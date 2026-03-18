# Flought — Session Context

## Current state (2026-03-18)

**Phase:** 6 — Sync Engine — COMPLETE
**Next:** Phase 6.5 — Store Submissions (Capacitor + Tauri packaging)
**Build:** 0 errors, 0 warnings, 42/42 tests passing
**Git:** `e654349` tagged `phase-6-verified`

---

## Completed milestones

| Phase | Name | Commit | Tag |
|-------|------|--------|-----|
| 0 | Shell & Pipeline | `0a17435` | — |
| 1 | Data Layer | `98cd0f9` | `phase-1-verified` |
| 2 | Capture UI & Onboarding | `8ad7720` | `phase-2-verified` |
| 3 | Editor | `8d850fb` | `phase-3-verified` |
| 4 | Graph | `7c38dc0` | `phase-4-verified` |
| 5 | Auth | `465e608` | — |
| 6 | Sync Engine | `e654349` | `phase-6-verified` |

Note: Phase 5 has no snapshot or tag — it was committed without R8 execution.

---

## Key architectural decisions (summary)

- `uiStore.svelte.ts` (not `.ts`) — $state rune requires Svelte-processed files
- All db logic in `src/lib/db.ts` only — never import Dexie from components
- D3 simulation in `src/workers/graphWorker.ts` only — never on main thread
- Google Drive access via `session.provider_token` (Google OAuth token, not Supabase JWT)
- Drive files in `appDataFolder` space — hidden from user in Drive UI
- Manifest written last in push — acts as atomic commit marker
- Edges stored in chunk-0 only; thoughts chunked at 500/file
- Sync: pull on app open, push 30s after last write (debounced)
- LWW conflict resolution by `updated_at` — no CRDTs (out of scope per CLAUDE.md)
- Never delete local thoughts during merge

---

## Phase 6.5 — what comes next

**Goal:** Package the web app for Android, iOS, Windows, Mac.

**Tasks:**
1. `npm run build` — confirm static output in `build/`
2. Capacitor init: `npx cap init Flought com.flought.app --web-dir=build`
3. `npx cap add android` + `npx cap add ios`
4. Tauri init for Windows/Mac
5. CI/CD pipeline for each store target

**Open decisions:**
- Capacitor version: check tools.md before running cap init (verify latest stable)
- Tauri version: v1 vs v2 — research before adopting
- Google Play / App Store developer accounts needed before submission

---

## Open blockers

None. Clean build, all tests passing.
