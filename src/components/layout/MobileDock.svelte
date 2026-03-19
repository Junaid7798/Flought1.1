<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Map, PenLine, Plus, X } from 'lucide-svelte';
	import { Capacitor } from '@capacitor/core';
	import { Keyboard } from '@capacitor/keyboard';
	import { $t as t } from '$lib/i18n';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import SparkInput from '../capture/SparkInput.svelte';

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		libraryId: string;
	}
	let { libraryId }: Props = $props();

	// ── State ─────────────────────────────────────────────────────────────────

	let captureOpen = $state(false);
	let dockHidden = $state(false);

	// ── Keyboard listeners (native only) ──────────────────────────────────────

	onMount(() => {
		if (!Capacitor.isNativePlatform()) return;
		Keyboard.addListener('keyboardWillShow', () => { dockHidden = true; });
		Keyboard.addListener('keyboardWillHide', () => { dockHidden = false; });
	});

	onDestroy(() => {
		if (!Capacitor.isNativePlatform()) return;
		Keyboard.removeAllListeners();
	});

	// ── Handlers ──────────────────────────────────────────────────────────────

	function selectTab(view: 'map' | 'editor') {
		uiStore.activeView = view;
		captureOpen = false;
	}

	function toggleCapture() {
		captureOpen = !captureOpen;
	}

	function closeCapture() {
		captureOpen = false;
	}

	function handleBackdropKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') closeCapture();
	}
</script>

<!-- ── Bottom sheet backdrop ──────────────────────────────────────────── -->
{#if captureOpen}
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		class="backdrop"
		role="button"
		aria-label="Close capture"
		onclick={closeCapture}
		onkeydown={handleBackdropKeydown}
	></div>
{/if}

<!-- ── Bottom sheet ───────────────────────────────────────────────────── -->
<div class="sheet" class:sheet-open={captureOpen} aria-hidden={!captureOpen}>
	<div class="sheet-handle-row">
		<div class="sheet-handle" aria-hidden="true"></div>
		<button class="sheet-close" onclick={closeCapture} aria-label="Close">
			<X size={18} />
		</button>
	</div>
	<SparkInput {libraryId} />
</div>

<!-- ── Dock ───────────────────────────────────────────────────────────── -->
<nav class="dock" class:dock-hidden={dockHidden} aria-label="Navigation">
	<button
		class="dock-tab"
		class:active={uiStore.activeView === 'map' && !captureOpen}
		onclick={() => selectTab('map')}
		aria-label={t('nav.map')}
		aria-current={uiStore.activeView === 'map' && !captureOpen ? 'page' : undefined}
	>
		<Map size={22} />
		<span class="tab-label">{t('nav.map')}</span>
	</button>

	<button
		class="dock-tab capture-tab"
		class:active={captureOpen}
		onclick={toggleCapture}
		aria-label={t('capture.prompt')}
		aria-expanded={captureOpen}
	>
		<div class="capture-pip">
			<Plus size={24} />
		</div>
	</button>

	<button
		class="dock-tab"
		class:active={uiStore.activeView === 'editor' && !captureOpen}
		onclick={() => selectTab('editor')}
		aria-label={t('nav.editor')}
		aria-current={uiStore.activeView === 'editor' && !captureOpen ? 'page' : undefined}
	>
		<PenLine size={22} />
		<span class="tab-label">{t('nav.editor')}</span>
	</button>
</nav>

<style>
	/* ── Backdrop ────────────────────────────────────────────────────────── */

	.backdrop {
		position: fixed;
		inset: 0;
		background: var(--overlay-backdrop);
		z-index: 59;
	}

	/* ── Bottom sheet ────────────────────────────────────────────────────── */

	.sheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--bg-panel);
		border-top: 1px solid var(--border-strong);
		border-radius: 16px 16px 0 0;
		z-index: 60;
		/* Start off-screen below the dock */
		transform: translateY(100%);
		opacity: 0;
		transition:
			transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
			opacity 180ms ease;
		pointer-events: none;
	}

	.sheet.sheet-open {
		transform: translateY(0);
		opacity: 1;
		pointer-events: auto;
	}

	.sheet-handle-row {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.625rem 1rem 0;
		position: relative;
	}

	.sheet-handle {
		width: 36px;
		height: 4px;
		border-radius: 2px;
		background: var(--border-strong);
	}

	.sheet-close {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
		padding: 0;
	}

	.sheet-close:hover {
		color: var(--text-primary);
	}

	/* ── Dock ────────────────────────────────────────────────────────────── */

	.dock {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: calc(60px + env(safe-area-inset-bottom));
		padding-bottom: env(safe-area-inset-bottom);
		background: var(--bg-panel);
		border-top: 1px solid var(--border);
		display: flex;
		align-items: stretch;
		z-index: 70;

		/* Desktop: hidden — Sidebar handles navigation */
		display: none;
		transition: transform 180ms ease, opacity 150ms ease;
	}

	@media (max-width: 767px) {
		.dock {
			display: flex;
		}
	}

	.dock.dock-hidden {
		transform: translateY(100%);
		opacity: 0;
		pointer-events: none;
		transition: transform 180ms ease, opacity 150ms ease;
	}

	/* ── Tabs ────────────────────────────────────────────────────────────── */

	.dock-tab {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		min-height: 44px;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		font-family: inherit;
		transition: color 120ms;
		padding: 0;
	}

	.dock-tab:hover,
	.dock-tab.active {
		color: var(--color-brand);
	}

	.dock-tab:focus-visible {
		outline: 2px solid var(--color-brand);
		outline-offset: -4px;
		border-radius: 6px;
	}

	.tab-label {
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	/* ── Capture (centre) tab ────────────────────────────────────────────── */

	.capture-tab {
		flex: 0 0 72px;
	}

	.capture-pip {
		width: 48px;
		height: 48px;
		border-radius: 14px;
		background: var(--color-brand);
		color: var(--bg-deep);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity 120ms;
	}

	.capture-tab:hover .capture-pip,
	.capture-tab.active .capture-pip {
		opacity: 0.85;
	}
</style>
