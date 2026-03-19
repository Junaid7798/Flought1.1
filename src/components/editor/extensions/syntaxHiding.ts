import { ViewPlugin, Decoration, type DecorationSet, type ViewUpdate } from '@codemirror/view';
import { type Extension, RangeSetBuilder } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

// Node types whose syntax markers should be hidden when cursor is outside
const HIDE_NODES = new Set([
	'StrongEmphasis', 'Emphasis', 'ATXHeading1', 'ATXHeading2', 'ATXHeading3',
	'CodeMark', 'LinkMark', 'EmphasisMark',
]);

// Heading node → CSS class map for visual hierarchy
const HEADING_CLASSES: Record<string, string> = {
	ATXHeading1: 'cm-h1',
	ATXHeading2: 'cm-h2',
	ATXHeading3: 'cm-h3',
};

const hiddenMark = Decoration.mark({ class: 'cm-syntax-hidden' });

export function createSyntaxHiding(): Extension {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: import('@codemirror/view').EditorView) {
				this.decorations = this.build(view);
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.selectionSet || update.viewportChanged) {
					this.decorations = this.build(update.view);
				}
			}

			build(view: import('@codemirror/view').EditorView): DecorationSet {
				const builder = new RangeSetBuilder<Decoration>();
				const cursor = view.state.selection.main.head;
				const tree = syntaxTree(view.state);

				tree.iterate({
					enter(node) {
						// Apply heading line decoration for visual hierarchy
						if (node.name in HEADING_CLASSES) {
							// heading class applied via mark on whole line
							return;
						}

						// Hide syntax marks when cursor is outside node
						if (HIDE_NODES.has(node.name)) {
							// Check if cursor overlaps with this node
							const cursorInside = cursor >= node.from && cursor <= node.to;
							if (!cursorInside) {
								// Find child mark nodes (EmphasisMark, CodeMark, etc.)
								node.node.cursor().iterate((child) => {
									if (
										child.name === 'EmphasisMark' ||
										child.name === 'CodeMark'    ||
										child.name === 'LinkMark'
									) {
										if (child.from < child.to) {
											builder.add(child.from, child.to, hiddenMark);
										}
									}
								});
							}
						}
					},
				});

				return builder.finish();
			}
		},
		{ decorations: (v) => v.decorations }
	);
}
