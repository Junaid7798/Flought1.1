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
	}
}

export const db = new FloughtDB();

// ── Thought CRUD ──────────────────────────────────────────────────────────────

export async function createThought(libraryId: string, title: string): Promise<string> {
	const now = new Date().toISOString();
	const id = generateId();
	await db.thoughts.add({
		id,
		library_id: libraryId,
		title,
		content: '',
		meta_state: 1,
		topic: '',
		x_pos: 0,
		y_pos: 0,
		created_at: now,
		updated_at: now,
		is_deleted: false,
		telemetry: [],
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

	await db.thoughts.update(id, { ...changes, updated_at: now, telemetry });
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

	const titleToId = new Map(candidates.map((t) => [t.title.toLowerCase(), t.id]));
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
		theme: 'midnight',
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
			});
			eventBus.emit({ type: 'thought.created', payload: { id } });
		}
	}

	// Mark blueprint as applied
	await db.userProfile.update(PROFILE_ID, { blueprint_applied: useCase });
}
