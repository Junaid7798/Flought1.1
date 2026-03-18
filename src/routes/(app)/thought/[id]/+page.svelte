<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { ArrowLeft } from 'lucide-svelte';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { getThought, updateThought, type Thought } from '$lib/db';
	import { ANIMATION_CONFIG } from '$lib/config';
	import { $t as t } from '$lib/i18n';
	import FrontmatterMask from '../../../../components/editor/FrontmatterMask.svelte';
	import ThoughtEditor from '../../../../components/editor/ThoughtEditor.svelte';
	import DocumentOutline from '../../../../components/editor/DocumentOutline.svelte';

	// ── State ─────────────────────────────────────────────────────────────────

	let thought = $state<Thought | null>(null);
	let titleValue = $state('');
	let titleDebounce: ReturnType<typeof setTimeout> | null = null;

	// ── Load thought ──────────────────────────────────────────────────────────

	onMount(async () => {
		const id = $page.params.id ?? '';
		if (!id) { goto('/map'); return; }

		const t = await getThought(id);
		if (!t || t.is_deleted) {
			goto('/map');
			return;
		}
		thought = t;
		titleValue = t.title;

		// Track in uiStore so graph can highlight the focused node
		uiStore.focusedNodeId = id ?? null;
	});

	// ── Title editing ─────────────────────────────────────────────────────────

	function handleTitleInput(e: Event) {
		if (!thought) return;
		titleValue = (e.target as HTMLInputElement).value;

		if (titleDebounce) clearTimeout(titleDebounce);
		titleDebounce = setTimeout(async () => {
			if (!thought) return;
			await updateThought(thought.id, { title: titleValue });
		}, ANIMATION_CONFIG.debounceEditor);
	}

	async function handleTitleBlur() {
		if (!thought) return;
		if (titleDebounce) {
			clearTimeout(titleDebounce);
			titleDebounce = null;
		}
		await updateThought(thought.id, { title: titleValue });
	}
</script>

{#if thought}
	<div class="page">
		<!-- Mobile back button -->
		<div class="mobile-header">
			<button class="back-btn" onclick={() => goto('/map')} aria-label={t('editor.backAriaLabel')}>
				<ArrowLeft size={20} />
			</button>
		</div>

		<!-- Editable title -->
		<div class="title-wrap">
			<input
				class="title-input"
				type="text"
				value={titleValue}
				oninput={handleTitleInput}
				onblur={handleTitleBlur}
				placeholder={t('editor.titlePlaceholder')}
				aria-label={t('editor.titleAriaLabel')}
			/>
		</div>

		<!-- YAML properties panel -->
		<FrontmatterMask thoughtId={thought.id} />

		<!-- Editor + Outline panel -->
		<div class="editor-region">
			<div class="editor-main">
				<ThoughtEditor thought={thought} searchWorker={uiStore.searchWorker} />
			</div>
			<!-- Document outline — desktop only, hidden on mobile -->
			<aside class="outline-panel" aria-label="Document outline">
				<p class="outline-heading">Outline</p>
				<DocumentOutline />
			</aside>
		</div>
	</div>
{/if}

<style>
	.page {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		overflow: hidden;
		background: var(--bg-deep);
	}

	/* Mobile back button — hidden on desktop */
	.mobile-header {
		display: none;
		align-items: center;
		padding: 0.5rem 1rem;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}

	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		border-radius: 8px;
		transition: background 120ms;
	}

	.back-btn:hover {
		background: var(--bg-hover);
	}

	/* Title input */
	.title-wrap {
		max-width: 600px;
		width: 100%;
		margin: 0 auto;
		padding: 1.5rem 1.5rem 0.5rem;
		box-sizing: border-box;
		flex-shrink: 0;
	}

	.title-input {
		width: 100%;
		background: transparent;
		border: none;
		color: var(--text-primary);
		font-size: 1.75rem;
		font-weight: 700;
		font-family: inherit;
		outline: none;
		padding: 0;
		line-height: 1.2;
	}

	.title-input::placeholder {
		color: var(--text-muted);
	}

	/* Editor fills remaining space */
	.editor-region {
		flex: 1;
		min-height: 0;
		overflow: hidden;
		display: flex;
	}

	.editor-main {
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}

	/* Outline panel — desktop sidebar, hidden on mobile */
	.outline-panel {
		width: 200px;
		flex-shrink: 0;
		border-left: 1px solid var(--border);
		overflow-y: auto;
		background: var(--bg-panel);
		display: none;
	}

	.outline-heading {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		padding: 0.75rem 0.75rem 0;
		margin: 0;
	}

	@media (min-width: 1100px) {
		.outline-panel {
			display: block;
		}
	}

	/* Mobile: full-screen with back button visible */
	@media (max-width: 767px) {
		.mobile-header {
			display: flex;
		}

		.title-wrap {
			padding: 1rem 1rem 0.5rem;
		}
	}
</style>
