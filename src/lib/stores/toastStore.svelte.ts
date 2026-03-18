// ── Toast store ────────────────────────────────────────────────────────────────
// Global list of active toasts. Max 3 shown at once to avoid clutter.

export interface Toast {
	id: string;
	message: string;
	type: 'success' | 'error' | 'info';
}

let _counter = 0;

export const toasts = $state<Toast[]>([]);

export function showToast(message: string, type: Toast['type'] = 'success', duration = 2500) {
	const id = `toast-${++_counter}`;
	// Cap at 3 visible toasts
	if (toasts.length >= 3) toasts.splice(0, 1);
	toasts.push({ id, message, type });
	setTimeout(() => dismissToast(id), duration);
}

export function dismissToast(id: string) {
	const idx = toasts.findIndex((t) => t.id === id);
	if (idx !== -1) toasts.splice(idx, 1);
}
