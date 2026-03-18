/**
 * CodeMirror extension that hides the frontmatter block (--- ... ---) from
 * the editor view using Decoration.replace(), so the raw YAML is never visible.
 * FrontmatterMask renders the equivalent UI above the editor.
 */

import { StateField } from '@codemirror/state';
import { EditorView, Decoration, type DecorationSet } from '@codemirror/view';

/** Matches the opening and closing --- of a YAML frontmatter block. */
function frontmatterRange(doc: { toString(): string }): { from: number; to: number } | null {
  const text = doc.toString();
  if (!text.startsWith('---')) return null;

  const closeIdx = text.indexOf('\n---', 3);
  if (closeIdx === -1) return null;

  // Include the trailing newline after the closing ---
  const endOfClose = text.indexOf('\n', closeIdx + 1);
  const to = endOfClose === -1 ? text.length : endOfClose + 1;

  return { from: 0, to };
}

const hideFrontmatterField = StateField.define<DecorationSet>({
  create(state) {
    const range = frontmatterRange(state.doc);
    if (!range) return Decoration.none;
    return Decoration.set([
      Decoration.replace({}).range(range.from, range.to),
    ]);
  },
  update(decos, tr) {
    if (!tr.docChanged) return decos;
    const range = frontmatterRange(tr.newDoc);
    if (!range) return Decoration.none;
    return Decoration.set([
      Decoration.replace({}).range(range.from, range.to),
    ]);
  },
  provide: (f) => EditorView.decorations.from(f),
});

export { hideFrontmatterField };
