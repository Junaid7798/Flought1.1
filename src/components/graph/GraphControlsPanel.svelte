<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { $t as t } from '$lib/i18n';
	import { GRAPH_SLIDER_CONSTRAINTS, GRAPH_PRESETS } from '$lib/graphDefaults';
	import type { GraphPreset } from '$lib/graphDefaults';

	// ── Accordion state ───────────────────────────────────────────────────────

	let displayOpen = $state(true);
	let physicsOpen = $state(false);
	let focusOpen   = $state(false);

	// ── Preset application ────────────────────────────────────────────────────

	function applyPreset(name: GraphPreset) {
		const p = GRAPH_PRESETS[name];
		uiStore.graphNodeSize     = p.nodeRadius;
		uiStore.graphEdgeOpacity  = p.edgeOpacity;
		uiStore.graphRepulsion    = p.repulsion;
		uiStore.graphLinkDistance = p.linkDistance;
		uiStore.graphSettleSpeed  = p.settleSpeed;
		uiStore.graphPreset       = name;
	}

	const PRESET_KEYS: GraphPreset[] = ['default', 'compact', 'spread', 'zen'];
	const PRESET_LABEL_KEYS: Record<GraphPreset, string> = {
		default: 'graph.presetDefault',
		compact: 'graph.presetCompact',
		spread:  'graph.presetSpread',
		zen:     'graph.presetZen',
	};
</script>

