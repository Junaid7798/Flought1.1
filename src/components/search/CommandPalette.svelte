<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { Map as MapIcon, FileText, Zap, Settings, Search, Clock, Hash, Plus } from 'lucide-svelte';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { getThoughtsByLibrary, createThought } from '$lib/db';
	import type { Thought } from '$lib/db';
	import { Capacitor } from '@capacitor/core';
	import { Haptics, ImpactStyle } from '@capacitor/haptics';
	import { $t as t } from '$lib/i18n';

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		libraryId: string;
	}
	let { libraryId }: Props = $props();

	// ── State ─────────────────────────────────────────────────────────────────

	let query = $state('');
	let resultIds = $state<string[]>([]);
	let thoughtMap = $state<Map<string, Thought>>(new Map());
	let inputEl = $state<HTMLInputElement | null>(null);
	let activeIndex = $state(0);

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

	// ── Populate thought map ──────────────────────────────────────────────────

	let liveSubscription: { unsubscribe(): void } | null = null;

	onMount(() => {
		if (!libraryId) return;
		liveSubscription = getThoughtsByLibrary(libraryId).subscribe((thoughts) => {
			thoughtMap = new Map(thoughts.map((t) => [t.id, t]));
		});
	});

	onDestroy(() => {
		liveSubscription?.unsubscribe();
	});

	// ── Worker message handler ────────────────────────────────────────────────

	function handleWorkerMessage(e: MessageEvent) {
		if (e.data?.type === 'results') {
			resultIds = e.data.ids as string[];
			activeIndex = 0;
		}
	}

	$effect(() => {
		const worker = uiStore.searchWorker;
		if (worker) {
			worker.addEventListener('message', handleWorkerMessage);
			return () => worker.removeEventListener('message', handleWorkerMessage);
		}
	});

	// ── Focus input when opened ───────────────────────────────────────────────

	$effect(() => {
		if (uiStore.commandPaletteOpen && inputEl) {
			requestAnimationFrame(() => inputEl?.focus());
		}
	});

	// ── Search on keystroke ───────────────────────────────────────────────────

	function handleInput() {
		const q = query.trim();
		if (!q) {
			resultIds = [];
			return;
		}
		uiStore.searchWorker?.postMessage({ type: 'search', query: q });
	}

	// ── Haptics helper ────────────────────────────────────────────────────────

	async function haptic(style: ImpactStyle = ImpactStyle.Light) {
		if (!Capacitor.isNativePlatform()) return;
		try { await Haptics.impact({ style }); } catch {}
	}

	// ── Keyboard navigation ──────────────────────────────────────────────────

	async function handleKeydown(e: KeyboardEvent) {
		const total = allDisplayItems.length;
		if (e.key === 'Escape') {
			close();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = total ? (activeIndex + 1) % total : 0;
			await haptic();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = total ? (activeIndex - 1 + total) % total : 0;
			await haptic();
		} else if (e.key === 'Enter') {
			if (total > 0) {
				const item = allDisplayItems[activeIndex];
				if (item) item.action();
			} else if (isSearching) {
				// No matches — create a new thought with the query as title
				createThoughtFromQuery();
			}
		} else if (e.key === 'Tab') {
			// Focus trap: keep Tab inside the palette
			e.preventDefault();
			inputEl?.focus();
		}
	}

	// ── Create thought from query ────────────────────────────────────────────

	async function createThoughtFromQuery() {
		const title = query.trim();
		if (!title || !libraryId) return;
		const id = await createThought(libraryId, title);
		close();
		if (id) goto(`/thought/${id}`);
	}

	// ── Derived results ───────────────────────────────────────────────────────

	const searchResults = $derived(
		resultIds
			.map((id) => thoughtMap.get(id))
			.filter((t): t is Thought => !!t)
			.slice(0, 8)
	);

	const isSearching = $derived(query.trim().length > 0);

	const filteredCommands = $derived(
		isSearching
			? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
			: commands
	);

	const allDisplayItems = $derived(
		[
			...filteredCommands.map((c) => ({
				id: c.id,
				label: c.label,
				icon: c.icon,
				shortcut: c.shortcut,
				action: c.action,
				type: 'command' as const,
			})),
			...searchResults.map((thought) => ({
				id: thought.id,
				label: thought.title || t('search.untitled'),
				icon: FileText,
				shortcut: undefined,
				action: () => navigate(thought.id),
				type: 'thought' as const,
			})),
		]
	);

	// ── Actions ───────────────────────────────────────────────────────────────

	function close() {
		uiStore.commandPaletteOpen = false;
		query = '';
		resultIds = [];
		activeIndex = 0;
	}

	function navigate(id: string) {
		haptic(ImpactStyle.Medium);
		close();
		goto(`/thought/${id}`);
	}
</script>

