# FLOUGHT — PROGRESS

## Phase status

- [x] Phase 0 — Shell & Pipeline (complete 2026-03-18)
- [x] Phase 1 — Data Layer (complete 2026-03-18)
- [x] Phase 2 — Capture UI & Onboarding (complete 2026-03-18)
- [x] Phase 3 — Editor ✓ (complete 2026-03-18)
- [x] Phase 4 — Graph ✓ (complete 2026-03-18)
- [ ] Phase 5 — Auth
- [ ] Phase 6 — Sync Engine
- [ ] Phase 6.5 — Store Submissions

## Current

Phase 5 — Auth. Supabase authentication, login/signup flow, session management.

---

# FLOUGHT — DECISIONS LOG
# Format: [PHASE N] Decision: what. Reason: why. Alternative: what was rejected.

[PHASE 0] Decision: Skip Capacitor init (task 0.3). Reason: no build/ output yet; cap init requires pointing at the web-dir. Alternative: run it now with a placeholder — rejected because it would create a stale capacitor.config.ts pointing at a non-existent directory.

[PHASE 0] Decision: Exclude @supabase/supabase-js from initial install then add it separately. Reason: initial omission was an error (misread CLAUDE.md); corrected immediately. Supabase handles auth only; Google Drive handles sync only — these are separate concerns.

[PHASE 0] Decision: uiStore uses $state at module level. Reason: Svelte 5 runes work at module scope in .ts files; this is the correct pattern for shared reactive state replacing writable() stores.

[PHASE 2] Decision: uiStore renamed from uiStore.ts → uiStore.svelte.ts. Reason: $state rune is only available inside .svelte and .svelte.ts/.svelte.js files; plain .ts files are not processed by the Svelte compiler. All imports updated to use '$lib/stores/uiStore.svelte'.

[PHASE 2] Decision: MobileDock owns the mobile bottom zone; SparkInput's mobile @media fixed-position block removed. Reason: SparkInput is embedded inside MobileDock's bottom sheet — a separate fixed bar would conflict. SparkInput is layout-agnostic; positioning is the parent's responsibility.

[PHASE 3] Decision: searchWorker stored in uiStore.searchWorker instead of passed as prop. Reason: both the (app) layout and thought/[id] page need access; prop drilling across route group layout boundaries is fragile. Singleton in global store is cleaner.

[PHASE 4] Decision: D3 simulation runs to tick completion synchronously in worker, then posts once. Reason: incremental position messages would flood the main thread (rAF × simulation ticks). Posting once after convergence is sufficient for layout; drag uses alpha(0.3) re-runs. Alternative: stream tick positions — rejected as unnecessary for static layout.

[PHASE 4] Decision: addNode handler uses {type:'addNode'} not re-simulate. Reason: full re-simulate repositions all existing nodes which is jarring UX. Incremental addNode preserves existing positions and only resolves the new node. Alternative: full re-simulate — rejected for layout stability.

[PHASE 5] Decision: Use @supabase/ssr package (not legacy @supabase/auth-helpers-sveltekit). Reason: @supabase/ssr is the current recommended approach for SvelteKit; auth-helpers is deprecated. Alternative: auth-helpers — rejected as deprecated.
