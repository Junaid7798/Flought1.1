<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { SlidersHorizontal, ArrowLeft } from 'lucide-svelte';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { getThoughtsByLibrary, type Thought } from '$lib/db';
	import { $t as t } from '$lib/i18n';
	import { GRAPH_CONFIG } from '$lib/config';
	import GraphCanvas from '../../../components/graph/GraphCanvas.svelte';
	import GraphControlsPanel from '../../../components/graph/GraphControlsPanel.svelte';
	import StageFilter from '../../../components/graph/StageFilter.svelte';
	import MapLanding from '../../../components/graph/MapLanding.svelte';

	// ── State ─────────────────────────────────────────────────────────────────

	let mapMode     = $state<'landing' | 'graph'>('landing');
	let stageFilter = $state<number | null>(null);
	let controlsOpen = $state(false);
	let totalCount   = $state(0);
	let visibleCount = $state(0);

	// ── Derived ──────────────────────────────────────────────────────────────

	const effectiveActiveId = $derived(
		mapMode === 'graph' && stageFilter === null
			? uiStore.focusedNodeId
			: null,
	);

	const statsText = $derived(
		t('map.stats')
			.replace('{total}', String(totalCount))
			.replace('{visible}', String(visibleCount)),
	);

	// ── Stage counts for the landing orbs ────────────────────────────────────

	let stageCounts = $state<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });

	// ── Live subscription ────────────────────────────────────────────────────

	let thoughtsSub: { unsubscribe(): void } | null = null;

	onMount(() => {
		if (!uiStore.activeLibraryId) return;
		thoughtsSub = getThoughtsByLibrary(uiStore.activeLibraryId).subscribe(
			(thoughts: Thought[]) => {
				totalCount = thoughts.length;
				const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
				for (const t of thoughts) {
					counts[t.meta_state] = (counts[t.meta_state] ?? 0) + 1;
				}
				stageCounts = counts;
			},
		);
	});

	onDestroy(() => {
		thoughtsSub?.unsubscribe();
	});

	// ── Landing → Graph transition ──────────────────────────────────────────

	function handleSelectStage(stageId: number | null) {
		stageFilter = stageId;
		mapMode = 'graph';
	}

	function backToLanding() {
		stageFilter = null;
		mapMode = 'landing';
	}
</script>

<div class="map-page">
	<GraphCanvas
		libraryId={uiStore.activeLibraryId!}
		activeThoughtId={effectiveActiveId}
		bind:renderedCount={visibleCount}
		{stageFilter}
	/>

	{#if mapMode === 'landing'}
		<MapLanding
			{stageCounts}
			{totalCount}
			onSelectStage={handleSelectStage}
		/>
	{/if}

	{#if mapMode === 'graph'}
		<div class="overlays">
			<div class="overlay-left">
				<StageFilter />
			</div>

			<!-- Floating toolbar -->
			<div class="toolbar" role="toolbar" aria-label={t('nav.map')}>
				<button
					class="back-btn"
					type="button"
					aria-label={t('map.landing.backToLanding')}
					onclick={backToLanding}
				>
					<ArrowLeft size={15} strokeWidth={2} />
				</button>

				<span class="stats">{statsText}</span>

				<button
					class="controls-btn"
					class:active={controlsOpen}
					type="button"
					aria-label={t('graph.controls')}
					aria-pressed={controlsOpen}
					onclick={() => (controlsOpen = !controlsOpen)}
				>
					<SlidersHorizontal size={15} strokeWidth={2} />
				</button>
			</div>
		</div>

		{#if controlsOpen}
			<GraphControlsPanel />
		{/if}
	{/if}
</div>

<style>
	.map-page {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.map-page::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.3) 100%);
		z-index: 5;
		opacity: 0.6;
		transition: opacity 0.3s;
	}

	@media (max-width: 767px) {
		.map-page::after {
			opacity: 0.3;
		}
	}

	.overlays {
		position: absolute;
		top: 0.75rem;
		left: 0.75rem;
		right: 0.75rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		pointer-events: none;
		z-index: 10;
	}

	.overlay-left {
		pointer-events: auto;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: var(--glass-panel);
		backdrop-filter: var(--glass-blur-sm);
		-webkit-backdrop-filter: var(--glass-blur-sm);
		border: 1px solid var(--border-strong);
		border-radius: 10px;
		padding: 0.5rem 0.75rem;
		pointer-events: auto;
	}

	.stats {
		font-size: 0.75rem;
		color: var(--text-muted);
		white-space: nowrap;
	}

	.back-btn,
	.controls-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		min-height: 44px;
		min-width: 44px;
		background: none;
		border: none;
		border-radius: 6px;
		color: var(--text-muted);
		cursor: pointer;
		padding: 0;
		transition: color 120ms, background 120ms;
	}

	.back-btn:hover,
	.controls-btn:hover {
		color: var(--text-secondary);
		background: var(--bg-hover);
	}

	.controls-btn.active {
		color: var(--color-brand);
	}

	@media (max-width: 767px) {
		.overlays {
			flex-direction: column;
			top: 0.5rem;
			left: 0.5rem;
			right: 0.5rem;
			gap: 0.5rem;
		}

		.toolbar {
			width: 100%;
			justify-content: space-between;
			padding: 0.25rem 0.5rem;
		}

		.overlay-left {
			width: 100%;
			overflow-x: auto;
			padding-bottom: 4px;
		}
	}
</style>
