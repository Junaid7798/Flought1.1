<script lang="ts">
	import { onDestroy } from 'svelte';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { getThoughtsByLibrary } from '$lib/db';
	import type { Thought } from '$lib/db';

	let { children } = $props();

	// ── Search index rebuild ──────────────────────────────────────────────────
	// Subscribe to the live thought list; when it changes, debounce an
	// {type:'index'} message to the search worker so the FlexSearch index
	// stays in sync without hammering the worker on rapid back-to-back writes.

	let indexDebounce: ReturnType<typeof setTimeout> | null = null;
	let liveSubscription: { unsubscribe(): void } | null = null;

	$effect(() => {
		const libraryId = uiStore.activeLibraryId;
		if (!libraryId) return;

		// Tear down any previous subscription when libraryId changes
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
	});
</script>

{@render children()}
