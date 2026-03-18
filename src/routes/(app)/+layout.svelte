<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { getThoughtsByLibrary, getUserProfile, tagUserProfileWithSupabaseId } from '$lib/db';
	import type { Thought } from '$lib/db';
	import { supabase, getSession } from '$lib/supabase';
	import type { Subscription } from '@supabase/supabase-js';

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
	});

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
		liveSubscription?.unsubscribe();
		authSub?.unsubscribe();
	});
</script>

{@render children()}
