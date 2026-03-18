<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { getThoughtsByLibrary, type Thought } from '$lib/db';
	import { $t as t } from '$lib/i18n';
	import { GRAPH_CONFIG } from '$lib/config';
	import GraphCanvas from '../../../components/graph/GraphCanvas.svelte';

	// ── State ─────────────────────────────────────────────────────────────────

	let showFullGraph = $state(false);
	let totalCount = $state(0);

	// ── Derived ──────────────────────────────────────────────────────────────

	const effectiveActiveId = $derived(showFullGraph ? null : uiStore.focusedNodeId);

	const visibleCount = $derived(
		effectiveActiveId
			? totalCount // neighbourhood count computed inside canvas
			: Math.min(totalCount, GRAPH_CONFIG.maxViewportNodes)
	);

	const statsText = $derived(
		t('map.stats')
			.replace('{total}', String(totalCount))
			.replace('{visible}', String(visibleCount))
	);

	// ── Live count subscription ──────────────────────────────────────────────

	let thoughtsSub: { unsubscribe(): void } | null = null;

	onMount(() => {
		if (!uiStore.activeLibraryId) return;
		thoughtsSub = getThoughtsByLibrary(uiStore.activeLibraryId).subscribe(
			(thoughts: Thought[]) => {
				totalCount = thoughts.length;
			}
		);
	});

	onDestroy(() => {
		thoughtsSub?.unsubscribe();
	});
</script>

<div class="map-page">
	<GraphCanvas
		libraryId={uiStore.activeLibraryId}
		activeThoughtId={effectiveActiveId}
	/>

	<!-- Floating toolbar -->
	<div class="toolbar" role="toolbar" aria-label={t('nav.map')}>
		<label class="toggle">
			<input
				type="checkbox"
				bind:checked={showFullGraph}
			/>
			<span class="toggle-label">{t('map.showAll')}</span>
		</label>

		<span class="stats">{statsText}</span>
	</div>
</div>

<style>
	.map-page {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.toolbar {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		background: var(--bg-panel);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		padding: 0.5rem 0.75rem;
		z-index: 10;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		min-height: 44px;
	}

	.toggle input[type='checkbox'] {
		width: 16px;
		height: 16px;
		accent-color: var(--color-brand);
		cursor: pointer;
	}

	.toggle-label {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		white-space: nowrap;
		user-select: none;
	}

	.stats {
		font-size: 0.75rem;
		color: var(--text-muted);
		white-space: nowrap;
	}

	@media (max-width: 767px) {
		.toolbar {
			top: 0.5rem;
			right: 0.5rem;
			padding: 0.375rem 0.625rem;
			gap: 0.625rem;
		}
	}
</style>
