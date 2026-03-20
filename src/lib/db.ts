import Dexie, { liveQuery, type Table } from 'dexie';
import { generateId } from '$lib/uuid';
import { eventBus } from '$lib/eventBus';
import { BLUEPRINTS } from '$lib/blueprints';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface Library {
	id: string;
	name: string;
	created_at: string;
	is_deleted: boolean;
}

export interface UserProfile {
	id: string;
	display_name: string;
	use_case: string;
	blueprint_applied: string | false;
	onboarding_complete: boolean;
	schema_version: number;
	supabase_user_id: string | null;
	behavior_signals: {
		mapViewTime: number;
		pipelineInteractions: number;
		thoughtsCreated: number;
	};
}

export interface UserSettings {
	id: string;
	theme: string;
	pipeline_label_overrides: [string, string, string, string];
	pipeline_colour_overrides: [string, string, string, string];
	string_overrides: Record<string, string>;
	keyboard_shortcuts: Record<string, string>;
	sync_provider: string | null;
	sync_connected: boolean;
	last_synced_at: string | null;
	sidebar_width: number;
	pinned_thought_ids: string[];
	font_size: number;
	layout_width: 'normal' | 'wide' | 'full';
	brand_color?: string;
	enabled_plugins: string[];
	right_sidebar_width: number;
	left_sidebar_collapsed: boolean;
	right_sidebar_collapsed: boolean;
}

export interface Thought {
	id: string;
	library_id: string;
	title: string;
	content: string;
	meta_state: 1 | 2 | 3 | 4;
	topic: string;
	x_pos: number;
	y_pos: number;
	created_at: string;
	updated_at: string;
	is_deleted: boolean;
	telemetry: TelemetryEntry[];
	// v3 fields
	aliases:        string[];
	last_viewed_at: number;
	word_count:     number;
	is_triaged:     boolean;
}

export interface TelemetryEntry {
	event: string;
	ts: string;
}

export interface Edge {
	id: string;
	library_id: string;
	source_id: string;
	target_id: string;
	link_type: string;
	created_at: string;
	is_deleted: boolean;
	// v3 fields
	traversal_count: number;
}

// ── Database ──────────────────────────────────────────────────────────────────

class FloughtDB extends Dexie {
	libraries!: Table<Library, string>;
	userProfile!: Table<UserProfile, string>;
	userSettings!: Table<UserSettings, string>;
	thoughts!: Table<Thought, string>;
	edges!: Table<Edge, string>;

	constructor() {
		super('flought');

		this.version(1).stores({
			libraries:   'id, name, created_at, is_deleted',
			userProfile: 'id',
			userSettings:'id',
			thoughts:    'id, library_id, meta_state, topic, created_at, updated_at, is_deleted',
			edges:       'id, library_id, source_id, target_id, is_deleted',
		});

		// v2 — adds font_size + sidebar_width to userSettings (no new indexes needed)
		this.version(2).stores({
			libraries:   'id, name, created_at, is_deleted',
			userProfile: 'id',
			userSettings:'id',
			thoughts:    'id, library_id, meta_state, topic, created_at, updated_at, is_deleted',
			edges:       'id, library_id, source_id, target_id, is_deleted',
		}).upgrade((tx) => {
			return tx.table('userSettings').toCollection().modify((s) => {
				if (s.font_size === undefined)    s.font_size    = 16;
				if (s.sidebar_width === undefined) s.sidebar_width = 220;
				if (s.pinned_thought_ids === undefined) s.pinned_thought_ids = [];
			});
		});

		// v3 — Group A: aliases, last_viewed_at, word_count, is_triaged on thoughts;
		//               traversal_count on edges. No new indexes — non-indexed fields only.
		this.version(3).stores({
			libraries:   'id, name, created_at, is_deleted',
			userProfile: 'id',
			userSettings:'id',
			thoughts:    'id, library_id, meta_state, topic, created_at, updated_at, is_deleted',
			edges:       'id, library_id, source_id, target_id, is_deleted',
		}).upgrade((tx) => {
			const upgradeThoughts = tx.table('thoughts').toCollection().modify((t) => {
				if (t.aliases        === undefined) t.aliases        = [];
				if (t.last_viewed_at === undefined) t.last_viewed_at = 0;
				if (t.word_count     === undefined) t.word_count     =
					t.content ? t.content.split(/\s+/).filter(Boolean).length : 0;
				if (t.is_triaged     === undefined) t.is_triaged     = true;
			});
			const upgradeEdges = tx.table('edges').toCollection().modify((e) => {
				if (e.traversal_count === undefined) e.traversal_count = 0;
			});
			return Promise.all([upgradeThoughts, upgradeEdges]);
		});

		// v4 — adds enabled_plugins to userSettings
		this.version(4).stores({
			libraries:   'id, name, created_at, is_deleted',
			userProfile: 'id',
			userSettings:'id',
			thoughts:    'id, library_id, meta_state, topic, created_at, updated_at, is_deleted',
			edges:       'id, library_id, source_id, target_id, is_deleted',
		}).upgrade((tx) => {
			return tx.table('userSettings').toCollection().modify((s) => {
				if (s.enabled_plugins === undefined) s.enabled_plugins = [];
			});
		});

		// v5 — adds right_sidebar_width
		this.version(5).stores({
			libraries:   'id, name, created_at, is_deleted',
			userProfile: 'id',
			userSettings:'id',
			thoughts:    'id, library_id, meta_state, topic, created_at, updated_at, is_deleted',
			edges:       'id, library_id, source_id, target_id, is_deleted',
		}).upgrade((tx) => {
			return tx.table('userSettings').toCollection().modify((s) => {
				if (s.right_sidebar_width === undefined) s.right_sidebar_width = 280;
			});
		});
	}
}

