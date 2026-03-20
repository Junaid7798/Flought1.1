<script lang="ts">
	import { onMount, onDestroy, setContext } from 'svelte';
	import { EditorView, keymap } from '@codemirror/view';
	import { EditorState } from '@codemirror/state';
	import { EDITOR_VIEW_KEY, type EditorViewGetter } from '$lib/editorContext';
	import { markdown } from '@codemirror/lang-markdown';
	import { defaultKeymap, historyKeymap } from '@codemirror/commands';
	import { history } from '@codemirror/commands';
	import matter from 'gray-matter';
	import {
		updateThought, rebuildEdgesForThought, getThoughtStates,
		getThoughtStatesAndAliases,
		type Thought,
	} from '$lib/db';
	import { extractLinks } from '$lib/linkParser';
	import { hideFrontmatterField } from '$lib/hideFrontmatter';
	import { checkboxField, checkboxTheme } from '$lib/checkboxWidget';
	import {
		thermalPillField, thermalPillTheme, updateThoughtStates,
		type ThoughtStateMap,
	} from '$lib/thermalPillWidget';
	import {
		embedField, embedTheme, updateEmbedMap, makeSnippet,
		type EmbedMap,
	} from '$lib/embedWidget';
	import { getThoughtsByLibrary } from '$lib/db';
	import { ANIMATION_CONFIG } from '$lib/config';
	import { createSyntaxHiding } from './extensions/syntaxHiding';
	import { createSemanticFolding } from './extensions/semanticFolding';
	import { createVaultAutocomplete } from './extensions/vaultAutocomplete';
	import { createSmartLists } from './extensions/smartLists';
	import { colorExtension } from '$lib/colorExtension';
	import FloatingToolbar from './FloatingToolbar.svelte';
	import SlashMenu, { type SlashItem } from './SlashMenu.svelte';

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		thought: Thought;
		searchWorker: Worker | null;
		bodyOnly?: boolean;
		initialBody?: string;
		isHeaderEditing?: boolean; // Added for FloatingToolbar conditional rendering
	}
	let { thought, searchWorker, bodyOnly = false, initialBody = '', isHeaderEditing = false }: Props = $props(); // Added isHeaderEditing

	// ── DOM refs ──────────────────────────────────────────────────────────────

	let containerEl = $state<HTMLDivElement | null>(null);
	let view: EditorView | null = null;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// ── State ─────────────────────────────────────────────────────────────────

	let slashOpen = $state(false);
	let slashX = $state(0);
	let slashY = $state(0);
	let slashFrom = -1;
	let autocompleteTerms = $state<string[]>([]);
	let isTyping = $state(false);
	let typingFadeTimer: ReturnType<typeof setTimeout> | null = null;

	let stateMapSub: { unsubscribe(): void } | null = null;
	let embedSub: { unsubscribe(): void } | null = null;
	let formatHandler: ((e: any) => void) | null = null;

	// ── CodeMirror theme ──────────────────────────────────────────────────────

	const modernTheme = EditorView.theme(
		{
			'&': {
				height: 'auto',
				backgroundColor: 'transparent',
				color: 'var(--text-primary)',
				fontFamily: "'Inter', system-ui, sans-serif",
				fontSize: '18px',
				lineHeight: '1.8',
				letterSpacing: '-0.01em',
			},
			'.cm-gutters': {
				backgroundColor: 'transparent',
				borderRight: 'none',
				color: 'var(--text-muted)',
				display: 'none',
			},
			'.cm-scroller': {
				overflow: 'visible',
				fontFamily: 'inherit',
			},
			'.cm-content': {
				padding: '0 0 50vh',
				caretColor: 'var(--color-brand)',
			},
			'.cm-line': { padding: '0 4px' },
			'.cm-activeLine': { 
				backgroundColor: 'rgba(255, 255, 255, 0.01)',
			},
			'&.cm-focused': { outline: 'none' },
			'.cm-cursor': { borderLeft: '2.5px solid var(--color-brand)' },
			'.cm-header':  { color: 'var(--text-primary)', fontWeight: '800', letterSpacing: '-0.04em', marginTop: '2em', marginBottom: '0.5em' },
			'.cm-header-1': { fontSize: '2em' },
			'.cm-header-2': { fontSize: '1.6em' },
			'.cm-header-3': { fontSize: '1.3em' }, // Added for h3
			'.cm-blockquote': { // Added for quote
				borderLeft: '3px solid var(--border-separator)',
				paddingLeft: '1.5rem',
				color: 'var(--text-secondary)',
				fontStyle: 'italic',
				margin: '2em 0',
			},
		},
		{ dark: true }
	);

	// ── Flush helpers ─────────────────────────────────────────────────────────

	async function flushContent(rawText: string) {
		let finalContent = rawText;

		if (bodyOnly) {
			try {
				const { data } = matter(thought.content);
				finalContent = matter.stringify(rawText, data);
			} catch (e) {
				// Fallback if original content isn't valid frontmatter
				finalContent = rawText;
			}
		}

		await updateThought(thought.id, { content: finalContent });
		searchWorker?.postMessage({
			type: 'update',
			thought: { id: thought.id, title: thought.title, content: finalContent },
		});
	}

	async function flushEdges(rawText: string) {
		const links = extractLinks(rawText);
		await rebuildEdgesForThought(thought.id, links);
	}

	// ── Slash command helpers ─────────────────────────────────────────────────

	function openSlashMenu(pos: number) {
		if (!view || !containerEl) return;
		const coords = view.coordsAtPos(pos);
		if (!coords) return;
		const rect = containerEl.getBoundingClientRect();
		const scrollRect = view.scrollDOM.getBoundingClientRect();
		
		slashX = coords.left - rect.left;
		slashY = coords.bottom - rect.top + 4;
		slashFrom = pos;
		slashOpen = true;
	}

	function handleSlashSelect(item: SlashItem) {
		slashOpen = false;
		if (!view || slashFrom < 0) return;
		view.dispatch({
			changes: { from: slashFrom, to: slashFrom + 1, insert: item.syntax },
			selection: { anchor: slashFrom + item.syntax.length },
		});
		view.focus();
	}

	function handleSlashClose() {
		slashOpen = false;
		view?.focus();
	}

	const getView: EditorViewGetter = () => view;
	setContext(EDITOR_VIEW_KEY, getView);

	// ── Mount / destroy ───────────────────────────────────────────────────────

	onMount(async () => {
		if (!containerEl) return;

		const statesAndAliases = await getThoughtStatesAndAliases();
		autocompleteTerms = statesAndAliases
			.filter((s) => s.id !== thought.id)
			.flatMap((s) => [s.title, ...s.aliases]);

		stateMapSub = getThoughtStates(thought.library_id).subscribe((states) => {
			if (!view) return;
			const map: ThoughtStateMap = new Map(
				states
					.filter((s) => s.id !== thought.id)
					.map((s) => [s.title.toLowerCase(), s.meta_state])
			);
			view.dispatch({ effects: [updateThoughtStates.of(map)] });
		});

		embedSub = getThoughtsByLibrary(thought.library_id).subscribe((thoughts) => {
			if (!view) return;
			const map: EmbedMap = new Map(
				thoughts
					.filter((t) => t.id !== thought.id)
					.map((t) => [
						t.title.toLowerCase(),
						{ title: t.title, meta_state: t.meta_state, snippet: makeSnippet(t.content) },
					])
			);
			view.dispatch({ effects: [updateEmbedMap.of(map)] });
		});

		const startState = EditorState.create({
			doc: bodyOnly ? initialBody : thought.content,
			extensions: [
				history(),
				keymap.of([...defaultKeymap, ...historyKeymap]),
				markdown(),
				hideFrontmatterField,
				checkboxField,
				checkboxTheme,
				thermalPillField,
				thermalPillTheme,
				embedField,
				embedTheme,
				createSyntaxHiding(),
				createSemanticFolding(),
				createVaultAutocomplete(autocompleteTerms),
				modernTheme,
				EditorView.lineWrapping,
				EditorView.updateListener.of((update) => {
					if (!update.docChanged) return;
					const content = update.state.doc.toString();

					isTyping = true;
					if (typingFadeTimer) clearTimeout(typingFadeTimer);
					typingFadeTimer = setTimeout(() => { isTyping = false; }, 1200);

					for (const tr of update.transactions) {
						tr.changes.iterChanges((_fromA, _toA, _fromB, toB, inserted) => {
							if (inserted.toString() === '/') {
								const lineStart = update.state.doc.lineAt(toB - 1).from;
								const prefix = update.state.doc.sliceString(lineStart, toB - 1);
								if (prefix.trim() === '') {
									openSlashMenu(toB - 1);
								}
							}
						});
					}

					if (debounceTimer) clearTimeout(debounceTimer);
					debounceTimer = setTimeout(() => {
						flushContent(content);
					}, ANIMATION_CONFIG.debounceEditor);
				}),
				EditorView.domEventHandlers({
					blur: () => {
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
				createSmartLists(),
				colorExtension,
			],
		});

		view = new EditorView({ state: startState, parent: containerEl });

		formatHandler = (e: any) => {
			if (!view) return;
			const { before, after } = e.detail;
			const { from, to } = view.state.selection.main;
			const selectedText = view.state.doc.sliceString(from, to);
			view.dispatch({
				changes: { from, to, insert: `${before}${selectedText}${after}` },
				selection: { anchor: from + before.length, head: from + before.length + selectedText.length }
			});
			view.focus();
		};
		window.addEventListener('flought:format', formatHandler);
	});

	onDestroy(() => {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}
		if (typingFadeTimer) {
			clearTimeout(typingFadeTimer);
			typingFadeTimer = null;
		}
		stateMapSub?.unsubscribe();
		embedSub?.unsubscribe();
		if (formatHandler) {
			window.removeEventListener('flought:format', formatHandler);
			formatHandler = null;
		}
		const content = view?.state.doc.toString() ?? '';
		if (content && view) {
			flushContent(content);
			flushEdges(content);
		}
		view?.destroy();
		view = null;
	});
</script>

<div class="editor-shell">
	<div class="editor-wrap" bind:this={containerEl}></div>
	<div class="rhythm-bar" class:active={isTyping}></div>
	{#if !isHeaderEditing && thought.library_id}
		<FloatingToolbar />
	{/if}
	{#if slashOpen}
		<SlashMenu
			x={slashX}
			y={slashY}
			onselect={handleSlashSelect}
			onclose={handleSlashClose}
		/>
	{/if}
</div>

<style>
	.editor-shell {
		display: flex;
		flex-direction: column;
		height: 100%;
		position: relative;
	}

	.editor-wrap {
		flex: 1;
		min-height: 200px;
		background-color: transparent;
	}

	.rhythm-bar {
		height: 2px;
		background: var(--color-brand);
		opacity: 0;
		transform: scaleX(0);
		transform-origin: left;
		transition: opacity 400ms, transform 400ms;
		position: absolute;
		bottom: -20px;
		left: 0;
		right: 0;
	}

	.rhythm-bar.active {
		opacity: 1;
		transform: scaleX(1);
		transition: opacity 80ms, transform 80ms;
	}
</style>
