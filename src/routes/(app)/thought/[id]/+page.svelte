<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { 
		getThought, updateThought, propagateRename,
		getUserSettings, updateUserSettings,
		type Thought 
	} from '$lib/db';
	import { showToast } from '$lib/stores/toastStore.svelte';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { ANIMATION_CONFIG } from '$lib/config';
	import { $t as t } from '$lib/i18n';
	import matter from 'gray-matter';
	import ThoughtEditor from '../../../../components/editor/ThoughtEditor.svelte';
	import DocumentOutline from '../../../../components/editor/DocumentOutline.svelte';
	import BacklinkFooter from '../../../../components/editor/BacklinkFooter.svelte';
	import { Capacitor } from '@capacitor/core';
	import { 
		ChevronLeft, ChevronRight, Share2, MoreVertical, 
		History, Link, Zap, Calendar, Pin, 
		Clock, Info, LayoutList, PanelRightClose, PanelRightOpen,
		Bold, Italic, List, ListOrdered, Quote, Code, Heading1, Heading2, Heading3
	} from 'lucide-svelte';

	// ── State ─────────────────────────────────────────────────────────────────

	let thought = $state<Thought | null>(null);
	let prevTitle = '';
	let scrollEl = $state<HTMLElement | null>(null);
	let kbHeight = $state(0);
	let isNative = $state(false);

	let rightSidebarWidth = $state(280);
	const MIN_WIDTH = 200;
	const MAX_WIDTH = 450;
	let resizing = $state(false);
	let saveWidthTimer: ReturnType<typeof setTimeout> | null = null;

	// Frontmatter state parsing (debounced for performance)
	let pageData = $state({ cover: null as string | null, icon: null as string | null, body: '' });
	let parseTimer: ReturnType<typeof setTimeout> | null = null;
	
	$effect(() => {
		if (!thought?.content) {
			pageData = { cover: null, icon: null, body: '' };
			return;
		}
		
		const parse = () => {
			try {
				const { data, content: body } = matter(thought!.content);
				pageData = { cover: data.cover || null, icon: data.icon || null, body };
			} catch (e) {
				pageData = { cover: null, icon: null, body: thought!.content };
			}
		};
		
		if (pageData.body === '') parse(); // Initial immediate parse
		else {
			if (parseTimer) clearTimeout(parseTimer);
			parseTimer = setTimeout(parse, 300); // Debounce subsequent parses
		}
	});

	// ── Load thought ──────────────────────────────────────────────────────────

	function handleKbShow(e: any) { kbHeight = e.keyboardHeight; }
	function handleKbHide() { kbHeight = 0; }

	onMount(async () => {
		isNative = Capacitor.isNativePlatform();
		const id = page.params.id as string;
		const [data, settings] = await Promise.all([
			getThought(id),
			getUserSettings()
		]);
		
		if (data) {
			thought = data;
			prevTitle = data.title;
		}
		
		if (settings?.right_sidebar_width) {
			rightSidebarWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, settings.right_sidebar_width));
		}

		if (isNative) {
			window.addEventListener('keyboardWillShow', handleKbShow);
			window.addEventListener('keyboardWillHide', handleKbHide);
		}
	});

	onDestroy(() => {
		if (isNative) {
			window.removeEventListener('keyboardWillShow', handleKbShow);
			window.removeEventListener('keyboardWillHide', handleKbHide);
		}
	});

	// ── Title editing ─────────────────────────────────────────────────────────

	let titleSaveTimer: ReturnType<typeof setTimeout> | null = null;

	async function handleTitleInput(e: Event) {
		if (!thought) return;
		const newTitle = (e.target as HTMLElement).innerText;
		
		if (titleSaveTimer) clearTimeout(titleSaveTimer);
		titleSaveTimer = setTimeout(async () => {
			if (!thought) return;
			await updateThought(thought.id, { title: newTitle });
		}, 600);
	}

	async function handleTitleBlur(e: FocusEvent) {
		if (!thought) return;
		const newTitle = (e.target as HTMLElement).innerText.trim();
		const oldTitle = prevTitle;
		
		if (newTitle && newTitle !== oldTitle) {
			prevTitle = newTitle;
			const count = await propagateRename(oldTitle, newTitle);
			if (count > 0) {
				showToast(t('editor.linksUpdated').replace('{count}', String(count)));
			}
		}
	}

	// ── Formatting helpers ────────────────────────────────────────────────────

	function applyWrap(before: string, after: string) {
		window.dispatchEvent(new CustomEvent('flought:format', { detail: { before, after } }));
	}

	const toolbarActions = [
		{ icon: Bold, label: 'Bold', wrap: ['**', '**'] },
		{ icon: Italic, label: 'Italic', wrap: ['*', '*'] },
		{ icon: Heading1, label: 'H1', wrap: ['# ', ''] },
		{ icon: Heading2, label: 'H2', wrap: ['## ', ''] },
		{ icon: Heading3, label: 'H3', wrap: ['### ', ''] },
		{ icon: List, label: 'Bullet List', wrap: ['- ', ''] },
		{ icon: ListOrdered, label: 'Numbered List', wrap: ['1. ', ''] },
		{ icon: Quote, label: 'Blockquote', wrap: ['> ', ''] },
		{ icon: Code, label: 'Code', wrap: ['`', '`'] },
		{ icon: Link, label: 'Link', wrap: ['[', '](url)'] },
	];

	// ── Resize Right Sidebar ──────────────────────────────────────────────────

	function handleResizeStart(e: MouseEvent) {
		e.preventDefault();
		resizing = true;

		function onMove(ev: MouseEvent) {
			// Calculate width from the right edge of the screen
			// Ev.clientX is distance from left. Total width is window.innerWidth.
			const newWidth = window.innerWidth - ev.clientX;
			rightSidebarWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth));
		}

		function onUp() {
			resizing = false;
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
			if (saveWidthTimer) clearTimeout(saveWidthTimer);
			saveWidthTimer = setTimeout(() => {
				updateUserSettings({ right_sidebar_width: rightSidebarWidth });
			}, 400);
		}

		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	}
