<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { Map as MapIcon, FileText, Zap, Settings, Search, Clock, Hash, Plus } from 'lucide-svelte';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { db } from '$lib/db';
	import type { Thought } from '$lib/db';
	import { Capacitor } from '@capacitor/core';
	import { Haptics, ImpactStyle } from '@capacitor/haptics';
	import { $t as t } from '$lib/i18n';
	import { handleError } from '$lib/errorHandler';

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		libraryId: string;
	}
	let { libraryId }: Props = $props();

	// ── State ─────────────────────────────────────────────────────────────────

	let query = $state('');
	let results = $state<Thought[]>([]);
	let inputEl = $state<HTMLInputElement | null>(null);
	let activeIndex = $state(0);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;

	// ── Command groups ────────────────────────────────────────────────────────

	type CommandItem = {
		id: string;
		label: string;
		icon: typeof MapIcon;
		shortcut?: string;
		action: () => void;
		group: 'navigation' | 'actions';
	};

	const commands: CommandItem[] = [
		{ id: 'map',     label: t('nav.map'),     icon: MapIcon,     shortcut: '⌘1', action: () => goto('/map'),     group: 'navigation' },
		{ id: 'editor',  label: t('nav.editor'),  icon: FileText,     shortcut: '⌘2', action: () => goto('/editor'),  group: 'navigation' },
		{ id: 'focus',   label: t('nav.focus'),   icon: Zap,         shortcut: '⌘3', action: () => goto('/focus'),   group: 'navigation' },
		{ id: 'settings',label: t('nav.settings'),icon: Settings,                    action: () => goto('/settings'), group: 'navigation' },
		{ id: 'features',label: 'Feature Guide',  icon: Hash,                        action: () => goto('/features'), group: 'actions' },
	];

	// ── Search with debounce + indexed query ───────────────────────────────────

	function handleInput() {
		const q = query.trim();
		if (!q) {
			results = [];
			return;
		}

		if (searchTimeout) clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => performSearch(q), 150);
	}

	async function performSearch(q: string) {
		try {
			// Indexed prefix search on title, limited to 50 results
			const matches = await db.thoughts
				.where('title')
				.startsWithIgnoreCase(q)
				.filter(t => t.library_id === libraryId && !t.is_deleted)
				.limit(50)
				.toArray();
			results = matches;
			activeIndex = 0;
		} catch (err) {
			handleError(err, 'CommandPalette.query', false);
			results = [];
		}
	}

	onDestroy(() => {
		if (searchTimeout) clearTimeout(searchTimeout);
	});

	// ── Focus input when opened ───────────────────────────────────────────────

	$effect(() => {
		if (uiStore.commandPaletteOpen && inputEl) {
			requestAnimationFrame(() => inputEl?.focus());
		}
	});

	// ── Haptics helper ────────────────────────────────────────────────────────

	async function haptic(style: ImpactStyle = ImpactStyle.Light) {
		if (!Capacitor.isNativePlatform()) return;
		try { await Haptics.impact({ style }); } catch {}
	}

	// ── Keyboard navigation ──────────────────────────────────────────────────

	async function handleKeydown(e: KeyboardEvent) {
		const total = results.length;
		if (e.key === 'Escape') {
			close();
			return;
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = (activeIndex + 1) % total;
			haptic();
			return;
		}
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = (activeIndex - 1 + total) % total;
			haptic();
			return;
		}
		if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
			e.preventDefault();
			if (total > 0 && results[activeIndex]) {
				selectThought(results[activeIndex].id);
			}
			return;
		}
		if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && total > 0 && results[activeIndex]) {
			e.preventDefault();
			openInEditor(results[activeIndex].id);
			return;
		}
	}

	// ── Actions ────────────────────────────────────────────────────────────────

	function close() {
		uiStore.commandPaletteOpen = false;
	}

	function selectThought(id: string) {
		close();
		goto(`/thought/${id}`);
	}

	function openInEditor(id: string) {
		close();
		goto(`/thought/${id}?mode=edit`);
	}

	function createNewThought() {
		close();
		// Prefill spark input with query
		uiStore.sparkInputPrefill = query;
		// Then navigate to editor or open spark
	}

	// ── Computed ───────────────────────────────────────────────────────────────

	$effect(() => {
		if (!uiStore.commandPaletteOpen) {
			query = '';
			results = [];
			activeIndex = 0;
		}
	});

	// ── Render helpers ────────────────────────────────────────────────────────

	const allItems = $derived([
		...commands.map(c => ({ type: 'command' as const, id: c.id, label: c.label, icon: c.icon, shortcut: c.shortcut, action: c.action, group: c.group })),
		...results.map(th => ({ type: 'thought' as const, thought: th }))
	] as Array<{ type: 'command'; id: string; label: string; icon: typeof MapIcon; shortcut?: string; action: () => void; group: string } | { type: 'thought'; thought: Thought }>);

	const visibleItems = $derived(
		!query ? allItems.filter(i => i.type === 'command') : allItems
	);

	function getItemIcon(item: any): typeof MapIcon {
		if (item.type === 'command') return item.icon;
		// For thoughts, could return FileText or a stage-colored icon
		return FileText;
	}

	function getItemLabel(item: any): string {
		if (item.type === 'command') return item.label;
		return item.thought.title || t('search.untitled');
	}

	function getItemSubtitle(item: any): string {
		if (item.type === 'thought') {
			const content = item.thought.content || '';
			return content.slice(0, 60).replace(/\n/g, ' ') + (content.length > 60 ? '...' : '');
		}
		return '';
	}

	function isItemActive(item: any, idx: number): boolean {
		return idx === activeIndex;
	}

	function executeItem(item: any) {
		if (item.type === 'command') {
			item.action();
		} else {
			selectThought(item.thought.id);
		}
	}
