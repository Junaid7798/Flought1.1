// src/lib/errorHandler.ts

export type ErrorContext =
	| 'supabase.init'
	| 'sync.push'
	| 'sync.pull'
	| 'SerendipityCollider.subscription'
	| 'FrontmatterMask.parse'
	| 'CommandPalette.query'
	| 'triage.liveQuery'
	| 'db.createThought'
	| 'db.updateThought'
	| 'db.softDeleteThought'
	| 'db.createEdge'
	| 'db.rebuildEdges'
	| 'ThoughtEditor.flushEdges'
	| 'Capture.submit'
	| 'GraphCanvas.draw'
	| 'GraphCanvas.simulate'
	| 'ShortcutManager.init'
	| 'Settings.export'
	| 'Settings.import'
	// extend as needed

export function handleError(error: unknown, context: ErrorContext, showToast: boolean = false): void {
	const message = error instanceof Error ? error.message : String(error);

	if (import.meta.env.DEV) {
		console.error(`[Flought Error] ${context}:`, error);
	}

	// When Sentry or other monitoring is added, hook it here:
	// if (import.meta.env.PROD && typeof window !== 'undefined' && (window as any).Sentry) {
	//   (window as any).Sentry.captureException(error, { tags: { context } });
	// }

	if (showToast) {
		// Import showToast lazily to avoid circular dependencies
		import('$lib/stores/toastStore.svelte').then(({ showToast: toastShow }) => {
			toastShow(message, 'error');
		}).catch(() => {
			// Toast system not available during early init; ignore
		});
	}
}
