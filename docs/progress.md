# FLOUGHT — PROGRESS

## Phase status

- [x] Phase 0 — Shell & Pipeline (complete 2026-03-18)
- [x] Phase 1 — Data Layer (complete 2026-03-18)
- [x] Phase 2 — Capture UI & Onboarding (complete 2026-03-18)
- [ ] Phase 3 — Editor
- [ ] Phase 4 — Graph
- [ ] Phase 5 — Auth
- [ ] Phase 6 — Sync Engine
- [ ] Phase 6.5 — Store Submissions

## Current

Phase 3 — Editor. Next: Task 3.1 — src/routes/editor/+page.svelte with CodeMirror, wikilink parsing, and properties panel.

---

# FLOUGHT — DECISIONS LOG
# Format: [PHASE N] Decision: what. Reason: why. Alternative: what was rejected.

[PHASE 0] Decision: Skip Capacitor init (task 0.3). Reason: no build/ output yet; cap init requires pointing at the web-dir. Alternative: run it now with a placeholder — rejected because it would create a stale capacitor.config.ts pointing at a non-existent directory.

[PHASE 0] Decision: Exclude @supabase/supabase-js from initial install then add it separately. Reason: initial omission was an error (misread CLAUDE.md); corrected immediately. Supabase handles auth only; Google Drive handles sync only — these are separate concerns.

[PHASE 0] Decision: uiStore uses $state at module level. Reason: Svelte 5 runes work at module scope in .ts files; this is the correct pattern for shared reactive state replacing writable() stores.

[PHASE 2] Decision: uiStore renamed from uiStore.ts → uiStore.svelte.ts. Reason: $state rune is only available inside .svelte and .svelte.ts/.svelte.js files; plain .ts files are not processed by the Svelte compiler. All imports updated to use '$lib/stores/uiStore.svelte'.

[PHASE 2] Decision: MobileDock owns the mobile bottom zone; SparkInput's mobile @media fixed-position block removed. Reason: SparkInput is embedded inside MobileDock's bottom sheet — a separate fixed bar would conflict. SparkInput is layout-agnostic; positioning is the parent's responsibility.
