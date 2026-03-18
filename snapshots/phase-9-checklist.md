# Phase 9 — Graph Intelligence & Widgets — Sign-off Checklist
Date: 2026-03-19

## Task 9.1 — Semantic Gravity & Focus Pull
- [x] graphWorker.ts: forceX + forceY imported from d3-force
- [x] focusStage message: applyGravity(sim, stageId) — strength 0.3 center pull for matching nodes
- [x] clearFocusStage message: clearGravity(sim) removes forceX/forceY
- [x] Negative push strength -0.1 for unfocused nodes
- [x] alpha(0.4).restart() on both focus and clear
- [x] uiStore.focusedStageId added, wired to Sidebar stage buttons
- [x] GraphCanvas $effect sends focusStage/clearFocusStage to worker on stageId change

## Task 9.2 — Subgroup Clustering (Convex Hulls)
- [x] d3-polygon installed, polygonHull imported in graphWorker.ts
- [x] computeHulls() groups nodes by meta_state, returns Record<number, [number, number][]>
- [x] postPositions() includes hulls in message to main thread
- [x] GraphCanvas: HULL_COLOUR resolved via getComputedStyle(document.body) on mount (FIX-18/FIX-24)
- [x] drawHulls() renders faint (0.06 opacity) coloured blob underneath nodes
- [x] Hull padding of 30px expands outward from centroid

## Task 9.3 — Node Context Menu & Widgets
- [x] NodeContextMenu.svelte created: Open, Change Stage (submenu), Pin/Unpin, Delete
- [x] Stage submenu shows all 4 pipeline stages with coloured dots
- [x] Pin/unpin reads and updates userSettings.pinned_thought_ids
- [x] Delete uses softDeleteThought (Rule 4 compliant)
- [x] GraphCanvas: right-click handler, hit tests node, shows context menu
- [x] PipelineMomentum.svelte created: progress bars per stage
- [x] Bar fill uses transform: scaleX() with transform-origin: left (FIX-19/FIX-25)
- [x] Container width via var(--momentum-bar-width) CSS variable (Rule 8)
- [x] --momentum-bar-width: 180px added to app.css :root
- [x] PipelineMomentum wired into Sidebar after Pipeline section

## Verification gates
- [x] npm run check: 0 errors, 0 warnings
- [x] npm test: 42/42 passing
- [x] Flought reviewer blocks 1-9: all new code PASS (pre-existing hover transitions noted)
