# FLOUGHT — PROGRESS

## Phase status

- [x] Phase 0 — Shell & Pipeline (complete 2026-03-18)
- [ ] Phase 1 — Data Layer
- [ ] Phase 2 — Capture UI & Onboarding
- [ ] Phase 3 — Editor
- [ ] Phase 4 — Graph
- [ ] Phase 5 — Auth
- [ ] Phase 6 — Sync Engine
- [ ] Phase 6.5 — Store Submissions

## Current

Phase 1 — Data Layer. Next: Task 1.1 — src/lib/db.ts (full Dexie schema).

---

# FLOUGHT — DECISIONS LOG
# Format: [PHASE N] Decision: what. Reason: why. Alternative: what was rejected.

[PHASE 0] Decision: Skip Capacitor init (task 0.3). Reason: no build/ output yet; cap init requires pointing at the web-dir. Alternative: run it now with a placeholder — rejected because it would create a stale capacitor.config.ts pointing at a non-existent directory.

[PHASE 0] Decision: Exclude @supabase/supabase-js from initial install then add it separately. Reason: initial omission was an error (misread CLAUDE.md); corrected immediately. Supabase handles auth only; Google Drive handles sync only — these are separate concerns.

[PHASE 0] Decision: uiStore uses $state at module level. Reason: Svelte 5 runes work at module scope in .ts files; this is the correct pattern for shared reactive state replacing writable() stores.