export const db = new FloughtDB();

// ── Thought CRUD ──────────────────────────────────────────────────────────────

export async function createThought(libraryId: string, title: string, is_triaged = true, content = ''): Promise<string> {
	const now = new Date().toISOString();
	const id = generateId();
	await db.thoughts.add({
		id,
		library_id: libraryId,
		title,
		content,
		meta_state: 1,
		topic: '',
		x_pos: 0,
		y_pos: 0,
		created_at: now,
		updated_at: now,
		is_deleted: false,
		telemetry: [],
		aliases:        [],
		last_viewed_at: 0,
		word_count:     title.split(/\s+/).filter(Boolean).length,
		is_triaged,
	});
	eventBus.emit({ type: 'thought.created', payload: { id } });
	return id;
}

export async function updateThought(
	id: string,
	changes: Partial<Omit<Thought, 'id' | 'created_at' | 'telemetry'>>
): Promise<void> {
	const now = new Date().toISOString();
	const existing = await db.thoughts.get(id);
	if (!existing) return;

	const telemetry: TelemetryEntry[] = [
		...existing.telemetry,
		{ event: 'updated', ts: now },
	].slice(-50);

	// Recalculate word_count when content or title changes
	const merged = { ...changes };
	if (merged.content !== undefined || merged.title !== undefined) {
		const finalTitle   = merged.title   ?? existing.title;
		const finalContent = merged.content ?? existing.content;
		merged.word_count  = (finalTitle + ' ' + finalContent).split(/\s+/).filter(Boolean).length;
	}

	await db.thoughts.update(id, { ...merged, updated_at: now, telemetry });
	eventBus.emit({ type: 'thought.updated', payload: { id } });
}

export async function softDeleteThought(id: string): Promise<void> {
	const now = new Date().toISOString();
	const existing = await db.thoughts.get(id);
	if (!existing) return;

	const telemetry: TelemetryEntry[] = [
		...existing.telemetry,
		{ event: 'deleted', ts: now },
	].slice(-50);

	await db.thoughts.update(id, { is_deleted: true, updated_at: now, telemetry });
	eventBus.emit({ type: 'thought.updated', payload: { id } });
}

export async function getThought(id: string): Promise<Thought | undefined> {
	return db.thoughts.get(id);
}

export function getThoughtsByLibrary(libraryId: string) {
	return liveQuery(() =>
		db.thoughts
			.where('library_id')
			.equals(libraryId)
			.filter((t) => !t.is_deleted)
			.toArray()
	);
}

// ── Edge CRUD ─────────────────────────────────────────────────────────────────

