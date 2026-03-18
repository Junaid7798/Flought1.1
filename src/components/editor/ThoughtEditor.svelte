<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { EditorView, keymap } from '@codemirror/view';
	import { EditorState } from '@codemirror/state';
	import { markdown } from '@codemirror/lang-markdown';
	import { defaultKeymap, historyKeymap } from '@codemirror/commands';
	import { history } from '@codemirror/commands';
	import { updateThought, rebuildEdgesForThought, type Thought } from '$lib/db';
	import { extractLinks } from '$lib/linkParser';
	import { hideFrontmatterField } from '$lib/hideFrontmatter';
	import { ANIMATION_CONFIG } from '$lib/config';

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		thought: Thought;
		searchWorker: Worker | null;
	}
	let { thought, searchWorker }: Props = $props();

	// ── DOM ref ───────────────────────────────────────────────────────────────

	let containerEl = $state<HTMLDivElement | null>(null);
	let view: EditorView | null = null;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// ── CodeMirror theme ──────────────────────────────────────────────────────

	// Reads CSS variables at mount time so colours stay in sync with app.css.
	// The theme is a static snapshot — no dynamic update needed.
	const midnightTheme = EditorView.theme(
		{
			'&': {
				height: '100%',
				backgroundColor: 'var(--bg-deep)',
				color: 'var(--text-primary)',
				fontFamily: "'Geist', sans-serif",
				fontSize: '1rem',
			},
			'.cm-scroller': {
				overflow: 'auto',
				lineHeight: '1.7',
				fontFamily: 'inherit',
			},
			'.cm-content': {
				maxWidth: '600px',
				margin: '0 auto',
				padding: '2rem 1.5rem',
				caretColor: 'var(--color-brand)',
			},
			'.cm-line': {
				padding: '0',
			},
			'&.cm-focused': {
				outline: 'none',
			},
			'&.cm-focused .cm-cursor': {
				borderLeftColor: 'var(--color-brand)',
			},
			'.cm-selectionBackground, ::selection': {
				backgroundColor: 'var(--bg-hover)',
			},
			'.cm-activeLine': {
				backgroundColor: 'transparent',
			},
			// Markdown styling
			'.cm-header': {
				color: 'var(--text-primary)',
				fontWeight: '700',
			},
			'.cm-strong': {
				color: 'var(--text-primary)',
				fontWeight: '700',
			},
			'.cm-em': {
				color: 'var(--text-secondary)',
				fontStyle: 'italic',
			},
			'.cm-link': {
				color: 'var(--color-brand)',
				textDecoration: 'none',
			},
			'.cm-url': {
				color: 'var(--text-muted)',
			},
			'.cm-monospace, .cm-code': {
				fontFamily: 'monospace',
				color: 'var(--text-secondary)',
				backgroundColor: 'var(--bg-surface)',
				borderRadius: '3px',
				padding: '0 0.25em',
			},
			// Gutters / scrollbar
			'.cm-gutters': {
				display: 'none',
			},
		},
		{ dark: true }
	);

	// ── Flush helpers ─────────────────────────────────────────────────────────

	// Save content to DB (debounced on input, immediate on blur/unmount)
	async function flushContent(content: string) {
		await updateThought(thought.id, { content });
		searchWorker?.postMessage({
			type: 'update',
			thought: { id: thought.id, title: thought.title, content },
		});
	}

	// Rebuild wikilink edges — call on blur or unmount ONLY (Rule 12)
	async function flushEdges(content: string) {
		const links = extractLinks(content);
		await rebuildEdgesForThought(thought.id, links);
	}

	// ── Mount / destroy ───────────────────────────────────────────────────────

	onMount(() => {
		if (!containerEl) return;

		const startState = EditorState.create({
			doc: thought.content,
			extensions: [
				history(),
				keymap.of([...defaultKeymap, ...historyKeymap]),
				markdown(),
				hideFrontmatterField,
				midnightTheme,
				EditorView.lineWrapping,
				EditorView.updateListener.of((update) => {
					if (!update.docChanged) return;
					const content = update.state.doc.toString();

					// Debounced DB save + search index update
					if (debounceTimer) clearTimeout(debounceTimer);
					debounceTimer = setTimeout(() => {
						flushContent(content);
					}, ANIMATION_CONFIG.debounceEditor);
				}),
				EditorView.domEventHandlers({
					blur: () => {
						// Cancel pending debounce; flush immediately on blur
						if (debounceTimer) {
							clearTimeout(debounceTimer);
							debounceTimer = null;
						}
						const content = view?.state.doc.toString() ?? '';
						flushContent(content);
						flushEdges(content);
						return false;
					},
				}),
			],
		});

		view = new EditorView({ state: startState, parent: containerEl });
	});

	onDestroy(() => {
		// Cancel pending debounce; flush immediately on unmount
		if (debounceTimer) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}
		const content = view?.state.doc.toString() ?? '';
		// Fire-and-forget — component is unmounting
		flushContent(content);
		flushEdges(content);
		view?.destroy();
		view = null;
	});
</script>

<div class="editor-wrap" bind:this={containerEl}></div>

<style>
	.editor-wrap {
		height: 100%;
		overflow: hidden;
		background-color: var(--bg-deep);
	}
</style>
