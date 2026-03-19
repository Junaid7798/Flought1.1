<script lang="ts">
	import { getContext } from 'svelte';
	import { Capacitor } from '@capacitor/core';
	import { EDITOR_VIEW_KEY, type EditorViewGetter } from '$lib/editorContext';
	import { FEATURE_CONFIG } from '$lib/config';
	import { $t as t } from '$lib/i18n';

	// ── Platform guard — native OS handles selection on mobile ────────────────
	// FloatingToolbar renders nothing on Capacitor native platforms.

	const isNative = Capacitor.isNativePlatform();

	// ── Editor context ────────────────────────────────────────────────────────

	const getView: EditorViewGetter = getContext(EDITOR_VIEW_KEY);

	// ── State ─────────────────────────────────────────────────────────────────

	let visible = $state(false);
	let x = $state(0);
	let y = $state(0);
	let toolbarEl = $state<HTMLDivElement | null>(null);

	// ── Selection listener ────────────────────────────────────────────────────

	function handleSelectionChange() {
		const sel = window.getSelection();
		if (!sel || sel.isCollapsed || sel.toString().length === 0) {
			visible = false;
			return;
		}

		const range = sel.getRangeAt(0);
		const rect = range.getBoundingClientRect();

		const toolbarWidth = toolbarEl?.offsetWidth ?? 160;
		const rawX = rect.left + rect.width / 2 - toolbarWidth / 2;
		const rawY = rect.top + window.scrollY - 48;

		// Clamp to viewport edges — FIX-V1-12
		x = Math.max(8, Math.min(window.innerWidth - toolbarWidth - 8, rawX));
		y = Math.max(8, rawY);
		visible = true;
	}

	$effect(() => {
		if (isNative) return;
		document.addEventListener('selectionchange', handleSelectionChange);
		return () => {
			document.removeEventListener('selectionchange', handleSelectionChange);
		};
	});

	// ── Action handler ────────────────────────────────────────────────────────

	function applyWrap(wrap: readonly [string, string]) {
		const view = getView();
		if (!view) return;

		const { from, to } = view.state.selection.main;
		const selected = view.state.sliceDoc(from, to);
		const [before, after] = wrap;

		view.dispatch({
			changes: { from, to, insert: before + selected + after },
			selection: { anchor: from + before.length, head: from + before.length + selected.length },
		});
		view.focus();
		visible = false;
	}
</script>

{#if !isNative && visible}
	<div
		class="toolbar"
		style="left: {x}px; top: {y}px;"
		bind:this={toolbarEl}
		role="toolbar"
		aria-label="Format selection"
	>
		{#each FEATURE_CONFIG.TOOLBAR_ACTIONS as action}
			<button
				class="toolbar-action"
				type="button"
				aria-label={t(action.i18nKey)}
				onmousedown={(e) => {
					e.preventDefault(); // prevent selection loss
					applyWrap(action.wrap as [string, string]);
				}}
			>
				{t(action.i18nKey)}
			</button>
		{/each}
	</div>
{/if}

<style>
	.toolbar {
		position: fixed;
		z-index: 400;
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 4px 6px;
		background: var(--bg-panel);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		pointer-events: auto;
		opacity: 0;
		transform: translateY(-4px);
		animation: toolbarIn 120ms ease forwards;
	}

	@keyframes toolbarIn {
		to { opacity: 1; transform: translateY(0); }
	}

	/* Blur only on desktop — Rule 9 compliant (conditional application) */
	@media (min-width: 768px) {
		.toolbar {
			backdrop-filter: blur(12px);
			-webkit-backdrop-filter: blur(12px);
		}
	}

	.toolbar-action {
		background: none;
		border: none;
		color: var(--text-secondary);
		font-family: inherit;
		font-size: 0.8125rem;
		font-weight: 600;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		cursor: pointer;
		transition: background 80ms, color 80ms;
		white-space: nowrap;
	}

	.toolbar-action:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}
</style>
