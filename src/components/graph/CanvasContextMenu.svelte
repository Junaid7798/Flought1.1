<script lang="ts">
	import { $t as t } from '$lib/i18n';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { eventBus } from '$lib/eventBus';

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		x: number;
		y: number;
		simX: number;
		simY: number;
		onClose: () => void;
	}
	let { x, y, simX, simY, onClose }: Props = $props();

	// ── Actions ───────────────────────────────────────────────────────────────

	function handleCreateHere() {
		uiStore.sparkInputPrefillCoords = { x: simX, y: simY };
		onClose();
	}

	function handleResetViewport() {
		eventBus.emit({ type: 'graph.resetViewport', payload: {} });
		onClose();
	}

	function handleSettleGraph() {
		eventBus.emit({ type: 'graph.settleGraph', payload: {} });
		onClose();
	}

	function handleBackdrop() {
		onClose();
	}
</script>

<!-- Invisible backdrop to close on click outside -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="backdrop" onpointerdown={handleBackdrop}></div>

<div
	class="context-menu"
	style="left: {x}px; top: {y}px"
	role="menu"
	aria-label="Canvas context menu"
>
	<button class="menu-item" role="menuitem" onclick={handleCreateHere}>
		{t('graph.createHere')}
	</button>

	<button class="menu-item" role="menuitem" onclick={handleResetViewport}>
		{t('graph.resetViewport')}
	</button>

	<button class="menu-item" role="menuitem" onclick={handleSettleGraph}>
		{t('graph.settleGraph')}
	</button>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 999;
	}

	.context-menu {
		position: fixed;
		z-index: 1000;
		min-width: 180px;
		background: var(--glass-surface);
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		border: 1px solid var(--border-strong);
		border-radius: 10px;
		padding: 4px 0;
		box-shadow: 0 8px 32px var(--shadow-dropdown);
	}

	.menu-item {
		display: flex;
		align-items: center;
		width: 100%;
		min-height: 36px;
		padding: 0 12px;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-secondary);
		font-size: 0.8125rem;
		font-family: inherit;
		text-align: left;
		transition: background 100ms, color 100ms;
	}

	.menu-item:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}
</style>
