import type { Thought, Edge } from '$lib/db';

// ── Types ────────────────────────────────────────────────────────────────────

export type SyncStatus = 'local' | 'synced' | 'syncing' | 'offline' | 'error';

export interface SyncPayload {
	thoughts: Thought[];
	edges: Edge[];
	exportedAt: string;
}

export interface SyncResult {
	success: boolean;
	error?: string;
}

export interface SyncAdapter {
	push(payload: SyncPayload): Promise<SyncResult>;
	pull(): Promise<SyncPayload | null>;
	getStatus(): Promise<SyncStatus>;
	isConnected(): boolean;
}

// ── Service ──────────────────────────────────────────────────────────────────

export class SyncService {
	private adapter: SyncAdapter | null = null;
	private status: SyncStatus = 'local';

	setAdapter(adapter: SyncAdapter): void {
		this.adapter = adapter;
	}

	getStatus(): SyncStatus {
		if (!this.adapter) return 'local';
		return this.status;
	}

	async push(payload: SyncPayload): Promise<SyncResult> {
		if (!this.adapter) return { success: false, error: 'No sync adapter configured' };

		if (!this.adapter.isConnected()) {
			this.status = 'offline';
			return { success: false, error: 'Not connected' };
		}

		this.status = 'syncing';
		const result = await this.adapter.push(payload);
		this.status = result.success ? 'synced' : 'error';
		return result;
	}

	async pull(): Promise<SyncPayload | null> {
		if (!this.adapter) return null;

		if (!this.adapter.isConnected()) {
			this.status = 'offline';
			return null;
		}

		this.status = 'syncing';
		try {
			const payload = await this.adapter.pull();
			this.status = 'synced';
			return payload;
		} catch {
			this.status = 'error';
			return null;
		}
	}
}

// ── Singleton ────────────────────────────────────────────────────────────────

export const syncService = new SyncService();
