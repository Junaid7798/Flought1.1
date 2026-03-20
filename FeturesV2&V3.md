# FLOUGHT — FEATURE BUILD PLAN V2 + V3
# V2 governs 1,000 → 10,000 users. V3 governs 10,000 → 100,000 users.
# Hand one task at a time to Claude Code. Never combine tasks. Never skip rituals.
# V1 features live in featurev1.md. Do not use both files simultaneously.

---

## WHY THIS FILE EXISTS

V1 established structural integrity. V2 adds depth for power users — the
features that make them tell others about the app. V3 adds platform-level
capability and advanced intelligence for a scaled user base.

No V2 task should be started until feature-v1-complete git tag exists.
No V3 task should be started until feature-v2-complete git tag exists.

Every feature here assumes the forward-compatibility hooks laid down in V1
Group A are already in place: aliases field, last_viewed_at, traversal_count,
is_triaged, word_count, FEATURE_CONFIG, janitor worker message union.

---

## ARCHITECTURAL RULES (identical to featurev1.md — never skip)

| Rule | Requirement |
|------|------------|
| IDs | Always `generateId()` from `$lib/uuid.ts` |
| meta_state | Always integer 1–4, never a string |
| Workers | NO Dexie imports. Receive via postMessage, return via postMessage |
| Components | No Dexie imports. Call db.ts functions only |
| Colours | CSS variables only. hexToRgb() for rgba. No hardcoded hex |
| Animations | transform and opacity only |
| Strings | All user-visible strings via `$t()` from i18n.ts |
| Config | All tuneable values in FEATURE_CONFIG in config.ts |
| DB writes | Every write calls eventBus.emit() |
| Telemetry | Capped at 50 entries on every write |

---

## SELF-REVIEW GATE
# Runs automatically after every task. Never skip. Never ask permission.

FLOUGHT SELF-REVIEW — FEATURE [V2/V3] GROUP [N]

Step 1 — Architecture check. Verify each rule from CLAUDE.md:
[ ] Rule 1: SvelteKit 5 Runes only — no $:, export let, writable()
[ ] Rule 2: No .svelte file imports Dexie directly
[ ] Rule 3: Every primary key is generateId() from uuid.ts
[ ] Rule 4: No hard deletes — is_deleted: true only
[ ] Rule 5: D3 simulation only in graphWorker.ts
[ ] Rule 6: Graph via Canvas 2D only
[ ] Rule 7: All sync via SyncService only
[ ] Rule 8: No hardcoded hex values — CSS variables only
[ ] Rule 9: Animations use transform and opacity ONLY
[ ] Rule 10: Telemetry capped at 50 on every write
[ ] Rule 11: Sync chunks at 500 thoughts per file object
[ ] Rule 12: rebuildEdgesForThought on blur/unmount only

Step 2 — Forward compatibility check:
[ ] All tuneable values in FEATURE_CONFIG in config.ts — none hardcoded
[ ] All user-visible strings in DEFAULT_STRINGS in i18n.ts via $t()
[ ] New db.ts functions follow existing signature and emit patterns
[ ] New workers accept typed message union, no Dexie imports
[ ] V3 hooks laid down where applicable — only config keys and type stubs

Step 3 — Test gate:
Run: npm run check → zero errors, zero warnings
Run: npm run test → zero failures

Step 4 — Rate this task /10
Score: correctness, completeness, rule compliance, forward compatibility.

IF score >= 9: proceed to handover and commit.
IF score < 9 (ITERATION 1): list every issue, fix all, re-run Steps 1–3, re-score.
IF new score >= 9: proceed to handover.
IF new score still < 9 (ITERATION 2 — FINAL):
  STOP. Report: "Task self-review score: [X]/10 after 2 iterations.
  Issues not resolved: [list]. Awaiting instruction."

---

## SESSION START RITUAL (every session, no exceptions)

Read these files before writing any code:
1. DEVELOPER_PERSONALITY.md
2. CLAUDE.md
3. docs/session-handover.md
4. docs/featurev2v3.md (this file)

Confirm: current version, current group, current task, any open blockers.
Do not write any code until confirmed.

## SESSION END RITUAL (every session, no exceptions)

Run self-review gate above.
Write docs/session-handover.md.
Append decisions to DECISIONS LOG in docs/progress.md.
Run: npm run build → must succeed before tagging.
Run: git add -A
Show the diff.
Commit: type(feature-v2-GN): description
If group complete:
  git tag feature-v2-GN-verified
  Write snapshots/feature-v2-GN-checklist.md
  Write snapshots/feature-v2-GN-tests.log

---

# ═══════════════════════════════════════════════════════════
# VERSION 2 — 1,000 → 10,000 USERS
# Goal: Depth for power users. One reason to tell others.
# ═══════════════════════════════════════════════════════════

## V2 EXECUTION ORDER

| Order | Group | Reason |
|-------|-------|--------|
| 1 | V2-A: Graph Navigation | Users with large vaults hit this ceiling first |
| 2 | V2-B: Editor Depth | Writing velocity is the daily retention driver |
| 3 | V2-C: Capture & Workflow | Reduces friction for power capture patterns |
| 4 | V2-D: Graph Interactions | Structural manipulation for heavy graph users |

---

## ═══════════════════════════════════════════
## GROUP V2-A — GRAPH NAVIGATION
## 11 features. Address graph readability at scale.
## Estimated time: 3–4 weeks | Model: Opus 4.6
## ═══════════════════════════════════════════

**V2-A.1 — Semantic Zoom (Level-of-Detail Rendering)**
```
Read CLAUDE.md. Read graphWorker.ts. Read GraphCanvas.svelte. Read GraphNode.ts.

In the Canvas 2D render loop, switch rendering mode based on transform.k (zoom scale):

  If transform.k < FEATURE_CONFIG.ZOOM_MACRO_THRESHOLD (default 0.5):
    MACRO VIEW: draw 4px colour dot only. Colour = getCategoryColour(node.topic)
    resolved via getComputedStyle — no hardcoded hex.
    Labels suppressed entirely.

  If transform.k >= MACRO_THRESHOLD and < FEATURE_CONFIG.ZOOM_MICRO_THRESHOLD (default 1.5):
    STANDARD VIEW: existing behaviour — circle + title label.

  If transform.k >= MICRO_THRESHOLD:
    MICRO VIEW: circle + title + 2-line content excerpt (first 80 chars of content).
    Excerpt colour: var(--text-muted), font-size 9px.

Add to FEATURE_CONFIG:
  ZOOM_MACRO_THRESHOLD: 0.5
  ZOOM_MICRO_THRESHOLD: 1.5
  ZOOM_EXCERPT_LENGTH: 80

Add to i18n.ts:
  (no user-visible strings — purely visual)

V3 hook: auto-assign macro emoji via LLM — add optional emoji: string field
  to thoughts schema now via Dexie version(4). Default null. Worker reads it
  if present, falls back to colour dot if null.

Execute self-review gate.
```

**V2-A.2 — Context Horizon / Depth-of-Field Slider**
```
Read CLAUDE.md. Read map/+page.svelte. Read GraphCanvas.svelte.

Add a depth slider to the Map toolbar: options [1] [2] [3] [All].
Default: FEATURE_CONFIG.NEIGHBOURHOOD_DEPTH (already exists from Phase 4).

On slider change: update uiStore.contextHorizonDepth.
GraphCanvas.svelte already has neighbourhood filter logic — wire slider to it.

Depth filter algorithm (BFS — already partially implemented in Phase 4):
  function getNeighborhood(startId, maxDepth):
    visited = Set([startId])
    queue = [{ id: startId, depth: 0 }]
    while queue not empty:
      current = queue.shift()
      if current.depth < maxDepth:
        findNeighbors(current.id).forEach(n => {
          if !visited.has(n): visited.add(n), queue.push({id:n, depth:current.depth+1})
        })
    return visited

Only active when a node is focused. When no node focused, slider is disabled.

Add to FEATURE_CONFIG:
  CONTEXT_HORIZON_MAX: 3

Add to i18n.ts:
  'graph.depth': 'Focus Depth'
  'graph.depthAll': 'All'

Execute self-review gate.
```

**V2-A.3 — Fractal Sub-Graphs**
```
Read CLAUDE.md. Read map/+page.svelte. Read graphWorker.ts.

Create a new SvelteKit route: src/routes/(app)/graph/[id]/+page.svelte.

On load: query db.thoughts.filter(t => t.content.includes(thoughtId) || t.id === thoughtId).
Pass this subset to GraphCanvas — same component, fraction of data.

Add to NodeContextMenu.svelte:
  Menu item: $t('graph.isolate') → navigate to /graph/[node.id]
  Place after "Open", before "Copy Wikilink".

Add breadcrumb above GraphCanvas in sub-graph view:
  "← All thoughts" link navigating back to /map.
  Title: node.title in var(--text-secondary).

Add to i18n.ts:
  'graph.isolate': 'Isolate graph'
  'graph.subgraph.back': '← All thoughts'

V3 hook: infinite nesting — sub-graph page already uses /graph/[id] pattern.
  V3 simply allows navigating to /graph/[id] from within a sub-graph.

Execute self-review gate.
```

**V2-A.4 — Echo Chamber Detector**
```
Read CLAUDE.md. Read graphWorker.ts. Read GraphCanvas.svelte.
Read src/components/graph/GraphEdge.ts.

In graphWorker.ts, add detection after simulation completes:

Algorithm:
  1. Build adjacency list from edges array.
  2. Find connected components using Union-Find or BFS.
  3. For each component with nodeCount >= FEATURE_CONFIG.ECHO_MIN_CLUSTER_SIZE:
     Count outbound edges to nodes OUTSIDE the component.
     If outboundEdges === 0: flag as echo chamber.
  4. For each echo chamber: extract node coordinates, compute polygonHull
     (d3-polygon already installed from Phase 9).
  5. Post hull data to main thread with echoHulls array.

In GraphCanvas.svelte:
  Draw echo hulls BEFORE nodes (underneath layer).
  Colour: resolved rgba of var(--color-error) at 0.08 opacity.
  Stroke: rgba of var(--color-error) at 0.3 opacity, 1px dashed.
  Only draw when uiStore.echoDetectorActive === true (toggle button on map).

Add to FEATURE_CONFIG:
  ECHO_MIN_CLUSTER_SIZE: 5

Add to i18n.ts:
  'graph.echoDetector': 'Echo Detector'

Execute self-review gate.
```

**V2-A.5 — Semantic Triangulation (Bridge Finder)**
```
Read CLAUDE.md. Read GraphCanvas.svelte. Read graphWorker.ts.

Interaction: Shift+click on a second node while one is already focused.

In GraphCanvas.svelte:
  Track shiftSelectedNode in uiStore.
  On Shift+click of second node: post { type: 'triangulate', nodeAId, nodeBId } to worker.

In graphWorker.ts:
  Handler for 'triangulate':
    neighborsA = Set of all direct neighbors of nodeAId.
    neighborsB = Set of all direct neighbors of nodeBId.
    sharedNodes = intersection of neighborsA and neighborsB.
    Post { type: 'triangulateResult', sharedNodeIds: [...sharedNodes] }

In GraphCanvas.svelte on triangulateResult:
  Dim all nodes to GRAPH_CONFIG.nodeUnfocusedOpacity.
  Highlight nodeA, nodeB, and all sharedNodes at full opacity.
  Draw edges connecting sharedNodes to both nodeA and nodeB in var(--color-brand).
  Clear on Escape or clicking empty canvas.

Add to i18n.ts:
  'graph.triangulate.hint': 'Shift+click a second node to find bridges'

Execute self-review gate.
```

**V2-A.6 — Canvas Minimap (Radar)**
```
Read CLAUDE.md. Read map/+page.svelte. Read GraphCanvas.svelte.

Add a secondary 120×120px <canvas> element positioned absolute, bottom-right
of the map page container. z-index below the toolbar.

Minimap renders every 500ms (NOT every frame — prevents double render cost):
  Scale all node x/y coordinates to fit within 120px bounds.
  Draw 2px dots per node coloured by meta_state (same PIPELINE_STATES from config.ts).
  Draw a white rectangle representing the current viewport
    (inverse of current D3 zoom transform mapped to minimap scale).

V3 hook: clicking the minimap teleports main camera to that position.
  Add data-minimap-clickable attribute now. V3 attaches the click handler.

Add to FEATURE_CONFIG:
  MINIMAP_SIZE: 120
  MINIMAP_REFRESH_MS: 500

Execute self-review gate.
```

**V2-A.7 — Orphan Radar**
```
Read CLAUDE.md. Read GraphCanvas.svelte. Read graphWorker.ts.

In graphWorker.ts: after simulation, tag each node with linkCount:
  node.linkCount = edges.filter(e => e.source === node.id || e.target === node.id).length

In GraphCanvas.svelte render loop:
  If uiStore.orphanRadarActive && node.linkCount === 0:
    Apply pulsing glow using ctx.shadowBlur:
      ctx.shadowColor = resolved var(--color-brand) via getComputedStyle.
      ctx.shadowBlur = 12 + Math.sin(Date.now() / 300) * 5
    Reset ctx.shadowBlur = 0 after drawing orphan nodes.

Add toggle button to Map toolbar: $t('graph.orphanRadar').
Stores state in uiStore.orphanRadarActive: boolean.

Add to i18n.ts:
  'graph.orphanRadar': 'Orphan Radar'

Execute self-review gate.
```

