<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { getThoughtsByLibrary } from '$lib/db';
	import type { Thought } from '$lib/db';
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

	// ── Populate thought map for display ──────────────────────────────────────

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

	// ── Worker message handler ─────────────────────────────────────────────────

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

	// ── Focus input when opened ────────────────────────────────────────────────

	$effect(() => {
		if (uiStore.commandPaletteOpen && inputEl) {
			// Defer one tick so the element is visible
			requestAnimationFrame(() => inputEl?.focus());
		}
	});

	// ── Search on keystroke ────────────────────────────────────────────────────

	function handleInput() {
		const q = query.trim();
		if (!q) {
			resultIds = [];
			return;
		}
		uiStore.searchWorker?.postMessage({ type: 'search', query: q });
	}

	// ── Keyboard navigation ────────────────────────────────────────────────────

	function handleKeydown(e: KeyboardEvent) {
		const total = displayResults.length;
		if (e.key === 'Escape') {
			close();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = total ? (activeIndex + 1) % total : 0;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = total ? (activeIndex - 1 + total) % total : 0;
		} else if (e.key === 'Enter') {
			const item = displayResults[activeIndex];
			if (item) navigate(item.id);
		}
	}

	// ── Results ───────────────────────────────────────────────────────────────

	const displayResults = $derived(
		resultIds
			.map((id) => thoughtMap.get(id))
			.filter((t): t is Thought => !!t)
			.slice(0, 8)
	);

	// ── Actions ───────────────────────────────────────────────────────────────

	function close() {
		uiStore.commandPaletteOpen = false;
		query = '';
		resultIds = [];
		activeIndex = 0;
	}

	function navigate(id: string) {
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

	<!-- Modal -->
	<div
		class="palette"
		role="dialog"
		aria-modal="true"
		aria-label={t('search.ariaLabel')}
	>
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

		{#if displayResults.length > 0}
			<ul class="results" role="listbox">
				{#each displayResults as thought, i}
					<li
						class="result-item"
						class:active={i === activeIndex}
						role="option"
						aria-selected={i === activeIndex}
						onmouseenter={() => { activeIndex = i; }}
						onclick={() => navigate(thought.id)}
						onkeydown={(e) => { if (e.key === 'Enter') navigate(thought.id); }}
						tabindex="-1"
					>
						<span class="result-title">{thought.title || t('search.untitled')}</span>
					</li>
				{/each}
			</ul>
		{:else if query.trim()}
			<p class="empty">{t('search.empty')}</p>
		{/if}
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: var(--overlay-backdrop);
		z-index: 200;
	}

	.palette {
		position: fixed;
		top: 15vh;
		left: 50%;
		transform: translateX(-50%);
		width: min(600px, calc(100vw - 2rem));
		background: var(--bg-surface);
		border: 1px solid var(--border-strong);
		border-radius: 12px;
		z-index: 201;
		overflow: hidden;
		box-shadow: 0 24px 64px var(--shadow-dropdown);
	}

	.search-input {
		display: block;
		width: 100%;
		padding: 1rem 1.25rem;
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--border);
		color: var(--text-primary);
		font-size: 1rem;
		font-family: inherit;
		outline: none;
		box-sizing: border-box;
	}

	.search-input::placeholder {
		color: var(--text-muted);
	}

	.results {
		list-style: none;
		margin: 0;
		padding: 0.375rem 0;
		max-height: 360px;
		overflow-y: auto;
	}

	.result-item {
		display: flex;
		align-items: center;
		padding: 0.625rem 1.25rem;
		cursor: pointer;
		min-height: 44px;
		transition: background 80ms;
	}

	.result-item.active {
		background: var(--bg-hover);
	}

	.result-title {
		font-size: 0.9375rem;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.empty {
		padding: 1rem 1.25rem;
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-muted);
		text-align: center;
	}
</style>
