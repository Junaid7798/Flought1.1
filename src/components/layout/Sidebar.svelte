<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { $t as t } from '$lib/i18n';
	import { PIPELINE_STATES } from '$lib/config';
	import {
		createLibrary,
		getLibraries,
		getThoughtsByLibrary,
		getUserSettings,
		updateUserSettings,
		type Library,
		type Thought,
		type UserSettings,
	} from '$lib/db';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { eventBus } from '$lib/eventBus';
	import SyncStatusBadge from './SyncStatusBadge.svelte';
	import PipelineMomentum from './PipelineMomentum.svelte';

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		activeLibraryId: string;
	}
	let { activeLibraryId }: Props = $props();

	// ── Live data ─────────────────────────────────────────────────────────────

	let libraries = $state<Library[]>([]);
	let thoughts = $state<Thought[]>([]);
	let settings = $state<UserSettings | null>(null);
	let pinnedIds = $state<Set<string>>(new Set());

	let libSub: { unsubscribe(): void } | null = null;
	let thoughtSub: { unsubscribe(): void } | null = null;

	onMount(() => {
		libSub = getLibraries().subscribe((v) => { libraries = v; });
		thoughtSub = getThoughtsByLibrary(activeLibraryId).subscribe((v) => { thoughts = v; });

		getUserSettings().then((s) => {
			if (!s) return;
			settings = s;
			pinnedIds = new Set(s.pinned_thought_ids ?? []);
			if (s.sidebar_width && s.sidebar_width !== uiStore.sidebarWidth) {
				uiStore.sidebarWidth = s.sidebar_width;
			}
		});
	});

	onDestroy(() => {
		libSub?.unsubscribe();
		thoughtSub?.unsubscribe();
	});

	// ── Derived ───────────────────────────────────────────────────────────────

	const activeLibrary = $derived(libraries.find((l) => l.id === activeLibraryId));

	const pipelineLabels = $derived<[string, string, string, string]>(
		settings?.pipeline_label_overrides ?? [t('stage.1'), t('stage.2'), t('stage.3'), t('stage.4')]
	);

	const stageCounts = $derived(
		PIPELINE_STATES.map((s) => thoughts.filter((th) => th.meta_state === s.id).length)
	);

	const topics = $derived(
		[...new Set(thoughts.map((th) => th.topic).filter(Boolean))].sort()
	);

	// Pinned thoughts — sorted by updated_at desc
	const pinnedThoughts = $derived(
		thoughts
			.filter((th) => pinnedIds.has(th.id))
			.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
	);

	// Recent thoughts — last 5 updated, excluding pinned
	const recentThoughts = $derived(
		thoughts
			.filter((th) => !pinnedIds.has(th.id))
			.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
			.slice(0, 5)
	);

	// ── Library switcher ──────────────────────────────────────────────────────

	let dropdownOpen = $state(false);
	let newLibName = $state('');
	let creatingLib = $state(false);

	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
		newLibName = '';
	}

	function switchLibrary(id: string) {
		dropdownOpen = false;
		uiStore.activeLibraryId = id;
		eventBus.emit({ type: 'library.switched', payload: { id } });
	}

	async function handleCreateLibrary() {
		const name = newLibName.trim();
		if (!name || creatingLib) return;
		creatingLib = true;
		const id = await createLibrary(name);
		newLibName = '';
		dropdownOpen = false;
		creatingLib = false;
		switchLibrary(id);
	}

	function handleNewLibKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleCreateLibrary();
		if (e.key === 'Escape') { dropdownOpen = false; }
	}

	// ── Stage filter ──────────────────────────────────────────────────────────

	function selectStage(id: number) {
		uiStore.focusedStageId = uiStore.focusedStageId === id ? null : id;
	}

	// ── Collapsible sections ──────────────────────────────────────────────────

	let pinnedOpen = $state(true);
	let recentOpen = $state(true);
	let topicsOpen = $state(true);

	// ── Pinning ───────────────────────────────────────────────────────────────

	async function togglePin(id: string) {
		const next = new Set(pinnedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		pinnedIds = next;
		await updateUserSettings({ pinned_thought_ids: [...next] });
	}

	// ── Topic colour cycling ──────────────────────────────────────────────────

	const TOPIC_COLOURS = [
		'var(--color-inbox)',
		'var(--color-queue)',
		'var(--color-forge)',
		'var(--color-brand)',
	];

	function topicColour(index: number): string {
		return TOPIC_COLOURS[index % TOPIC_COLOURS.length];
	}

	// ── Capture ───────────────────────────────────────────────────────────────

	function openCapture() {
		uiStore.activeView = 'editor';
	}

	// ── Resize drag ──────────────────────────────────────────────────────────

	const MIN_WIDTH = 200;
	const MAX_WIDTH = 400;

	let resizing = $state(false);
	let saveWidthTimer: ReturnType<typeof setTimeout> | null = null;

	function handleResizeStart(e: MouseEvent) {
		e.preventDefault();
		resizing = true;

		function onMove(ev: MouseEvent) {
			const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, ev.clientX));
			uiStore.sidebarWidth = newWidth;
		}

		function onUp() {
			resizing = false;
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
			// Debounce the DB write — only persist after dragging stops
			if (saveWidthTimer) clearTimeout(saveWidthTimer);
			saveWidthTimer = setTimeout(() => {
				updateUserSettings({ sidebar_width: uiStore.sidebarWidth });
			}, 400);
		}

		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	}

