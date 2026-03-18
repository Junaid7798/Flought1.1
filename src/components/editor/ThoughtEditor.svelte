<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { EditorView, keymap } from '@codemirror/view';
	import { EditorState } from '@codemirror/state';
	import { markdown } from '@codemirror/lang-markdown';
	import { defaultKeymap, historyKeymap } from '@codemirror/commands';
	import { history } from '@codemirror/commands';
	import {
		updateThought, rebuildEdgesForThought, getThoughtStates,
		type Thought,
	} from '$lib/db';
	import { extractLinks } from '$lib/linkParser';
	import { hideFrontmatterField } from '$lib/hideFrontmatter';
	import { checkboxField, checkboxTheme } from '$lib/checkboxWidget';
	import {
		thermalPillField, thermalPillTheme, updateThoughtStates,
		type ThoughtStateMap,
	} from '$lib/thermalPillWidget';
	import { ANIMATION_CONFIG } from '$lib/config';
	import SlashMenu, { type SlashItem } from './SlashMenu.svelte';

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		thought: Thought;
		searchWorker: Worker | null;
	}
	let { thought, searchWorker }: Props = $props();

	// ── DOM refs ──────────────────────────────────────────────────────────────

	let containerEl = $state<HTMLDivElement | null>(null);
	let view: EditorView | null = null;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// ── Slash command state ───────────────────────────────────────────────────

	let slashOpen = $state(false);
	let slashX = $state(0);
	let slashY = $state(0);
	let slashFrom = -1;

	// ── Typing rhythm bar ─────────────────────────────────────────────────────

	let isTyping = $state(false);
	let typingFadeTimer: ReturnType<typeof setTimeout> | null = null;

	// ── Live thought-state subscription ──────────────────────────────────────

	let stateMapSub: { unsubscribe(): void } | null = null;

	// ── CodeMirror theme ──────────────────────────────────────────────────────

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
			'.cm-line': { padding: '0' },
			'&.cm-focused': { outline: 'none' },
			'&.cm-focused .cm-cursor': { borderLeftColor: 'var(--color-brand)' },
			'.cm-selectionBackground, ::selection': { backgroundColor: 'var(--bg-hover)' },
			'.cm-activeLine': { backgroundColor: 'transparent' },
			'.cm-header':  { color: 'var(--text-primary)', fontWeight: '700' },
			'.cm-strong':  { color: 'var(--text-primary)', fontWeight: '700' },
			'.cm-em':      { color: 'var(--text-secondary)', fontStyle: 'italic' },
			'.cm-link':    { color: 'var(--color-brand)', textDecoration: 'none' },
			'.cm-url':     { color: 'var(--text-muted)' },
			'.cm-monospace, .cm-code': {
				fontFamily: 'monospace',
				color: 'var(--text-secondary)',
				backgroundColor: 'var(--bg-surface)',
				borderRadius: '3px',
				padding: '0 0.25em',
			},
			'.cm-gutters': { display: 'none' },
		},
		{ dark: true }
	);

	// ── Flush helpers ─────────────────────────────────────────────────────────

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

	// ── Slash command helpers ─────────────────────────────────────────────────

	function openSlashMenu(pos: number) {
		if (!view || !containerEl) return;
		const coords = view.coordsAtPos(pos);
		if (!coords) return;
		const rect = containerEl.getBoundingClientRect();
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

	// ── Mount / destroy ───────────────────────────────────────────────────────

	onMount(() => {
		if (!containerEl) return;

		// Subscribe to live thought states for thermal pill decorations
		stateMapSub = getThoughtStates(thought.library_id).subscribe((states) => {
			if (!view) return;
			const map: ThoughtStateMap = new Map(
				states
					.filter((s) => s.id !== thought.id)
					.map((s) => [s.title.toLowerCase(), s.meta_state])
			);
			view.dispatch({ effects: [updateThoughtStates.of(map)] });
		});

		const startState = EditorState.create({
			doc: thought.content,
			extensions: [
				history(),
				keymap.of([...defaultKeymap, ...historyKeymap]),
				markdown(),
				hideFrontmatterField,
				checkboxField,
				checkboxTheme,
				thermalPillField,
				thermalPillTheme,
				midnightTheme,
				EditorView.lineWrapping,
				EditorView.updateListener.of((update) => {
					if (!update.docChanged) return;
					const content = update.state.doc.toString();

					// Typing rhythm bar — light up on any keystroke, fade after 1.2s idle
					isTyping = true;
					if (typingFadeTimer) clearTimeout(typingFadeTimer);
					typingFadeTimer = setTimeout(() => { isTyping = false; }, 1200);

					// Slash command detection — '/' at line-start or after whitespace only
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

					// Debounced DB save + search index update
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
			],
		});

		view = new EditorView({ state: startState, parent: containerEl });
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
		const content = view?.state.doc.toString() ?? '';
		flushContent(content);
		flushEdges(content);
		view?.destroy();
		view = null;
	});
</script>

<div class="editor-shell">
	<div class="editor-wrap" bind:this={containerEl}></div>

	<!-- Typing rhythm bar: 2px cyan line, grows in on keypress, fades after idle -->
	<div class="rhythm-bar" class:active={isTyping}></div>
</div>

{#if slashOpen}
	<SlashMenu
		x={slashX}
		y={slashY}
		onselect={handleSlashSelect}
		onclose={handleSlashClose}
	/>
{/if}

<style>
	.editor-shell {
		display: flex;
		flex-direction: column;
		height: 100%;
		position: relative;
	}

	.editor-wrap {
		flex: 1;
		min-height: 0;
		overflow: hidden;
		background-color: var(--bg-deep);
	}

	/* Typing rhythm bar — Rule 9 compliant: transform + opacity only */
	.rhythm-bar {
		height: 2px;
		flex-shrink: 0;
		background: var(--color-brand);
		opacity: 0;
		transform: scaleX(0);
		transform-origin: left;
		transition: opacity 400ms, transform 400ms;
	}

	.rhythm-bar.active {
		opacity: 1;
		transform: scaleX(1);
		transition: opacity 80ms, transform 80ms;
	}
</style>
