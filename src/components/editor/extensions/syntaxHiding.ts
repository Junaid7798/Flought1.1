import { ViewPlugin, Decoration, type DecorationSet, type ViewUpdate, EditorView } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

// The CSS class that hides the characters
const hidden = Decoration.mark({ class: 'cm-syntax-hidden' });

/**
 * CodeMirror 6 plugin that hides markdown syntax markers (**, *, #, [], etc.)
 * unless the cursor is currently inside that specific node.
 */
export const syntaxHiding = ViewPlugin.fromClass(class {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.build(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.selectionSet || update.viewportChanged) {
      this.decorations = this.build(update.view);
    }
  }

  build(view: EditorView) {
    const cursor = view.state.selection.main.head;
    const builder: any[] = [];

    // Use visibleRanges for high performance on large documents
    for (const { from, to } of view.visibleRanges) {
      syntaxTree(view.state).iterate({
        enter: (node) => {
          // Node types used by lezer-markdown for formatting marks
          const isFormattingMark = [
            'EmphasisMark', 
            'StrongEmphasisMark', 
            'CodeMark', 
            'ATXHeadingMark', 
            'LinkMark', 
            'ImageMark',
            'ListMark',
            'TaskMarker',
            'QuoteMark'
          ].includes(node.name);

          if (!isFormattingMark) return;

          // Only hide if the cursor is NOT inside this specific mark's range
          // Expand the check slightly to allow touching the marker
          const cursorTouching = cursor >= node.from && cursor <= node.to;
          if (!cursorTouching) {
            builder.push(hidden.range(node.from, node.to));
          }
        },
        from,
        to
      });
    }

    return Decoration.set(builder, true);
  }
}, {
  decorations: v => v.decorations
});

/**
 * For backwards compatibility with existing imports in ThoughtEditor.svelte
 */
export function createSyntaxHiding() {
  return syntaxHiding;
}
