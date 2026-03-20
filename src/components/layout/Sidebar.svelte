<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PLUGINS } from '$lib/plugins';
	import {
		ChevronLeft, ChevronDown, Pin, PinOff, Settings, BookOpen,
		Hash, Map, FileText, Plus, Zap, Sparkles, LayoutGrid, Sun,
		Trello, CheckCircle2, Users, Calendar, Orbit, Table, Type,
		PanelLeftOpen
	} from 'lucide-svelte';
	import { $t as t } from '$lib/i18n';
	import { PIPELINE_STATES } from '$lib/config';
	import {
		createLibrary,
		createThought,
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
	import { TEMPLATES, type TemplateDefinition } from '$lib/templates';
	import Skeleton from '../common/Skeleton.svelte';
	import ErrorBoundary from '../common/ErrorBoundary.svelte';

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
	let loading = $state(true);

	let libSub: { unsubscribe(): void } | null = null;
	let thoughtSub: { unsubscribe(): void } | null = null;

	onMount(async () => {
		libSub = getLibraries().subscribe((v) => {
			libraries = v;
			if (v.length > 0) loading = false;
		});
		thoughtSub = getThoughtsByLibrary(activeLibraryId).subscribe((v) => { thoughts = v; });

		const s = await getUserSettings();
		if (s) {
			settings = s;
			pinnedIds = new Set(s.pinned_thought_ids ?? []);
			if (s.sidebar_width && s.sidebar_width !== uiStore.sidebarWidth) {
				uiStore.sidebarWidth = s.sidebar_width;
			}
		}

		// Ensure loading is false even if DB is empty after check
		setTimeout(() => { loading = false; }, 800);
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

	const pinnedThoughts = $derived(
		thoughts
			.filter((th) => pinnedIds.has(th.id))
			.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
	);

	const recentThoughts = $derived(
		thoughts
			.filter((th) => !pinnedIds.has(th.id))
			.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
			.slice(0, 5)
	);

	const currentPath = $derived($page.url.pathname);
	const collapsed = $derived(uiStore.sidebarCollapsed);

	const enabledPlugins = $derived(
		PLUGINS.filter(p => settings?.enabled_plugins?.includes(p.id))
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
	let templatesOpen = $state(false);
	let pluginsOpen = $state(true);

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

	// ── Resize drag ──────────────────────────────────────────────────────────

	const MIN_WIDTH = 200;
	const MAX_WIDTH = 400;

	let resizing = $state(false);
	let saveWidthTimer: ReturnType<typeof setTimeout> | null = null;

	function handleResizeStart(e: MouseEvent) {
		if (collapsed) return;
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
			if (saveWidthTimer) clearTimeout(saveWidthTimer);
			saveWidthTimer = setTimeout(() => {
				updateUserSettings({ sidebar_width: uiStore.sidebarWidth });
			}, 400);
		}

		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	}

	// ── Template logic ────────────────────────────────────────────────────────

	async function handleCreateFromTemplate(template: TemplateDefinition) {
		let content = template.markdown;
		const now = new Date();
		
		// Fill placeholders
		const dateStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
		content = content.replace(/\{\{date\}\}/g, dateStr);
		
		// Approximate week of year
		const startOfYear = new Date(now.getFullYear(), 0, 1);
		const pastDays = (now.getTime() - startOfYear.getTime()) / 86400000;
		const weekNum = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
		content = content.replace(/\{\{week\}\}/g, weekNum.toString());

		const newId = await createThought(activeLibraryId, template.name, true, content);
		
		uiStore.activeView = 'editor';
		uiStore.focusedNodeId = newId;
		goto(`/thought/${newId}`);
	}

	// ── Icon rail items ──────────────────────────────────────────────────────

	const railItems = [
		{ id: 'map',     icon: Map,      href: '/map',      label: t('nav.map')      },
		{ id: 'triage',  icon: BookOpen, href: '/triage',   label: t('nav.triage')   },
		{ id: 'editor',  icon: FileText, href: '/editor',   label: t('nav.editor')   },
		{ id: 'focus',   icon: Zap,      href: '/focus',    label: t('nav.focus')    },
		{ id: 'settings',icon: Settings, href: '/settings', label: t('nav.settings') },
	] as const;
</script>

<nav class="sidebar" class:collapsed aria-label="Sidebar">

	<!-- ── Expanded content ──────────────────────────────────────────────── -->
	{#if !collapsed}

		<!-- Brand -->
		<div class="brand">
			<div class="brand-inner">
				<div class="brand-logo" aria-hidden="true">
					<img src="/logo.png" alt="" width="24" height="24" />
				</div>
				<div class="brand-text">
					<span class="brand-name">Flought</span>
					<span class="brand-tag">{t('brand.tagline')}</span>
				</div>
			</div>
			<button
				class="collapse-btn"
				onclick={() => { uiStore.sidebarCollapsed = true; }}
				aria-label="Collapse sidebar"
				type="button"
			>
				<ChevronLeft size={16} strokeWidth={2} />
			</button>
		</div>

		<!-- Library Switcher -->
		<div class="section library-section">
			<button class="library-trigger" onclick={toggleDropdown} aria-expanded={dropdownOpen} type="button">
				<BookOpen size={13} strokeWidth={2} class="lib-icon" />
				<span class="library-name">
					{#if loading && !activeLibrary}
						<Skeleton width="60%" height="16px" />
					{:else}
						{activeLibrary?.name ?? '...'}
					{/if}
				</span>
				<span class="chevron" class:open={dropdownOpen}>
					<ChevronDown size={13} strokeWidth={2} />
				</span>
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
							type="button"
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
							type="button"
						>+</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Pipeline -->
		<div class="section">
			<h2 class="section-label">{t('pipeline.label')}</h2>
			{#each PIPELINE_STATES as state, i}
				<button
					class="stage-btn"
					class:stage-active={uiStore.focusedStageId === state.id}
					style="--stage-colour: var({state.cssVar})"
					onclick={() => selectStage(state.id)}
					type="button"
				>
					<span class="stage-dot"></span>
					<span class="stage-name">{pipelineLabels[i]}</span>
					<span class="stage-count premium-badge">{stageCounts[i]}</span>
				</button>
			{/each}
		</div>

		<!-- Pinned Thoughts -->
		{#if pinnedThoughts.length > 0}
			<div class="section">
				<button class="section-header" onclick={() => (pinnedOpen = !pinnedOpen)} aria-expanded={pinnedOpen} type="button">
					<span class="section-label">Pinned</span>
					<span class="section-chevron" class:open={pinnedOpen}>
						<ChevronDown size={11} strokeWidth={2} />
					</span>
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
								{#if thought.is_triaged === false}
									<span class="triage-dot" aria-label={t('feature.triage.unread')}></span>
								{/if}
							</button>
							<button
								class="pin-btn pinned"
								onclick={() => togglePin(thought.id)}
								aria-label="Unpin"
								type="button"
							>
								<PinOff size={12} strokeWidth={2} />
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Recent Thoughts -->
		{#if recentThoughts.length > 0}
			<div class="section">
				<button class="section-header" onclick={() => (recentOpen = !recentOpen)} aria-expanded={recentOpen} type="button">
					<span class="section-label">Recent</span>
					<span class="section-chevron" class:open={recentOpen}>
						<ChevronDown size={11} strokeWidth={2} />
					</span>
				</button>
				<div class="accordion-body" class:visible={recentOpen}>
					{#if loading && !recentThoughts.length}
						<div class="skeleton-col">
							<Skeleton width="80%" height="28px" className="row-skeleton" />
							<Skeleton width="70%" height="28px" className="row-skeleton" />
							<Skeleton width="90%" height="28px" className="row-skeleton" />
						</div>
					{:else}
						{#each recentThoughts as thought}
							<div class="thought-row">
								<button
									class="thought-link"
									onclick={() => goto(`/thought/${thought.id}`)}
									type="button"
								>
									{thought.title || t('search.untitled')}
									{#if thought.is_triaged === false}
										<span class="triage-dot" aria-label={t('feature.triage.unread')}></span>
									{/if}
								</button>
								<button
									class="pin-btn"
									onclick={() => togglePin(thought.id)}
									aria-label="Pin"
									type="button"
								>
									<Pin size={12} strokeWidth={2} />
								</button>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/if}

		<!-- Topics -->
		{#if topics.length > 0}
			<div class="section">
				<button class="section-header" onclick={() => (topicsOpen = !topicsOpen)} aria-expanded={topicsOpen} type="button">
					<span class="section-label-row">
						<Hash size={11} strokeWidth={2.5} />
						<span class="section-label">{t('topic.plural')}</span>
					</span>
					<span class="section-chevron" class:open={topicsOpen}>
						<ChevronDown size={11} strokeWidth={2} />
					</span>
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

		<!-- Installed Plugins -->
		{#if enabledPlugins.length > 0}
			<div class="section">
				<button class="section-header" onclick={() => (pluginsOpen = !pluginsOpen)} aria-expanded={pluginsOpen} type="button">
					<span class="section-label-row">
						<Zap size={11} strokeWidth={2.5} />
						<span class="section-label">Installed Plugins</span>
					</span>
					<span class="section-chevron" class:open={pluginsOpen}>
						<ChevronDown size={11} strokeWidth={2} />
					</span>
				</button>
				<div class="accordion-body" class:visible={pluginsOpen}>
					{#each enabledPlugins as plugin}
						<div class="template-btn" style="cursor: default">
							<div class="template-icon-box">
								{#if plugin.icon === 'Calendar'}<Calendar size={12} />
								{:else if plugin.icon === 'Zap'}<Zap size={12} />
								{:else if plugin.icon === 'Orbit'}<Orbit size={12} />
								{:else if plugin.icon === 'Table'}<Table size={12} />
								{:else if plugin.icon === 'Type'}<Type size={12} />
								{:else}<Sparkles size={12} />
								{/if}
							</div>
							<span class="template-name">{plugin.name}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Templates -->
		<div class="section">
			<button class="section-header" onclick={() => (templatesOpen = !templatesOpen)} aria-expanded={templatesOpen} type="button">
				<span class="section-label-row">
					<LayoutGrid size={11} strokeWidth={2.5} />
					<span class="section-label">Templates</span>
				</span>
				<span class="section-chevron" class:open={templatesOpen}>
					<ChevronDown size={11} strokeWidth={2} />
				</span>
			</button>
			<div class="accordion-body" class:visible={templatesOpen}>
				{#each TEMPLATES as template}
					<button
						class="template-btn"
						onclick={() => handleCreateFromTemplate(template)}
						type="button"
					>
						<div class="template-icon-box">
							{#if template.icon === 'Sun'}<Sun size={12} />
							{:else if template.icon === 'Trello'}<Trello size={12} />
							{:else if template.icon === 'CheckCircle2'}<CheckCircle2 size={12} />
							{:else if template.icon === 'Users'}<Users size={12} />
							{:else}<LayoutGrid size={12} />
							{/if}
						</div>
						<span class="template-name">{template.name}</span>
						<Plus size={10} class="template-plus" />
					</button>
				{/each}
			</div>
		</div>

		<!-- Spacer -->
		<div class="spacer"></div>

		<!-- Bottom actions -->
		<div class="bottom-area">
			<div class="sync-row">
				<SyncStatusBadge status={uiStore.syncStatus} lastSyncedAt={uiStore.lastSyncedAt} />
			</div>

			<button
				class="settings-link"
				class:settings-link--active={currentPath === '/features'}
				onclick={() => goto('/features')}
				type="button"
			>
				<Sparkles size={15} strokeWidth={1.8} />
				<span>What's New</span>
			</button>

			<button
				class="settings-link"
				class:settings-link--active={uiStore.isSettingsOpen}
				onclick={() => { uiStore.isSettingsOpen = true; }}
				type="button"
			>
				<Settings size={15} strokeWidth={1.8} />
				<span>{t('nav.settings')}</span>
			</button>
		</div>

	{:else}
		<!-- ── Collapsed icon rail ─────────────────────────────────────────────── -->
		<div class="rail">
			<button
				class="rail-expand"
				onclick={() => { uiStore.sidebarCollapsed = false; }}
				aria-label="Expand sidebar"
				type="button"
			>
				<PanelLeftOpen size={20} />
			</button>

			<div class="rail-divider"></div>

			{#each railItems as item}
				{@const isActive = currentPath.startsWith(item.href) || (item.id === 'map' && currentPath === '/')}
				<button
					class="rail-item"
					class:rail-item--active={isActive}
					onclick={() => goto(item.href)}
					aria-label={item.label}
					title={item.label}
					type="button"
				>
					<item.icon size={18} strokeWidth={isActive ? 2.2 : 1.7} />
				</button>
			{/each}

			<div class="rail-spacer"></div>
		</div>
	{/if}

</nav>

<!-- Resize handle -->
{#if !collapsed}
	<button
		class="resize-handle"
		class:active={resizing}
		aria-label="Resize sidebar"
		style="left: {uiStore.sidebarWidth - 3}px"
		onmousedown={handleResizeStart}
		type="button"
	></button>
{/if}

<style>
	/* ── Sidebar base ──────────────────────────────────────────────────── */

	.sidebar {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		background: var(--bg-panel);
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		border-right: 1px solid var(--border);
		overflow-y: auto;
		overflow-x: hidden;
		padding-bottom: env(safe-area-inset-bottom);
		position: relative;
		scrollbar-width: thin;
		scrollbar-color: var(--border-strong) transparent;
	}

	.sidebar.collapsed {
		width: 38px;
		min-width: 38px;
		overflow: hidden;
		border-right: 1px solid var(--border-subtle);
	}

	/* ── Brand ──────────────────────────────────────────────────────────── */

	.brand {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-md) var(--spacing-sm) var(--spacing-sm);
		gap: var(--spacing-xs);
	}

	.brand-inner {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.brand-logo {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.brand-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.brand-name {
		font-size: 0.9375rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.02em;
		line-height: 1.2;
	}

	.brand-tag {
		font-size: 0.5625rem;
		color: var(--text-muted);
		letter-spacing: 0.02em;
	}

	.collapse-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--size-control);
		height: var(--size-control);
		background: none;
		border: none;
		cursor: pointer;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		transition: background var(--transition-fast), color var(--transition-fast);
		flex-shrink: 0;
	}

	.collapse-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	/* ── Sections ───────────────────────────────────────────────────────── */

	.section {
		padding: var(--spacing-xs) 0;
		border-top: 1px solid var(--border);
		position: relative;
	}

	.section::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.02), transparent);
		pointer-events: none;
		opacity: 0;
		transition: opacity var(--transition-base);
	}

	.section:hover::before {
		opacity: 1;
	}

	.section-label {
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--text-secondary);
		padding: var(--spacing-sm) var(--spacing-lg) var(--spacing-2xs);
		margin: 0;
		line-height: inherit;
		display: block;
		opacity: 0.8;
	}

	.section-label-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm) var(--spacing-lg) var(--spacing-2xs);
		color: var(--text-muted);
	}

	.section-label-row .section-label {
		padding: 0;
	}

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
		display: flex;
		align-items: center;
		padding-right: var(--spacing-md);
		color: var(--text-muted);
		transition: transform var(--transition-fast);
		transform: rotate(-90deg);
	}

	.section-chevron.open {
		transform: rotate(0deg);
	}

	.accordion-body {
		display: none;
	}

	.accordion-body.visible {
		display: block;
		animation: accordionIn var(--transition-base) ease forwards;
	}

	@keyframes accordionIn {
		from { opacity: 0; transform: translateY(-4px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	/* ── Library switcher ───────────────────────────────────────────────── */

	.library-section {
		position: relative;
	}

	.library-trigger {
		width: 100%;
		min-height: 40px;
		display: flex;
		align-items: center;
		padding: var(--spacing-xs) var(--spacing-sm);
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-primary);
		font-size: 0.8125rem;
		font-weight: 600;
		font-family: inherit;
		gap: var(--spacing-xs);
		transition: background var(--transition-fast);
	}

	.library-trigger:hover {
		background: var(--bg-hover);
	}

	:global(.lib-icon) {
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.library-name {
		flex: 1;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chevron {
		display: flex;
		align-items: center;
		color: var(--text-muted);
		transition: transform var(--transition-fast);
		flex-shrink: 0;
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--glass-surface);
		backdrop-filter: var(--glass-blur-sm);
		-webkit-backdrop-filter: var(--glass-blur-sm);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		z-index: 100;
		overflow: hidden;
		box-shadow: var(--shadow-md);
	}

	.dropdown-item {
		width: 100%;
		min-height: 40px;
		display: flex;
		align-items: center;
		padding: 0 var(--spacing-md);
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-secondary);
		font-size: 0.8125rem;
		font-family: inherit;
		text-align: left;
		transition: background var(--transition-fast), color var(--transition-fast);
	}

	.dropdown-item:hover,
	.dropdown-item.active {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.dropdown-item.active {
		color: var(--color-brand);
		background: var(--brand-tint);
	}

	.dropdown-create {
		display: flex;
		border-top: 1px solid var(--border);
		padding: var(--spacing-xs);
		gap: var(--spacing-xs);
	}

	.create-input {
		flex: 1;
		min-height: 34px;
		background: var(--bg-panel);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		font-size: 0.8125rem;
		font-family: inherit;
		padding: 0 var(--spacing-sm);
		outline: none;
		transition: border-color var(--transition-fast);
	}

	.create-input:focus {
		border-color: var(--color-brand);
	}

	.create-input::placeholder {
		color: var(--text-muted);
	}

	.create-btn {
		min-width: 34px;
		min-height: 34px;
		background: var(--gradient-brand);
		color: var(--bg-deep);
		border: none;
		border-radius: var(--radius-sm);
		font-size: 1.125rem;
		font-weight: 700;
		cursor: pointer;
		transition: opacity var(--transition-fast);
	}

	.create-btn:disabled {
		opacity: 0.35;
		cursor: default;
	}

	/* ── Pipeline stages ────────────────────────────────────────────────── */

	.stage-btn {
		width: 100%;
		min-height: 36px;
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 0 var(--spacing-md);
		background: none;
		border: none;
		border-left: 2px solid transparent;
		cursor: pointer;
		font-family: inherit;
		transition: background var(--transition-fast), border-color var(--transition-fast);
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
		margin-right: var(--spacing-xs);
	}

	.stage-btn {
		width: calc(100% - 16px);
		margin: 2px 8px;
		min-height: 36px;
		display: flex;
		align-items: center;
		padding: 0 var(--spacing-sm);
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-family: inherit;
		gap: var(--spacing-sm);
		transition: all var(--transition-fast);
		color: var(--text-secondary);
	}

	.stage-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
		transform: translateX(4px);
	}

	.stage-btn.stage-active {
		background: var(--brand-tint) !important;
		border-color: var(--brand-rim) !important;
		color: var(--text-primary) !important;
		box-shadow: inset 0 1px 0 var(--rim-light);
	}

	.stage-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--stage-colour);
		flex-shrink: 0;
		opacity: 0.5;
		transition: opacity var(--transition-fast), transform var(--transition-fast);
	}

	.stage-btn.stage-active .stage-dot {
		opacity: 1;
		transform: scale(1.25);
	}

	.stage-name {
		flex: 1;
		font-size: 0.8125rem;
		color: var(--text-secondary);
		text-align: left;
	}

	.stage-btn.stage-active .stage-name {
		color: var(--text-primary);
	}

	.stage-count {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
		background: var(--bg-surface);
		border-radius: 4px;
		padding: 1px 6px;
		border: 1px solid var(--border);
		box-shadow: var(--shadow-sm);
		min-width: 20px;
		text-align: center;
		transition: all var(--transition-fast);
	}

	.stage-btn.stage-active .stage-count {
		background: var(--bg-elevated);
		color: var(--text-primary);
		border-color: var(--color-brand);
	}

	/* ── Pinned / Recent thought rows ───────────────────────────────────── */

	.thought-row {
		display: flex;
		align-items: center;
		padding: 2px 8px;
		margin: 2px 0;
		gap: var(--spacing-xs);
		animation: rowIn var(--transition-base) ease both;
		will-change: transform, opacity;
	}

	.thought-row:nth-child(1) { animation-delay: 0ms; }
	.thought-row:nth-child(2) { animation-delay: 30ms; }
	.thought-row:nth-child(3) { animation-delay: 60ms; }
	.thought-row:nth-child(4) { animation-delay: 90ms; }
	.thought-row:nth-child(5) { animation-delay: 120ms; }

	@keyframes rowIn {
		from { opacity: 0; transform: translateX(-6px); }
		to   { opacity: 1; transform: translateX(0); }
	}

	.thought-link {
		flex: 1;
		min-height: 32px;
		background: none;
		border: 1px solid transparent;
		cursor: pointer;
		color: var(--text-secondary);
		font-size: 0.75rem;
		font-weight: 500;
		font-family: inherit;
		text-align: left;
		padding: 0 var(--spacing-sm);
		border-radius: var(--radius-sm);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: all var(--transition-fast);
		letter-spacing: var(--letter-spacing-compact);
	}

	.thought-link:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
		transform: translateX(4px);
		border-color: var(--border);
	}

	.triage-dot {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-brand);
		margin-left: 4px;
		vertical-align: middle;
		flex-shrink: 0;
		animation: triagePulse 1.5s ease-in-out infinite;
	}

	@keyframes triagePulse {
		0%, 100% { opacity: 1; }
		50%       { opacity: 0.3; }
	}

	.pin-btn {
		flex-shrink: 0;
		width: 26px;
		height: 26px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		border-radius: var(--radius-sm);
		opacity: 0;
		transition: opacity var(--transition-fast), color var(--transition-fast);
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
		width: calc(100% - 16px);
		margin: 2px 8px;
		min-height: 32px;
		display: flex;
		align-items: center;
		padding: 0 var(--spacing-sm);
		background: transparent;
		border-radius: var(--radius-sm);
		cursor: pointer;
		gap: var(--spacing-sm);
		transition: all var(--transition-fast);
	}

	.topic-row:hover {
		background: var(--bg-hover);
		transform: translateX(4px);
	}

	.topic-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
		box-shadow: 0 0 8px currentColor;
	}

	.topic-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary);
		letter-spacing: var(--letter-spacing-compact);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* ── Bottom area ─────────────────────────────────────────────────────── */

	.spacer {
		flex: 1;
	}

	.bottom-area {
		border-top: 1px solid var(--border);
		padding: var(--spacing-xs) 0 0;
	}

	.sync-row {
		display: flex;
		align-items: center;
		padding: var(--spacing-xs) var(--spacing-sm) var(--spacing-xs);
	}

	.settings-link {
		width: 100%;
		min-height: 36px;
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 0 var(--spacing-sm);
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-family: inherit;
		text-align: left;
		transition: color var(--transition-fast), background var(--transition-fast);
	}

	.settings-link:hover {
		color: var(--text-secondary);
		background: var(--bg-hover);
	}

	.settings-link--active {
		color: var(--color-brand);
	}

	/* ── Icon rail (collapsed) ──────────────────────────────────────────── */

	.rail {
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
		padding: var(--spacing-sm) 0;
	}

	.rail-expand {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: none;
		border: none;
		cursor: pointer;
		border-radius: var(--radius-md);
		margin-bottom: var(--spacing-xs);
		transition: background var(--transition-fast);
	}

	.rail-expand:hover {
		background: var(--bg-hover);
	}

	.rail-divider {
		width: 20px;
		height: 1px;
		background: var(--border);
		margin: var(--spacing-xs) 0;
	}

	.rail-item {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: none;
		border: none;
		cursor: pointer;
		border-radius: var(--radius-md);
		color: var(--text-muted);
		transition: background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
		margin-bottom: 2px;
	}

	.rail-item:hover {
		background: var(--bg-hover);
		color: var(--text-secondary);
	}

	.rail-item--active {
		color: var(--color-brand);
		background: var(--brand-tint);
	}

	.rail-spacer {
		flex: 1;
	}

	/* ── Templates ──────────────────────────────────────────────────────── */

	.template-btn {
		width: calc(100% - var(--spacing-sm) * 2);
		margin: 2px var(--spacing-sm);
		padding: var(--spacing-xs) var(--spacing-sm);
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		background: none;
		border: none;
		cursor: pointer;
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		transition: all var(--transition-fast);
		text-align: left;
	}

	.template-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.template-icon-box {
		width: 22px;
		height: 22px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-deep);
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		border: 1px solid var(--border);
	}

	.template-name {
		font-size: 0.8125rem;
		font-weight: 500;
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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
		transition: background var(--transition-fast);
		border: none;
	}

	.resize-handle:hover,
	.resize-handle.active {
		background: var(--color-brand);
		opacity: 0.35;
	}

	/* ── Mobile: hide entirely ──────────────────────────────────────────── */

	@media (max-width: 767px) {
		.sidebar,
		.resize-handle {
			display: none;
		}
	}
</style>