**V2-A.8 — Gravitational Mass (Node Size = Word Count)**
```
Read CLAUDE.md. Read graphWorker.ts. Read GraphNode.ts. Read GraphCanvas.svelte.

word_count field already exists on thoughts from V1 Group A schema.

In graphWorker.ts:
  Compute node radius from word_count:
    node.radius = Math.min(
      FEATURE_CONFIG.GRAPH_NODE_MAX_RADIUS,
      FEATURE_CONFIG.GRAPH_NODE_BASE_RADIUS + (node.word_count / 100)
    )
  Apply variable radius to forceCollide and forceManyBody:
    forceCollide().radius(d => d.radius + 2)
    forceManyBody().strength(d => -d.radius * FEATURE_CONFIG.GRAPH_MASS_CHARGE_FACTOR)

In GraphNode.ts and GraphCanvas.svelte:
  Replace hardcoded NODE_RADIUS constant reads with node.radius from simulation data.

Add to FEATURE_CONFIG:
  GRAPH_NODE_BASE_RADIUS: 5
  GRAPH_NODE_MAX_RADIUS: 25
  GRAPH_MASS_CHARGE_FACTOR: 5

Execute self-review gate.
```

**V2-A.9 — Semantic Decay (Knowledge Rot)**
```
Read CLAUDE.md. Read graphWorker.ts. Read GraphCanvas.svelte.

In graphWorker.ts render tick:
  const SIX_MONTHS = FEATURE_CONFIG.DECAY_THRESHOLD_MS (default 180 * 86400000)
  const age = Date.now() - node.updated_at

  If age > SIX_MONTHS:
    decayFactor = Math.min(1, (age - SIX_MONTHS) / SIX_MONTHS)
    node.decayOpacity = 1.0 - (decayFactor * 0.7)
    node.decaySaturation = 100 - (decayFactor * 100)
  Else:
    node.decayOpacity = 1.0
    node.decaySaturation = 100

In GraphCanvas.svelte draw call:
  Resolve node colour from PIPELINE_STATES[meta_state].
  Parse hex to HSL. Apply decaySaturation and decayOpacity.
  Never hardcode HSL values — derive from resolved CSS variable.

Add to FEATURE_CONFIG:
  DECAY_THRESHOLD_MS: 15552000000  (180 days)
  DECAY_MIN_OPACITY: 0.3

V3 hook: Resurrect button temporarily reverses decay gravity.
  Add node.isResurrected: boolean = false now. V3 sets it to true and applies
  positive D3 radial force toward canvas center for 30 seconds.

Execute self-review gate.
```

**V2-A.10 — Bento Box Canvas Layout**
```
Read CLAUDE.md. Read graphWorker.ts. Read GraphCanvas.svelte. Read CanvasContextMenu.svelte.

Add "Snap to Bento" item to CanvasContextMenu.svelte (Group E.2 from V1).

On "Snap to Bento":
  simulation.stop()
  Divide canvas into N columns by PIPELINE_STATES count (4 columns for 4 stages).
  Each column width = canvasWidth / 4.
  For each stage, gather its nodes. Assign x/y in a grid within that column:
    fx = (stageIndex * colWidth) + (nodeIndexInStage % gridCols) * cellSize
    fy = Math.floor(nodeIndexInStage / gridCols) * cellSize
  Apply D3 transition over 500ms to animate nodes to bento positions.
  After transition: set node.fx/fy permanently until user drags or resets.
  "Reset to physics" item in CanvasContextMenu: clear all fx/fy, alpha(1).restart().

Add to FEATURE_CONFIG:
  BENTO_TRANSITION_MS: 500

Add to i18n.ts:
  'graph.snapBento': 'Snap to Bento'
  'graph.resetPhysics': 'Reset physics'

Execute self-review gate.
```

**V2-A.11 — Kanban Lens (Pipeline View)**
```
Read CLAUDE.md. Read map/+page.svelte. Read src/lib/db.ts.

Create src/routes/(app)/kanban/+page.svelte using Svelte 5 Runes.

Data: liveQuery from db.ts returning thoughts grouped by meta_state.
  Group by: inbox (1), queue (2), forge (3), archive (4).
  Each group sorted by updated_at descending.

Layout: CSS Grid with 4 columns, one per stage.
  Column header: pipeline stage label from $t('stage.N') — respects renaming from V1 F.2.
  Column colour accent: PIPELINE_STATES[i].cssVar — no hardcoded colours.
  Each thought card: title, topic tag (if present), relative updated_at timestamp.
  Drag-and-drop between columns: on drop, call updateThought(id, { meta_state: newStage }).

Add navigation tab to topbar or sidebar alongside Map and Editor.
Add to i18n.ts:
  'nav.kanban': 'Kanban'
  'kanban.empty': 'No thoughts in this stage'

V3 hook: custom columns by #topic instead of meta_state.
  Column definition stored in Dexie kanban_views table. Schema slot added now,
  table empty in V2.

Execute self-review gate.
```

**Group V2-A done when:**
- [ ] Semantic Zoom switches rendering modes at correct zoom thresholds
- [ ] Context Horizon slider filters graph by connection depth correctly
- [ ] Fractal Sub-Graphs open correct subset at /graph/[id]
- [ ] Echo Chamber Detector draws red hulls around isolated clusters
- [ ] Triangulation highlights shared bridge nodes between two selected nodes
- [ ] Minimap renders in corner, updates every 500ms, viewport rectangle visible
- [ ] Orphan Radar pulses zero-edge nodes in cyan
- [ ] Node sizes reflect word count, physics responds proportionally
- [ ] Old nodes desaturate and fade based on updated_at age
- [ ] Bento Box snaps nodes into stage columns with 500ms animation
- [ ] Kanban view renders 4 columns, drag-and-drop changes meta_state
- [ ] No hardcoded hex, no hardcoded strings, no hardcoded numbers
- [ ] npm run check passes zero errors
- [ ] npm run test passes all tests
- [ ] SESSION END RITUAL executed — session-handover.md written
- [ ] git tag feature-v2-GA-verified created and pushed

---

## ═══════════════════════════════════════════
## GROUP V2-B — EDITOR DEPTH
## 15 features. Writing velocity and reading comprehension.
## Estimated time: 4–5 weeks | Model: Sonnet 4.6
## ═══════════════════════════════════════════

**V2-B.1 — Context Peeker (Hover Previews)**
```
Read CLAUDE.md. Read ThoughtEditor.svelte. Read src/lib/db.ts.

Create src/components/editor/extensions/contextPeeker.ts.
Export createContextPeeker(): Extension.

Uses CM6 hoverTooltip from @codemirror/view.
  On hover over [[Link]] syntax (300ms debounce):
    Extract title from wikilink regex.
    Query db.thoughts.where('title').equals(title).first() — single row, fast.
    Build tooltip DOM element:
      Stage pill: PIPELINE_STATES colour for meta_state — resolved via getComputedStyle.
      Content preview: thought.content.substring(0, FEATURE_CONFIG.PEEKER_PREVIEW_LENGTH).
      Link: $t('feature.peeker.open') → navigate to /thought/id on click.
    Return tooltip above cursor.

Mobile: disable hoverTooltip on Capacitor.isNativePlatform().
  On mobile, long-press on wikilink shows peeker via CM6 tooltip at tap coordinates.

Styling:
  background: var(--bg-panel), border: 1px solid var(--border-strong)
  backdrop-filter gated behind @media (min-width: 768px)
  max-width: 280px, padding: 0.75rem
  Appear: opacity 0→1, 150ms — Rule 9

Add to FEATURE_CONFIG:
  PEEKER_PREVIEW_LENGTH: 120
  PEEKER_DEBOUNCE_MS: 300

Add to i18n.ts:
  'feature.peeker.open': 'Open →'

Wire into ThoughtEditor.svelte extensions array.
Execute self-review gate.
```

**V2-B.2 — Ghost Mentions (Unlinked Reference Detector)**
```
Read CLAUDE.md. Read ThoughtEditor.svelte. Read src/lib/db.ts.

Create src/components/editor/extensions/ghostMentions.ts.
Export createGhostMentions(titles: string[]): Extension.

titles array passed from ThoughtEditor on mount — same source as vaultAutocomplete.
Zero Dexie reads per keystroke.

On CM6 document update (1 second debounce):
  Scan visible document text for words matching titles array.
  Exclude words already inside [[ ]] brackets.
  For each unlinked match: apply Decoration.mark({ class: 'cm-ghost-mention' })

On click of .cm-ghost-mention span:
  Dispatch CM6 transaction wrapping the word in [[ ]].
  Calls rebuildEdgesForThought on blur (Rule 12 — no immediate call).

In app.css:
  .cm-ghost-mention {
    text-decoration: underline;
    text-decoration-style: dashed;
    text-decoration-color: var(--color-brand);
    opacity: 0.7;
    cursor: pointer;
  }

Add to FEATURE_CONFIG:
  GHOST_MENTION_DEBOUNCE_MS: 1000

Wire into ThoughtEditor.svelte after vaultAutocomplete.
Execute self-review gate.
```

**V2-B.3 — Semantic Breadcrumbs (Navigation Trail)**
```
Read CLAUDE.md. Read src/lib/stores/uiStore.svelte.ts.
Read src/routes/(app)/thought/[id]/+page.svelte.

Add to uiStore.svelte.ts:
  navigationTrail: $state<{id: string, title: string}[]>([])
  pushTrail(node: {id: string, title: string}): void
    if trail.at(-1)?.id !== node.id:
      trail.push(node)
      if trail.length > FEATURE_CONFIG.BREADCRUMB_MAX_LENGTH: trail.shift()

In thought/[id]/+page.svelte onMount:
  uiStore.pushTrail({ id: thoughtId, title: thought.title })

Create src/components/editor/Breadcrumbs.svelte using Svelte 5 Runes.
  Reads uiStore.navigationTrail.
  Renders horizontal list: title → title → title (current is last, no link).
  Earlier entries are navigation links to /thought/{id}.
  Hidden if trail.length <= 1.
  Overflow: shows last BREADCRUMB_VISIBLE_COUNT items only, prepend "…" if truncated.

Mount Breadcrumbs above title in thought/[id]/+page.svelte.

Add to FEATURE_CONFIG:
  BREADCRUMB_MAX_LENGTH: 10
  BREADCRUMB_VISIBLE_COUNT: 4

Add to i18n.ts:
  'feature.breadcrumbs.overflow': '…'

Execute self-review gate.
```

**V2-B.4 — Focus Mode / Zen Fade**
```
Read CLAUDE.md. Read ThoughtEditor.svelte.

Create src/components/editor/extensions/focusMode.ts.
Export createFocusMode(isActive: () => boolean): Extension.

A CM6 ViewPlugin that:
  If isActive() returns false: applies no decorations.
  If isActive() returns true:
    For every visible line: apply Decoration.line({ class: 'cm-focus-dim' })
    For the active line: apply Decoration.line({ class: 'cm-focus-active' })

In app.css:
  .cm-editor.focus-mode-active .cm-focus-dim {
    opacity: 0.3;
    transition: opacity var(--animation-focus-fade, 300ms) ease;
  }
  .cm-editor.focus-mode-active .cm-focus-active {
    opacity: 1 !important;
  }

Add toggle button in ThoughtEditor.svelte toolbar area.
Toggle sets uiStore.focusModeActive: boolean.
Pass isActive as reactive accessor to extension.

Add to i18n.ts:
  'editor.focusMode': 'Focus Mode'

Wire into ThoughtEditor.svelte.
Execute self-review gate.
```

**V2-B.5 — Telescopic Search (Inline Filtering)**
```
Read CLAUDE.md. Read ThoughtEditor.svelte.

Create src/components/editor/extensions/telescopicSearch.ts.
Export createTelescopicSearch(query: () => string): Extension.

A CM6 ViewPlugin:
  If query() is empty: no decorations.
  If query() has value:
    Parse document into paragraph blocks (split by blank lines using syntaxTree).
    For each block NOT containing the query string:
      Apply Decoration.replace (hide the block text, show a "…" widget instead).
    For each block CONTAINING the query string:
      Apply Decoration.mark to highlight the matching substring.

Wire to Cmd+F shortcut in ShortcutManager.ts.
On Cmd+F: focus a search input that sets uiStore.telescopicQuery.
On Escape: clear query, all blocks visible again.

Add to i18n.ts:
  'editor.search.placeholder': 'Search in note…'
  'editor.search.clear': 'Clear'

Add to FEATURE_CONFIG:
  TELESCOPIC_MIN_QUERY_LENGTH: 2

Wire into ThoughtEditor.svelte.
Execute self-review gate.
```

**V2-B.6 — Progressive Summarization Cycle**
```
Read CLAUDE.md. Read ThoughtEditor.svelte.

Create src/components/editor/extensions/progressiveSummary.ts.
Export createProgressiveSummary(): Extension.

Adds a CM6 keymap binding for Cmd+H (or Ctrl+H on Windows).
On trigger with a non-empty selection:
  Read selection text.
  Check syntax tree for existing formatting around selection:
    If wrapped in == (highlight): remove == marks.
    If wrapped in ** (bold): replace ** with ==.
    If neither: wrap in **.
  Dispatch CM6 transaction with the transformed text.

In app.css add highlight rendering:
  .cm-highlight-mark {
    background-color: rgba(var(--color-brand-rgb), 0.2);
    border-radius: 2px;
  }
  Add --color-brand-rgb to :root using hexToRgb on mount (same pattern as hull colours).

Add to i18n.ts:
  'editor.progressiveSummary': 'Cycle Highlight'

Wire into ThoughtEditor.svelte.
Execute self-review gate.
```

