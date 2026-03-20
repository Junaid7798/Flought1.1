import { Decoration, ViewPlugin, EditorView, ViewUpdate, type DecorationSet } from "@codemirror/view";
import { Range } from "@codemirror/state";

/**
 * CodeMirror extension to render {color:#hex}text{/color} tags.
 * It applies the color to the content and hides the tags unless the cursor is inside.
 */
export const colorExtension = ViewPlugin.fromClass(class {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.getDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged || update.selectionSet) {
      this.decorations = this.getDecorations(update.view);
    }
  }

  getDecorations(view: EditorView) {
    const widgets: Range<Decoration>[] = [];
    const text = view.state.doc.toString();
    const cursor = view.state.selection.main.head;
    const regex = /\{color:(#[0-9a-f]{6}|var\(--[a-z-]+\))\}(.*?)\{\/color\}/g;
    
    // We only process visible ranges for performance
    for (let {from, to} of view.visibleRanges) {
      // Small buffer to catch partial matches at edges
      const startPos = Math.max(0, from - 100);
      const endPos = Math.min(text.length, to + 100);
      const slice = text.slice(startPos, endPos);
      
      let match;
      regex.lastIndex = 0;
      
      while ((match = regex.exec(slice)) !== null) {
        const matchStart = startPos + match.index;
        const color = match[1];
        const content = match[2];
        const fullLen = match[0].length;
        const tag1Len = `{color:${color}}`.length;
        const tag2Len = `{/color}`.length;

        // 1. Mark the content with the actual color
        widgets.push(Decoration.mark({
          attributes: { style: `color: ${color}; font-weight: 500;` },
          class: "cm-colored-text"
        }).range(matchStart + tag1Len, matchStart + tag1Len + content.length));

        // 2. Add masking decoration for tags
        // Only hide if the cursor is NOT inside the tag range
        const cursorInTag1 = cursor >= matchStart && cursor <= matchStart + tag1Len;
        const cursorInTag2 = cursor >= matchStart + tag1Len + content.length && cursor <= matchStart + fullLen;

        const tagDecoration = Decoration.mark({
          attributes: { style: 'opacity: 0.3; font-size: 0.85em; font-family: var(--font-mono); transition: all 0.2s;' },
          class: "cm-color-tag" + (cursorInTag1 ? "" : " cm-syntax-hidden")
        });
        
        const tag2Decoration = Decoration.mark({
          attributes: { style: 'opacity: 0.3; font-size: 0.85em; font-family: var(--font-mono); transition: all 0.2s;' },
          class: "cm-color-tag" + (cursorInTag2 ? "" : " cm-syntax-hidden")
        });

        widgets.push(tagDecoration.range(matchStart, matchStart + tag1Len));
        widgets.push(tag2Decoration.range(matchStart + tag1Len + content.length, matchStart + fullLen));
      }
    }

    return Decoration.set(widgets, true);
  }
}, {
  decorations: v => v.decorations
});