export async function createEdge(
	libraryId: string,
	sourceId: string,
	targetId: string,
	linkType = 'wikilink'
): Promise<string> {
	const id = generateId();
	await db.edges.add({
		id,
		library_id: libraryId,
		source_id: sourceId,
		target_id: targetId,
		link_type: linkType,
		created_at: new Date().toISOString(),
		is_deleted: false,
		traversal_count: 0,
	});
	eventBus.emit({ type: 'edge.created', payload: { id } });
	return id;
}

export async function softDeleteEdge(id: string): Promise<void> {
	await db.edges.update(id, { is_deleted: true });
	eventBus.emit({ type: 'edge.updated', payload: { id } });
}

/** Lightweight liveQuery for thermal pill widget — fetches id+title+meta_state only. */
export function getThoughtStates(libraryId: string) {
	return liveQuery(() =>
		db.thoughts
			.where('library_id')
			.equals(libraryId)
			.filter((t) => !t.is_deleted)
			.toArray()
			.then((ts) => ts.map((t) => ({ id: t.id, title: t.title, meta_state: t.meta_state })))
	);
}

export function getEdgesByLibrary(libraryId: string) {
	return liveQuery(() =>
		db.edges
			.where('library_id')
			.equals(libraryId)
			.filter((e) => !e.is_deleted)
			.toArray()
	);
}

export async function getEdgesForThought(thoughtId: string): Promise<Edge[]> {
	const [asSrc, asTgt] = await Promise.all([
		db.edges.where('source_id').equals(thoughtId).filter((e) => !e.is_deleted).toArray(),
		db.edges.where('target_id').equals(thoughtId).filter((e) => !e.is_deleted).toArray(),
	]);
	return [...asSrc, ...asTgt];
}

/**
 * Diff-based edge rebuild. Called on editor blur/unmount only (Rule 12).
 * Resolves linked titles to thought IDs within the same library, then:
 *   - soft-deletes edges whose target title is no longer present
 *   - creates edges for newly added titles
 * Never deletes all and recreates.
 */
export async function rebuildEdgesForThought(
	thoughtId: string,
	newLinkedTitles: string[]
): Promise<void> {
	const thought = await db.thoughts.get(thoughtId);
	if (!thought) return;

	// Resolve titles → thought IDs in this library (non-deleted)
	const candidates = await db.thoughts
		.where('library_id')
		.equals(thought.library_id)
		.filter((t) => !t.is_deleted && t.id !== thoughtId)
		.toArray();

	// Build title+alias lookup — alias match resolves to the canonical thought ID
	const titleToId = new Map<string, string>();
	for (const c of candidates) {
		titleToId.set(c.title.toLowerCase(), c.id);
		for (const alias of c.aliases ?? []) {
			const key = alias.toLowerCase();
			if (!titleToId.has(key)) titleToId.set(key, c.id); // title wins if collision
		}
	}
	const newTargetIds = new Set(
		newLinkedTitles
			.map((title) => titleToId.get(title.toLowerCase()))
			.filter((id): id is string => id !== undefined)
	);

	// Existing live edges where this thought is the source
	const existingEdges = await db.edges
		.where('source_id')
		.equals(thoughtId)
		.filter((e) => !e.is_deleted)
		.toArray();

	const existingTargetIds = new Set(existingEdges.map((e) => e.target_id));

	// Soft-delete edges no longer linked
	const toDelete = existingEdges.filter((e) => !newTargetIds.has(e.target_id));
	await Promise.all(toDelete.map((e) => softDeleteEdge(e.id)));

	// Create genuinely new edges
	const toCreate = [...newTargetIds].filter((tid) => !existingTargetIds.has(tid));
	await Promise.all(toCreate.map((tid) => createEdge(thought.library_id, thoughtId, tid)));
}

// ── Library CRUD ──────────────────────────────────────────────────────────────

export async function createLibrary(name: string): Promise<string> {
	const id = generateId();
	await db.libraries.add({
		id,
		name,
		created_at: new Date().toISOString(),
		is_deleted: false,
	});
	return id;
}

export function getLibraries() {
	return liveQuery(() =>
		db.libraries.filter((l) => !l.is_deleted).toArray()
	);
}

export async function getDefaultLibrary(): Promise<Library> {
	const existing = await db.libraries.filter((l) => !l.is_deleted).first();
	if (existing) return existing;
	const id = await createLibrary('My Mind');
	return db.libraries.get(id) as Promise<Library>;
}

// ── User Profile & Settings ───────────────────────────────────────────────────