**V2-B.7 — Typewriter Centering**
```
Read CLAUDE.md. Read ThoughtEditor.svelte.

Create src/components/editor/extensions/typewriterMode.ts.
Export createTypewriterMode(isActive: () => boolean): Extension.

A CM6 updateListener extension:
  On selection change, if isActive():
    Get cursor position coords: view.coordsAtPos(selection.main.head)
    Target Y = window.innerHeight / 2
    Scroll offset = cursor.top - target
    view.scrollDOM.scrollTop += offset (animate via requestAnimationFrame single tick)

Add toggle button in ThoughtEditor.svelte toolbar.
Toggle sets uiStore.typewriterModeActive: boolean.

Add to i18n.ts:
  'editor.typewriterMode': 'Typewriter'

Wire into ThoughtEditor.svelte.
Execute self-review gate.
```

**V2-B.8 — Blind Draft Mode (Hemingway Mode)**
```
Read CLAUDE.md. Read ThoughtEditor.svelte.

Create src/components/editor/extensions/blindDraftMode.ts.
Export createBlindDraftMode(isActive: () => boolean): Extension.

A CM6 ViewPlugin:
  Tracks a fadeQueue: Map<lineNumber, timestamp> of recently typed lines.
  On document change: add changed lines to fadeQueue with Date.now().
  On every view update: for lines in fadeQueue older than FEATURE_CONFIG.BLIND_DRAFT_FADE_DELAY_MS:
    Apply Decoration.line({ class: 'cm-blind-faded' })

In app.css:
  .cm-blind-faded {
    opacity: 0;
    transition: opacity var(--blind-draft-fade-ms, 3000ms) ease;
    pointer-events: none;
    user-select: none;
  }

Add toggle button in ThoughtEditor.svelte toolbar.
Only available when uiStore.focusModeActive is false (incompatible — guard this).

Add to FEATURE_CONFIG:
  BLIND_DRAFT_FADE_DELAY_MS: 3000

Add to i18n.ts:
  'editor.blindDraft': 'Blind Draft'

Wire into ThoughtEditor.svelte.
Execute self-review gate.
```

**V2-B.9 — Shadow Text (Ghost Revisions)**
```
Read CLAUDE.md. Read ThoughtEditor.svelte.

Cmd+R on a selection: instead of deleting, marks the text as "ghost" and places
cursor at end of selection to type the replacement.

Create src/components/editor/extensions/shadowText.ts.
Export createShadowText(): Extension.

Uses a CM6 StateField to track { ghostFrom: number, ghostTo: number } | null.

On Cmd+R:
  Store current selection range in StateField as ghost range.
  Apply Decoration.mark({ class: 'cm-ghost-text' }) to the range.
  Move cursor to end of ghost range.
  Do NOT delete the text yet.

On Escape (while ghost range active):
  Dispatch transaction deleting the ghost range text.
  Clear StateField.

On any document change inserting text after ghost range:
  The ghost text remains visible. User types new version alongside it.
  On Escape: delete ghost text only.

In app.css:
  .cm-ghost-text {
    opacity: 0.25;
    text-decoration: line-through;
    color: var(--text-muted);
  }

Add to i18n.ts:
  'editor.shadowText': 'Rewrite (keep original)'
  'editor.shadowText.confirm': 'Press Esc to delete original'

Wire into ThoughtEditor.svelte.
Execute self-review gate.
```

**V2-B.10 — Sticky Context Headers**
```
Read CLAUDE.md. Read ThoughtEditor.svelte.

Create src/components/editor/extensions/stickyHeaders.ts.
Export createStickyHeaders(): Extension.

A CM6 ViewPlugin that:
  Scans visible syntax tree for ATXHeading nodes (H1, H2).
  Finds the last heading above the viewport top edge.
  Applies a DOM mutation (not a Decoration — headers outside viewport aren't in the DOM).

Implementation: use IntersectionObserver on H1/H2 CM6 line elements.
  Track which headers have scrolled above the viewport.
  The last one above gets a .cm-sticky-header CSS class applied.

In app.css:
  .cm-sticky-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg-deep);
    border-bottom: 1px solid var(--border);
    padding: 0.25rem 0;
  }
  Backdrop-filter gated behind @media (min-width: 768px).

Wire into ThoughtEditor.svelte.
Execute self-review gate.
```

**V2-B.11 — Flow Ring (Ambient Word Count)**
```
Read CLAUDE.md. Read ThoughtEditor.svelte.

word_count field already in thoughts schema from V1 Group A.

Create src/components/editor/FlowRing.svelte using Svelte 5 Runes.

Props: wordCount: number

Computed:
  target = FEATURE_CONFIG.FLOW_RING_TARGET_WORDS (default 250)
  dashOffset = 100 - Math.min((wordCount / target) * 100, 100)
  isComplete = wordCount >= target

Render: 16×16px SVG.
  Background circle: stroke var(--bg-panel).
  Progress circle: stroke var(--color-brand), stroke-dasharray 100,
    stroke-dashoffset animates via CSS transition 0.3s — Rule 9.
  When isComplete: apply a single pulse animation on the progress circle
    using opacity 1→0.5→1 over 1s — Rule 9.

Mount in ThoughtEditor.svelte status bar area (bottom of editor).

V3 hook: FLOW_RING_TARGET_WORDS becomes per-stage configurable.
  Add stageWordTargets: Record<number, number> to FEATURE_CONFIG now, default all 250.

Add to FEATURE_CONFIG:
  FLOW_RING_TARGET_WORDS: 250

Wire into ThoughtEditor.svelte.
Execute self-review gate.
```

**V2-B.12 — Auto-Color Hash Tags**
```
Read CLAUDE.md. Read ThoughtEditor.svelte.

Create src/components/editor/extensions/tagColours.ts.
Export createTagColours(): Extension.

Hash function (deterministic, pure):
  function hashTagToHSL(tag: string): string
    let hash = 0
    for char of tag: hash = char.charCodeAt(0) + ((hash << 5) - hash)
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 65%, 65%)`

A CM6 MatchDecorator targeting /#[\w/]+/ (supports nested tags from V1 Fluid Tag Hierarchies).
For each match: Decoration.mark({ attributes: { style: `color: ${hashTagToHSL(match)}` } })

Note: inline style is the only exception to Rule 8 here because the colour is
algorithmically derived at runtime and cannot be a static CSS variable.
This exception is documented in the DECISIONS LOG.

Wire into ThoughtEditor.svelte.
Execute self-review gate.
```

**V2-B.13 — Glassmorphic Callout Blocks**
```
Read CLAUDE.md. Read ThoughtEditor.svelte.

Create src/components/editor/extensions/calloutBlocks.ts.
Export createCalloutBlocks(): Extension.

A CM6 ViewPlugin that detects blockquote lines starting with > [!type].
Supported types and their CSS variable mappings (from app.css):
  idea    → var(--color-brand)
  warning → var(--color-inbox)    (amber)
  success → var(--color-forge)    (green)
  error   → var(--color-archive)  (grey/red)

For each matched block:
  Apply Decoration.replace to hide the > [!type] line.
  Apply Decoration.line to the remaining blockquote lines
    with a CSS class: .cm-callout-[type]

In app.css for each type (no hardcoded colours):
  .cm-callout-idea { border-left: 3px solid var(--color-brand); background: rgba resolved at runtime; }
  (use hexToRgb pattern at mount to set --callout-idea-bg CSS variable)

Wire into ThoughtEditor.svelte.
Execute self-review gate.
```

**V2-B.14 — Relative Time Pills (@today)**
```
Read CLAUDE.md. Read ThoughtEditor.svelte.

Create src/components/editor/extensions/timePills.ts.
Export createTimePills(): Extension.

A CM6 MatchDecorator targeting /@(\d{4}-\d{2}-\d{2})/.
For each match: Decoration.replace with a TimePillWidget.

TimePillWidget.toDOM():
  Parse the date. Calculate relative label:
    today → $t('time.today')
    yesterday → $t('time.yesterday')
    N days ago → $t('time.daysAgo', {n})
    future dates → formatted date string
  Return a <span> styled as a pill with var(--bg-surface) background,
    border: 1px solid var(--border), border-radius: 4px, font-size: 0.8em.

