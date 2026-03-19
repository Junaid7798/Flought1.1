<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { ArrowLeft, Share2 } from 'lucide-svelte';
	import { Capacitor } from '@capacitor/core';
	import { Share } from '@capacitor/share';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import { getThought, updateThought, updateLastViewed, markTriaged, type Thought } from '$lib/db';
	import { saveScrollPosition, getScrollPosition } from '$lib/scrollMemory';
	import { propagateRename } from '$lib/janitorService';
	import { showToast } from '$lib/stores/toastStore.svelte';
	import { ANIMATION_CONFIG } from '$lib/config';
	import { $t as t } from '$lib/i18n';
	import FrontmatterMask from '../../../../components/editor/FrontmatterMask.svelte';
	import ThoughtEditor from '../../../../components/editor/ThoughtEditor.svelte';
	import DocumentOutline from '../../../../components/editor/DocumentOutline.svelte';
	import BacklinkFooter from '../../../../components/editor/BacklinkFooter.svelte';

	// ── State ─────────────────────────────────────────────────────────────────

	let thought = $state<Thought | null>(null);
	let titleValue = $state('');
	let prevTitle = '';  // tracks saved title for rename propagation
	let titleDebounce: ReturnType<typeof setTimeout> | null = null;
	let scrollEl = $state<HTMLDivElement | null>(null);
	let triageTimer: ReturnType<typeof setTimeout> | null = null;

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
		prevTitle  = t.title;

		// Track in uiStore so graph can highlight the focused node
		uiStore.focusedNodeId = id ?? null;

		// B.6 — Restore scroll position and mark last viewed
		await updateLastViewed(id);

		// D.3 — Auto-triage after 5 seconds in editor
		if (t && !t.is_triaged) {
			triageTimer = setTimeout(() => markTriaged(id), 5000);
		}
		// Defer scroll restore one tick so CM6 has rendered
		requestAnimationFrame(() => {
			if (scrollEl) {
				scrollEl.scrollTop = getScrollPosition(id);
			}
		});
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

		// C.1 — Propagate rename if title changed
		const oldTitle = prevTitle;
		const newTitle = titleValue.trim();
		if (newTitle && newTitle !== oldTitle) {
			prevTitle = newTitle;
			const count = await propagateRename(oldTitle, newTitle);
			if (count > 0) {
				showToast(t('editor.linksUpdated').replace('{count}', String(count)));
			}
		}
	}

	onDestroy(() => {
		const id = thought?.id;
		if (id && scrollEl) {
			saveScrollPosition(id, scrollEl.scrollTop);
		}
		uiStore.focusedNodeId = null;
		if (triageTimer) clearTimeout(triageTimer);
	});

	async function handleShare() {
		if (!thought) return;
		await Share.share({
			title: thought.title,
			text: thought.content,
			dialogTitle: thought.title,
		});
	}
</script>

{#if thought}
	<div class="page">
		<!-- Mobile back button + share button -->
		<div class="mobile-header">
			<button class="back-btn" onclick={() => goto('/map')} aria-label={t('editor.backAriaLabel')}>
				<ArrowLeft size={20} />
			</button>
			{#if Capacitor.isNativePlatform()}
				<button class="share-btn" onclick={handleShare} aria-label={t('editor.share')}>
					<Share2 size={20} />
				</button>
			{/if}
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
			<div class="editor-main" bind:this={scrollEl}>
				<ThoughtEditor thought={thought} searchWorker={uiStore.searchWorker} />
				<!-- B.5 — Ambient backlink footer -->
				<BacklinkFooter thoughtTitle={thought.title} />
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
		width: 100%;
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

	.share-btn {
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
		margin-left: auto;
		transition: background 120ms;
	}

	.share-btn:hover {
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
		overflow-y: auto;
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
