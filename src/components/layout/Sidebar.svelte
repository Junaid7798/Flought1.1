<script lang="ts">
	import { onMount } from 'svelte';
	import { $t as t } from '$lib/i18n';
	import { PIPELINE_STATES } from '$lib/config';
	import {
		createLibrary,
		getLibraries,
		getThoughtsByLibrary,
		getUserSettings,
		type Library,
		type Thought,
		type UserSettings,
	} from '$lib/db';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { eventBus } from '$lib/eventBus';

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		activeLibraryId: string;
	}
	let { activeLibraryId }: Props = $props();

	// ── Live data ─────────────────────────────────────────────────────────────

	let libraries = $state<Library[]>([]);
	let thoughts = $state<Thought[]>([]);
	let settings = $state<UserSettings | null>(null);

	onMount(() => {
		const libSub = getLibraries().subscribe((v) => { libraries = v; });
		const thoughtSub = getThoughtsByLibrary(activeLibraryId).subscribe((v) => { thoughts = v; });

		getUserSettings().then((s) => { if (s) settings = s; });

		return () => {
			libSub.unsubscribe();
			thoughtSub.unsubscribe();
		};
	});

	// ── Derived ───────────────────────────────────────────────────────────────

	const activeLibrary = $derived(libraries.find((l) => l.id === activeLibraryId));

	const pipelineLabels = $derived<[string, string, string, string]>(
		settings?.pipeline_label_overrides ?? [t('stage.1'), t('stage.2'), t('stage.3'), t('stage.4')]
	);

	const stageCounts = $derived(
		PIPELINE_STATES.map((s) => thoughts.filter((t) => t.meta_state === s.id).length)
	);

	const topics = $derived(
		[...new Set(thoughts.map((t) => t.topic).filter(Boolean))].sort()
	);

	// Last synced display
	const lastSyncedLabel = $derived(() => {
		if (!settings?.last_synced_at) return t('sync.never');
		const diff = Math.floor((Date.now() - new Date(settings.last_synced_at).getTime()) / 60000);
		if (diff < 1) return t('sync.justNow');
		if (diff === 1) return t('sync.oneMin');
		return t('sync.minsAgo').replace('{n}', String(diff));
	});

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

	let activeStage = $state<number | null>(null);

	function selectStage(id: number) {
		activeStage = activeStage === id ? null : id;
	}

	// ── Capture ───────────────────────────────────────────────────────────────

	function openCapture() {
		uiStore.activeView = 'editor';
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
</script>

<nav class="sidebar" aria-label="Sidebar">

	<!-- ── Brand ──────────────────────────────────────────────────────────── -->
	<div class="brand">
		<span class="brand-name">Flought</span>
		<span class="brand-tag">{t('brand.tagline')}</span>
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
				class:stage-active={activeStage === state.id}
				style="--stage-colour: var({state.cssVar})"
				onclick={() => selectStage(state.id)}
			>
				<span class="stage-dot"></span>
				<span class="stage-name">{pipelineLabels[i]}</span>
				<span class="stage-count">{stageCounts[i]}</span>
			</button>
		{/each}
	</div>

	<!-- ── Topics ─────────────────────────────────────────────────────────── -->
	{#if topics.length > 0}
		<div class="section">
			<p class="section-label">{t('topic.plural')}</p>
			{#each topics as topic, i}
				<div class="topic-row">
					<span class="topic-dot" style="background: {topicColour(i)}"></span>
					<span class="topic-name">{topic}</span>
				</div>
			{/each}
		</div>
	{/if}

	<!-- ── Spacer ─────────────────────────────────────────────────────────── -->
	<div class="spacer"></div>

	<!-- ── Sync badge ─────────────────────────────────────────────────────── -->
	<div class="sync-badge">
		<span class="sync-icon" aria-hidden="true">⟳</span>
		<span class="sync-text">
			{settings?.sync_connected ? lastSyncedLabel() : t('sync.offline')}
		</span>
	</div>

	<!-- ── Capture button ─────────────────────────────────────────────────── -->
	<button class="capture-btn" onclick={openCapture}>
		<span aria-hidden="true">+</span>
		{t('capture.prompt')}
	</button>

</nav>

<style>
	.sidebar {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		background-color: var(--bg-panel);
		border-right: 1px solid var(--border);
		overflow-y: auto;
		overflow-x: hidden;
		padding-bottom: env(safe-area-inset-bottom);
	}

	/* ── Brand ──────────────────────────────────────────────────────────── */

	.brand {
		display: flex;
		flex-direction: column;
		padding: 1.25rem 1rem 0.75rem;
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

	.sync-icon {
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.sync-text {
		font-size: 0.75rem;
		color: var(--text-muted);
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

	/* ── Mobile: hide entirely — MobileDock handles nav ─────────────────── */

	@media (max-width: 767px) {
		.sidebar {
			display: none;
		}
	}
</style>
