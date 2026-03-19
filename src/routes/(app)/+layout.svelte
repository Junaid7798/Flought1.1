<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { fly } from 'svelte/transition';
	import { Capacitor } from '@capacitor/core';
	import { NavigationBar } from '@capgo/capacitor-navigation-bar';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import {
		getThoughtsByLibrary,
		getUserProfile, getUserSettings,
		tagUserProfileWithSupabaseId, updateUserSettings,
		db,
	} from '$lib/db';
	import type { Thought, Edge } from '$lib/db';
	import { supabase, getSession } from '$lib/supabase';
	import type { Subscription } from '@supabase/supabase-js';
	import { syncService } from '$lib/sync/SyncService';
	import { GoogleDriveAdapter } from '$lib/sync/GoogleDriveAdapter';
	import { eventBus } from '$lib/eventBus';

	let { children } = $props();

	// ── Auth guard ────────────────────────────────────────────────────────────

	let authSub: Subscription | null = null;

	onMount(async () => {
		// 1. Check current session — redirect to /login if missing
		let session;
		try {
			session = await getSession();
		} catch {
			goto('/login');
			return;
		}
		if (!session) {
			goto('/login');
			return;
		}

		// 2. Tag local Dexie profile with Supabase user ID (idempotent)
		await tagUserProfileWithSupabaseId(session.user.id);

		// 3. Check onboarding — redirect if incomplete
		const profile = await getUserProfile();
		if (!profile?.onboarding_complete) {
			goto('/onboarding');
			return;
		}

		// 4. Listen for auth state changes (token refresh, sign-out)
		const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
			if (event === 'SIGNED_OUT' || !newSession) {
				goto('/login');
			} else if (event === 'TOKEN_REFRESHED' && newSession) {
				await tagUserProfileWithSupabaseId(newSession.user.id);
			}
		});
		authSub = data.subscription;

		// 5. Wire sync adapter if connected
		await initSync();

		// 6. Set Android navigation bar colour (native only)
		if (Capacitor.getPlatform() === 'android') {
			const colour = getComputedStyle(document.body)
				.getPropertyValue('--bg-deep')
				.trim();
			if (colour) {
				await NavigationBar.setNavigationBarColor({ color: colour, darkButtons: false });
			}
		}
	});

	// ── Sync wiring ──────────────────────────────────────────────────────────

	let syncPushDebounce: ReturnType<typeof setTimeout> | null = null;
	let syncEventUnsubs: (() => void)[] = [];

	const SYNC_PUSH_DELAY = 30_000; // 30s after last write

	async function initSync() {
		const settings = await getUserSettings();
		if (!settings?.sync_connected || settings.sync_provider !== 'google') {
			uiStore.syncStatus = 'local';
			return;
		}

		// Attach adapter
		const adapter = new GoogleDriveAdapter();
		syncService.setAdapter(adapter);

		// Pull on app open to hydrate Dexie from Drive
		uiStore.syncStatus = 'syncing';
		const pulled = await syncService.pull();
		uiStore.syncStatus = syncService.getStatus();

		if (pulled) {
			await mergePulledPayload(pulled.thoughts, pulled.edges);
			uiStore.lastSyncedAt = new Date().toISOString();
			await updateUserSettings({ last_synced_at: uiStore.lastSyncedAt });
		}

		// Listen for db writes → debounced push
		const writeEvents = [
			'thought.created', 'thought.updated', 'edge.created', 'edge.updated',
		] as const;
		for (const eventType of writeEvents) {
			const unsub = eventBus.on(eventType, () => schedulePush());
			syncEventUnsubs.push(unsub);
		}
	}

	function schedulePush() {
		if (syncPushDebounce) clearTimeout(syncPushDebounce);
		syncPushDebounce = setTimeout(() => executePush(), SYNC_PUSH_DELAY);
	}

	async function executePush() {
		const libraryId = uiStore.activeLibraryId;
		if (!libraryId) return;

		const thoughts = await db.thoughts
			.where('library_id').equals(libraryId)
			.filter((t: Thought) => !t.is_deleted)
			.toArray();
		const edges = await db.edges
			.where('library_id').equals(libraryId)
			.filter((e: Edge) => !e.is_deleted)
			.toArray();

		uiStore.syncStatus = 'syncing';
		const result = await syncService.push({
			thoughts,
			edges,
			exportedAt: new Date().toISOString(),
		});
		uiStore.syncStatus = syncService.getStatus();

		if (result.success) {
			uiStore.lastSyncedAt = new Date().toISOString();
			await updateUserSettings({ last_synced_at: uiStore.lastSyncedAt });
			eventBus.emit({ type: 'sync.completed', payload: { provider: 'google' } });
		}
	}

	/**
	 * Merge pulled thoughts/edges into Dexie — last-write-wins by updated_at.
	 * Does not delete local thoughts absent from remote (local-first).
	 */
	async function mergePulledPayload(remoteThoughts: Thought[], remoteEdges: Edge[]) {
		for (const rt of remoteThoughts) {
			const local = await db.thoughts.get(rt.id);
			if (!local || rt.updated_at > local.updated_at) {
				await db.thoughts.put(rt);
			}
		}
		for (const re of remoteEdges) {
			const local = await db.edges.get(re.id);
			if (!local || re.created_at > local.created_at) {
				await db.edges.put(re);
			}
		}
	}

	// ── Search index rebuild ──────────────────────────────────────────────────

	let indexDebounce: ReturnType<typeof setTimeout> | null = null;
	let liveSubscription: { unsubscribe(): void } | null = null;

	$effect(() => {
		const libraryId = uiStore.activeLibraryId;
		if (!libraryId) return;

		liveSubscription?.unsubscribe();

		liveSubscription = getThoughtsByLibrary(libraryId).subscribe((thoughts: Thought[]) => {
			if (indexDebounce) clearTimeout(indexDebounce);
			indexDebounce = setTimeout(() => {
				uiStore.searchWorker?.postMessage({
					type: 'index',
					thoughts: thoughts.map((t) => ({ id: t.id, title: t.title, content: t.content })),
				});
			}, 2000);
		});
	});

	onDestroy(() => {
		if (indexDebounce) clearTimeout(indexDebounce);
		if (syncPushDebounce) clearTimeout(syncPushDebounce);
		liveSubscription?.unsubscribe();
		authSub?.unsubscribe();
		for (const unsub of syncEventUnsubs) unsub();
	});
</script>

<!-- Route transition wrapper.
     display:grid + grid-area:1/1 stacks outgoing and incoming pages
     in the same grid cell during the 250ms crossfade — no overlap jump. -->
<div class="route-shell">
	{#key $page.url.pathname}
		<div
			class="route-view"
			in:fly={{ y: 20, duration: 250, easing: t => t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2 }}
		>
			{@render children()}
		</div>
	{/key}
</div>

<style>
	/* Grid shell: old + new views occupy the same cell during transition */
	.route-shell {
		display: grid;
		width: 100%;
		height: 100%;
	}

	.route-view {
		grid-area: 1 / 1;
		display: contents;
	}
</style>
