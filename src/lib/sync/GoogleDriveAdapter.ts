import { supabase } from '$lib/supabase';
import type { SyncAdapter, SyncPayload, SyncResult, SyncStatus } from './SyncService';
import type { Thought, Edge } from '$lib/db';

// ── Constants ────────────────────────────────────────────────────────────────

const CHUNK_SIZE = 500;
const MANIFEST_NAME = 'flought-sync-manifest.json';
const CHUNK_PREFIX = 'flought-sync-chunk-';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const APPDATA_SPACE = 'appDataFolder';

function errorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	return String(err);
}

// ── Types ────────────────────────────────────────────────────────────────────

interface SyncManifest {
	totalChunks: number;
	exportedAt: string;
	version: 1;
}

interface ChunkPayload {
	thoughts: Thought[];
	edges: Edge[];
	chunkIndex: number;
}

// ── Adapter ──────────────────────────────────────────────────────────────────

export class GoogleDriveAdapter implements SyncAdapter {
	private connected = false;

	constructor() {
		this.connected = typeof navigator !== 'undefined' && navigator.onLine;
		if (typeof window !== 'undefined') {
			window.addEventListener('online', () => { this.connected = true; });
			window.addEventListener('offline', () => { this.connected = false; });
		}
	}

	isConnected(): boolean {
		return this.connected;
	}

	async getStatus(): Promise<SyncStatus> {
		if (!this.connected) return 'offline';
		const token = await this.getAccessToken();
		if (!token) return 'error';
		return 'synced';
	}

	// ── Push ──────────────────────────────────────────────────────────────────

	async push(payload: SyncPayload): Promise<SyncResult> {
		const token = await this.getAccessToken();
		if (!token) return { success: false, error: 'token_expired' };

		try {
			// 1. Chunk thoughts at object level (rule 11: never slice raw JSON)
			const chunks = this.chunkThoughts(payload.thoughts, payload.edges);

			// 2. Upload each chunk
			for (let i = 0; i < chunks.length; i++) {
				const name = `${CHUNK_PREFIX}${i}.json`;
				const body = JSON.stringify(chunks[i]);
				const result = await this.upsertFile(name, body, token);
				if (!result.success) return result;
			}

			// 3. Clean up stale chunks from a previous sync with more chunks
			await this.deleteStaleChunks(chunks.length, token);

			// 4. Upload manifest last (acts as commit marker)
			const manifest: SyncManifest = {
				totalChunks: chunks.length,
				exportedAt: payload.exportedAt,
				version: 1,
			};
			const manifestResult = await this.upsertFile(
				MANIFEST_NAME,
				JSON.stringify(manifest),
				token,
			);
			if (!manifestResult.success) return manifestResult;

			return { success: true };
		} catch (err) {
			return { success: false, error: errorMessage(err) };
		}
	}

	// ── Pull ──────────────────────────────────────────────────────────────────

	async pull(): Promise<SyncPayload | null> {
		const token = await this.getAccessToken();
		if (!token) return null;

		try {
			// 1. Fetch manifest
			const manifest = await this.readFile<SyncManifest>(MANIFEST_NAME, token);
			if (!manifest) return null;

			// 2. Fetch all chunks
			const allThoughts: Thought[] = [];
			let allEdges: Edge[] = [];

			for (let i = 0; i < manifest.totalChunks; i++) {
				const chunk = await this.readFile<ChunkPayload>(
					`${CHUNK_PREFIX}${i}.json`,
					token,
				);
				if (!chunk) return null; // incomplete sync data
				allThoughts.push(...chunk.thoughts);
				// Edges live in chunk 0 only
				if (i === 0) allEdges = chunk.edges;
			}

			return {
				thoughts: allThoughts,
				edges: allEdges,
				exportedAt: manifest.exportedAt,
			};
		} catch {
			return null;
		}
	}

	// ── Internal: chunking ───────────────────────────────────────────────────