</script>

<div class="command-palette" class:open={uiStore.commandPaletteOpen}>
	<div class="overlay" role="button" tabindex="-1" onclick={() => uiStore.commandPaletteOpen = false} onkeydown={(e) => { if (e.key === 'Escape') uiStore.commandPaletteOpen = false; }}></div>
	<div class="panel" role="dialog" aria-label={t('search.ariaLabel')} aria-modal="true">
		<div class="search-bar">
			<Search size={16} class="search-icon" />
			<input
				bind:value={query}
				oninput={handleInput}
				bind:this={inputEl}
				placeholder={t('search.placeholder')}
				type="text"
				autocomplete="off"
				class="search-input"
			/>
			{#if query}
				<button class="clear-btn" onclick={() => { query = ''; results = []; }}>✕</button>
			{/if}
		</div>

		<div class="results" role="listbox">
			{#each visibleItems as item, idx (item.type === 'thought' ? item.thought.id : item.id)}
				{@const active = isItemActive(item, idx)}
				{@const icon = getItemIcon(item)}
				<div
					class="result-item"
					class:active
					role="option"
					tabindex="0"
					aria-selected={active}
					onclick={() => executeItem(item)}
					onkeydown={(e) => { if (e.key === 'Enter') executeItem(item); }}
				>
					<div class="item-icon">
						<icon size={18}></icon>
					</div>
					<div class="item-content">
						<div class="item-label">{getItemLabel(item)}</div>
						{#if getItemSubtitle(item)}
							<div class="item-sub">{getItemSubtitle(item)}</div>
						{/if}
					</div>
					{#if item.type === 'command' && item.shortcut}
						<kbd>{item.shortcut}</kbd>
					{/if}
				</div>
			{:else}
				<div class="empty-state">
					{#if query}
						No thoughts match "{query}"
					{:else}
						Type to search thoughts or use commands above
					{/if}
				</div>
			{/each}
		</div>

		<div class="footer">
			<span class="hint">↵ to open • ⌘↵ to edit • Esc to close</span>
		</div>
	</div>
</div>

<style>
	.command-palette {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: none;
	}

	.command-palette.open {
		display: block;
	}

	.overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(2px);
	}

	.panel {
		position: absolute;
		top: 20vh;
		left: 50%;
		transform: translateX(-50%);
		width: min(640px, 90vw);
		background: var(--bg-panel);
		border: 1px solid var(--border-strong);
		border-radius: 16px;
		box-shadow: var(--shadow-xl);
		display: flex;
		flex-direction: column;
		max-height: 60vh;
		overflow: hidden;
	}

	.search-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border-bottom: 1px solid var(--border);
	}

	:global(.search-icon) {
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		background: none;
		border: none;
		outline: none;
		color: var(--text-primary);
		font-size: 1.125rem;
		font-family: inherit;
	}

	.search-input::placeholder {
		color: var(--text-muted);
	}

	.clear-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
	}

	.clear-btn:hover {
		color: var(--text-secondary);
		background: var(--bg-hover);
	}

	.results {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.result-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0.75rem;
		border-radius: 8px;
		cursor: pointer;
		margin-bottom: 2px;
	}

	.result-item:hover,
	.result-item.active {
		background: var(--bg-hover);
	}

	.item-icon {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-surface);
		border-radius: 8px;
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.item-content {
		flex: 1;
		min-width: 0;
	}

	.item-label {
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.item-sub {
		font-size: 0.8125rem;
		color: var(--text-muted);
		margin-top: 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.result-item.active {
		background: var(--brand-tint);
	}

	.result-item.active .item-label {
		color: var(--text-primary);
	}

	.empty-state {
		padding: 3rem 1rem;
		text-align: center;
		color: var(--text-muted);
	}

	.footer {
		padding: 0.75rem 1rem;
		border-top: 1px solid var(--border);
		text-align: center;
	}

	.hint {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
</style>
