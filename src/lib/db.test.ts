import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';

// Re-import db module fresh per test suite by resetting the Dexie instance.
// fake-indexeddb/auto patches indexedDB globally before any Dexie is opened.
import {
	db,
	createThought,
	updateThought,
	softDeleteThought,
	createEdge,
	getEdgesForThought,
	rebuildEdgesForThought,
	initUserProfile,
	getUserProfile,
} from './db';

beforeEach(async () => {
	// Delete and re-open the database before each test for isolation.
	await db.delete();
	await db.open();
});

// ── createThought ─────────────────────────────────────────────────────────────

describe('createThought', () => {
	it('returns a uuid v4 string', async () => {
		const id = await createThought('lib-1', 'Hello');
		expect(id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
		);
	});

	it('sets meta_state to 1', async () => {
		const id = await createThought('lib-1', 'Hello');
		const thought = await db.thoughts.get(id);
		expect(thought?.meta_state).toBe(1);
	});

	it('sets is_deleted to false', async () => {
		const id = await createThought('lib-1', 'Hello');
		const thought = await db.thoughts.get(id);
		expect(thought?.is_deleted).toBe(false);
	});

	it('sets topic to empty string', async () => {
		const id = await createThought('lib-1', 'Hello');
		const thought = await db.thoughts.get(id);
		expect(thought?.topic).toBe('');
	});
});

// ── updateThought ─────────────────────────────────────────────────────────────

describe('updateThought', () => {
	it('caps telemetry at 50 entries after 60 updates', async () => {
		const id = await createThought('lib-1', 'Hello');
		for (let i = 0; i < 60; i++) {
			await updateThought(id, { title: `Title ${i}` });
		}
		const thought = await db.thoughts.get(id);
		expect(thought?.telemetry.length).toBe(50);
	});

	it('updates the title', async () => {
		const id = await createThought('lib-1', 'Original');
		await updateThought(id, { title: 'Updated' });
		const thought = await db.thoughts.get(id);
		expect(thought?.title).toBe('Updated');
	});

	it('updates updated_at on every call', async () => {
		const id = await createThought('lib-1', 'Hello');
		const before = (await db.thoughts.get(id))!.updated_at;
		await new Promise((r) => setTimeout(r, 2));
		await updateThought(id, { title: 'Changed' });
		const after = (await db.thoughts.get(id))!.updated_at;
		expect(after > before).toBe(true);
	});
});

// ── softDeleteThought ─────────────────────────────────────────────────────────

describe('softDeleteThought', () => {
	it('sets is_deleted to true but record still exists', async () => {
		const id = await createThought('lib-1', 'Hello');
		await softDeleteThought(id);
		const thought = await db.thoughts.get(id);
		expect(thought).toBeDefined();
		expect(thought?.is_deleted).toBe(true);
	});

	it('appends a deleted telemetry entry', async () => {
		const id = await createThought('lib-1', 'Hello');
		await softDeleteThought(id);
		const thought = await db.thoughts.get(id);
		expect(thought?.telemetry.at(-1)?.event).toBe('deleted');
	});

	it('is a no-op for unknown id', async () => {
		await expect(softDeleteThought('non-existent-id')).resolves.toBeUndefined();
	});
});

// ── createEdge + getEdgesForThought ───────────────────────────────────────────

describe('createEdge + getEdgesForThought', () => {
	it('edge is retrievable as source', async () => {
		const edgeId = await createEdge('lib-1', 'src-1', 'tgt-1');
		const edges = await getEdgesForThought('src-1');
		expect(edges.map((e) => e.id)).toContain(edgeId);
	});

	it('edge is retrievable as target', async () => {
		const edgeId = await createEdge('lib-1', 'src-1', 'tgt-1');
		const edges = await getEdgesForThought('tgt-1');
		expect(edges.map((e) => e.id)).toContain(edgeId);
	});

	it('does not return soft-deleted edges', async () => {
		const edgeId = await createEdge('lib-1', 'src-1', 'tgt-1');
		await db.edges.update(edgeId, { is_deleted: true });
		const edges = await getEdgesForThought('src-1');
		expect(edges.map((e) => e.id)).not.toContain(edgeId);
	});

	it('defaults link_type to wikilink', async () => {
		const edgeId = await createEdge('lib-1', 'src-1', 'tgt-1');
		const edge = await db.edges.get(edgeId);
		expect(edge?.link_type).toBe('wikilink');
	});
});

// ── rebuildEdgesForThought ────────────────────────────────────────────────────

describe('rebuildEdgesForThought', () => {
	const LIB = 'lib-rebuild';

	async function seedThoughts() {
		// Create three thoughts with known titles in the same library
		const aId = await createThought(LIB, 'Alpha');
		const bId = await createThought(LIB, 'Beta');
		const cId = await createThought(LIB, 'Gamma');
		// Give them the correct library_id (createThought already uses LIB)
		return { aId, bId, cId };
	}

	it('creates edges for new linked titles', async () => {
		const { aId } = await seedThoughts();
		await rebuildEdgesForThought(aId, ['Beta', 'Gamma']);
		const edges = await getEdgesForThought(aId);
		expect(edges.length).toBe(2);
	});

	it('soft-deletes edges no longer linked', async () => {
		const { aId, bId } = await seedThoughts();
		// Start: A → Beta
		await createEdge(LIB, aId, bId);
		// Rebuild with no links
		await rebuildEdgesForThought(aId, []);
		const edges = await getEdgesForThought(aId);
		expect(edges.length).toBe(0);
	});

	it('leaves unchanged edges untouched', async () => {
		const { aId, bId, cId } = await seedThoughts();
		// Start: A → Beta
		const existingEdgeId = await createEdge(LIB, aId, bId);
		// Rebuild keeping Beta, adding Gamma
		await rebuildEdgesForThought(aId, ['Beta', 'Gamma']);
		// The original Beta edge should still be live (not deleted and recreated)
		const existingEdge = await db.edges.get(existingEdgeId);
		expect(existingEdge?.is_deleted).toBe(false);
		// Total live edges: Beta + Gamma
		const edges = await getEdgesForThought(aId);
		expect(edges.filter((e) => e.source_id === aId).length).toBe(2);
		// suppress unused var warning
		void cId;
	});

	it('is a no-op for unknown thoughtId', async () => {
		await expect(rebuildEdgesForThought('ghost', ['Alpha'])).resolves.toBeUndefined();
	});
});

// ── initUserProfile ───────────────────────────────────────────────────────────

describe('initUserProfile', () => {
	it('creates a profile on first call', async () => {
		await initUserProfile('Alice', 'freelance');
		const profile = await getUserProfile();
		expect(profile?.display_name).toBe('Alice');
	});

	it('is idempotent — calling twice creates exactly one record', async () => {
		await initUserProfile('Alice', 'freelance');
		await initUserProfile('Bob', 'pkm'); // second call should be a no-op
		const count = await db.userProfile.count();
		expect(count).toBe(1);
		// Original name preserved
		const profile = await getUserProfile();
		expect(profile?.display_name).toBe('Alice');
	});

	it('sets schema_version to 1', async () => {
		await initUserProfile('Alice', 'freelance');
		const profile = await getUserProfile();
		expect(profile?.schema_version).toBe(1);
	});

	it('seeds userSettings alongside the profile', async () => {
		await initUserProfile('Alice', 'freelance');
		const settings = await db.userSettings.get('settings');
		expect(settings).toBeDefined();
		expect(settings?.theme).toBe('modern-dark');
	});
});
