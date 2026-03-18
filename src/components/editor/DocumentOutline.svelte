<script lang="ts">
	import { onMount, onDestroy, getContext } from 'svelte';
	import { syntaxTree } from '@codemirror/language';
	import { EDITOR_VIEW_KEY, type EditorViewGetter } from '$lib/editorContext';

	// ── Types ──────────────────────────────────────────────────────────────────

	interface HeadingNode {
		level: 1 | 2 | 3;
		text: string;
		pos: number;   // character offset in doc — used for scrollIntoView
	}

	// ── Context ───────────────────────────────────────────────────────────────

	const getView = getContext<EditorViewGetter>(EDITOR_VIEW_KEY);

	// ── State ─────────────────────────────────────────────────────────────────

	let headings = $state<HeadingNode[]>([]);

	// ── Parse helpers ─────────────────────────────────────────────────────────

	function parseHeadings(): HeadingNode[] {
		const view = getView?.();
		if (!view) return [];
		const tree = syntaxTree(view.state);
		const doc = view.state.doc;
		const result: HeadingNode[] = [];

		tree.iterate({
			enter(node) {
				// CM6 markdown parser names headings ATXHeading1 / ATXHeading2 / ATXHeading3
				const m = node.name.match(/^ATXHeading([123])$/);
				if (!m) return;
				const level = parseInt(m[1]) as 1 | 2 | 3;
				// Text is everything after the #+ prefix — trim hash marks and whitespace
				const raw = doc.sliceString(node.from, node.to);
				const text = raw.replace(/^#{1,3}\s*/, '').trim();
				if (text) result.push({ level, text, pos: node.from });
			},
		});

		return result;
	}

	// ── Live sync via requestAnimationFrame poll ───────────────────────────────
	// We use EditorView.updateListener is owned by ThoughtEditor, so instead we
	// poll on a modest interval to stay decoupled. 400ms is imperceptible for an
	// outline panel.

	let rafId: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
		rafId = setInterval(() => {
			const next = parseHeadings();
			// Only update if content changed — avoid thrashing
			if (
				next.length !== headings.length ||
				next.some((h, i) => h.text !== headings[i]?.text || h.pos !== headings[i]?.pos)
			) {
				headings = next;
			}
		}, 400);
	});

	onDestroy(() => {
		if (rafId !== null) clearInterval(rafId);
	});

	// ── Navigation ────────────────────────────────────────────────────────────

	function scrollToHeading(pos: number) {
		const view = getView?.();
		if (!view) return;
		view.dispatch({
			selection: { anchor: pos },
			scrollIntoView: true,
		});
		view.focus();
	}
</script>

{#if headings.length > 0}
	<nav class="outline" aria-label="Document outline">
		<ul class="outline-list" role="list">
			{#each headings as h (h.pos)}
				<li class="outline-item outline-item--h{h.level}">
					<button
						type="button"
						class="outline-btn"
						onclick={() => scrollToHeading(h.pos)}
						title={h.text}
					>
						{h.text}
					</button>
				</li>
			{/each}
		</ul>
	</nav>
{/if}

<style>
	.outline {
		padding: 0.75rem 0;
	}

	.outline-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.outline-btn {
		display: block;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.3125rem 0.75rem;
		font-family: inherit;
		font-size: 0.8125rem;
		color: var(--text-secondary);
		border-radius: 6px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: background 100ms, color 100ms;
		min-height: 28px;
	}

	.outline-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	/* Indentation by heading level */
	.outline-item--h1 .outline-btn {
		font-weight: 600;
		color: var(--text-primary);
		padding-left: 0.75rem;
	}

	.outline-item--h2 .outline-btn {
		padding-left: 1.375rem;
	}

	.outline-item--h3 .outline-btn {
		padding-left: 2rem;
		font-size: 0.75rem;
	}
</style>
