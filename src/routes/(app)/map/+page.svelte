<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { SlidersHorizontal } from 'lucide-svelte';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { getThoughtsByLibrary, type Thought } from '$lib/db';
	import { $t as t } from '$lib/i18n';
	import { GRAPH_CONFIG } from '$lib/config';
	import GraphCanvas from '../../../components/graph/GraphCanvas.svelte';
	import GraphControlsPanel from '../../../components/graph/GraphControlsPanel.svelte';

	// ── State ─────────────────────────────────────────────────────────────────

	let showFullGraph  = $state(false);
	let controlsOpen  = $state(false);
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

	<!-- Empty state — shown when library has no thoughts -->
	{#if totalCount === 0}
		<div class="empty-state" aria-live="polite">
			<p class="empty-title">{t('map.emptyTitle')}</p>
			<p class="empty-hint">{t('map.emptyHint')}</p>
		</div>
	{/if}

	<!-- Floating toolbar -->
	<div class="toolbar" role="toolbar" aria-label={t('nav.map')}>
		<label class="toggle">
			<input
				class="toggle-input"
				type="checkbox"
				bind:checked={showFullGraph}
			/>
			<span class="toggle-track" aria-hidden="true">
				<span class="toggle-thumb"></span>
			</span>
			<span class="toggle-label">{t('map.showAll')}</span>
		</label>

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

	{#if controlsOpen}
		<GraphControlsPanel />
	{/if}
</div>

<style>
	.map-page {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.empty-state {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		gap: 0.5rem;
	}

	.empty-title {
		font-size: 1.0625rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin: 0;
	}

	.empty-hint {
		font-size: 0.875rem;
		color: var(--text-muted);
		margin: 0;
	}

	.toolbar {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		background: var(--glass-panel);
		backdrop-filter: var(--glass-blur-sm);
		-webkit-backdrop-filter: var(--glass-blur-sm);
		border: 1px solid var(--border-strong);
		border-radius: 10px;
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

	/* Visually hidden native input — keeps keyboard + screen reader support */
	.toggle-input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
	}

	.toggle-track {
		position: relative;
		width: 28px;
		height: 16px;
		border-radius: 8px;
		background: var(--bg-hover);
		border: 1px solid var(--border-strong);
		flex-shrink: 0;
		transition: background 150ms, border-color 150ms;
	}

	.toggle-input:checked ~ .toggle-track {
		background: var(--color-brand);
		border-color: var(--color-brand);
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--text-muted);
		transition: transform 150ms, background 150ms;
	}

	.toggle-input:checked ~ .toggle-track .toggle-thumb {
		transform: translateX(12px);
		background: var(--bg-deep);
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

	.controls-btn:hover {
		color: var(--text-secondary);
		background: var(--bg-hover);
	}

	.controls-btn.active {
		color: var(--color-brand);
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