const PROFILE_ID = 'profile';
const SETTINGS_ID = 'settings';

export async function initUserProfile(
	displayName: string,
	useCase: string
): Promise<void> {
	const existing = await db.userProfile.get(PROFILE_ID);
	if (existing) return; // idempotent

	await db.userProfile.add({
		id: PROFILE_ID,
		display_name: displayName,
		use_case: useCase,
		blueprint_applied: false,
		onboarding_complete: false,
		schema_version: 1,
		supabase_user_id: null,
		behavior_signals: {
			mapViewTime: 0,
			pipelineInteractions: 0,
			thoughtsCreated: 0,
		},
	});

	await db.userSettings.put({
		id: SETTINGS_ID,
		theme: 'modern-dark',
		pipeline_label_overrides: ['Inbox', 'Queue', 'Forge', 'Archive'],
		pipeline_colour_overrides: ['#F59E0B', '#3B82F6', '#10B981', '#6B7280'],
		string_overrides: {},
		keyboard_shortcuts: {},
		sync_provider: null,
		sync_connected: false,
		last_synced_at: null,
		sidebar_width: 220,
		pinned_thought_ids: [],
		font_size: 16,
		layout_width: 'normal',
		brand_color: '#8B5CF6',
		enabled_plugins: [],
		right_sidebar_width: 280,
		left_sidebar_collapsed: false,
		right_sidebar_collapsed: false,
	});
}

export async function getUserProfile(): Promise<UserProfile | undefined> {
	return db.userProfile.get(PROFILE_ID);
}

export async function getUserSettings(): Promise<UserSettings | undefined> {
	return db.userSettings.get(SETTINGS_ID);
}

export async function updateUserSettings(
	changes: Partial<Omit<UserSettings, 'id'>>
): Promise<void> {
	await db.userSettings.update(SETTINGS_ID, changes);
}

export async function markOnboardingComplete(): Promise<void> {
	await db.userProfile.update(PROFILE_ID, { onboarding_complete: true });
}

// ── ⚠️ DEV BYPASS — REMOVE BEFORE DEPLOY ────────────────────────────────────
// Seeds a completed profile + default library so you can reach /map instantly
// without going through login or onboarding. Only called when
// PUBLIC_DEV_BYPASS=true in .env (which is never committed).
export async function devSeedBypass(): Promise<string> {
	const existing = await db.userProfile.get(PROFILE_ID);
	if (!existing) {
		await db.userProfile.put({
			id: PROFILE_ID,
			display_name: 'Dev',
			use_case: 'work',
			blueprint_applied: false,
			onboarding_complete: true,
			schema_version: 1,
			supabase_user_id: null,
			behavior_signals: { mapViewTime: 0, pipelineInteractions: 0, thoughtsCreated: 0 },
		});
	} else if (!existing.onboarding_complete) {
		await db.userProfile.update(PROFILE_ID, { onboarding_complete: true });
	}

	const settingsExisting = await db.userSettings.get(SETTINGS_ID);
	if (!settingsExisting) {
		await db.userSettings.put({
			id: SETTINGS_ID,
			theme: 'modern-dark',
			pipeline_label_overrides: ['Inbox', 'Queue', 'Forge', 'Vault'],
			pipeline_colour_overrides: ['#F59E0B', '#3B82F6', '#10B981', '#6B7280'],
			string_overrides: {},
			keyboard_shortcuts: {},
			sync_provider: null,
			sync_connected: false,
			last_synced_at: null,
			sidebar_width: 220,
			pinned_thought_ids: [],
			font_size: 16,
			layout_width: 'normal',
			brand_color: '#8B5CF6',
			enabled_plugins: [],
			right_sidebar_width: 280,
			left_sidebar_collapsed: false,
			right_sidebar_collapsed: false,
		});
	}

	const lib = await getDefaultLibrary();
	return lib.id;
}
// ── END DEV BYPASS ───────────────────────────────────────────────────────────

export async function tagUserProfileWithSupabaseId(userId: string): Promise<void> {
	const existing = await db.userProfile.get(PROFILE_ID);
	if (!existing) return;
	if (existing.supabase_user_id === userId) return; // already tagged
	await db.userProfile.update(PROFILE_ID, { supabase_user_id: userId });
}

// ── Blueprint ─────────────────────────────────────────────────────────────────

