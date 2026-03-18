/**
 * CodeMirror 6 extension that renders - [ ] and - [x] as clickable checkboxes.
 * Clicking toggles the markdown in-place without breaking undo history.
 */

import { StateField } from '@codemirror/state';
import { EditorView, WidgetType, Decoration, type DecorationSet } from '@codemirror/view';
import type { Range } from '@codemirror/state';

// ── Widget ────────────────────────────────────────────────────────────────────

class CheckboxWidget extends WidgetType {
	constructor(private checked: boolean, private from: number, private to: number) {
		super();
	}

	eq(other: CheckboxWidget) {
		return other.checked === this.checked && other.from === this.from;
	}

	toDOM(view: EditorView): HTMLElement {
		const wrap = document.createElement('span');
		wrap.setAttribute('aria-hidden', 'true');
		wrap.className = 'cm-checkbox-wrap';

		const box = document.createElement('input');
		box.type = 'checkbox';
		box.checked = this.checked;
		box.className = 'cm-checkbox';

		// Prevent CM6 from receiving the click as a cursor movement
		box.addEventListener('mousedown', (e) => e.preventDefault());
		box.addEventListener('change', () => {
			const newMark = box.checked ? '[x]' : '[ ]';
			view.dispatch({
				changes: { from: this.from, to: this.to, insert: newMark },
			});
		});

		wrap.appendChild(box);
		return wrap;
	}

	ignoreEvent() {
		return false;
	}
}

// ── Decoration builder ────────────────────────────────────────────────────────

const CHECKBOX_RE = /- \[([ x])\]/g;

function buildDecorations(doc: string): DecorationSet {
	const widgets: Range<Decoration>[] = [];
	let match: RegExpExecArray | null;

	CHECKBOX_RE.lastIndex = 0;
	while ((match = CHECKBOX_RE.exec(doc)) !== null) {
		const checked = match[1] === 'x';
		// Replace just the `[ ]` or `[x]` portion (keep the `- ` prefix visible)
		const from = match.index + 2; // after `- `
		const to = from + 3;          // `[ ]` or `[x]` is 3 chars
		widgets.push(
			Decoration.replace({
				widget: new CheckboxWidget(checked, from, to),
				inclusive: false,
			}).range(from, to)
		);
	}

	return Decoration.set(widgets, true);
}

// ── StateField ────────────────────────────────────────────────────────────────

export const checkboxField = StateField.define<DecorationSet>({
	create(state) {
		return buildDecorations(state.doc.toString());
	},
	update(decos, tr) {
		if (!tr.docChanged) return decos;
		return buildDecorations(tr.newDoc.toString());
	},
	provide: (f) => EditorView.decorations.from(f),
});

// ── Theme ─────────────────────────────────────────────────────────────────────

export const checkboxTheme = EditorView.baseTheme({
	'.cm-checkbox-wrap': {
		display: 'inline-flex',
		alignItems: 'center',
		verticalAlign: 'middle',
	},
	'.cm-checkbox': {
		width: '14px',
		height: '14px',
		accentColor: 'var(--color-brand)',
		cursor: 'pointer',
		margin: '0 2px',
	},
});
