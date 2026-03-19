<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { getThoughtsByLibrary } from '$lib/db';

	// Navigate to the most recently updated thought, or /map if none exist
	onMount(async () => {
		if (!uiStore.activeLibraryId) {
			goto('/map');
			return;
		}

		return new Promise<void>((resolve) => {
			const sub = getThoughtsByLibrary(uiStore.activeLibraryId).subscribe((thoughts) => {
				sub.unsubscribe();
				if (thoughts.length === 0) {
					goto('/map');
				} else {
					const latest = thoughts
						.filter((t) => !t.is_deleted)
						.sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
					if (latest) {
						goto(`/thought/${latest.id}`);
					} else {
						goto('/map');
					}
				}
				resolve();
			});
		});
	});
</script>
