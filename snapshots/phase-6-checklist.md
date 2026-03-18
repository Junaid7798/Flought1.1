# Phase 6 Checklist — Verified 2026-03-18

- [x] npm run check — 0 errors, 0 warnings
- [x] npm test — 42/42 tests passing (3 test files)
- [x] SyncService singleton wired in (app)/+layout.svelte
      → initSync() called after auth guard passes
- [x] GoogleDriveAdapter instantiated and attached via syncService.setAdapter()
      → Only when userSettings.sync_connected && sync_provider === 'google'
- [x] Pull on app open hydrates Dexie from Drive
      → syncService.pull() → mergePulledPayload() with LWW rule
- [x] LWW merge: incoming updated_at > local updated_at → overwrite
      → mergePulledPayload compares rt.updated_at > local.updated_at
- [x] LWW merge: local thought does not exist → create
      → db.thoughts.put(rt) when !local
- [x] LWW merge: never deletes local thoughts during merge
      → No delete calls in mergePulledPayload — only put() for newer or missing
- [x] Push after db writes with 30s debounce
      → eventBus listeners on thought.created/updated, edge.created/updated → schedulePush()
- [x] Push sends current library's thoughts + edges to Drive
      → executePush() queries db.thoughts + db.edges by libraryId, calls syncService.push()
- [x] Thoughts chunked at 500 per file object (CLAUDE.md rule 11)
      → chunkThoughts() slices at CHUNK_SIZE=500, never slices raw JSON strings
- [x] Edges stored only in chunk-0
      → chunkThoughts: edges only when chunks.length === 0
- [x] Manifest written last as commit marker
      → push(): uploads all chunks first, deleteStaleChunks, then manifest last
- [x] uiStore.syncStatus updated at every sync step
      → 'syncing' before pull/push, syncService.getStatus() after
- [x] uiStore.lastSyncedAt updated on successful sync
      → new Date().toISOString() after pull merge and after successful push
- [x] SyncStatusBadge reads from uiStore reactively
      → Sidebar passes uiStore.syncStatus and uiStore.lastSyncedAt as props
- [x] SyncStatusBadge shows correct label for all 5 states
      → local/synced/syncing/offline/error with correct dot colour and label text
- [x] Connecting Drive stores auth token via Supabase OAuth
      → connectGoogleDrive() calls signInWithOAuth with drive.appdata scope
- [x] Token expiry shows reconnect prompt, not a crash
      → GoogleDriveAdapter returns {success:false, error:'token_expired'} on 401
      → status becomes 'error' → badge clickable → opens "Reconnect Google Drive" modal
- [x] All sync goes through SyncService.ts (CLAUDE.md rule 7)
      → No direct Google Drive API calls from components or routes
- [x] No Dexie import outside db.ts
      → (app)/+layout.svelte imports db from '$lib/db', not Dexie directly
- [x] No hardcoded hex colours
      → All colours via CSS vars
- [x] All strings via $t() from i18n.ts
      → sync.reconnectTitle, sync.reconnectCta added for reconnect flow

## Files modified in Phase 6

- src/routes/(app)/+layout.svelte — sync wiring: initSync, mergePulledPayload, schedulePush, executePush
- src/lib/stores/uiStore.svelte.ts — added syncStatus + lastSyncedAt fields
- src/components/layout/Sidebar.svelte — passes uiStore.syncStatus/lastSyncedAt to SyncStatusBadge
- src/components/layout/SyncStatusBadge.svelte — reconnect prompt on error state (isReconnect flag)
- src/lib/i18n.ts — added sync.reconnectTitle + sync.reconnectCta keys

## Files created in Phase 6 (previous commit 8221def)

- src/lib/sync/SyncService.ts — SyncAdapter interface, SyncService class, singleton
- src/lib/sync/GoogleDriveAdapter.ts — full Drive appdata push/pull with chunking