export async function applyBlueprint(useCase: string): Promise<void> {
	const blueprint = BLUEPRINTS[useCase];
	if (!blueprint) return;

	const library = await getDefaultLibrary();

	// Update pipeline label overrides
	await updateUserSettings({
		pipeline_label_overrides: blueprint.pipelineLabels,
	});

	// Seed thoughts — only create if no non-deleted thoughts exist in this library
	const existingCount = await db.thoughts
		.where('library_id')
		.equals(library.id)
		.filter((t) => !t.is_deleted)
		.count();

	if (existingCount === 0) {
		const now = new Date().toISOString();
		for (const seed of blueprint.seedThoughts) {
			const id = generateId();
			await db.thoughts.add({
				id,
				library_id: library.id,
				title: seed.title,
				content: '',
				meta_state: seed.meta_state,
				topic: seed.topic,
				x_pos: 0,
				y_pos: 0,
				created_at: now,
				updated_at: now,
				is_deleted: false,
				telemetry: [],
				aliases:        [],
				last_viewed_at: 0,
				word_count:     seed.title.split(/\s+/).filter(Boolean).length,
				is_triaged:     true,
			});
			eventBus.emit({ type: 'thought.created', payload: { id } });
		}
	}

	// Mark blueprint as applied
	await db.userProfile.update(PROFILE_ID, { blueprint_applied: useCase });
}

// ── Group A — New functions ────────────────────────────────────────────────────

export async function updateLastViewed(id: string): Promise<void> {
	await db.thoughts.update(id, { last_viewed_at: Date.now() });
	eventBus.emit({ type: 'thought.updated', payload: { id } });
}

export async function getBacklinksForThought(title: string): Promise<Thought[]> {
	const pattern = '[[' + title + ']]';
	return db.thoughts
		.filter((t) => !t.is_deleted && t.content.includes(pattern))
		.toArray();
}

export async function getThoughtStatesAndAliases(): Promise<
	{ id: string; title: string; meta_state: number; aliases: string[] }[]
> {
	const thoughts = await db.thoughts.filter((t) => !t.is_deleted).toArray();
	return thoughts.map((t) => ({
		id:         t.id,
		title:      t.title,
		meta_state: t.meta_state,
		aliases:    t.aliases ?? [],
	}));
}

export async function updateTraversalCount(edgeId: string): Promise<void> {
	const edge = await db.edges.get(edgeId);
	if (!edge) return;
	await db.edges.update(edgeId, { traversal_count: (edge.traversal_count ?? 0) + 1 });
}

export async function markTriaged(id: string): Promise<void> {
	await db.thoughts.update(id, { is_triaged: true });
	eventBus.emit({ type: 'thought.updated', payload: { id } });
}

// ── Group C.3 — Alias CRUD ────────────────────────────────────────────────────

export async function addAlias(thoughtId: string, alias: string): Promise<void> {
	const thought = await db.thoughts.get(thoughtId);
	if (!thought) return;
	const trimmed = alias.trim();
	if (!trimmed) return;
	// Dedup — case-insensitive check
	const lower = trimmed.toLowerCase();
	if (thought.aliases.some((a) => a.toLowerCase() === lower)) return;
	const aliases = [...thought.aliases, trimmed];
	await updateThought(thoughtId, { aliases });
}

export async function removeAlias(thoughtId: string, alias: string): Promise<void> {
	const thought = await db.thoughts.get(thoughtId);
	if (!thought) return;
	const aliases = thought.aliases.filter((a) => a !== alias);
	await updateThought(thoughtId, { aliases });
}

/**
 * Global link propogation on rename.
 * Finds all thoughts containing [[Old Title]] and updates to [[New Title]].
 */
export async function propagateRename(oldTitle: string, newTitle: string): Promise<number> {
	const oldPattern = '[[' + oldTitle + ']]';
	const newPattern = '[[' + newTitle + ']]';

	const relatedThoughts = await db.thoughts
		.filter((t) => !t.is_deleted && t.content.includes(oldPattern))
		.toArray();

	let count = 0;
	for (const t of relatedThoughts) {
		const newContent = t.content.split(oldPattern).join(newPattern);
		if (newContent !== t.content) {
			await updateThought(t.id, { content: newContent });
			count++;
		}
	}
	return count;
}
