# Session Handover
# Overwrite this file completely at the end of every session.
# The next session starts by reading this file first.

**Last updated:** 2026-03-18
**Session ended cleanly:** yes

---

## Resume from here

Phase: 6 — Sync Engine (wiring)
Next task: Wire GoogleDriveAdapter into syncService. In src/routes/(app)/+layout.svelte, after session check: if userSettings.sync_connected && sync_provider === 'google', instantiate GoogleDriveAdapter and call syncService.setAdapter(adapter), then call syncService.pull() to hydrate local Dexie from Drive. Add a push() call after every db write (or on a 30s interval). Wire syncService.getStatus() into SyncStatusBadge in Sidebar.svelte.
Model to use: Sonnet 4.6

---

## Completed this session (2026-03-18)

Phase 5 — Auth (complete):
- src/lib/supabase.ts — createClient + getSession() helper
- src/routes/login/+page.svelte — Google OAuth, GitHub OAuth, email magic link (OTP), sent/error states
- src/routes/(app)/+layout.svelte — auth guard: getSession() → /login if no session; tagUserProfileWithSupabaseId(); onboarding_complete check → /onboarding; onAuthStateChange for TOKEN_REFRESHED + SIGNED_OUT
- src/routes/+layout.svelte — added /login to bypass list (guard + isOnboarding derived)
- src/lib/db.ts — supabase_user_id: string | null on UserProfile; tagUserProfileWithSupabaseId(); initUserProfile seeds it as null
- src/components/layout/SyncStatusBadge.svelte — 5-state dot (local/synced/syncing/offline/error); pulse animation for syncing; click-when-local opens Google Drive connect modal; connectGoogleDrive() calls signInWithOAuth with drive.appdata scope; updateUserSettings on connect
- src/app.css — --color-error: #EF4444 added
- src/lib/i18n.ts — login.* keys (9 keys), sync.local/syncing/error/connectTitle/connectCta/connectCancel (6 keys)
- src/lib/sync/SyncService.ts — SyncAdapter interface, SyncPayload/SyncResult/SyncStatus types, SyncService class (setAdapter/push/pull/getStatus), singleton export
- src/lib/sync/GoogleDriveAdapter.ts — full Drive appdata implementation; push chunks thoughts 500/file (object-level, never string-sliced); upserts via multipart upload; manifest as commit marker; deleteStaleChunks on push; pull reassembles from manifest+chunks; 401 → token_expired; never throws

---

## Files created or modified this session

- `src/lib/supabase.ts` (new)
- `src/routes/login/+page.svelte` (new)
- `src/routes/(app)/+layout.svelte` (modified — auth guard added to existing search-index layout)
- `src/routes/+layout.svelte` (modified — /login bypass)
- `src/lib/db.ts` (modified — supabase_user_id field + tagUserProfileWithSupabaseId)
- `src/components/layout/SyncStatusBadge.svelte` (new)
- `src/app.css` (modified — --color-error)
- `src/lib/i18n.ts` (modified — login.* and sync.* keys)
- `src/lib/sync/SyncService.ts` (new)
- `src/lib/sync/GoogleDriveAdapter.ts` (new)

---

## All files by phase (cumulative)

### Phase 0
- `_headers`, `.env.example`, `src/lib/config.ts`, `src/lib/i18n.ts`, `src/lib/eventBus.ts`
- `src/lib/stores/uiStore.svelte.ts`, `src/app.css`, `src/routes/+layout.ts`, `src/routes/+layout.svelte`

### Phase 1
- `src/lib/db.ts`, `src/lib/uuid.ts`, `src/tests/db.test.ts`, `config.test.ts`, `i18n.test.ts`

### Phase 2
- `src/components/capture/SparkInput.svelte`, `src/components/layout/Sidebar.svelte`
- `src/components/layout/MobileDock.svelte`
- `src/routes/onboarding/name/+page.svelte`, `category/+page.svelte`, `blueprint/+page.svelte`

### Phase 3
- `src/components/editor/ThoughtEditor.svelte`, `FrontmatterMask.svelte`
- `src/workers/searchWorker.ts`, `src/components/search/CommandPalette.svelte`
- `src/routes/(app)/+layout.svelte`, `src/routes/(app)/thought/[id]/+page.svelte`

