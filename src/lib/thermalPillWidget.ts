/**
 * CodeMirror 6 extension that replaces [[Thought Title]] wikilinks with
 * coloured pipeline-stage pills. Colour comes from CSS variables (Rule 8).
 *
 * Updated via StateEffect when the liveQuery from db.ts emits new states.
 */

import { StateField, StateEffect } from '@codemirror/state';
import type { Range } from '@codemirror/state';
import { EditorView, WidgetType, Decoration, type DecorationSet } from '@codemirror/view';
import { PIPELINE_STATES } from '$lib/config';

// ── State effect to push a new title→state map into the field ─────────────────

export type ThoughtStateMap = Map<string, 1 | 2 | 3 | 4>;

export const updateThoughtStates = StateEffect.define<ThoughtStateMap>();

// ── Widget ────────────────────────────────────────────────────────────────────

class ThermalPillWidget extends WidgetType {
	constructor(private title: string, private metaState: 1 | 2 | 3 | 4) {
		super();
	}

	eq(other: ThermalPillWidget) {
		return other.title === this.title && other.metaState === this.metaState;
	}

	toDOM(): HTMLElement {
		const state = PIPELINE_STATES.find((s) => s.id === this.metaState);
		const cssVar = state?.cssVar ?? '--color-archive';

		const pill = document.createElement('span');
		pill.className = 'cm-thermal-pill';
		pill.textContent = this.title;
		pill.style.setProperty('--pill-colour', `var(${cssVar})`);
		pill.setAttribute('aria-label', `Linked thought: ${this.title}`);
		return pill;
	}

	ignoreEvent() {
		return true;
	}
}

// ── Decoration builder ────────────────────────────────────────────────────────

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;

function buildDecorations(doc: string, stateMap: ThoughtStateMap): DecorationSet {
	const widgets: Range<Decoration>[] = [];
	let match: RegExpExecArray | null;

	WIKILINK_RE.lastIndex = 0;
	while ((match = WIKILINK_RE.exec(doc)) !== null) {
		const title = match[1];
		const metaState = stateMap.get(title.toLowerCase());
		if (metaState === undefined) continue; // unresolved link — render as raw text

		widgets.push(
			Decoration.replace({
				widget: new ThermalPillWidget(title, metaState),
				inclusive: false,
			}).range(match.index, match.index + match[0].length)
		);
	}

	return Decoration.set(widgets, true);
}

// ── StateField ────────────────────────────────────────────────────────────────

interface PillState {
	decos: DecorationSet;
	map: ThoughtStateMap;
}

export const thermalPillField = StateField.define<PillState>({
	create() {
		return { decos: Decoration.none, map: new Map() };
	},
	update(value, tr) {
		let { map } = value;
		let mapChanged = false;

		for (const effect of tr.effects) {
			if (effect.is(updateThoughtStates)) {
				map = effect.value;
				mapChanged = true;
			}
		}

		if (!tr.docChanged && !mapChanged) return value;

		return {
			map,
			decos: buildDecorations(tr.newDoc.toString(), map),
		};
	},
	provide(field) {
		return EditorView.decorations.from(field, (state) => state.decos);
	},
});

// ── Theme ─────────────────────────────────────────────────────────────────────

export const thermalPillTheme = EditorView.baseTheme({
	'.cm-thermal-pill': {
		display: 'inline-block',
		padding: '1px 7px',
		borderRadius: '10px',
		fontSize: '0.8125em',
		fontWeight: '500',
		background: 'color-mix(in srgb, var(--pill-colour) 18%, transparent)',
		color: 'var(--pill-colour)',
		border: '1px solid color-mix(in srgb, var(--pill-colour) 35%, transparent)',
		cursor: 'default',
		verticalAlign: 'middle',
		lineHeight: '1.4',
		userSelect: 'none',
	},
});