</script>

<svelte:head>
	<title>{thought?.title || 'Loading...'} | Flought</title>
</svelte:head>

<div class="page-container" style="--keyboard-offset: {kbHeight}px">
	{#if thought}
		<div class="editor-shell">
			<!-- Main writing column -->
			<main class="editor-main" bind:this={scrollEl}>
				{#if pageData.cover}
					<div class="page-cover" style="background-image: url('{pageData.cover}')"></div>
				{/if}

				<div class="page-header">
					{#if pageData.icon}
						<div class="page-icon-wrap">
							<span>{pageData.icon}</span>
						</div>
					{/if}
					
					<h1 
						class="page-title" 
						contenteditable="true"
						spellcheck="false"
						data-placeholder={t('editor.titlePlaceholder')}
						onblur={handleTitleBlur}
						oninput={handleTitleInput}
					>
						{thought.title}
					</h1>

					<div class="header-actions">
						<button 
							class="sidebar-toggle-btn" 
							onclick={() => { uiStore.rightSidebarCollapsed = !uiStore.rightSidebarCollapsed; }}
							title={uiStore.rightSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
							type="button"
						>
							{#if uiStore.rightSidebarCollapsed}
								<PanelRightOpen size={18} />
							{:else}
								<PanelRightClose size={18} />
							{/if}
						</button>
					</div>
				</div>

				<div class="layout-container">
					<div class="writing-canvas">
						<!-- Formatting toolbar (Inline/Floating) -->
						{#if !Capacitor.isNativePlatform()}
							<div class="fmt-toolbar-wrap">
								<div class="fmt-toolbar glass" role="toolbar">
									{#each toolbarActions as action}
										{@const ToolbarIcon = action.icon}
										<button
											class="fmt-btn"
											onclick={() => applyWrap(action.wrap[0], action.wrap[1])}
											title={action.label}
											aria-label={action.label}
											type="button"
										>
											<ToolbarIcon size={14} />
										</button>
									{/each}
								</div>
							</div>
						{/if}

						<div class="content-block">
							<ThoughtEditor 
								thought={thought} 
								bodyOnly={true}
								initialBody={pageData.body}
								searchWorker={uiStore.searchWorker} 
							/>
							<BacklinkFooter thoughtTitle={thought.title} />
						</div>
					</div>
				</div>
			</main>

			<!-- Resize handle -->
			<button
				class="right-resize-handle hidden-mobile"
				class:active={resizing}
				aria-label="Resize right sidebar"
				onmousedown={handleResizeStart}
				type="button"
			></button>

			<!-- Sidebars / Extras -->
			<aside class="editor-sidebar hidden-mobile" class:collapsed={uiStore.rightSidebarCollapsed} style="width: {uiStore.rightSidebarCollapsed ? 38 : rightSidebarWidth}px; flex-basis: {uiStore.rightSidebarCollapsed ? 38 : rightSidebarWidth}px;">
				{#if !uiStore.rightSidebarCollapsed}
					{#if scrollEl}
						<DocumentOutline scrollElement={scrollEl} />
					{/if}
				{:else}
					<div class="rail-mini">
						<button 
							class="rail-btn" 
							onclick={() => { uiStore.rightSidebarCollapsed = false; }} 
							aria-label="Expand sidebar"
							type="button"
						>
							<PanelRightOpen size={16} />
						</button>
					</div>
				{/if}
			</aside>
		</div>
	{:else}
		<div class="loading-state">
			<div class="spinner"></div>
		</div>
	{/if}
</div>

<style>
	.page-container {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: var(--bg-background);
		overflow: hidden;
	}

	.editor-shell {
		display: flex;
		height: 100%;
		width: 100%;
	}

	.editor-main {
		flex: 1;
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		padding-bottom: calc(10vh + var(--keyboard-offset));
		scroll-behavior: smooth;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 2.5rem 0 1.5rem;
		max-width: 720px;
		margin: 0 auto;
		width: 100%;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.page-header:hover .header-actions {
		opacity: 1;
	}

	.sidebar-toggle-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		cursor: pointer;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		transition: all 0.2s;
	}

	.sidebar-toggle-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.layout-container {
		max-width: var(--layout-max-width, 800px);
		margin: 0 auto;
		padding: 0 var(--spacing-md);
	}

	.writing-canvas {
		margin-top: 1rem;
	}

	.fmt-toolbar-wrap {
		position: sticky;
		top: 1rem;
		z-index: 100;
		margin-bottom: 2rem;
		display: flex;
		justify-content: center;
	}

	.fmt-toolbar {
		display: flex;
		gap: 0.25rem;
		padding: 0.375rem;
		border-radius: var(--radius-pill);
		background: var(--bg-surface);
		border: 1px solid var(--border-strong);
		box-shadow: var(--shadow-lg);
	}

	.fmt-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		border: none;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s var(--ease-out);
	}

	.fmt-btn:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
		transform: scale(1.1);
	}

	.content-block {
		margin-bottom: 4rem;
	}

	.editor-sidebar.collapsed {
		padding: 0;
		border-left: 1px solid var(--border-subtle);
		background: var(--bg-panel);
		overflow: hidden;
	}

	.rail-mini {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: var(--spacing-md);
		gap: var(--spacing-sm);
	}

	.rail-btn {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		cursor: pointer;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		transition: background var(--transition-fast);
	}

	.rail-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.right-resize-handle {
		width: 6px;
		cursor: col-resize;
		background: transparent;
		border: none;
		position: relative;
		z-index: 50;
		flex-shrink: 0;
	}

	.right-resize-handle::after {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: 2px;
		width: 2px;
		background: transparent;
		transition: background var(--transition-fast);
	}

	.right-resize-handle:hover::after,
	.right-resize-handle.active::after {
		background: var(--brand-tint);
	}

	.editor-sidebar {
		border-left: 1px solid var(--border-separator);
		padding: 2rem 1.5rem;
		background: var(--bg-surface);
		flex-shrink: 0;
	}

	.loading-state {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--brand-tint);
		border-top-color: var(--color-brand);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@media (max-width: 1100px) {
		.editor-sidebar { display: none; }
	}

	@media (max-width: 600px) {
		.page-header { padding-top: 2rem; }
		.page-title { font-size: 2.25rem; }
		.fmt-toolbar-wrap { display: none; }
	}
</style>
