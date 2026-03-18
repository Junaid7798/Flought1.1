// ── Embed Widget (Block-Level Transclusion) ───────────────────────────────────
// CM6 StateField that replaces ![[Thought Title]] with a read-only embed card
// showing the linked thought's title, pipeline stage, and a 2-line body snippet.
//
// Data is injected via the updateEmbedMap StateEffect — same pattern as
// thermalPillWidget.ts. ThoughtEditor subscribes to getThoughtStates() and
// dispatches the map whenever it changes.

import {
	StateField,
	StateEffect,
	type Range,
} from '@codemirror/state';
import {
	Decoration,
	type DecorationSet,
	EditorView,
	WidgetType,
} from '@codemirror/view';
import { PIPELINE_STATES } from '$lib/config';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EmbedEntry {
	title: string;
	meta_state: 1 | 2 | 3 | 4;
	snippet: string;   // first 120 chars of content, stripped of markdown
}

export type EmbedMap = Map<string, EmbedEntry>;  // lowercase title → entry

// ── StateEffect ───────────────────────────────────────────────────────────────

export const updateEmbedMap = StateEffect.define<EmbedMap>();

// ── Widget ────────────────────────────────────────────────────────────────────

class EmbedWidget extends WidgetType {
	constructor(private entry: EmbedEntry) {
		super();
	}

	eq(other: EmbedWidget) {
		return (
			other.entry.title === this.entry.title &&
			other.entry.meta_state === this.entry.meta_state &&
			other.entry.snippet === this.entry.snippet
		);
	}

	toDOM() {
		const state = PIPELINE_STATES[this.entry.meta_state - 1];
		const card = document.createElement('div');
		card.className = 'cm-embed-card';

		const header = document.createElement('div');
		header.className = 'cm-embed-header';

		const pill = document.createElement('span');
		pill.className = 'cm-embed-pill';
		pill.style.background = `var(${state.cssVar})`;

		const titleEl = document.createElement('span');
		titleEl.className = 'cm-embed-title';
		titleEl.textContent = this.entry.title;

		header.appendChild(pill);
		header.appendChild(titleEl);

		const body = document.createElement('p');
		body.className = 'cm-embed-body';
		body.textContent = this.entry.snippet || '—';

		card.appendChild(header);
		card.appendChild(body);
		return card;
	}

	ignoreEvent() {
		return false;
	}
}

// ── Decoration builder ────────────────────────────────────────────────────────

const EMBED_RE = /!\[\[([^\]]+)\]\]/g;

function buildDecorations(doc: string, map: EmbedMap): DecorationSet {
	const widgets: Range<Decoration>[] = [];
	let m: RegExpExecArray | null;
	EMBED_RE.lastIndex = 0;

	while ((m = EMBED_RE.exec(doc)) !== null) {
		const title = m[1].trim();
		const entry = map.get(title.toLowerCase());
		if (!entry) continue;

		const from = m.index;
		const to = from + m[0].length;
		widgets.push(
			Decoration.replace({
				widget: new EmbedWidget(entry),
				inclusive: false,
				block: false,
			}).range(from, to)
		);
	}

	return Decoration.set(widgets, true);
}

// ── StateField ────────────────────────────────────────────────────────────────

interface EmbedState {
	decos: DecorationSet;
	map: EmbedMap;
}

export const embedField = StateField.define<EmbedState>({
	create() {
		return { decos: Decoration.none, map: new Map() };
	},
	update(prev, tr) {
		let { decos, map } = prev;
		for (const effect of tr.effects) {
			if (effect.is(updateEmbedMap)) {
				map = effect.value;
			}
		}
		if (tr.docChanged || tr.effects.some((e) => e.is(updateEmbedMap))) {
			decos = buildDecorations(tr.newDoc.toString(), map);
		}
		return { decos, map };
	},
	provide(field) {
		return EditorView.decorations.from(field, (state) => state.decos);
	},
});

// ── Theme ─────────────────────────────────────────────────────────────────────

export const embedTheme = EditorView.baseTheme({
	'.cm-embed-card': {
		display: 'inline-flex',
		flexDirection: 'column',
		gap: '4px',
		padding: '8px 12px',
		background: 'var(--bg-surface)',
		border: '1px solid var(--border-strong)',
		borderRadius: '8px',
		marginTop: '4px',
		marginBottom: '4px',
		cursor: 'default',
		userSelect: 'none',
		maxWidth: '480px',
		verticalAlign: 'top',
	},
	'.cm-embed-header': {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
	},
	'.cm-embed-pill': {
		width: '10px',
		height: '10px',
		borderRadius: '50%',
		flexShrink: '0',
		opacity: '0.85',
	},
	'.cm-embed-title': {
		fontSize: '0.875rem',
		fontWeight: '600',
		color: 'var(--text-primary)',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	'.cm-embed-body': {
		fontSize: '0.75rem',
		color: 'var(--text-secondary)',
		margin: '0',
		display: '-webkit-box',
		WebkitLineClamp: '2',
		WebkitBoxOrient: 'vertical',
		overflow: 'hidden',
		lineHeight: '1.5',
	},
});

// ── Snippet helper ────────────────────────────────────────────────────────────

/** Strip common markdown syntax and return first 120 chars. */
export function makeSnippet(content: string): string {
	return content
		.replace(/^---[\s\S]*?---\n?/, '')   // strip frontmatter
		.replace(/!\[\[.*?\]\]/g, '')          // strip embeds
		.replace(/\[\[.*?\]\]/g, '')           // strip wikilinks
		.replace(/[#*_`~>]/g, '')              // strip common markdown chars
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 120);
}