When typing @today: CM6 command converts it to @YYYY-MM-DD (today's date).
Bind to Slash menu item: '/today'.

Add to FEATURE_CONFIG:
  (none — relative label logic is pure)

Add to i18n.ts:
  'time.today': 'Today'
  'time.yesterday': 'Yesterday'
  'time.daysAgo': '{n} days ago'

Wire into ThoughtEditor.svelte.
Execute self-review gate.
```

**V2-B.15 — Smart Indent Sibling (Cmd+Enter)**
```
Read CLAUDE.md. Read ThoughtEditor.svelte. Read src/lib/db.ts.
Read src/routes/(app)/thought/[id]/+page.svelte.

Add to ThoughtEditor.svelte CM6 extensions:
  keymap.of([{
    key: 'Mod-Enter',
    run: (view) => {
      1. Get current thought title from props.
      2. Append [[New Thought]] link to current document via CM6 dispatch.
      3. Generate new ID via generateId().
      4. Create new thought in Dexie via createThought(libraryId, 'New Thought').
      5. Navigate to /thought/[newId] via SvelteKit goto().
      return true
    }
  }])

New thought title 'New Thought' should use $t('editor.newThought.defaultTitle').

Add to i18n.ts:
  'editor.newThought.defaultTitle': 'New Thought'
  'editor.newThought.shortcut': 'New linked thought'

Execute self-review gate.
```

**Group V2-B done when:**
- [ ] Context Peeker shows popover on wikilink hover, mobile long-press
- [ ] Ghost Mentions underlines unlinked words matching vault titles
- [ ] Breadcrumbs show navigation trail above editor
- [ ] Focus Mode dims non-active paragraphs
- [ ] Telescopic Search collapses non-matching blocks on Cmd+F
- [ ] Progressive Summarization cycles bold→highlight→plain on Cmd+H
- [ ] Typewriter Mode keeps active line centered
- [ ] Blind Draft Mode fades typed text after delay
- [ ] Shadow Text keeps ghost text visible while rewriting
- [ ] Sticky Context Headers stick to top during scroll
- [ ] Flow Ring fills to target word count, pulses on complete
- [ ] Hash tags render in consistent deterministic colours
- [ ] Callout blocks render glassmorphic panels for > [!type]
- [ ] @today renders as relative time pill, updates daily
- [ ] Cmd+Enter creates linked thought and navigates
- [ ] npm run check passes zero errors
- [ ] npm run test passes all tests
- [ ] SESSION END RITUAL executed
- [ ] git tag feature-v2-GB-verified created and pushed

---

## ═══════════════════════════════════════════
## GROUP V2-C — CAPTURE & WORKFLOW
## 4 features. Reduce capture friction for power users.
## Estimated time: 1.5 weeks | Model: Sonnet 4.6
## ═══════════════════════════════════════════

**V2-C.1 — Ephemeral Scratchpad (Vapor Note)**
```
Read CLAUDE.md. Read src/components/layout/MobileDock.svelte.
Read src/components/layout/Sidebar.svelte.

The Vapor Note lives in localStorage — NOT Dexie. It self-destructs after 24 hours.
It is a second, separate capture bar from SparkInput. It is never synced.

Create src/components/capture/VaporNote.svelte using Svelte 5 Runes.

State:
  vaporText = $state(localStorage.getItem('vapor_note') || '')
  vaporTimestamp = parseInt(localStorage.getItem('vapor_ts') || '0')

On mount: if Date.now() - vaporTimestamp > FEATURE_CONFIG.VAPOR_TTL_MS: clear both keys.

$effect syncing vaporText to localStorage:
  localStorage.setItem('vapor_note', vaporText)
  localStorage.setItem('vapor_ts', String(Date.now()))

Promote to Graph button:
  If vaporText is not empty:
    createThought(activeLibraryId, $t('vapor.defaultTitle'))
    updateThought(newId, { content: vaporText })
    vaporText = ''
    localStorage.removeItem('vapor_note')
    localStorage.removeItem('vapor_ts')
    Navigate to /thought/[newId]

Mount as a collapsible panel in the Sidebar below SerendipityCollider.
On mobile: add a second tab "Scratch" to MobileDock.

Add to FEATURE_CONFIG:
  VAPOR_TTL_MS: 86400000

Add to i18n.ts:
  'vapor.heading': 'Scratch'
  'vapor.placeholder': 'Jot something temporary…'
  'vapor.promote': 'Promote to graph'
  'vapor.defaultTitle': 'From Scratchpad'
  'vapor.expires': 'Clears in 24h'

Execute self-review gate.
```

**V2-C.2 — OS-Level Spotlight Search (iOS/Android only)**
```
Read CLAUDE.md. Read src/routes/(app)/+layout.svelte. Read src/lib/db.ts.
Note: This feature is mobile-only. Web and desktop do NOT implement this.

Install: @capacitor-community/spotlight (verify package exists and is maintained
  before installing — search npm. If unavailable, defer to V3.)

In (app)/+layout.svelte:
  After thought sync on mount, if Capacitor.getPlatform() === 'ios' or 'android':
    Call indexThoughtsInSpotlight() from a new src/lib/spotlightService.ts.

Create src/lib/spotlightService.ts:
  export async function indexThoughtsInSpotlight(): Promise<void>
    const thoughts = await getThoughtsByLibrary(activeLibraryId) (lightweight)
    For each thought (title only — not full content per V1 forward compat note):
      await Spotlight.index({
        itemId: thought.id,
        title: thought.title,
        description: thought.content.substring(0, 100)
      })
  export async function removeFromSpotlight(thoughtId: string): Promise<void>
    await Spotlight.deleteItem({ itemId: thoughtId })

Wire removeFromSpotlight into softDeleteThought in db.ts (after is_deleted write).

Handle deep-link in (app)/+layout.svelte:
  App.addListener('appUrlOpen', data => {
    if data.url contains 'spotlight-thought-id':
      goto('/thought/' + extractedId)
  })

Add to i18n.ts:
  (none — OS handles UI)

Execute self-review gate.
```

**V2-C.3 — Blackout Prompt (Writer's Block Breaker)**
```
Read CLAUDE.md. Read src/routes/(app)/thought/[id]/+page.svelte.

Create src/components/editor/BlackoutPrompt.svelte using Svelte 5 Runes.

Props: thoughtContent: string

State: showPrompt = $state(false), promptText = $state('')

On mount:
  If thoughtContent.length === 0:
    Start FEATURE_CONFIG.BLACKOUT_IDLE_MS (45000ms) timer.
    On timer fire: pick random prompt from PROMPTS array, set showPrompt = true.

On any keydown in editor: clearTimeout(timer), showPrompt = false.
On onDestroy: clearTimeout(timer).

PROMPTS array (hardcoded array of 20 strings — only the keys go in i18n, not the array):
  'prompt.opposite': 'What is the exact opposite of this idea?'
  'prompt.child': 'How would you explain this to a 10-year-old?'
  'prompt.critic': 'Who would most strongly disagree with this — and why?'
  'prompt.firstPrinciples': 'What is the single most fundamental truth this rests on?'
  'prompt.analogy': 'What completely unrelated thing does this remind you of?'
  ... (20 total in i18n.ts)

UI when showPrompt === true:
  Full-screen overlay: background var(--bg-deep), opacity 0.95.
  Single large prompt text in var(--text-muted), centered.
  Tap/click anywhere to dismiss.
  Transition: opacity 0→1, 600ms — Rule 9.

Add to FEATURE_CONFIG:
  BLACKOUT_IDLE_MS: 45000

Mount in thought/[id]/+page.svelte.
Execute self-review gate.
```

**V2-C.4 — Dead Weight Pruning (Auto-Archive Prompt)**
```
Read CLAUDE.md. Read src/routes/(app)/+layout.svelte. Read src/lib/db.ts.

last_viewed_at field already in schema from V1 Group A.

In (app)/+layout.svelte onMount, run once per app session:
  Check localStorage 'pruning_last_run'. If within 7 days: skip.
  const staleThreshold = Date.now() - FEATURE_CONFIG.PRUNING_STALE_MS
  Query db.thoughts where meta_state IN [1,2] AND last_viewed_at < staleThreshold.
  If staleCount > 0:
    toastStore.add(
      $t('pruning.prompt').replace('{count}', staleCount),
      'info',
      { action: { label: $t('pruning.review'), onClick: () => goto('/kanban') } }
    )
  localStorage.setItem('pruning_last_run', Date.now().toString())

This prompts — it never auto-archives. User reviews in Kanban view (V2-A.11).

Add to FEATURE_CONFIG:
  PRUNING_STALE_MS: 5184000000   (60 days)
  PRUNING_CHECK_INTERVAL_MS: 604800000  (7 days)

Add to i18n.ts:
  'pruning.prompt': '{count} thoughts unopened in 60 days. Review them?'
  'pruning.review': 'Review'

Execute self-review gate.
```

**Group V2-C done when:**
- [ ] Vapor Note captures text, survives app restart, promotes to graph correctly
- [ ] Vapor Note self-destructs after 24 hours
- [ ] Spotlight Search indexes thoughts on iOS/Android (not on web or desktop)
- [ ] Tapping OS search result deep-links to correct thought
- [ ] Blackout Prompt appears after 45s on empty thought, dismissed on keypress
- [ ] Dead Weight Pruning toast appears after 60-day stale threshold
- [ ] npm run check passes zero errors
- [ ] npm run test passes all tests
- [ ] SESSION END RITUAL executed
- [ ] git tag feature-v2-GC-verified created and pushed

---

## ═══════════════════════════════════════════
## GROUP V2-D — GRAPH INTERACTIONS
## 5 features. Structural manipulation for heavy graph users.
## Estimated time: 2 weeks | Model: Opus 4.6
## ═══════════════════════════════════════════

**V2-D.1 — Thought Fork**
```
Read CLAUDE.md. Read ThoughtEditor.svelte. Read src/lib/db.ts.

Add "Fork" button to ThoughtEditor.svelte mobile-header and desktop toolbar.

On fork:
  original = current thought
  newId = generateId()
  await createThought(original.library_id, original.title + ' ' + $t('fork.titleSuffix'))
  await updateThought(newId, { content: original.content, meta_state: original.meta_state })
  Link original to fork: append [[forkTitle]] to original.content via updateThought.
  Navigate to /thought/[newId]

In graphWorker.ts: fork edge renders as ctx.setLineDash([8, 4]) — dotted style.
  Track edge as link_type: 'fork' in the edges Dexie record.

Add to i18n.ts:
  'fork.titleSuffix': '(Fork)'
  'editor.fork': 'Fork'
  'fork.created': 'Fork created'

V3 hook: Merge Fork diff-viewer reads original.id from fork edge.
  edge.link_type 'fork' is already stored — V3 reads it.

Execute self-review gate.
```

**V2-D.2 — Semantic Merge / Node Fusion**
```
Read CLAUDE.md. Read GraphCanvas.svelte. Read src/lib/db.ts.

Interaction: drag node A and hold it over node B for FEATURE_CONFIG.MERGE_HOLD_MS.
  Visual cue: node B grows in radius + cyan pulse while A is held over it.
  On release after hold: show confirmation toast with undo window.

On merge confirmed (after FEATURE_CONFIG.MERGE_UNDO_MS delay):
  db.transaction('rw', db.thoughts, db.edges, async () => {
    nodeA = await getThought(nodeAId)
    nodeB = await getThought(nodeBId)
    nodeB.content += '\n\n' + $t('merge.divider').replace('{title}', nodeA.title)
      + '\n\n' + nodeA.content
    await updateThought(nodeBId, { content: nodeB.content })
    linkedThoughts = await getBacklinksForThought(nodeA.title)
    for each: replace [[nodeA.title]] with [[nodeB.title]] via updateThought
    await softDeleteThought(nodeAId)
  })

Janitor worker handles the link replacement (post renameLinks message).

Add to FEATURE_CONFIG:
  MERGE_HOLD_MS: 1000
  MERGE_UNDO_MS: 5000

Add to i18n.ts:
  'merge.confirm': 'Merge "{a}" into "{b}"?'
  'merge.divider': '— Merged from {title} —'
  'merge.success': 'Merged. Undo?'

Execute self-review gate.
```

**V2-D.3 — Speculative Edges (What-If Sandbox)**
```
Read CLAUDE.md. Read GraphCanvas.svelte. Read src/lib/stores/uiStore.svelte.ts.

Speculative edges are visual-only D3 springs — they do NOT write to Dexie.

Interaction: Alt+drag from node A to node B.

In GraphCanvas.svelte:
  Detect Alt key held during dragstart.
  On dragend over a different node: add { source: nodeAId, target: nodeBId, isSpeculative: true }
    to uiStore.speculativeEdges array ($state — not Dexie).
  Feed speculativeEdges into the D3 forceLink alongside real edges.
  Worker receives speculative edges as a separate array in simulate message.

In render loop:
  Speculative edges: ctx.setLineDash([4, 4]), colour var(--color-queue) at 0.5 opacity.
  Real edges: unchanged.

On right-click of speculative edge:
  Context menu item $t('edge.solidify') → appends [[targetTitle]] to source thought content.
    Calls rebuildEdgesForThought on blur (Rule 12).
  Context menu item $t('edge.discard') → removes from speculativeEdges array.

Speculative edges are cleared on page refresh (session-only).

Add to uiStore.svelte.ts:
  speculativeEdges: $state<Array<{source: string, target: string}>>([])

Add to i18n.ts:
  'edge.solidify': 'Make permanent'
  'edge.discard': 'Discard'

Execute self-review gate.
```

**V2-D.4 — Viewport Bookmarks (Spatial Snapshots)**
```
Read CLAUDE.md. Read map/+page.svelte. Read GraphCanvas.svelte.

Viewport bookmarks are session-only in V2 (localStorage, not Dexie).
V3 persists them to Dexie with user-defined names.

Keyboard shortcuts (via ShortcutManager.ts):
  Cmd+Shift+1/2/3 → save current D3 zoom transform to localStorage key 'viewport_1/2/3'
  Cmd+1/2/3 → recall viewport, animate camera via d3.zoom transition 750ms

In map/+page.svelte:
  On mount: read viewports from localStorage, store in local $state object.
  Show small bookmark indicators in toolbar when a slot is saved.

In GraphCanvas.svelte:
  expose a setViewport(transform) function via Svelte context so map/+page can call it.

Add to i18n.ts:
  'viewport.saved': 'View {n} saved'
  'viewport.recalled': 'View {n} restored'

V3 hook: Dexie viewports table already created (empty) in V1 forward compat.
  V3 reads from table first, falls back to localStorage.

Execute self-review gate.
```

**V2-D.5 — Actionable Edges / Typed Links**
```
Read CLAUDE.md. Read src/lib/db.ts. Read GraphCanvas.svelte. Read GraphEdge.ts.
Read src/components/editor/extensions/vaultAutocomplete.ts.

Typed link syntax: [[Blocks::Target Title]] and [[Supports::Target Title]].

In db.ts, extend rebuildEdgesForThought():
  Add regex for typed links: /\[\[(Blocks|Supports|Causes|Questions)::(.*?)\]\]/g
  When matched: create edge with link_type = 'blocks'|'supports'|'causes'|'questions'.
  Target title is match[2] — resolve via existing alias + title lookup.

In GraphEdge.ts, extend drawEdge():
  Add linkType: string = 'reference' param.
  If linkType === 'blocks': stroke var(--color-inbox) at 0.7 opacity, draw arrowhead.
  If linkType === 'supports': stroke var(--color-forge) at 0.7 opacity, draw arrowhead.
  If linkType === 'causes': stroke var(--color-brand) at 0.7 opacity, draw arrowhead.
  If linkType === 'questions': stroke var(--text-muted) at 0.7 opacity, dashed.
  Default: existing behaviour unchanged.

Arrowhead drawing: small ctx.beginPath triangle at target end of edge.
  All colours from resolved CSS variables via getComputedStyle — no hardcoded hex.

In vaultAutocomplete: extend matchBefore to also trigger on /\[\[\w+::/
  so autocomplete suggests target titles after typing [[Blocks::.

Add to FEATURE_CONFIG:
  TYPED_LINK_TYPES: ['Blocks', 'Supports', 'Causes', 'Questions']

Add to i18n.ts:
  'edge.type.blocks': 'Blocks'
  'edge.type.supports': 'Supports'
  'edge.type.causes': 'Causes'
  'edge.type.questions': 'Questions'

Execute self-review gate.
```

**Group V2-D done when:**
- [ ] Fork creates linked duplicate, dotted edge visible on graph
- [ ] Merge combines content, redirects all inbound links, soft-deletes original
- [ ] Speculative edges draw as dashed purple lines, not persisted to Dexie
- [ ] Solidify converts speculative edge to real markdown link
- [ ] Cmd+Shift+1 saves viewport, Cmd+1 restores with animation
- [ ] [[Blocks::Title]] and [[Supports::Title]] draw coloured arrow edges
- [ ] npm run check passes zero errors
- [ ] npm run test passes all tests
- [ ] SESSION END RITUAL executed
- [ ] git tag feature-v2-GD-verified created and pushed

---

## V2 COMPLETE WHEN

- [ ] All 4 V2 groups pass their done-when checklists
- [ ] npm run check passes zero errors, zero warnings
- [ ] npm run test passes all tests
- [ ] Semantic Zoom switches modes at correct thresholds (manual test)
- [ ] Ghost Mentions underline unlinked references (manual test)
- [ ] Merge redirects all inbound links correctly (manual test)
- [ ] Vapor Note self-destructs after 24h (manual test)
- [ ] git tag feature-v2-complete created
- [ ] session-handover.md updated
- [ ] progress.md DECISIONS LOG updated

---

# ═══════════════════════════════════════════════════════════
# VERSION 3 — 10,000 → 100,000 USERS
# Goal: Platform-level capability. One reason to pay.
# ═══════════════════════════════════════════════════════════

## V3 EXECUTION ORDER

| Order | Group | Reason |
|-------|-------|--------|
| 1 | V3-A: Advanced Graph Physics | Performance ceiling at 5,000+ node vaults |
| 2 | V3-B: Advanced Editor | Power user features requiring stable V2 editor foundation |
| 3 | V3-C: Spatial & Hybrid | Complex editor+canvas integrations needing V2 as base |
| 4 | V3-D: Platform & Output | Output and platform features that depend on V3-A/B/C |

---

## ═══════════════════════════════════════════
## GROUP V3-A — ADVANCED GRAPH PHYSICS
## 16 features. Performance and intelligence at scale.
## Estimated time: 6–8 weeks | Model: Opus 4.6
## ═══════════════════════════════════════════

**V3-A.1 — Resonance Score / PageRank**
```
Create src/workers/pagerankWorker.ts. No Dexie. Pure matrix computation.

InMessage: { type: 'compute'; edges: EdgeData[]; nodeIds: string[] }
OutMessage: { type: 'scores'; scores: Record<string, number> }

Algorithm: simplified PageRank, 20 iterations.
  Initialize all node scores to 1/N.
  Each iteration: score[node] = 0.15/N + 0.85 * sum(score[inbound] / outDegree[inbound])
  Normalize final scores to 0–100 range.

Run once per week per session (check localStorage 'pagerank_last_run').
Cache results in Dexie resonance_cache table (add to schema in V3 version bump).
Display score as subtle badge on thought/[id]/+page.svelte (top-right, var(--text-muted)).

Add to FEATURE_CONFIG:
  PAGERANK_ITERATIONS: 20
  PAGERANK_DAMPING: 0.85
  PAGERANK_REFRESH_INTERVAL_MS: 604800000

Add to i18n.ts:
  'resonance.label': 'Resonance'
  'resonance.tooltip': 'How connected this idea is to your core knowledge'

Execute self-review gate.
```

**V3-A.2 — Organic Pathways / Mycelial Routing**
```
traversal_count field already exists on edges from V1 Group A.
updateTraversalCount() already called on wikilink clicks from V1.

In graphWorker.ts render loop:
  For each edge, read traversal_count.
  thickness = Math.min(FEATURE_CONFIG.EDGE_MAX_THICKNESS,
    1 + (edge.traversal_count * FEATURE_CONFIG.EDGE_THICKNESS_FACTOR))
  ctx.lineWidth = thickness

  Bezier offset for organic look (deterministic from edge id — no randomness per frame):
    const idHash = hashString(edge.id) (pure function, no randomness)
    const midX = (src.x + tgt.x) / 2 + (Math.sin(idHash) * 8)
    const midY = (src.y + tgt.y) / 2 + (Math.cos(idHash) * 8)
    ctx.quadraticCurveTo(midX, midY, tgt.x, tgt.y)

Add to FEATURE_CONFIG:
  EDGE_MAX_THICKNESS: 5
  EDGE_THICKNESS_FACTOR: 0.08

Execute self-review gate.
```

**V3-A.3 — Synaptic Pruning / Edge Decay**
```
In graphWorker.ts render loop:
  For each edge, read traversal_count and edge.created_at (already in schema).
  If traversal_count === 0 and (Date.now() - edge.created_at) > FEATURE_CONFIG.EDGE_DECAY_THRESHOLD_MS:
    ctx.setLineDash([5, 10])
    Apply lower opacity: FEATURE_CONFIG.EDGE_DECAY_OPACITY
  Else: normal solid line.

Right-click on dashed edge in CanvasContextMenu:
  Add menu item: $t('edge.stale.prompt') → calls softDeleteEdge(edgeId) from db.ts.

Add to FEATURE_CONFIG:
  EDGE_DECAY_THRESHOLD_MS: 7776000000  (90 days)
  EDGE_DECAY_OPACITY: 0.15

Add to i18n.ts:
  'edge.stale.prompt': 'This link is unused — remove it?'
  'edge.stale.remove': 'Remove link'

Execute self-review gate.
```

**V3-A.4 — Latent Gravity (Implied Edges from Shared Tags)**
```
In graphWorker.ts: before simulation, compute sharedTagWeight for node pairs.
  For each pair of nodes with no existing edge:
    sharedTags = count of tags appearing in BOTH node.content strings.
    If sharedTags >= FEATURE_CONFIG.LATENT_GRAVITY_MIN_SHARED_TAGS:
      sharedTagWeight = sharedTags (passed to custom force)

Custom force applied in simulation:
  simulation.force('latent', alpha => {
    for each pair with sharedTagWeight:
      dx = nodeB.x - nodeA.x; dy = nodeB.y - nodeA.y
      dist = Math.sqrt(dx*dx + dy*dy)
      pull = sharedTagWeight * FEATURE_CONFIG.LATENT_GRAVITY_STRENGTH * alpha / dist
      nodeA.vx += dx * pull; nodeA.vy += dy * pull
      nodeB.vx -= dx * pull; nodeB.vy -= dy * pull
  })

Add to FEATURE_CONFIG:
  LATENT_GRAVITY_MIN_SHARED_TAGS: 3
  LATENT_GRAVITY_STRENGTH: 0.3

Execute self-review gate.
```

**V3-A.5 — Edge-Weight Decay (Proximity Forgetting)**
```
In graphWorker.ts, extend D3 forceLink distance accessor:
  const linkForce = d3.forceLink(edges).id(d => d.id).distance(link => {
    const ageDiff = Math.abs(link.source.updated_at - link.target.updated_at)
    const driftMultiplier = Math.min(
      FEATURE_CONFIG.EDGE_DRIFT_MAX_MULTIPLIER,
      1 + (ageDiff / FEATURE_CONFIG.EDGE_DRIFT_ONE_YEAR_MS)
    )
    return FEATURE_CONFIG.GRAPH_LINK_DISTANCE * driftMultiplier
  })

Add to FEATURE_CONFIG:
  EDGE_DRIFT_MAX_MULTIPLIER: 3
  EDGE_DRIFT_ONE_YEAR_MS: 31536000000

Execute self-review gate.
```

**V3-A.6 — Orbital Debt (Reading Ring / #to-read orbits)**
```
In graphWorker.ts: add custom orbital force for nodes tagged #to-read or #process.
  orbital force runs every tick:
    for each #to-read node:
      dx = node.x - canvasCenter.x; dy = node.y - canvasCenter.y
      dist = Math.sqrt(dx*dx + dy*dy)
      targetRadius = FEATURE_CONFIG.ORBITAL_RADIUS_FRACTION * Math.min(canvasW, canvasH)
      node.vx += (dx/dist * targetRadius - dx) * alpha * 0.5
      node.vy += (dy/dist * targetRadius - dy) * alpha * 0.5
      node.vx += -dy * FEATURE_CONFIG.ORBITAL_SPEED * alpha
      node.vy += dx * FEATURE_CONFIG.ORBITAL_SPEED * alpha

Add to FEATURE_CONFIG:
  ORBITAL_RADIUS_FRACTION: 0.45
  ORBITAL_SPEED: 0.05

Execute self-review gate.
```

**V3-A.7 — Topographical Resonance Mapping**
```
Install: d3-contour (verify package availability before installing).

In graphWorker.ts after positions computed:
  Build density grid from node x/y/linkCount data.
  Run d3.contourDensity() on the grid.
  Post contour path data to main thread.

In GraphCanvas.svelte:
  Before drawing nodes, draw contour paths:
    ctx.beginPath()
    Draw each contour polygon with very low opacity stroke (var(--border-strong) at 0.3).
    No fill — only elevation lines.

Add to FEATURE_CONFIG:
  CONTOUR_BANDWIDTH: 30
  CONTOUR_THRESHOLD_COUNT: 10

Execute self-review gate.
```

**V3-A.8 — Hierarchical Edge Bundling**
```
In graphWorker.ts: implement edge bundling as a post-processing step.
  Group edges by source cluster and target cluster (using connected components).
  For inter-cluster edges in the same pair: compute a shared control point.
    controlX = midpoint of all edge midpoints in the bundle.
    controlY = midpoint of all edge midpoints in the bundle.
  Post bundledEdges with control points to main thread.

In GraphCanvas.svelte:
  For bundled edges: ctx.bezierCurveTo through shared control point.
  For single edges: existing quadraticCurveTo from V3-A.2.

Add to FEATURE_CONFIG:
  BUNDLE_MIN_EDGES: 3  (minimum edges between clusters to trigger bundling)

Execute self-review gate.
```

**V3-A.9 — Directed Flow State / DAG Toggle**
```
In graphWorker.ts:
  Add message type: { type: 'toggleDAG'; enabled: boolean }
  When enabled:
    simulation.stop()
    Assign depth to each node via BFS from root nodes (nodes with no inbound edges).
    Apply d3.forceY(d => d.depth * FEATURE_CONFIG.DAG_LAYER_HEIGHT).strength(1)
    Apply d3.forceX(canvasWidth / 2).strength(0.1)
    simulation.alpha(1).restart()
  When disabled: restore standard forces, alpha(1).restart()

Add toggle button to Map toolbar: $t('graph.dagMode').
On click: post toggleDAG message to worker.

Add to FEATURE_CONFIG:
  DAG_LAYER_HEIGHT: 100

Add to i18n.ts:
  'graph.dagMode': 'Hierarchy View'

Execute self-review gate.
```

**V3-A.10 — Butterfly Effect (Downstream Cascade)**
```
In GraphCanvas.svelte:
  On Spacebar while hovering a node:
    Run BFS from hovered node following outbound edges only.
    Assign depth to each reachable node.
    Store cascadeData = { nodeId: depth } in $state.

In render loop:
  For nodes in cascadeData:
    const time = Date.now()
    const waveFront = (time % FEATURE_CONFIG.CASCADE_PERIOD_MS) / FEATURE_CONFIG.CASCADE_PERIOD_MS
    const nodeWavePosition = node.depth / maxDepth
    const intensity = Math.max(0, 1 - Math.abs(waveFront - nodeWavePosition) * 5)
    Apply ctx.shadowColor + ctx.shadowBlur based on intensity.

On Escape or second Spacebar: clear cascadeData.

Add to FEATURE_CONFIG:
  CASCADE_PERIOD_MS: 2000

Execute self-review gate.
```

**V3-A.11 — Spatial Sieve (Gravity Filtering)**
```
In GraphCanvas.svelte:
  Add Sieve toggle to Map toolbar.
  On activate: show horizontal line across canvas at canvasHeight / 2.
  Show tag input above the line.

On query submission:
  simulation.force('sieve-gravity', d3.forceY(canvasHeight * 2).strength(0.5))
  simulation.alpha(1).restart()

  In tick: for matching nodes when y >= sieveY:
    node.y = sieveY
    node.vy *= -0.5

On deactivate:
  simulation.force('sieve-gravity', null)
  simulation.alpha(0.3).restart()

Add to i18n.ts:
  'graph.sieve': 'Sieve'
  'graph.sieve.placeholder': 'Filter by tag…'

Execute self-review gate.
```

**V3-A.12 — Black Hole Deletion Event**
```
In GraphCanvas.svelte, intercept the softDelete flow:
  Before calling softDeleteThought:
    Apply temporary radial attraction force to deleted node coordinates:
      simulation.force('blackhole', d3.forceRadial(0, node.x, node.y).strength(2))
      simulation.alpha(1).restart()
    After FEATURE_CONFIG.BLACK_HOLE_MS:
      simulation.force('blackhole', null)
      Proceed with softDeleteThought.

Add to FEATURE_CONFIG:
  BLACK_HOLE_MS: 300

Execute self-review gate.
```

**V3-A.13 — Wandering Mind (Idle Screen)**
```
In map/+page.svelte:
  Add idle detection: reset on mousemove/touchstart/keydown.
  After FEATURE_CONFIG.WANDER_IDLE_MS: start wandering.

startWandering():
  Pick a recently updated node from top 10 by updated_at.
  d3.select(canvas).transition().duration(FEATURE_CONFIG.WANDER_PAN_MS)
    .ease(d3.easeSinInOut)
    .call(zoom.transform, d3.zoomIdentity.translate(-node.x, -node.y).scale(1.2))
    .on('end', startWandering)

stopWandering(): cancel transition, restore normal interaction.

Add to FEATURE_CONFIG:
  WANDER_IDLE_MS: 15000
  WANDER_PAN_MS: 10000

Execute self-review gate.
```

**V3-A.14 — CRDT Chronometer (Time-Scrubbing Canvas)**
```
In map/+page.svelte:
  Add a horizontal slider below the GraphCanvas. Range: earliest created_at → now.
  Bind to uiStore.chronoScrubTime: number.

In graphWorker.ts:
  Extend simulate message with scrubTime?: number.
  If scrubTime: filter nodes and edges to those with created_at <= scrubTime.
  Pass filtered subset to simulation.

Slider label: formatted date derived from scrubTime value.
Play button: increments scrubTime by FEATURE_CONFIG.CHRONO_STEP_MS on each frame.

Add to FEATURE_CONFIG:
  CHRONO_STEP_MS: 86400000  (1 day per frame)

Add to i18n.ts:
  'graph.chrono.label': 'Time Travel'
  'graph.chrono.play': 'Play'
  'graph.chrono.reset': 'Now'

Execute self-review gate.
```

**V3-A.15 — Time-Lapse Node Evolution**
```
Extension of V3-A.14. A dedicated "Replay" mode.

In map/+page.svelte:
  "Replay from beginning" button: sets scrubTime = earliest created_at.
  Auto-plays by incrementing scrubTime by FEATURE_CONFIG.TIMELAPSE_STEP_MS per frame.
  Nodes appear with a bloom animation (opacity 0→1 + scale 0.5→1 via canvas globalAlpha).

New node bloom: tracked via Set of recently-added node IDs in current render window.
  On first appearance: apply scale 0.5→1 lerp over 300ms using requestAnimationFrame.

Add to FEATURE_CONFIG:
  TIMELAPSE_STEP_MS: 604800000  (1 week per frame)
  TIMELAPSE_BLOOM_MS: 300

Execute self-review gate.
```

**V3-A.16 — Freehand Lasso Selection**
```
In GraphCanvas.svelte:
  On Shift+mousedown: enter lasso mode.
  Track path: Array<[number,number]> of canvas coordinates during mousemove.
  Draw path on canvas as dashed stroke using overlay canvas layer.
  On mouseup: run Point-in-Polygon for each node against the lasso polygon.

Point-in-Polygon (Ray-casting):
  function isPointInPolygon(point, vertices):
    x = point[0]; y = point[1]; inside = false
    for i, j in vertices:
      xi=vertices[i][0]; yi=vertices[i][1]; xj=vertices[j][0]; yj=vertices[j][1]
      intersect = ((yi>y) !== (yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi)
      if intersect: inside = !inside
    return inside

Selected nodes stored in uiStore.lassoSelectedNodes: string[].
Show bulk-action menu: Change Stage, Delete, Link to...

Execute self-review gate.
```

**Group V3-A done when:**
- [ ] Resonance scores computed weekly, displayed on thought pages
- [ ] Traversed edges thicker and more curved than new edges
- [ ] Unused edges render as dashed after 90 days
- [ ] Shared-tag nodes cluster via latent gravity
- [ ] Temporally diverged linked nodes push apart
- [ ] #to-read nodes orbit outer edge of canvas
- [ ] Contour elevation lines visible behind nodes
- [ ] Inter-cluster edges bundle into highways
- [ ] DAG toggle reorganizes graph hierarchically
- [ ] Butterfly Effect wave propagates from spacebar node
- [ ] Sieve catches matching nodes, others fall off canvas
- [ ] Black Hole deletion pulls connected nodes inward briefly
- [ ] Wandering Mind pans after 15s idle
- [ ] Chrono slider filters graph to historical state
- [ ] Timelapse auto-plays with node bloom animations
- [ ] Lasso selection enables bulk actions on selected nodes
- [ ] npm run check passes zero errors, npm run test passes all tests
- [ ] SESSION END RITUAL executed
- [ ] git tag feature-v3-GA-verified created and pushed

---

## ═══════════════════════════════════════════
## GROUP V3-B — ADVANCED EDITOR
## 16 features. Power user features on stable V2 foundation.
## Estimated time: 6–8 weeks | Model: Opus 4.6
## ═══════════════════════════════════════════

**V3-B.1 — Granular Time-Travel (Delta Snapshots)**
```
Add db.deltas table to Dexie via version bump:
  deltas: '++id, thoughtId, timestamp'
  Fields: { id, thoughtId: string, timestamp: number, patch: string }

In ThoughtEditor.svelte debounce handler (800ms — existing):
  After saving content to db.ts, also compute and save diff:
    import { diff_match_patch } from 'diff-match-patch'
    patch = dmp.patch_toText(dmp.patch_make(previousContent, newContent))
    await db.deltas.add({ thoughtId, timestamp: Date.now(), patch })
  Cap deltas per thought at FEATURE_CONFIG.DELTA_MAX_PER_THOUGHT.

Add time-travel slider to ThoughtEditor.svelte.
On slider change: fetch ordered deltas for thoughtId, apply patches in reverse.
Display read-only CM6 view of reconstructed content at that timestamp.
"Restore to this version" button: writes reconstructed content back as updateThought.

Add to FEATURE_CONFIG:
  DELTA_MAX_PER_THOUGHT: 50

Add to i18n.ts:
  'editor.timeTravel': 'Time Travel'
  'editor.timeTravel.restore': 'Restore this version'

Execute self-review gate.
```

**V3-B.2 — Inline Transclusion Mutation (Live Embeds)**
```
Extend the existing ThoughtEmbedWidget from Phase 8 (embedWidget.ts).
Currently: read-only Svelte component showing title, stage, 2-line snippet.
V3 upgrade: embed becomes an editable nested CM6 instance.

In embedWidget.ts:
  On click inside the embed: replace the read-only preview with a minimal CM6 EditorView.
  Bound to the embedded thought's content.
  On CM6 updateListener: call updateThought(targetId, { content: newContent }) debounced 800ms.
  On click outside: return to read-only preview mode.

Guard against infinite loops:
  Track activeEmbedIds: Set in uiStore.
  If targetId is already in set: show read-only with $t('embed.circularWarning').

Add to i18n.ts:
  'embed.circularWarning': 'Circular embed — edit in original'
  'embed.editing': 'Editing original'

Execute self-review gate.
```

**V3-B.3 — Transclusion Aggregation (Auto-Log)**
```
In ThoughtEditor.svelte:
  If thought.title matches a user-defined aggregate title
    (stored in FEATURE_CONFIG.AGGREGATE_TITLES array, default ['Daily Log', 'Journal']):
    After editor mounts: scan all thoughts for lines matching /^\/log (.*)$/gm.
    Render extracted lines as read-only blocks ABOVE the editor body.
    Each block: "text" + link to source thought.
    Does NOT modify any thought content — purely a view aggregation.

Add to FEATURE_CONFIG:
  AGGREGATE_TITLES: ['Daily Log', 'Journal']
  AGGREGATE_PREFIX: '/log'

Add to i18n.ts:
  'aggregate.heading': 'Aggregated entries'
  'aggregate.source': 'from {title}'

Execute self-review gate.
```

**V3-B.4 — Dynamic Variables ({{Note::$var}})**
```
Create src/components/editor/extensions/dynamicVariables.ts.
Export createDynamicVariables(): Extension.

A CM6 ViewPlugin matching /\{\{(.*?)::(.*?)\}\}/g.
For each match:
  targetTitle = match[1], varName = match[2]
  Query db.thoughts.where('title').equals(targetTitle).first()
  Extract value: regex varName + '\s*=\s*(.*?)' from content.
  Decoration.widget replacing the syntax with a <span> showing the value.
  Widget re-evaluates when editor viewport updates.

V3+ hook: arithmetic operations inside {{ }} deferred to V3+.
  Store full expression string in widget now. V3+ evaluates it.

Add to i18n.ts:
  'variable.notFound': 'Variable not found'
  'variable.noteNotFound': 'Note not found'

Wire into ThoughtEditor.svelte.
Execute self-review gate.
```

**V3-B.5 — Flashback Block (/flashback)**
```
Add /flashback to the Slash command menu in ThoughtEditor.svelte.

On trigger:
  Calculate one year ago ± 3 days window.
  Query db.thoughts.where('created_at').between(yearAgoStart, yearAgoEnd).toArray().
  If results > 0: pick random thought, extract first paragraph.
  Insert as CM6 transaction:
    '> ' + firstParagraph + '\n> — [[' + source.title + ']]\n\n'
  If no results: toastStore.add($t('flashback.noMemories'), 'info').

Add to i18n.ts:
  'flashback.noMemories': 'No memories from this time last year'
  'editor.slash.flashback': 'Flashback from one year ago'

Execute self-review gate.
```

**V3-B.6 — Inline Flashcards (Q:: A syntax)**
```
Create src/components/editor/extensions/flashcards.ts.
Export createFlashcards(): Extension.

CM6 MatchDecorator targeting /Q:\s*(.*?)\s*::\s*A:\s*(.*)/g.
For each match: Decoration.replace with a FlashcardWidget.

FlashcardWidget.toDOM():
  Mount a Svelte FlashcardComponent with:
    isFlipped: $state(false)
    question, answer from regex groups
  Front: question only, "Tap to reveal" hint.
  Back: answer, "Tap to hide" option.
  Flip animation: scaleY(1)→scaleY(0)→scaleY(1) split into two halves — Rule 9.
  Card uses var(--bg-surface) background, var(--border) border.

Add to i18n.ts:
  'flashcard.reveal': 'Tap to reveal'
  'flashcard.hide': 'Tap to hide'

Wire into ThoughtEditor.svelte.
Execute self-review gate.
```

**V3-B.7 — Dynamic Calculations (Live Result Pills)**
```
Create src/components/editor/extensions/mathPills.ts.
Export createMathPills(): Extension.

CM6 MatchDecorator targeting /([\d\.\+\-\*\/\(\)\s]+)=\s*$/ at end of line.

For each match:
  Sanitize: only allow digits, operators, parens, spaces.
  Evaluate: new Function('return ' + sanitizedExpr)()
  If result is finite: Decoration.widget with result pill after the = sign.
  If invalid: no decoration.

Result pill: <span> using var(--color-forge) at 0.15 background, var(--color-forge) text.
  Shows '= N'. fontFamily: monospace.
  Tab key binding: append the result as real text and remove the decoration trigger.

Add to i18n.ts:
  'math.error': '= ?'

Wire into ThoughtEditor.svelte.
Execute self-review gate.
```

**V3-B.8 — Parameterized Tags / Typological Supertags**
```
CM6 ViewPlugin detecting /#(\w+)\((.*?)\)/ syntax.
Example: #book(rating: 5, author: "Smith")

On match:
  Parse key-value pairs from the parentheses content.
  Store parsed properties in Dexie (add properties: Record<string,Record<string,string>>
    to thoughts schema via version bump).
  Decoration.replace with a pill showing #tagname + expandable property grid.

Property grid uses existing FrontmatterMask Svelte component styling.
On property edit: dispatch CM6 transaction updating the raw syntax + updateThought.

Add to i18n.ts:
  'supertag.addProperty': 'Add property'

Wire into ThoughtEditor.svelte.
Execute self-review gate.
```

**V3-B.9 — Inline Media Projection (YouTube/Image Auto-Render)**
```
CM6 ViewPlugin detecting lines containing only a URL.
  YouTube: /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([\w-]+)$/
  Image: /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i

YouTube: Decoration.replace with iframe widget.
  <iframe src="https://www.youtube.com/embed/{videoId}" width="100%" height="240"
    frameborder="0" allow="autoplay; encrypted-media">
  Lazy-loaded: only render when line is in viewport.
  Mobile guard: on Capacitor, render a tap-to-open link instead of iframe.

Image: Decoration.replace with <img> widget.
  Max-width: 100%, border-radius: 4px.
  Same lazy-load and mobile guard.

Add to i18n.ts:
  'media.tapToOpen': 'Tap to open'

Wire into ThoughtEditor.svelte.
Execute self-review gate.
```

**V3-B.10 — Omni-Paste (URL Auto-Title Fetch)**
```
In ThoughtEditor.svelte: intercept the CM6 paste event.
  Detect if pasted text is a URL (simple regex /^https?:\/\//).
  If URL:
    event.preventDefault()
    Insert loading placeholder: '[Fetching title…](url)'
    Fetch page title:
      On web: use fetch() with CORS proxy or direct if same-origin.
      On Capacitor: use @capacitor/core HTTP plugin to bypass CORS.
    On success: replace placeholder with [title](url) via CM6 transaction.
    On failure: replace placeholder with raw URL as [url](url).

Add to FEATURE_CONFIG:
  URL_FETCH_TIMEOUT_MS: 3000

Add to i18n.ts:
  'paste.fetching': 'Fetching title…'
  'paste.fetchFailed': 'Could not fetch title'

Execute self-review gate.
```

**V3-B.11 — Scrollbar Heatmap (Header Ticks)**
```
Create a custom scrollbar track overlay in ThoughtEditor.svelte.

On CM6 document update:
  Parse document for H1/H2/H3 positions using syntaxTree.
  Map each header line number to percentage of total document height.
  Render as absolute-positioned <div> elements inside a narrow right-margin track:
    H1: full width tick, 2px height, var(--color-brand) at 0.6 opacity.
    H2: 60% width, 1px height, var(--color-brand) at 0.4 opacity.
    H3: 40% width, 1px height, var(--text-muted) at 0.4 opacity.

Track: 6px wide, position: absolute right: 0, height: 100%.
On tick click: scroll editor to corresponding line position.

Execute self-review gate.
```

**V3-B.12 — Ambient Context Gutter (Backlink Dots)**
```
Create CM6 gutter extension in ThoughtEditor.svelte.

On thought mount and on content change:
  Query all thoughts containing block-anchor references to current thought: [[currentTitle^*]].
  Map anchor IDs to document line numbers via SearchCursor.
  Return a gutter marker (6px cyan dot) for each matching line.

Gutter marker: <div> 6×6px, border-radius 50%, background var(--color-brand).
Tooltip on hover: source thought title.

On click of gutter dot: navigate to source thought.

Execute self-review gate.
```

**V3-B.13 — Block-Level Transclusion (![[Note^block-id]])**
```
Extend existing ThoughtEmbedWidget (Phase 8 embedWidget.ts).
Currently handles ![[Title]]. V3 extends to ![[Title^block-id]].

Syntax: ![[Note Title^section-heading]] where section-heading matches an H2 or H3.

On mount: fetch target thought. Extract content under that specific heading
  (text between that heading and the next heading of equal/higher level).
Render extracted content only (not full thought) as the embed body.

Gutter dot (V3-B.12) marks line in SOURCE thought where the block-id anchor exists.

Add to i18n.ts:
  'embed.blockNotFound': 'Section not found in "{title}"'

Execute self-review gate.
```

**V3-B.14 — Cognitive Replay (Time-Lapse Editor)**
```
Requires V3-B.1 (delta snapshots) to be built first.

Add "Replay" button to ThoughtEditor.svelte toolbar.

On replay:
  Fetch all deltas for current thought, sorted by timestamp ascending.
  Instantiate a read-only CM6 EditorView in a modal overlay.
  Apply each delta patch with requestAnimationFrame pacing:
    delay = FEATURE_CONFIG.REPLAY_TICK_MS per delta.
  Show timestamp indicator updating as replay progresses.
  Stop/pause controls.

Add to FEATURE_CONFIG:
  REPLAY_TICK_MS: 100

Add to i18n.ts:
  'editor.replay': 'Replay'
  'editor.replay.speed': 'Speed'

Execute self-review gate.
```

**V3-B.15 — Inline Git-Prose (Semantic Diffing on Paste)**
```
Intercept CM6 paste event when pasting over a selection.

If clipboard text differs from selected text:
  import { diff_match_patch } from 'diff-match-patch'
  diffs = dmp.diff_main(selectedText, pastedText)
  dmp.diff_cleanupSemantic(diffs)
  Prevent default paste.
  Show diff overlay:
    Removed words: Decoration.mark({ class: 'cm-diff-remove' }) (strikethrough, var(--color-inbox))
    Added words: Decoration.mark({ class: 'cm-diff-add' }) (var(--color-forge))
  "Accept" button: apply the paste, remove overlay decorations.
  "Cancel" button: restore original, clear overlay.

Add to i18n.ts:
  'diff.accept': 'Accept'
  'diff.cancel': 'Cancel'
  'diff.reviewing': 'Review changes'

Execute self-review gate.
```

**V3-B.16 — Narrative Loom (Linear Traversal Physics)**
```
In GraphCanvas.svelte:
  "Loom Mode" in NodeContextMenu after selecting 2–8 nodes via Shift+click.

On activate:
  simulation.stop()
  Selected nodes sorted by created_at.
  Apply d3.forceX(index * FEATURE_CONFIG.LOOM_NODE_SPACING).strength(1) per node.
  Apply d3.forceY(canvasHeight / 2).strength(1) per node.
  All non-selected nodes: apply opacity 0.1 in render loop.
  All non-selected edges: opacity 0.04.
  Selected edges: full opacity, var(--color-brand) stroke.

On deactivate: clear forces, restore opacities, alpha(1).restart().

Add to FEATURE_CONFIG:
  LOOM_NODE_SPACING: 200

Add to i18n.ts:
  'graph.loom': 'Loom Mode'
  'graph.loom.hint': 'Shift+click nodes then activate'

Execute self-review gate.
```

**Group V3-B done when:**
- [ ] Time-Travel slider reconstructs thought at any historical state
- [ ] Inline embeds become editable with circular guard
- [ ] /log lines aggregate into Daily Log thought
- [ ] {{Note::$var}} pills show live values from source notes
- [ ] /flashback inserts year-ago paragraph as blockquote
- [ ] Flashcards flip on tap with scaleY animation
- [ ] Math expressions evaluate to live result pills
- [ ] #tag(key:val) renders as property grid pill
- [ ] YouTube and image URLs render inline
- [ ] Pasted URLs auto-fetch and format as markdown links
- [ ] Header ticks render in scrollbar track, click navigates
- [ ] Gutter dots mark block-referenced paragraphs
- [ ] ![[Note^heading]] embeds specific section content
- [ ] Replay plays back all typed changes with correct pacing
- [ ] Paste over selection shows diff overlay with accept/cancel
- [ ] Loom Mode arranges selected nodes linearly
- [ ] npm run check passes zero errors, npm run test passes all tests
- [ ] SESSION END RITUAL executed
- [ ] git tag feature-v3-GB-verified created and pushed

---

## ═══════════════════════════════════════════
## GROUP V3-C — SPATIAL & HYBRID
## 12 features. Editor and canvas as unified environment.
## Estimated time: 6–8 weeks | Model: Opus 4.6
## ═══════════════════════════════════════════

**V3-C.1 — Split-Pane Spatial Pinning (Desktop/Tablet)**
```
In (app)/+layout.svelte:
  If window.innerWidth > FEATURE_CONFIG.SPLIT_PANE_MIN_WIDTH:
    Render GraphCanvas at 35% width left pane.
    Render ThoughtEditor at 65% width right pane.
    Both panes visible simultaneously.

Node drag from canvas to editor:
  canvas.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', '[[' + draggedNode.title + ']]')
  })
  ThoughtEditor wrapper has ondragover/ondrop handlers.
  On drop: CM6 transaction inserting the wikilink text at cursor position.

On mobile: single pane only — split mode disabled.

Add to FEATURE_CONFIG:
  SPLIT_PANE_MIN_WIDTH: 1024

Add to i18n.ts:
  'layout.splitPane': 'Split View'

Execute self-review gate.
```

**V3-C.2 — Spatial Querying (near: search syntax)**
```
Extend CommandPalette.svelte to parse near: operator.

Query parsing: 'React near:State' → { text: 'React', nearTarget: 'State' }

On search with nearTarget:
  1. Find all nodes containing nearTarget text.
  2. For each: run BFS to depth FEATURE_CONFIG.SPATIAL_QUERY_DEPTH.
  3. Build Set of allowed node IDs within that neighborhood.
  4. Filter text results to only nodes in the allowed Set.

Display: results show "N hops from {nearTarget}" as subtitle.

Add to FEATURE_CONFIG:
  SPATIAL_QUERY_DEPTH: 2

Add to i18n.ts:
  'search.near': 'near'
  'search.nearHint': '{n} hops from {target}'

Execute self-review gate.
```

**V3-C.3 — Bi-Directional Viewport Sync (Live Map)**
```
Requires Split-Pane (V3-C.1) to be built first.

In ThoughtEditor.svelte:
  Hook into CM6 EditorView.update viewport changes.
  Extract visible [[wikilinks]] in current viewport using view.visibleRanges.
  Dispatch extracted titles to uiStore.visibleWikilinks: string[].

In GraphCanvas.svelte:
  $effect watching uiStore.visibleWikilinks.
  For each title in array: find corresponding node.
  If nodes found: animate camera to center on their centroid via d3.zoom transition 500ms.
  Only animate when uiStore.viewportSyncActive === true (toggle in Map toolbar).

Add to i18n.ts:
  'graph.viewportSync': 'Live Map Sync'

Execute self-review gate.
```

**V3-C.4 — Canvas Wormhole (Tethered Editing)**
```
Requires Split-Pane (V3-C.1) to be built first.

Add an SVG overlay absolutely positioned over the entire split-pane layout.
z-index: between canvas (0) and editor (10).

When a node is selected for editing:
  Read .editor-panel bounding box (top-left corner coordinates).
  Read node screen coordinates from current D3 transform.
  Draw animated SVG Bezier path from node center to editor panel corner:
    d = `M ${nodeX} ${nodeY} C ${cpX1} ${cpY1} ${cpX2} ${cpY2} ${panelX} ${panelY}`
    Stroke: var(--color-brand) at 0.4 opacity, 2px, stroke-dasharray animated.

Update path in requestAnimationFrame as node drifts.
Hide path when no node is actively selected.

Execute self-review gate.
```

**V3-C.5 — Semantic Chunking (Header-Tethered Nodes)**
```
In ThoughtEditor.svelte:
  Make H2 and H3 gutter elements draggable (HTML5 drag handle).
  On dragstart: set dataTransfer with { sourceThoughtId, headerText, headerLevel }.

In GraphCanvas.svelte:
  On drop of dragged header:
    Compute simX/simY from drop coordinates (same inversion as Create Thought Here).
    Create new thought: title = headerText, content = text under that header.
    Set parentId: sourceThoughtId and headerAnchor: headerText on new thought
      (add these optional fields to thoughts schema via version bump).
    Insert ![[headerText]] transclusion in original thought at that header position.
    Navigate to new thought.

Execute self-review gate.
```

**V3-C.6 — Text-to-Graph Explosion (List Unpacking)**
```
In ThoughtEditor.svelte:
  On selection of markdown list items (CM6 syntax detection):
    Show "Explode to graph" option in floating format toolbar (V2-B action slot).

On explode:
  Parse selected text by /^[-*] (.+)$/gm.
  For each item:
    Create thought via createThought(libraryId, item).
    Spawn at canvas position: current node position + radial offset (index * 50px radius).
    Append ![[item]] transclusion to current thought replacing the list item.

Add to FEATURE_CONFIG:
  EXPLOSION_RADIAL_OFFSET: 50

Add to i18n.ts:
  'editor.explode': 'Explode to graph'

Execute self-review gate.
```

**V3-C.7 — Spatial Portal (Inline Micro-Canvas)**
```
Add /portal to Slash command menu.

On trigger: insert a PortalWidget at cursor position.

PortalWidget.toDOM():
  Extract all [[links]] from current thought's content.
  Mount a lightweight Svelte MicroCanvas component:
    Uses same graphWorker.ts but with filtered thought subset.
    Canvas size: 100% width, 200px height.
    Zoom/pan enabled within the widget.
  Return the container element.

MicroCanvas uses the existing GraphCanvas component with a subset of nodes.
  Pass linkedThoughtIds as filter to simulation message.

Add to i18n.ts:
  'editor.slash.portal': 'Insert mini-map'

Execute self-review gate.
```

**V3-C.8 — Spatial-Semantic Regions (Smart Zones)**
```
Add "Draw Zone" mode to Map toolbar toggle.
On activate: Shift+drag draws a closed polygon path on the canvas.
On polygon close: prompt for zone tag name.

Store zones in Dexie zones table (add via version bump):
  { id, library_id, polygonPoints: [number,number][], tag: string, created_at }

In graphWorker.ts render loop (before nodes):
  Draw each zone polygon as a faint filled region.
  Zone colour: resolved from tag hash (same hashTagToHSL from V2-B.12 tagColours).

On D3 dragend of any node:
  Check if new x/y position falls inside any zone polygon (Point-in-Polygon from V3-A.16).
  If inside zone: append zone.tag to thought content via updateThought.
  If moved OUT of zone: remove zone.tag from thought content via updateThought.

Execute self-review gate.
```

**V3-C.9 — Magnetic Sector Wells (Spatial Folders)**
```
Add "Add Magnet" option to CanvasContextMenu (right-click empty canvas).
On select: prompt for topic name. Save to Dexie magnets table:
  { id, library_id, topic: string, x: number, y: number, strength: number }

In graphWorker.ts: apply custom force for each magnet:
  For nodes with matching topic:
    node.vx += (magnet.x - node.x) * alpha * magnet.strength
    node.vy += (magnet.y - node.y) * alpha * magnet.strength

Magnets rendered on canvas as large, low-opacity text labels using var(--text-muted).
Right-click magnet: delete or adjust strength.

Add to FEATURE_CONFIG:
  MAGNET_DEFAULT_STRENGTH: 0.1

Execute self-review gate.
```

**V3-C.10 — X-Ray Lens (Canvas Clipping Paths)**
```
Add "Lens" tool to Map toolbar toggle.
On activate: track mouse position. Render lens circle following cursor.

In GraphCanvas.svelte render loop (lens mode):
  Standard render first (normal zoom level).
  Then:
    ctx.save()
    ctx.beginPath()
    ctx.arc(mouseX, mouseY, FEATURE_CONFIG.LENS_RADIUS, 0, Math.PI * 2)
    ctx.clip()
    Re-render nodes inside lens at 2× zoom (scale transform applied to ctx).
    Hide edges inside lens for clarity.
    ctx.restore()

Add to FEATURE_CONFIG:
  LENS_RADIUS: 100

Add to i18n.ts:
  'graph.lens': 'Lens'

Execute self-review gate.
```

**V3-C.11 — Collision-Aware Hover Expansion**
```
In GraphCanvas.svelte:
  Track hoveredNodeId in $state.
  On mousemove: update hoveredNodeId to node under cursor (hit test).

In graphWorker.ts:
  Accept { type: 'hover'; nodeId: string | null } message.
  On hover: temporarily boost collision radius for that node:
    forceCollide().radius(d => d.id === msg.nodeId ? 40 : d.radius)
    simulation.alpha(0.3).restart()
  On hover clear: restore normal collision.

In GraphCanvas.svelte render loop for hovered node:
  Draw title at 1.5× font size.
  ctx.font = '${fontSize * 1.5}px Geist'

Execute self-review gate.
```

**V3-C.12 — Contextual Canvas Graffiti**
```
Add "Draw" mode to Map toolbar toggle.
On activate: Shift+drag on canvas draws a freehand path.

Store paths in Dexie canvas_annotations table (add via version bump):
  { id, library_id, points: [number,number][], label: string | null, created_at }

Path coordinates stored as D3 simulation coordinates (not screen pixels).
  Convert via currentTransform.invert([screenX, screenY]) on every point.
  This ensures paths stay fixed in simulation space during pan/zoom.

In GraphCanvas.svelte render loop:
  For each annotation: transform simulation coords back to screen via currentTransform.
  Draw as ctx.quadraticCurveTo path.
  Stroke: var(--color-brand) at 0.4 opacity, 2px.

Double-click annotation path to add text label.
Right-click annotation: delete.

Execute self-review gate.
```

**Group V3-C done when:**
- [ ] Split pane shows canvas left, editor right on wide screens
- [ ] Node drag from canvas to editor inserts wikilink at cursor
- [ ] near: search syntax filters by graph topology correctly
- [ ] Viewport sync pans canvas to match visible wikilinks in editor
- [ ] Wormhole SVG bezier connects active node to editor panel
- [ ] Dragging H2 gutter to canvas creates tethered child thought
- [ ] List explosion creates multiple thoughts from selected list items
- [ ] /portal embeds working mini-canvas at cursor
- [ ] Smart zones auto-tag dragged nodes
- [ ] Magnets pull tagged nodes toward set coordinates
- [ ] X-Ray Lens shows zoomed view at cursor position
- [ ] Hovered node expands title, pushes neighbors
- [ ] Freehand paths persist in simulation coordinates across zoom/pan
- [ ] npm run check passes zero errors, npm run test passes all tests
- [ ] SESSION END RITUAL executed
- [ ] git tag feature-v3-GC-verified created and pushed

---

## ═══════════════════════════════════════════
## GROUP V3-D — PLATFORM & OUTPUT
## 10 features. Output, platform integration, and synthesis.
## Estimated time: 3–4 weeks | Model: Sonnet 4.6
## ═══════════════════════════════════════════

**V3-D.1 — Broadcast Sync (Multi-Window BroadcastChannel)**
```
Create src/lib/broadcastSync.ts.

const bc = new BroadcastChannel('flought_sync')

export function broadcastDocUpdate(thoughtId: string, content: string): void
  bc.postMessage({ type: 'doc_update', thoughtId, content })

export function onDocUpdate(callback: (thoughtId: string, content: string) => void): () => void
  const handler = (event: MessageEvent) => {
    if event.data.type === 'doc_update': callback(event.data.thoughtId, event.data.content)
  }
  bc.addEventListener('message', handler)
  return () => bc.removeEventListener('message', handler)

In ThoughtEditor.svelte:
  In CM6 updateListener: call broadcastDocUpdate after debounce (alongside Dexie save).
  On mount: register onDocUpdate listener. If message matches current thoughtId:
    Apply incoming content to CM6 via dispatchBroadcast (flag to prevent re-broadcast loop).
  On unmount: call returned cleanup function.

Execute self-review gate.
```

**V3-D.2 — Deep-Link State Memory (URL-Encoded Viewport)**
```
In map/+page.svelte:
  Throttle D3 zoom event to update URL params every 500ms:
    window.history.replaceState({}, '', '?x=' + Math.round(transform.x)
      + '&y=' + Math.round(transform.y) + '&z=' + transform.k.toFixed(2))
  Do not trigger SvelteKit navigation — replaceState only.

On GraphCanvas mount:
  Read $page.url.searchParams for x, y, z.
  If present: apply d3.zoomIdentity.translate(x, y).scale(z) immediately (no animation).

Execute self-review gate.
```

**V3-D.3 — Chain-of-Thought Exporter**
```
In GraphCanvas.svelte:
  Track chainStartNode and chainEndNode in $state.
  "Select chain start" and "Select chain end" items in NodeContextMenu.

On both nodes selected:
  Run Dijkstra's shortest path algorithm (pure function, no worker needed for single call):
    function dijkstra(startId, endId, edges): string[]
    Returns ordered array of node IDs along shortest path.
  Fetch content for each node in path.
  Build export text:
    for each nodeId in pathArray:
      thought = await getThought(nodeId)
      text += '# ' + thought.title + '\n\n' + thought.content + '\n\n---\n\n'
  navigator.clipboard.writeText(text)
  toastStore.add($t('export.chainCopied').replace('{n}', pathArray.length), 'success')

Add to i18n.ts:
  'export.chainCopied': 'Chain of {n} thoughts copied'
  'graph.chainStart': 'Set as chain start'
  'graph.chainEnd': 'Export chain to here'

Execute self-review gate.
```

**V3-D.4 — Thought Playlists**
```
Create src/routes/(app)/queue/+page.svelte using Svelte 5 Runes.

State: queueIds from uiStore.thoughtQueue: string[] ($state).

Data: on mount, fetch each thought by ID from db.ts.
Render: stacked thought titles with content previews. Read-only markdown rendering.
  Scroll is continuous — no pagination.

Add to GraphCanvas.svelte:
  Shift+click adds node to uiStore.thoughtQueue (not remove — only additive here).
  Long-press on mobile: same.

Sidebar "Queue" badge shows count when uiStore.thoughtQueue.length > 0.
"Read Queue" button in sidebar navigates to /queue.
"Clear queue" button on /queue page.

Add to uiStore.svelte.ts:
  thoughtQueue: $state<string[]>([])

Add to i18n.ts:
  'nav.queue': 'Queue'
  'queue.empty': 'Queue is empty'
  'queue.clear': 'Clear queue'
  'queue.add': 'Add to queue'

Execute self-review gate.
```

**V3-D.5 — Semantic Anchor (Global Sticky Paragraph)**
```
In ThoughtEditor.svelte context menu (right-click on paragraph):
  Item: $t('anchor.set') → stores { text: selectedParagraph, sourceId: thoughtId } in uiStore.anchor.

In (app)/+layout.svelte (outside {#key} transition, same level as ToastManager):
  {#if uiStore.anchor.isActive}
    <div class="semantic-anchor" ...>
      <p>{uiStore.anchor.text}</p>
      <a href="/thought/{uiStore.anchor.sourceId}">{$t('anchor.returnTo')}</a>
      <button onclick={() => uiStore.anchor.isActive = false}>{$t('anchor.dismiss')}</button>
    </div>
  {/if}

Anchor persists across route changes because it is mounted outside the {#key} block.

Add to uiStore.svelte.ts:
  anchor: $state<{text: string, sourceId: string, isActive: boolean}>
    ({ text: '', sourceId: '', isActive: false })

Add to i18n.ts:
  'anchor.set': 'Anchor this paragraph'
  'anchor.returnTo': 'Return to source'
  'anchor.dismiss': 'Dismiss'

Execute self-review gate.
```

**V3-D.6 — Tributary Reader (Inbound Synthesis)**
```
In ThoughtEditor.svelte:
  Add "Show Tributaries" toggle button in editor header.

On activate (uiStore.tributariesActive === true):
  Call getBacklinksForThought(thought.title) from db.ts (already returns full Thought[]).
  For each backlink: extract the paragraph(s) containing [[thought.title]].
    paragraphs = backlink.content.split('\n\n')
    matchingParas = paragraphs.filter(p => p.includes('[[' + thought.title + ']]'))
  Render matching paragraphs as read-only blocks ABOVE the editor.
    Each block: paragraph text + link to source thought.

Styling: same as BacklinkFooter from V1 B.5 but rendered above, not below.

Execute self-review gate.
```

**V3-D.7 — Concept Lensing (Topic Illumination)**
```
In Sidebar.svelte:
  On long-press (mobile) or Ctrl+click (desktop) on a topic tag:
    Set uiStore.activeLens = topicTag.

In ThoughtEditor.svelte:
  $effect watching uiStore.activeLens.
  If lens active: post lens query to CM6 extension.

Create src/components/editor/extensions/conceptLens.ts.
Export createConceptLens(getLens: () => string | null): Extension.

A CM6 ViewPlugin:
  If getLens() is null: no decorations.
  If getLens() has value:
    Apply .dim-all class to editor wrapper.
    Scan document for lines containing the lens text.
    Apply Decoration.line({ class: 'cm-lens-highlight' }) to matching lines.

In app.css:
  .editor-wrapper.dim-all .cm-line { opacity: 0.15; transition: opacity 200ms; }
  .editor-wrapper.dim-all .cm-lens-highlight { opacity: 1 !important; }

Execute self-review gate.
```

**V3-D.8 — Temporal Context (On This Day)**
```
In ThoughtEditor.svelte (below BacklinkFooter from V1 B.5):
  On mount: query thoughts created on the same calendar day as current thought
    (any year — just month+day match).
  Exclude current thought. Limit 3.

Create src/components/editor/TemporalContext.svelte using Svelte 5 Runes.
  Props: currentThoughtCreatedAt: number

  Query: all thoughts where:
    new Date(t.created_at).getMonth() === targetMonth
    AND new Date(t.created_at).getDate() === targetDay
    AND t.id !== currentThoughtId
  Limit 3 results.

  Renders below BacklinkFooter. Only shown if results.length > 0.
  Heading: $t('temporal.heading')
  Each result: year + title as navigation link.

Add to i18n.ts:
  'temporal.heading': 'On this day'

Execute self-review gate.
```

**V3-D.9 — Atomic Threading (Linear Compilation)**
```
In GraphCanvas.svelte:
  Select sequence of connected nodes via ordered Shift+click.
  Track uiStore.threadQueue: string[] (ordered selection).
  "View Thread" button appears in Map toolbar when threadQueue.length >= 2.

Create src/routes/(app)/thread/+page.svelte using Svelte 5 Runes.

Data: fetches thoughts in threadQueue order from db.ts.
Renders each thought as a full CM6 editor instance (stacked vertically).

Keyboard wiring:
  In each CM6 instance: bind ArrowDown at document end → focus next CM6 instance.
  Bind ArrowUp at document start → focus previous CM6 instance.
  All instances use full updateThought flow on change.

Add to i18n.ts:
  'thread.heading': 'Thread'
  'thread.add': 'Add to thread'
  'thread.clear': 'Clear thread'
  'nav.thread': 'Thread'

Execute self-review gate.
```

**V3-D.10 — Presentation Lens (Zen Slide Mode)**
```
Add "Present" button to ThoughtEditor.svelte toolbar.

On activate (uiStore.presentationMode === true):
  Hide: Sidebar, MobileDock, BacklinkFooter, TemporalContext, all toolbar buttons.
  Show: editor content only, centered, max-width 680px.
  Font size: 1.4× base (apply --presentation-scale CSS variable).
  Apply scroll-snap-type: y mandatory to editor scroll container.
  Apply scroll-snap-align: start to each H1/H2 CM6 line element.

This makes H1/H2 headers act as slide boundaries.

On Escape or button: restore normal layout.

Add to app.css:
  .presentation-mode { --presentation-scale: 1.4; }
  
Add to i18n.ts:
  'editor.present': 'Present'
  'editor.present.exit': 'Exit presentation'

Execute self-review gate.
```

**Group V3-D done when:**
- [ ] Multi-window edits sync instantly via BroadcastChannel
- [ ] URL params encode zoom/pan, restore on load
- [ ] Chain-of-Thought exports shortest path as clipboard markdown
- [ ] Thought Playlists queue nodes, render as continuous reading view
- [ ] Anchor persists across route changes, dismisses on button
- [ ] Tributaries show inbound paragraphs above editor when toggled
- [ ] Concept Lensing dims non-matching lines, highlights matching
- [ ] Temporal Context shows same-day thoughts across years
- [ ] Thread view renders multiple CM6 instances with keyboard navigation
- [ ] Presentation Mode snaps to H1/H2 slide boundaries
- [ ] npm run check passes zero errors, npm run test passes all tests
- [ ] SESSION END RITUAL executed
- [ ] git tag feature-v3-GD-verified created and pushed

---

## V3 COMPLETE WHEN

- [ ] All 4 V3 groups pass their done-when checklists
- [ ] npm run check passes zero errors, zero warnings
- [ ] npm run test passes all tests
- [ ] PageRank scores display on thought pages (manual test)
- [ ] Traversed edges visibly thicker than new edges (manual test)
- [ ] Split pane renders on wide screen, drag-to-editor works (manual test)
- [ ] near: search returns topologically filtered results (manual test)
- [ ] git tag feature-v3-complete created
- [ ] session-handover.md updated
- [ ] progress.md DECISIONS LOG updated

---

## WHAT NEEDS TO CHANGE IN OTHER FILES

### progress.md
Add phase entries for each V2 and V3 group as they complete.
Use existing DECISIONS LOG format:
  [FEATURE V2-A] [FEATURE V2-B] ... [FEATURE V3-D]

### session-handover.md
Overwrite at end of every session with current version, group, task, build status.
Note whether working on V2 or V3 explicitly.

### verification-checklist.md
Add V2 feature gate section:
  [ ] Ghost nodes visible for unresolved [[links]]
  [ ] Semantic Zoom switches at correct thresholds
  [ ] Vapor Note self-destructs after 24h
  [ ] Typed links [[Blocks::]] draw coloured arrow edges

Add V3 feature gate section:
  [ ] PageRank scores computed and displayed
  [ ] Delta snapshots allow time-travel reconstruction
  [ ] Spatial queries with near: filter by topology
  [ ] BroadcastChannel syncs multi-window edits instantly

### CLAUDE.md
No changes needed. All 12 rules satisfied throughout.

### featurev1.md
No changes needed. V1 forward-compatibility hooks remain as-is.
