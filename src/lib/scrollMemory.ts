// ── Scroll Memory ─────────────────────────────────────────────────────────────
// localStorage-backed scroll position store, isolated to this module.
// V2 can swap the backend to Dexie by changing only this file.

const KEY_PREFIX = 'scroll_';

export function saveScrollPosition(thoughtId: string, pos: number): void {
	try {
		localStorage.setItem(KEY_PREFIX + thoughtId, String(pos));
	} catch {
		// localStorage unavailable (private browsing, quota exceeded) — fail silently
	}
}

export function getScrollPosition(thoughtId: string): number {
	try {
		return parseInt(localStorage.getItem(KEY_PREFIX + thoughtId) ?? '0', 10);
	} catch {
		return 0;
	}
}

export function clearScrollPosition(thoughtId: string): void {
	try {
		localStorage.removeItem(KEY_PREFIX + thoughtId);
	} catch {
		// fail silently
	}
}