	private chunkThoughts(thoughts: Thought[], edges: Edge[]): ChunkPayload[] {
		if (thoughts.length === 0) {
			return [{ thoughts: [], edges, chunkIndex: 0 }];
		}

		const chunks: ChunkPayload[] = [];
		for (let i = 0; i < thoughts.length; i += CHUNK_SIZE) {
			chunks.push({
				thoughts: thoughts.slice(i, i + CHUNK_SIZE),
				// Edges only in the first chunk
				edges: chunks.length === 0 ? edges : [],
				chunkIndex: chunks.length,
			});
		}
		return chunks;
	}

	// ── Internal: Google Drive file operations ───────────────────────────────

	private async getAccessToken(): Promise<string | null> {
		const { data } = await supabase.auth.getSession();
		return data.session?.provider_token ?? null;
	}

	/** Find a file by name in appDataFolder. Returns file ID or null. */
	private async findFile(name: string, token: string): Promise<string | null> {
		const q = encodeURIComponent(`name='${name}' and trashed=false`);
		const res = await fetch(
			`${DRIVE_API}/files?spaces=${APPDATA_SPACE}&q=${q}&fields=files(id)`,
			{ headers: { Authorization: `Bearer ${token}` } },
		);
		if (res.status === 401) return null;
		if (!res.ok) return null;
		const json = await res.json();
		return json.files?.[0]?.id ?? null;
	}

	/** Create or update a file in appDataFolder. */
	private async upsertFile(name: string, body: string, token: string): Promise<SyncResult> {
		const existingId = await this.findFile(name, token);

		if (existingId) {
			// Update existing file content
			const res = await fetch(
				`${DRIVE_UPLOAD}/files/${existingId}?uploadType=media`,
				{
					method: 'PATCH',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
					body,
				},
			);
			if (res.status === 401) return { success: false, error: 'token_expired' };
			if (!res.ok) return { success: false, error: `Drive update failed: ${res.status}` };
			return { success: true };
		}

		// Create new file in appDataFolder
		const metadata = { name, parents: [APPDATA_SPACE] };
		const boundary = '----FloughtSync';
		const multipart =
			`--${boundary}\r\n` +
			`Content-Type: application/json; charset=UTF-8\r\n\r\n` +
			`${JSON.stringify(metadata)}\r\n` +
			`--${boundary}\r\n` +
			`Content-Type: application/json\r\n\r\n` +
			`${body}\r\n` +
			`--${boundary}--`;

		const res = await fetch(
			`${DRIVE_UPLOAD}/files?uploadType=multipart`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': `multipart/related; boundary=${boundary}`,
				},
				body: multipart,
			},
		);
		if (res.status === 401) return { success: false, error: 'token_expired' };
		if (!res.ok) return { success: false, error: `Drive create failed: ${res.status}` };
		return { success: true };
	}

	/** Read and parse a JSON file from appDataFolder. */
	private async readFile<T>(name: string, token: string): Promise<T | null> {
		const fileId = await this.findFile(name, token);
		if (!fileId) return null;

		const res = await fetch(
			`${DRIVE_API}/files/${fileId}?alt=media`,
			{ headers: { Authorization: `Bearer ${token}` } },
		);
		if (!res.ok) return null;
		return res.json() as Promise<T>;
	}

	/** Delete chunk files with index >= count (leftovers from previous syncs). */
	private async deleteStaleChunks(currentCount: number, token: string): Promise<void> {
		// Search for all chunk files
		const q = encodeURIComponent(`name contains '${CHUNK_PREFIX}' and trashed=false`);
		const res = await fetch(
			`${DRIVE_API}/files?spaces=${APPDATA_SPACE}&q=${q}&fields=files(id,name)`,
			{ headers: { Authorization: `Bearer ${token}` } },
		);
		if (!res.ok) return;
		const json = await res.json();
		const files: { id: string; name: string }[] = json.files ?? [];

		for (const file of files) {
			const match = file.name.match(/^flought-sync-chunk-(\d+)\.json$/);
			if (match && parseInt(match[1], 10) >= currentCount) {
				await fetch(`${DRIVE_API}/files/${file.id}`, {
					method: 'DELETE',
					headers: { Authorization: `Bearer ${token}` },
				});
			}
		}
	}
}
