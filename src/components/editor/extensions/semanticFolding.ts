import { foldGutter, foldKeymap } from '@codemirror/language';
import { keymap } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { $t as t } from '$lib/i18n';
import { FEATURE_CONFIG } from '$lib/config';

// FOLD_PERSIST is false in V1 — fold state is session-only.
// V2 sets FEATURE_CONFIG.FOLD_PERSIST = true and reads data-line to persist.
void FEATURE_CONFIG.FOLD_PERSIST;

function makeFoldMarker(open: boolean): HTMLElement {
	const span = document.createElement('span');
	span.setAttribute('aria-label', open ? t('feature.fold.open') : t('feature.fold.close'));
	// data-line set for V2 persistence hook — reads line number from DOM
	span.setAttribute('data-line', '');
	span.className = open ? 'cm-fold-marker cm-fold-open' : 'cm-fold-marker cm-fold-closed';

	// Inline SVG chevron — 6×6px, Rule 8: colour via CSS var
	span.innerHTML = `<svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
	  <path d="M1 2L3 4L5 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
	</svg>`;
	return span;
}

export function createSemanticFolding(): Extension[] {
	return [
		foldGutter({
			markerDOM: makeFoldMarker,
		}),
		keymap.of(foldKeymap),
	];
}
