<script lang="ts">
	import { getContext } from 'svelte';
	import { fade } from 'svelte/transition';
	import { 
		Bold, Italic, Code, Link2, 
		Heading1, Heading2, Heading3, List, Quote, Palette, GripVertical, Smile, CheckSquare
	} from 'lucide-svelte';
	import { Capacitor } from '@capacitor/core';
	import { EDITOR_VIEW_KEY, type EditorViewGetter } from '$lib/editorContext';
	import { FEATURE_CONFIG, EDITOR_COLORS } from '$lib/config';
	import { $t as t } from '$lib/i18n';

	// ── Platform guard — native OS handles selection on mobile ────────────────
	const isNative = Capacitor.isNativePlatform();
	const getView: EditorViewGetter = getContext(EDITOR_VIEW_KEY);

	// ── State ─────────────────────────────────────────────────────────────────
	let visible = $state(false);
	let x = $state(0);
	let y = $state(0);
	let toolbarEl = $state<HTMLDivElement | null>(null);
	let colorPickerOpen = $state(false);
	let isDragging = $state(false);
	let hasBeenDragged = $state(false);

	// Drag state
	let dragOffset = { x: 0, y: 0 };

	const iconMap: Record<string, any> = {
		bold: Bold,
		italic: Italic,
		code: Code,
		link: Link2,
		h1: Heading1,
		h2: Heading2,
		h3: Heading3,
		list: List,
		checklist: CheckSquare,
		quote: Quote,
		emoji: Smile,
		color: Palette
	};

	// ── Selection listener ────────────────────────────────────────────────────
	function handleSelectionChange() {
		const sel = window.getSelection();
		if (!sel || sel.isCollapsed || sel.toString().length === 0) {
			visible = false;
			colorPickerOpen = false;
			hasBeenDragged = false;
			return;
		}

		if (hasBeenDragged) return;

		const range = sel.getRangeAt(0);
		const rect = range.getBoundingClientRect();

		const toolbarWidth = toolbarEl?.offsetWidth ?? 280;
		const rawX = rect.left + rect.width / 2 - toolbarWidth / 2;
		const rawY = rect.top + window.scrollY - 72;

		x = Math.max(8, Math.min(window.innerWidth - toolbarWidth - 8, rawX));
		y = Math.max(8, rawY);
		visible = true;
	}

	// ── Resize listener — hide on mobile ─────────────────────────────────────
	let isMobileScreen = $state(false);
	function checkMobile() { isMobileScreen = window.innerWidth <= 767; }

	$effect(() => {
		checkMobile();
		if (isNative) return;
		window.addEventListener('resize', checkMobile);
		document.addEventListener('selectionchange', handleSelectionChange);
		return () => {
			window.removeEventListener('resize', checkMobile);
			document.removeEventListener('selectionchange', handleSelectionChange);
		};
	});

	// ── Drag Logic ───────────────────────────────────────────────────────────
	function startDrag(e: PointerEvent) {
		if (isNative) return;
		isDragging = true;
		hasBeenDragged = true;
		dragOffset = {
			x: e.clientX - x,
			y: e.clientY - y
		};
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	function moveDrag(e: PointerEvent) {
		if (!isDragging) return;
		x = e.clientX - dragOffset.x;
		y = e.clientY - dragOffset.y;
	}

	function stopDrag(e: PointerEvent) {
		isDragging = false;
		(e.target as HTMLElement).releasePointerCapture(e.pointerId);
	}

	// ── Action handlers ───────────────────────────────────────────────────────
	function applyAction(action: typeof FEATURE_CONFIG.TOOLBAR_ACTIONS[number]) {
		if (action.id === 'color') {
			colorPickerOpen = !colorPickerOpen;
			return;
		}

		const view = getView();
		if (!view) return;

		const { from, to } = view.state.selection.main;
		const selected = view.state.sliceDoc(from, to);
		const [before, after] = action.wrap;

		view.dispatch({
			changes: { from, to, insert: before + selected + after },
			selection: { anchor: from + before.length, head: from + before.length + selected.length },
		});
		view.focus();
		visible = false;
	}

	function applyColor(color: string) {
		const view = getView();
		if (!view) return;

		const { from, to } = view.state.selection.main;
		const selected = view.state.sliceDoc(from, to);
		const before = `{color:${color}}`;
		const after = `{/color}`;

		view.dispatch({
			changes: { from, to, insert: before + selected + after },
			selection: { anchor: from + before.length, head: from + before.length + selected.length },
		});
		view.focus();
		colorPickerOpen = false;
		visible = false;
	}
</script>

{#if !isNative && visible}
	<div
		class="toolbar glass"
		style="left: {x}px; top: {y}px;"
		bind:this={toolbarEl}
		role="toolbar"
		aria-label="Format selection"
		class:dragging={isDragging}
		transition:fade={{ duration: 100 }}
	>
		<div 
			class="drag-handle" 
			role="presentation"
			onpointerdown={startDrag}
			onpointermove={moveDrag}
			onpointerup={stopDrag}
		>
			<GripVertical size={14} />
		</div>

		<div class="actions-row">
			{#each FEATURE_CONFIG.TOOLBAR_ACTIONS as action}
				{@const Icon = iconMap[action.id]}
				<button
					class="toolbar-action"
					class:active={action.id === 'color' && colorPickerOpen}
					type="button"
					aria-label={t(action.i18nKey)}
					onmousedown={(e) => {
						e.preventDefault(); 
						applyAction(action);
					}}
				>
					{#if Icon}
						<Icon size={16} />
					{/if}
				</button>
			{/each}
		</div>

		{#if colorPickerOpen}
			<div class="color-picker" transition:fade={{ duration: 80 }}>
				{#each EDITOR_COLORS as color}
					<button 
						class="color-swatch"
						style="background: {color.value}"
						title={color.name}
						onmousedown={(e) => {
							e.preventDefault();
							applyColor(color.value);
						}}
					></button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.toolbar {
		position: fixed;
		z-index: 400;
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 4px;
		background: var(--bg-panel);
		border: 1px solid var(--border-strong);
		border-radius: 12px;
		box-shadow: var(--shadow-xl);
		pointer-events: auto;
		user-select: none;
	}

	.dragging {
		cursor: grabbing;
		opacity: 0.9;
		box-shadow: var(--shadow-2xl);
		transform: scale(1.02);
	}

	.drag-handle {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2px 0;
		cursor: grab;
		color: var(--text-muted);
		opacity: 0.5;
		transition: opacity 0.2s;
	}

	.drag-handle:hover {
		opacity: 1;
	}

	.actions-row {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.toolbar-action {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		color: var(--text-secondary);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.toolbar-action:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.toolbar-action.active {
		background: var(--brand-tint-subtle);
		color: var(--color-brand);
	}

	/* Color Picker */
	.color-picker {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px;
		padding: 8px;
		border-top: 1px solid var(--border-separator);
		margin-top: 4px;
	}

	.color-swatch {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 1px solid var(--border-subtle);
		cursor: pointer;
		transition: transform 0.1s;
	}

	.color-swatch:hover {
		transform: scale(1.2);
	}

	.glass {
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}
</style>
