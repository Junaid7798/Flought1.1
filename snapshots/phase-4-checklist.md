# Phase 4 Checklist — Verified 2026-03-18

- [x] npm run check — 0 errors, 0 warnings
- [x] /map shows a graph of thoughts with coloured nodes
      → GraphCanvas renders nodes via drawNode() with PIPELINE_STATES[meta_state] colours
- [x] Clicking a node navigates to the editor
      → handlePointerUp sets uiStore.focusedNodeId and calls goto('/thought/${id}')
- [x] Focus mode fades unconnected nodes (check with an active thought)
      → 300ms rAF lerp between nodeFocusOpacity(1.0) and nodeUnfocusedOpacity(0.12)
- [x] Dragging a node persists position in Dexie (check DevTools IndexedDB)
      → updateThought(id, { x_pos, y_pos }) in handlePointerUp only
- [x] Drag saves only on dragEnd — not on dragMove
      → handlePointerMove only posts { type: 'drag' } to worker; no Dexie writes
- [x] Library switch reloads the graph cleanly
      → getThoughtsByLibrary/getEdgesByLibrary liveQuery subscriptions react to libraryId prop
- [x] New thought added via addNode — not full re-simulate
      → eventBus.on('thought.created') → { type: 'addNode' } (not 'simulate')
- [x] D3 simulation only in graphWorker.ts — not main thread
      → All d3-force imports exclusively in src/workers/graphWorker.ts
- [x] No Dexie import outside db.ts
      → grep clean across routes/, components/, workers/, stores/
- [x] No hardcoded hex colours
      → grep clean — all colours via CSS vars or PIPELINE_STATES config

## Files added in Phase 4

- src/workers/graphWorker.ts — D3 forceSimulation, simulate/drag/dragEnd/addNode
- src/components/graph/GraphNode.ts — drawNode() pure Canvas 2D function
- src/components/graph/GraphEdge.ts — drawEdge() pure Canvas 2D function
- src/components/graph/GraphCanvas.svelte — full graph renderer, camera, focus mode

## Files modified in Phase 4

- src/routes/(app)/map/+page.svelte — replaced placeholder with GraphCanvas + floating toolbar
- src/lib/db.ts — added getEdgesByLibrary() liveQuery
- src/lib/i18n.ts — added map.showAll, map.stats keys
- package.json / package-lock.json — d3-force + @types/d3-force
