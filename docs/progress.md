# FLOUGHT — PROGRESS

## Phase status

- [x] Phase 0 — Shell & Pipeline (complete 2026-03-18)
- [x] Phase 1 — Data Layer (complete 2026-03-18)
- [x] Phase 2 — Capture UI & Onboarding (complete 2026-03-18)
- [x] Phase 3 — Editor ✓ (complete 2026-03-18)
- [x] Phase 4 — Graph ✓ (complete 2026-03-18)
- [x] Phase 5 — Auth ✓ (complete 2026-03-18)
- [x] Phase 6 — Sync Engine ✓ (complete 2026-03-18)
- [x] Phase 7 — AAA UI & The Adaptive Shell ✓ (complete 2026-03-19)
- [ ] Phase 6.5 — Store Submissions

## Current

Phase 6.5 — Store Submissions. Capacitor (Android/iOS) and Tauri (Windows/Mac) packaging.

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


[PHASE 7] Decision: Route transitions use in: only (no out:). 
Reason: {#key} destroys the outgoing element immediately — 
an out: transition would conflict by trying to keep it mounted. 
display: contents on .route-view preserves grid stacking during 
in-transition only. Result: clean fade-in-from-below, no overlap flash.

[PHASE 7] Decision: color-mix() used in thermalPillWidget.ts for
pill background tinting. Known risk: fails silently on older Android
WebViews. Fallback: base colour still renders. Must be addressed
before Phase 10 (Capacitor build) — add a @supports (color-mix())
guard or replace with opacity-based fallback at that point.

[PHASE 7] Decision: Dexie version(2) bumped for font_size/sidebar_width/pinned_thought_ids fields.
Reason: non-indexed fields don't technically require a version bump, but the .upgrade() migration
is needed to backfill defaults into existing userSettings records for users upgrading from v1.
Alternative: no bump, rely on optional chaining with fallbacks in UI — rejected because it
scatters default logic across multiple components.

[PHASE 7] Decision: ToastManager mounted at root layout level outside the {#key} route transition.
Reason: toasts must survive route changes (e.g. a capture toast should stay visible while
navigating). Mounting inside the keyed route-view would destroy the toast on navigation.
Alternative: portal into body via action — rejected as over-engineering for V1.

[PHASE 7] Decision: Toast store uses $state<Toast[]> array at module level (toastStore.svelte.ts).
Reason: matches uiStore pattern; avoids a separate Svelte store mechanism. Array mutations
(push/splice) are reactive because $state uses Proxy. Alternative: writable() array — rejected
per Rule 1 (Svelte 5 Runes only).