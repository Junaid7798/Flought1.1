// Shared context key for EditorView instance.
// ThoughtEditor sets this; DocumentOutline (and any other child) reads it.
import type { EditorView } from '@codemirror/view';

export const EDITOR_VIEW_KEY = Symbol('editorView');
export type EditorViewGetter = () => EditorView | null;