</script>

<nav class="sidebar" aria-label="Sidebar">

	<!-- ── Brand + collapse toggle ─────────────────────────────────────────── -->
	<div class="brand">
		<div class="brand-text">
			<span class="brand-name">Flought</span>
			<span class="brand-tag">{t('brand.tagline')}</span>
		</div>
		<button
			class="collapse-btn"
			onclick={() => { uiStore.sidebarCollapsed = !uiStore.sidebarCollapsed; }}
			aria-label={uiStore.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			type="button"
		>
			<span class="collapse-chevron" class:flipped={uiStore.sidebarCollapsed}>‹</span>
		</button>
	</div>

	<!-- ── Library Switcher ───────────────────────────────────────────────── -->
	<div class="section library-section">
		<button class="library-trigger" onclick={toggleDropdown} aria-expanded={dropdownOpen}>
			<span class="library-name">{activeLibrary?.name ?? '…'}</span>
			<span class="chevron" class:open={dropdownOpen}>▾</span>
		</button>

		{#if dropdownOpen}
			<div class="dropdown" role="listbox" aria-label={t('library.singular')}>
				{#each libraries as lib}
					<button
						class="dropdown-item"
						class:active={lib.id === activeLibraryId}
						role="option"
						aria-selected={lib.id === activeLibraryId}
						onclick={() => switchLibrary(lib.id)}
					>
						{lib.name}
					</button>
				{/each}
				<div class="dropdown-create">
					<input
						class="create-input"
						type="text"
						placeholder={t('library.new')}
						bind:value={newLibName}
						onkeydown={handleNewLibKeydown}
						maxlength={60}
					/>
					<button
						class="create-btn"
						onclick={handleCreateLibrary}
						disabled={!newLibName.trim() || creatingLib}
						aria-label={t('library.create')}
					>+</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- ── Pipeline ───────────────────────────────────────────────────────── -->
	<div class="section">
		<p class="section-label">{t('pipeline.label')}</p>
		{#each PIPELINE_STATES as state, i}
			<button
				class="stage-btn"
				class:stage-active={uiStore.focusedStageId === state.id}
				style="--stage-colour: var({state.cssVar})"
				onclick={() => selectStage(state.id)}
			>
				<span class="stage-dot"></span>
				<span class="stage-name">{pipelineLabels[i]}</span>
				<span class="stage-count">{stageCounts[i]}</span>
			</button>
		{/each}
	</div>

	<!-- ── Pipeline Momentum ──────────────────────────────────────────────── -->
	<div class="section">
		<PipelineMomentum {thoughts} />
	</div>

	<!-- ── Pinned Thoughts ─────────────────────────────────────────────────── -->
	{#if pinnedThoughts.length > 0}
		<div class="section">
			<button class="section-header" onclick={() => (pinnedOpen = !pinnedOpen)} type="button">
				<span class="section-label">Pinned</span>
				<span class="section-chevron" class:open={pinnedOpen}>▾</span>
			</button>
			<div class="accordion-body" class:visible={pinnedOpen}>
				{#each pinnedThoughts as thought}
					<div class="thought-row">
						<button
							class="thought-link"
							onclick={() => goto(`/thought/${thought.id}`)}
							type="button"
						>
							{thought.title || t('search.untitled')}
						</button>
						<button
							class="pin-btn pinned"
							onclick={() => togglePin(thought.id)}
							aria-label="Unpin"
							type="button"
						>⊛</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- ── Recent Thoughts ────────────────────────────────────────────────── -->
	{#if recentThoughts.length > 0}
		<div class="section">
			<button class="section-header" onclick={() => (recentOpen = !recentOpen)} type="button">
				<span class="section-label">Recent</span>
				<span class="section-chevron" class:open={recentOpen}>▾</span>
			</button>
			<div class="accordion-body" class:visible={recentOpen}>
				{#each recentThoughts as thought}
					<div class="thought-row">
						<button
							class="thought-link"
							onclick={() => goto(`/thought/${thought.id}`)}
							type="button"
						>
							{thought.title || t('search.untitled')}
						</button>
						<button
							class="pin-btn"
							onclick={() => togglePin(thought.id)}
							aria-label="Pin"
							type="button"
						>⊙</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- ── Topics ─────────────────────────────────────────────────────────── -->
	{#if topics.length > 0}
		<div class="section">
			<button class="section-header" onclick={() => (topicsOpen = !topicsOpen)} type="button">
				<span class="section-label">{t('topic.plural')}</span>
				<span class="section-chevron" class:open={topicsOpen}>▾</span>
			</button>
			<div class="accordion-body" class:visible={topicsOpen}>
				{#each topics as topic, i}
					<div class="topic-row">
						<span class="topic-dot" style="background: {topicColour(i)}"></span>
						<span class="topic-name">{topic}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- ── Spacer ─────────────────────────────────────────────────────────── -->
	<div class="spacer"></div>

	<!-- ── Sync badge ─────────────────────────────────────────────────────── -->
	<div class="sync-badge">
		<SyncStatusBadge status={uiStore.syncStatus} lastSyncedAt={uiStore.lastSyncedAt} />
	</div>

	<!-- ── Capture button ─────────────────────────────────────────────────── -->
	<button class="capture-btn" onclick={openCapture}>
		<span aria-hidden="true">+</span>
		{t('capture.prompt')}
	</button>

</nav>

<!-- Resize handle — positioned at live sidebar width via inline style -->
<button
	class="resize-handle"
	class:active={resizing}
	aria-label="Resize sidebar"
	style="left: {uiStore.sidebarWidth - 3}px"
	onmousedown={handleResizeStart}
	type="button"
></button>

<style>
	.sidebar {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		/* Glassmorphism — desktop only per FIX-20 (backdrop-filter kills Android fps) */
		background-color: var(--bg-panel);
		border-right: 1px solid var(--border);
		overflow-y: auto;
		overflow-x: hidden;
		padding-bottom: env(safe-area-inset-bottom);
		position: relative;
	}

	@media (min-width: 768px) {
		.sidebar {
			background-color: transparent;
			background: var(--bg-panel);
			opacity: 0.92;
			backdrop-filter: blur(24px);
			-webkit-backdrop-filter: blur(24px);
		}
	}

	/* ── Brand ──────────────────────────────────────────────────────────── */

	.brand {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1rem 0.75rem;
		gap: 0.5rem;
	}

	.brand-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.brand-name {
		font-size: 1.0625rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	.brand-tag {
		font-size: 0.6875rem;
		color: var(--text-muted);
	}

	.collapse-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: none;
		border: none;
		cursor: pointer;
		border-radius: 6px;
		color: var(--text-muted);
		transition: background 120ms, color 120ms;
		flex-shrink: 0;
	}

	.collapse-btn:hover {
		background: var(--bg-hover);
		color: var(--text-secondary);
	}

	.collapse-chevron {
		font-size: 1rem;
		display: block;
		transition: transform 200ms;
		transform: rotate(0deg);
	}

	.collapse-chevron.flipped {
		transform: rotate(180deg);
	}

	/* ── Sections ───────────────────────────────────────────────────────── */

	.section {
		padding: 0.5rem 0;
		border-top: 1px solid var(--border);
	}

	.section-label {
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
		padding: 0.5rem 1rem 0.375rem;
		margin: 0;
	}

	/* Collapsible section header (Pipeline uses plain label; others use button) */
	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		font-family: inherit;
	}

	.section-chevron {
		font-size: 0.625rem;
		color: var(--text-muted);
		padding-right: 1rem;
		transition: transform 150ms;
		transform: rotate(-90deg);
	}

	.section-chevron.open {
		transform: rotate(0deg);
	}

	/* Accordion body — Rule 9: opacity + translateY ONLY. No height animation. */
	.accordion-body {
		display: none;
	}

	.accordion-body.visible {
		display: block;
		animation: accordionIn 150ms ease forwards;
	}

	@keyframes accordionIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ── Library switcher ───────────────────────────────────────────────── */

	.library-section {
		position: relative;
	}

	.library-trigger {
		width: 100%;
		min-height: 44px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-primary);
		font-size: 0.875rem;
		font-weight: 600;
		font-family: inherit;
		gap: 0.5rem;
		transition: background 120ms;
	}

	.library-trigger:hover {
		background: var(--bg-hover);
	}

	.library-name {
		flex: 1;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chevron {
		font-size: 0.75rem;
		color: var(--text-muted);
		transition: transform 150ms;
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--bg-surface);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		z-index: 100;
		overflow: hidden;
		box-shadow: 0 8px 24px var(--shadow-dropdown);
	}

	.dropdown-item {
		width: 100%;
		min-height: 44px;
		display: flex;
		align-items: center;
		padding: 0 1rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-family: inherit;
		text-align: left;
		transition: background 120ms, color 120ms;
	}

	.dropdown-item:hover,
	.dropdown-item.active {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.dropdown-item.active {
		color: var(--color-brand);
	}

	.dropdown-create {
		display: flex;
		border-top: 1px solid var(--border);
		padding: 0.5rem;
		gap: 0.375rem;
	}

	.create-input {
		flex: 1;
		min-height: 36px;
		background: var(--bg-panel);
		border: 1px solid var(--border-strong);
		border-radius: 6px;
		color: var(--text-primary);
		font-size: 0.8125rem;
		font-family: inherit;
		padding: 0 0.625rem;
		outline: none;
	}

	.create-input:focus {
		border-color: var(--color-brand);
	}

	.create-input::placeholder {
		color: var(--text-muted);
	}

	.create-btn {
		min-width: 36px;
		min-height: 36px;
		background: var(--color-brand);
		color: var(--bg-deep);
		border: none;
		border-radius: 6px;
		font-size: 1.125rem;
		font-weight: 700;
		cursor: pointer;
		transition: opacity 120ms;
	}

	.create-btn:disabled {
		opacity: 0.35;
		cursor: default;
	}

	/* ── Pipeline stages ────────────────────────────────────────────────── */

	.stage-btn {
		width: 100%;
		min-height: 44px;
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0 1rem;
		background: none;
		border: none;
		border-left: 2px solid transparent;
		cursor: pointer;
		font-family: inherit;
		transition: background 120ms, border-color 120ms;
	}

	.stage-btn:hover {
		background: var(--bg-hover);
	}

	.stage-btn.stage-active {
		border-left-color: var(--color-brand);
		background: var(--bg-surface);
	}

	.stage-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--stage-colour);
		flex-shrink: 0;
	}

	.stage-name {
		flex: 1;
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-align: left;
	}

	.stage-btn.stage-active .stage-name {
		color: var(--text-primary);
	}

	.stage-count {
		font-size: 0.75rem;
		color: var(--text-muted);
		min-width: 1.5ch;
		text-align: right;
	}

	/* ── Pinned / Recent thought rows ───────────────────────────────────── */

	.thought-row {
		display: flex;
		align-items: center;
		padding: 0 0.5rem 0 1rem;
		min-height: 36px;
		gap: 0.25rem;
	}

	.thought-link {
		flex: 1;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-secondary);
		font-size: 0.8125rem;
		font-family: inherit;
		text-align: left;
		padding: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: color 120ms;
	}

	.thought-link:hover {
		color: var(--text-primary);
	}

	.pin-btn {
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		font-size: 0.875rem;
		border-radius: 4px;
		opacity: 0;
		transition: opacity 120ms, color 120ms;
	}

	.thought-row:hover .pin-btn {
		opacity: 1;
	}

	.pin-btn.pinned {
		opacity: 1;
		color: var(--color-brand);
	}

	/* ── Topics ─────────────────────────────────────────────────────────── */

	.topic-row {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.5rem 1rem;
		min-height: 36px;
	}

	.topic-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.topic-name {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* ── Bottom ─────────────────────────────────────────────────────────── */

	.spacer {
		flex: 1;
	}

	.sync-badge {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-top: 1px solid var(--border);
	}

	.capture-btn {
		width: calc(100% - 1.5rem);
		min-height: 44px;
		margin: 0.625rem 0.75rem;
		margin-bottom: calc(0.625rem + env(safe-area-inset-bottom));
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: var(--color-brand);
		color: var(--bg-deep);
		border: none;
		border-radius: 10px;
		font-size: 0.9375rem;
		font-weight: 700;
		font-family: inherit;
		cursor: pointer;
		transition: opacity 150ms;
	}

	.capture-btn:hover {
		opacity: 0.88;
	}

	/* ── Resize handle ──────────────────────────────────────────────────── */

	.resize-handle {
		position: fixed;
		top: 0;
		width: 6px;
		height: 100dvh;
		cursor: col-resize;
		z-index: 200;
		background: transparent;
		transition: background 150ms;
	}

	.resize-handle:hover,
	.resize-handle.active {
		background: var(--color-brand);
		opacity: 0.35;
	}

	/* ── Mobile: hide entirely — MobileDock handles nav ─────────────────── */

	@media (max-width: 767px) {
		.sidebar {
			display: none;
		}

		.resize-handle {
			display: none;
		}
	}
</style>