{#if uiStore.commandPaletteOpen}
	<!-- Backdrop -->
	<div
		class="backdrop"
		role="presentation"
		onclick={close}
		onkeydown={() => {}}
	></div>

	<!-- Palette -->
	<div
		class="palette"
		role="dialog"
		aria-modal="true"
		aria-label={t('search.ariaLabel')}
	>
		<div class="input-row">
			<Search size={16} strokeWidth={1.8} class="search-icon" />
			<input
				bind:this={inputEl}
				bind:value={query}
				class="search-input"
				type="text"
				placeholder={t('search.placeholder')}
				autocomplete="off"
				spellcheck="false"
				oninput={handleInput}
				onkeydown={handleKeydown}
			/>
			<kbd>Esc</kbd>
		</div>

		{#if allDisplayItems.length > 0}
			<div class="results" role="listbox">
				{#if filteredCommands.length > 0}
					<div class="group-header">Navigation</div>
					{#each filteredCommands as cmd, i}
						{@const Icon = cmd.icon}
						<button
							class="result-item"
							class:active={i === activeIndex}
							role="option"
							aria-selected={i === activeIndex}
							onmouseenter={() => { activeIndex = i; haptic(); }}
							onclick={() => { cmd.action(); haptic(ImpactStyle.Medium); }}
							type="button"
						>
							<Icon size={16} strokeWidth={1.8} />
							<span class="result-title">{cmd.label}</span>
							{#if cmd.shortcut}
								<kbd>{cmd.shortcut}</kbd>
							{/if}
						</button>
					{/each}
				{/if}

				{#if searchResults.length > 0}
					<div class="group-header">Thoughts</div>
					{#each searchResults as thought, i}
						{@const idx = filteredCommands.length + i}
						<button
							class="result-item"
							class:active={idx === activeIndex}
							role="option"
							aria-selected={idx === activeIndex}
							onmouseenter={() => { activeIndex = idx; }}
							onclick={() => navigate(thought.id)}
							type="button"
						>
							<FileText size={16} strokeWidth={1.8} />
							<span class="result-title">{thought.title || t('search.untitled')}</span>
						</button>
					{/each}
				{/if}
			</div>
		{:else if isSearching}
			<div class="empty">
				<p class="empty-text">{t('search.empty')}</p>
				<button class="empty-create" onclick={createThoughtFromQuery} type="button">
					<Plus size={14} strokeWidth={2} />
					Create "{query.trim()}"
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: var(--overlay-backdrop);
		z-index: 200;
		animation: fadeIn var(--transition-fast) ease forwards;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to   { opacity: 1; }
	}

	.palette {
		position: fixed;
		top: 15vh;
		left: 50%;
		transform: translateX(-50%);
		width: min(560px, calc(100vw - max(2rem, env(safe-area-inset-left) + env(safe-area-inset-right) + 1.5rem)));
		background: var(--glass-overlay);
		backdrop-filter: var(--glass-blur);
		-webkit-backdrop-filter: var(--glass-blur);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-xl);
		z-index: 201;
		overflow: hidden;
		box-shadow: var(--shadow-lg);
		animation: paletteIn var(--transition-base) cubic-bezier(0.22, 1, 0.36, 1) forwards;
	}

	@keyframes paletteIn {
		from { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.98); }
		to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
	}

	.input-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 0 var(--spacing-md);
		border-bottom: 1px solid var(--border);
		min-height: 48px;
	}

	:global(.search-icon) {
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		background: transparent;
		border: none;
		color: var(--text-primary);
		font-size: 0.9375rem;
		font-family: inherit;
		outline: none;
		padding: var(--spacing-sm) 0;
	}

	.search-input::placeholder {
		color: var(--text-muted);
	}

	.results {
		padding: var(--spacing-xs) 0;
		max-height: 360px;
		overflow-y: auto;
	}

	.group-header {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		padding: var(--spacing-sm) var(--spacing-md) var(--spacing-xs);
	}

	.result-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 10px var(--spacing-md);
		cursor: pointer;
		min-height: 48px;
		width: 100%;
		background: none;
		border: none;
		border-radius: var(--radius-md);
		margin: 0 var(--spacing-xs);
		width: calc(100% - var(--spacing-sm));
		box-sizing: border-box;
		color: var(--text-secondary);
		font-family: inherit;
		text-align: left;
		transition: background var(--transition-fast), color var(--transition-fast);
	}

	.result-item:hover {
		background: var(--bg-hover);
	}

	.result-item.active {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}

	.result-item :global(svg) {
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.result-item.active :global(svg) {
		color: var(--color-brand);
	}

	.result-title {
		flex: 1;
		font-size: 0.875rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.empty {
		padding: var(--spacing-lg) var(--spacing-md);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.empty-text {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-muted);
		text-align: center;
	}

	.empty-create {
		display: flex;
		align-items: center;
		gap: 4px;
		background: var(--brand-tint);
		color: var(--color-brand);
		border: 1px solid rgba(34, 211, 238, 0.2);
		border-radius: var(--radius-md);
		padding: 6px 12px;
		font-size: 0.8125rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: background var(--transition-fast), border-color var(--transition-fast);
	}

	.empty-create:hover {
		background: rgba(34, 211, 238, 0.15);
		border-color: rgba(34, 211, 238, 0.35);
	}

	/* ── Mobile ─────────────────────────────────────────────────────────── */

	@media (max-width: 767px) {
		.palette {
			top: max(2rem, env(safe-area-inset-top) + 0.5rem);
			width: calc(100vw - 1rem);
			border-radius: var(--radius-lg);
		}

		.results {
			max-height: calc(100dvh - 12rem);
		}
	}
</style>
