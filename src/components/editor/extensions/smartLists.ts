import { keymap } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { insertNewlineContinueMarkup } from '@codemirror/lang-markdown';
import { indentMore, indentLess } from '@codemirror/commands';

export function createSmartLists(): Extension {
	return keymap.of([
		{ key: 'Enter',       run: insertNewlineContinueMarkup },
		{ key: 'Tab',         run: indentMore },
		{ key: 'Shift-Tab',   run: indentLess },
	]);
}