<div class="controls-panel" role="complementary" aria-label={t('graph.controls')}>

	<!-- ── Display section ──────────────────────────────────────────────── -->
	<section class="accordion">
		<button
			class="accordion-trigger"
			type="button"
			aria-expanded={displayOpen}
			onclick={() => (displayOpen = !displayOpen)}
		>
			<span class="section-title">{t('graph.display')}</span>
			<span class="chevron" class:open={displayOpen}><ChevronDown size={14} strokeWidth={2} /></span>
		</button>

		{#if displayOpen}
			<div class="accordion-body">

				<!-- Node Size -->
				<div class="control-row">
					<div class="control-header">
						<label class="control-label" for="ctrl-node-size">{t('graph.nodeSize')}</label>
						<span class="control-value">{uiStore.graphNodeSize}</span>
					</div>
					<input
						id="ctrl-node-size"
						type="range"
						min={GRAPH_SLIDER_CONSTRAINTS.nodeRadius.min}
						max={GRAPH_SLIDER_CONSTRAINTS.nodeRadius.max}
						step={GRAPH_SLIDER_CONSTRAINTS.nodeRadius.step}
						bind:value={uiStore.graphNodeSize}
						style="accent-color: var(--color-brand)"
					/>
				</div>

				<!-- Edge Opacity -->
				<div class="control-row">
					<div class="control-header">
						<label class="control-label" for="ctrl-edge-opacity">{t('graph.edgeOpacity')}</label>
						<span class="control-value">{uiStore.graphEdgeOpacity.toFixed(2)}</span>
					</div>
					<input
						id="ctrl-edge-opacity"
						type="range"
						min={GRAPH_SLIDER_CONSTRAINTS.edgeOpacity.min}
						max={GRAPH_SLIDER_CONSTRAINTS.edgeOpacity.max}
						step={GRAPH_SLIDER_CONSTRAINTS.edgeOpacity.step}
						bind:value={uiStore.graphEdgeOpacity}
						style="accent-color: var(--color-brand)"
					/>
				</div>

				<!-- Show Labels toggle -->
				<label class="toggle-row">
					<input class="toggle-input" type="checkbox" bind:checked={uiStore.graphShowLabels} />
					<span class="toggle-track" aria-hidden="true"><span class="toggle-thumb"></span></span>
					<span class="toggle-text">{t('graph.showLabels')}</span>
				</label>

				<!-- Show Hulls toggle -->
				<label class="toggle-row">
					<input class="toggle-input" type="checkbox" bind:checked={uiStore.graphShowHulls} />
					<span class="toggle-track" aria-hidden="true"><span class="toggle-thumb"></span></span>
					<span class="toggle-text">{t('graph.showHulls')}</span>
				</label>

			</div>
		{/if}
	</section>

	<!-- ── Physics section ──────────────────────────────────────────────── -->
	<section class="accordion">
		<button
			class="accordion-trigger"
			type="button"
			aria-expanded={physicsOpen}
			onclick={() => (physicsOpen = !physicsOpen)}
		>
			<span class="section-title">{t('graph.physics')}</span>
			<span class="chevron" class:open={physicsOpen}><ChevronDown size={14} strokeWidth={2} /></span>
		</button>

		{#if physicsOpen}
			<div class="accordion-body">

				<!-- Repulsion -->
				<div class="control-row">
					<div class="control-header">
						<label class="control-label" for="ctrl-repulsion">{t('graph.repulsion')}</label>
						<span class="control-value">{uiStore.graphRepulsion}</span>
					</div>
					<input
						id="ctrl-repulsion"
						type="range"
						min={GRAPH_SLIDER_CONSTRAINTS.repulsion.min}
						max={GRAPH_SLIDER_CONSTRAINTS.repulsion.max}
						step={GRAPH_SLIDER_CONSTRAINTS.repulsion.step}
						bind:value={uiStore.graphRepulsion}
						style="accent-color: var(--color-brand)"
					/>
				</div>

				<!-- Link Distance -->
				<div class="control-row">
					<div class="control-header">
						<label class="control-label" for="ctrl-link-dist">{t('graph.linkDistance')}</label>
						<span class="control-value">{uiStore.graphLinkDistance}</span>
					</div>
					<input
						id="ctrl-link-dist"
						type="range"
						min={GRAPH_SLIDER_CONSTRAINTS.linkDistance.min}
						max={GRAPH_SLIDER_CONSTRAINTS.linkDistance.max}
						step={GRAPH_SLIDER_CONSTRAINTS.linkDistance.step}
						bind:value={uiStore.graphLinkDistance}
						style="accent-color: var(--color-brand)"
					/>
				</div>

				<!-- Settle Speed -->
				<div class="control-row">
					<div class="control-header">
						<label class="control-label" for="ctrl-settle">{t('graph.settleSpeed')}</label>
						<span class="control-value">{uiStore.graphSettleSpeed.toFixed(3)}</span>
					</div>
					<input
						id="ctrl-settle"
						type="range"
						min={GRAPH_SLIDER_CONSTRAINTS.settleSpeed.min}
						max={GRAPH_SLIDER_CONSTRAINTS.settleSpeed.max}
						step={GRAPH_SLIDER_CONSTRAINTS.settleSpeed.step}
						bind:value={uiStore.graphSettleSpeed}
						style="accent-color: var(--color-brand)"
					/>
				</div>

			</div>
		{/if}
	</section>

	<!-- ── Focus section ────────────────────────────────────────────────── -->
	<section class="accordion">
		<button
			class="accordion-trigger"
			type="button"
			aria-expanded={focusOpen}
			onclick={() => (focusOpen = !focusOpen)}
		>
			<span class="section-title">{t('graph.focus')}</span>
			<span class="chevron" class:open={focusOpen}><ChevronDown size={14} strokeWidth={2} /></span>
		</button>

		{#if focusOpen}
			<div class="accordion-body">

				<!-- Neighbourhood Depth -->
				<div class="control-row">
					<span class="control-label">{t('graph.neighbourhoodDepth')}</span>
					<div class="depth-group" role="group" aria-label={t('graph.neighbourhoodDepth')}>
						{#each [1, 2, 3] as depth}
							<button
								class="depth-btn"
								class:active={uiStore.graphNeighbourhoodDepth === depth}
								type="button"
								aria-current={uiStore.graphNeighbourhoodDepth === depth ? 'true' : undefined}
								onclick={() => (uiStore.graphNeighbourhoodDepth = depth)}
							>{depth}</button>
						{/each}
					</div>
				</div>

				<!-- Dim Strength -->
				<div class="control-row">
					<div class="control-header">
						<label class="control-label" for="ctrl-dim">{t('graph.dimStrength')}</label>
						<span class="control-value">{uiStore.graphDimStrength.toFixed(2)}</span>
					</div>
					<input
						id="ctrl-dim"
						type="range"
						min={GRAPH_SLIDER_CONSTRAINTS.dimStrength.min}
						max={GRAPH_SLIDER_CONSTRAINTS.dimStrength.max}
						step={GRAPH_SLIDER_CONSTRAINTS.dimStrength.step}
						bind:value={uiStore.graphDimStrength}
						style="accent-color: var(--color-brand)"
					/>
				</div>

			</div>
		{/if}
	</section>

	<!-- ── Presets row (flat, no accordion) ─────────────────────────────── -->
	<div class="presets-row" role="group" aria-label={t('graph.presets')}>
		{#each PRESET_KEYS as name}
			<button
				class="preset-btn"
				class:active={uiStore.graphPreset === name}
				type="button"
				aria-current={uiStore.graphPreset === name ? 'true' : undefined}
				onclick={() => applyPreset(name)}
			>{t(PRESET_LABEL_KEYS[name])}</button>
		{/each}
	</div>

</div>

<style>
	.controls-panel {
		position: absolute;
		top: 3.5rem;
		right: 0.75rem;
		width: 280px;
		z-index: 20;
		background: var(--glass-panel);
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		border: 1px solid var(--border-strong);
		border-radius: 12px;
		overflow: hidden;
	}

	/* Fallback for older Android WebView (pre-API 30) */
	@supports not (backdrop-filter: blur(1px)) {
		.controls-panel {
			background: var(--bg-panel);
		}
	}

	@media (max-width: 767px) {
		.controls-panel {
			width: calc(100vw - 1.5rem);
			z-index: 65; /* below dock (70), above sheet (60) */
		}
	}

	/* ── Accordion ──────────────────────────────────────────────────────── */

	.accordion {
		border-bottom: 1px solid var(--border);
	}

	.accordion-trigger {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: none;
		border: none;
		padding: 0.625rem 0.875rem;
		cursor: pointer;
		min-height: 44px;
		color: var(--text-primary);
		font-family: inherit;
		font-size: 0.8125rem;
		font-weight: 500;
	}

	.accordion-trigger:hover {
		background: var(--bg-hover);
	}

	.section-title {
		color: var(--text-secondary);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.chevron {
		color: var(--text-muted);
		display: flex;
		align-items: center;
		transition: transform 150ms;
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.accordion-body {
		padding: 0.25rem 0.875rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	/* ── Controls ───────────────────────────────────────────────────────── */

	.control-row {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.control-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.control-label {
		font-size: 0.8125rem;
		color: var(--text-secondary);
	}

	.control-value {
		font-size: 0.75rem;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	input[type='range'] {
		width: 100%;
		height: 4px;
		cursor: pointer;
		border-radius: 2px;
		background: var(--bg-hover);
		appearance: none;
		-webkit-appearance: none;
	}

	/* ── Toggles ────────────────────────────────────────────────────────── */

	.toggle-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		min-height: 36px;
	}

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

	.toggle-text {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		user-select: none;
	}

	/* ── Depth buttons ──────────────────────────────────────────────────── */

	.depth-group {
		display: flex;
		gap: 0.375rem;
		margin-top: 0.25rem;
	}

	.depth-btn {
		flex: 1;
		min-height: 32px;
		background: var(--bg-panel);
		border: 1px solid var(--border-strong);
		border-radius: 6px;
		color: var(--text-secondary);
		font-family: inherit;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 120ms, border-color 120ms, color 120ms;
	}

	.depth-btn.active {
		background: var(--color-brand);
		border-color: var(--color-brand);
		color: var(--bg-deep);
		font-weight: 600;
	}

	/* ── Presets row ────────────────────────────────────────────────────── */

	.presets-row {
		display: flex;
		gap: 0.375rem;
		padding: 0.625rem 0.875rem;
	}

	.preset-btn {
		flex: 1;
		min-height: 32px;
		background: var(--bg-panel);
		border: 1px solid var(--border-strong);
		border-radius: 6px;
		color: var(--text-secondary);
		font-family: inherit;
		font-size: 0.75rem;
		cursor: pointer;
		transition: background 120ms, border-color 120ms, color 120ms;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.preset-btn.active {
		border-color: var(--color-brand);
		color: var(--color-brand);
	}

	.preset-btn:hover:not(.active) {
		background: var(--bg-hover);
	}
</style>