### Phase 4
- `src/workers/graphWorker.ts`, `src/components/graph/GraphNode.ts`, `GraphEdge.ts`, `GraphCanvas.svelte`
- `src/routes/(app)/map/+page.svelte`
- `src/lib/db.ts` — getEdgesByLibrary()

### Phase 5
- `src/lib/supabase.ts`, `src/routes/login/+page.svelte`
- `src/components/layout/SyncStatusBadge.svelte`
- `src/lib/sync/SyncService.ts`, `src/lib/sync/GoogleDriveAdapter.ts`

---

## Build status

npm run check: PASSING (0 errors, 0 warnings)
npm run test: 42 tests passing (3 test files)
Last git commit: feat(phase-5): auth — login page, session guard, sync badge (465e608)
Last push: origin/master at 465e608
SyncService.ts and GoogleDriveAdapter.ts are NOT yet committed — staged for next commit.
Live URL: not yet deployed

---

## Architecture critical notes (read before any Phase 6 work)

**Auth guard flow (important for Phase 6):**
1. `src/routes/+layout.svelte` onMount: skips guard for /onboarding and /login; otherwise checks getUserProfile() + onboarding_complete → /onboarding
2. `src/routes/(app)/+layout.svelte` onMount: getSession() → /login; tagUserProfileWithSupabaseId; getUserProfile().onboarding_complete → /onboarding; then sets up onAuthStateChange

**GoogleDriveAdapter internals:**
- Access token from: `supabase.auth.getSession()` → `session.provider_token` (the Google OAuth token, not the Supabase JWT)
- Files live in Drive `appDataFolder` space (invisible to user in Drive UI)
- Manifest (`flought-sync-manifest.json`) is written LAST — acts as commit marker. If push fails mid-way, stale manifest from previous sync remains valid
- Edges are stored ONLY in chunk-0. On pull, edges come from chunk-0 only
- deleteStaleChunks runs after all chunks upload but before manifest — ensures no orphan chunk files if chunk count decreases

**SyncService wiring (not done yet):**
- GoogleDriveAdapter is created but NOT wired to syncService yet
- SyncStatusBadge receives `status` as a prop — caller must derive it from syncService.getStatus()
- The connect flow (SyncStatusBadge → signInWithOAuth + updateUserSettings) sets sync_connected=true in Dexie but does NOT call syncService.setAdapter() — that wiring must happen in (app)/+layout.svelte after session check
- CLAUDE.md rule 7: ALL sync goes through SyncService.ts — never call Drive API directly from components

---

## Open decisions

- Capacitor init skipped — run `npx cap init Flought com.flought.app --web-dir=build` after first `npm run build`
- Phase 6 sync interval: pull on app open; push 30s after last write (debounce). Do NOT push on every keypress.
- Conflict resolution: last-write-wins by `updated_at`. No CRDTs (explicitly out of scope per CLAUDE.md).
- uiStore does NOT yet have a syncStatus field. Add `syncStatus: 'local' as SyncStatus` to uiStore before wiring Sidebar.

---

## Known issues

None. 0 errors, 0 warnings.

---

## Non-obvious context

- `uiStore.svelte.ts` (not `.ts`) — $state rune only works in Svelte-processed files
- Route group `(app)` strips from URL — `src/routes/(app)/map/` serves `/map`
- searchWorker lives in `uiStore.searchWorker` — avoids prop drilling across route group layouts
- GraphCanvas relative import from `(app)/map/` is 3 levels: `'../../../components/graph/GraphCanvas.svelte'`
- D3 simulation runs to completion synchronously in worker; posts positions ONCE
- SyncStatusBadge is a `<button>` (not a `<span>`) — needed for click handler; cursor:default unless status=local

---

## If handover is missing (recovery prompt)

Paste this into new session:
```
There is no session-handover.md. Reconstruct current state from:
1. DEVELOPER_PERSONALITY.md
2. CLAUDE.md
3. docs/progress.md
4. git log --oneline -20

Tell me: current phase, last completed task, next task.
Ask me to confirm before proceeding.
```
