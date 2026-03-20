// ── ShortcutManager ────────────────────────────────────────────────────────────
// Single global keydown listener. Reads userSettings.keyboard_shortcuts for
// overrides, fires named Actions via registered callbacks.
//
// Usage:
//   initializeShortcuts(settings.keyboard_shortcuts);
//   onAction('newThought', () => { ... });
//   destroyShortcuts();   // call from root onDestroy

import type { UserSettings } from '$lib/db';

// ── Action registry ────────────────────────────────────────────────────────────

export type Action =
	| 'commandPalette'   // Cmd/Ctrl+K
	| 'newThought'       // Cmd/Ctrl+N
	| 'focusSearch'      // Cmd/Ctrl+F
	| 'goMap'            // Cmd/Ctrl+1
	| 'goEditor'         // Cmd/Ctrl+2
	| 'goFocus'          // Cmd/Ctrl+3
	| 'openSettings'     // Cmd/Ctrl+,
	| 'toggleSidebar'    // Cmd/Ctrl+\
	| 'quickCapture';    // Cmd/Ctrl+j

// Default bindings — format: "modifier+key" (all lowercase)
// modifier: "cmd" = Meta on Mac / Ctrl on Win/Linux; "ctrl" = always Ctrl
export const DEFAULT_BINDINGS: Record<Action, string> = {
	commandPalette: 'cmd+k',
	newThought:     'cmd+n',
	focusSearch:    'cmd+f',
	goMap:          'cmd+1',
	goEditor:       'cmd+2',
	goFocus:        'cmd+3',
	openSettings:   'cmd+,',
	toggleSidebar:  'cmd+\\',
	quickCapture:   'cmd+j',
};

// ── Internal state ─────────────────────────────────────────────────────────────

type ActionCallback = () => void;

const _listeners = new Map<Action, Set<ActionCallback>>();
let _bindings: Record<string, Action> = {};   // "resolved combo" → Action
let _attached = false;

// ── Binding resolution ─────────────────────────────────────────────────────────

/** Normalise a binding string to a canonical combo key, e.g. "cmd+k" → "Meta+k" / "Control+k" */
function resolveCombo(binding: string): string {
	const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);
	return binding
		.toLowerCase()
		.replace('cmd', isMac ? 'Meta' : 'Control')
		.replace('ctrl', 'Control');
}

function buildBindings(overrides: Record<string, string>) {
	_bindings = {};
	for (const [action, defaultCombo] of Object.entries(DEFAULT_BINDINGS) as [Action, string][]) {
		const combo = overrides[action] ?? defaultCombo;
		_bindings[resolveCombo(combo)] = action;
	}
}

// ── Event handler ──────────────────────────────────────────────────────────────

function handleKeydown(e: KeyboardEvent) {
	// Build combo string from event: "Meta+k", "Control+Shift+n", etc.
	const parts: string[] = [];
	if (e.metaKey)  parts.push('Meta');
	if (e.ctrlKey)  parts.push('Control');
	if (e.altKey)   parts.push('Alt');
	if (e.shiftKey) parts.push('Shift');
	parts.push(e.key);
	const combo = parts.join('+');

	const action = _bindings[combo];
	if (!action) return;

	// Don't intercept inside contenteditable / input unless explicitly allowed
	const target = e.target as HTMLElement;
	const isEditing =
		target.tagName === 'INPUT' ||
		target.tagName === 'TEXTAREA' ||
		target.isContentEditable;

	// Allow commandPalette + goMap/goEditor/goFocus/openSettings/toggleSidebar/quickCapture anywhere
	const globalActions: Action[] = [
		'commandPalette', 'goMap', 'goEditor', 'goFocus', 
		'openSettings', 'toggleSidebar', 'quickCapture'
	];
	if (isEditing && !globalActions.includes(action)) return;

	e.preventDefault();
	fire(action);
}

function fire(action: Action) {
	const cbs = _listeners.get(action);
	if (!cbs) return;
	for (const cb of cbs) cb();
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Attach the global listener and load bindings.
 * Pass `userSettings.keyboard_shortcuts` or `{}` for defaults only.
 * Safe to call multiple times — will re-initialise bindings without double-attaching.
 */
export function initializeShortcuts(overrides: UserSettings['keyboard_shortcuts'] = {}) {
	buildBindings(overrides);
	if (!_attached) {
		window.addEventListener('keydown', handleKeydown);
		_attached = true;
	}
}

/** Register a callback for an action. Returns an unsubscribe function. */
export function onAction(action: Action, cb: ActionCallback): () => void {
	if (!_listeners.has(action)) _listeners.set(action, new Set());
	_listeners.get(action)!.add(cb);
	return () => _listeners.get(action)?.delete(cb);
}

/** Remove the global listener. Call from root layout onDestroy. */
export function destroyShortcuts() {
	window.removeEventListener('keydown', handleKeydown);
	_attached = false;
}
