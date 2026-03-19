# FLOUGHT — FEATURE BUILD PLAN V1
# 18 features across 6 groups.
# Hand one task at a time to Claude Code. Never combine tasks. Never skip rituals.
# This file governs 0 → 1,000 users. V2 features live in featurev2.md.

---

## WHY THIS FILE EXISTS

Phase 11 ships the core app. This file governs every feature added post-launch
up to the 1,000-user threshold. Scope is locked to 18 features chosen by four
criteria evaluated simultaneously: structural integrity of the graph, daily
utility, launch differentiation, and zero high-performance risk.

Every feature here is also designed with forward compatibility. Where a V1
feature will be extended in V2 or V3, the architecture is laid down now so
no V1 code needs to be rewritten later — only extended.

---

## ARCHITECTURAL VIOLATIONS CAUGHT IN PLANNING

These violations exist in the Gemini feature specifications. Every task below
corrects them before any code is written.

| Fix | Source violation | Resolution |
|-----|-----------------|------------|
| FIX-V1-1 | Gemini uses `crypto.randomUUID()` throughout | All IDs via `generateId()` from `$lib/uuid.ts` only — Rule 3 |
| FIX-V1-2 | Gemini uses `meta_state: 'inbox'` string literals | meta_state is always integer 1–4, never a string — CLAUDE.md schema |
| FIX-V1-3 | Janitor worker imports Dexie directly | Workers have NO Dexie imports. Worker receives data via postMessage, returns replacements, main thread writes via db.ts — Rule 2 |
| FIX-V1-4 | Backlink footer uses liveQuery directly in component | Component calls db.ts exported function only. No Dexie in .svelte files — Rule 2 |
| FIX-V1-5 | Autocomplete queries Dexie on every keystroke | Query once on mount, store in memory array, filter in memory only. Never query on keystrokes |
| FIX-V1-6 | Gemini code uses hardcoded hex colours | All colours via CSS variables from app.css — Rule 8 |
| FIX-V1-7 | Gemini animations use width/height/background-color | Animations via transform and opacity only — Rule 9 |
| FIX-V1-8 | Sticky Headers CSS uses color-mix() | Replace with rgba() via hexToRgb() — established pattern from Phase 9 |
| FIX-V1-9 | Thermal Calendar uses Tailwind class names | Pure CSS with CSS variables only |
| FIX-V1-10 | Gemini code calls db directly from workers | Workers are pure computation only — receive via postMessage, return via postMessage |
| FIX-V1-11 | Gemini uses hardcoded magic numbers throughout | All tuneable values in `FEATURE_CONFIG` exported from `src/lib/config.ts` |
| FIX-V1-12 | Floating toolbar uses window.getSelection() without viewport guard | Must clamp toolbar position to viewport edges — never overflow |
| FIX-V1-13 | Gemini strings are hardcoded in component templates | All user-visible strings via `$t()` from `src/lib/i18n.ts` |

---

## FORWARD COMPATIBILITY DESIGN

These decisions are made NOW so V2/V3 features slot in without rewriting V1 code.

### Schema additions (Group A) that unblock V2/V3

| Field added in V1 | Unblocks in V2 | Unblocks in V3 |
|-------------------|---------------|----------------|
| `aliases: string[]` on thoughts | Phantom Edge auto-suggest, Semantic Auto-Linking | — |
| `last_viewed_at: number` on thoughts | Echo/Spaced Repetition, Dead Weight Pruning | Lock-Screen deep-link |
| `traversal_count: number` on edges | Organic Pathways/Mycelial Routing, Synaptic Pruning | — |
| `is_triaged: boolean` on thoughts | Capture Triage Dots (V1 Group D) | — |
| `word_count: number` on thoughts | Gravitational Mass, Flow Ring | Cognitive Load Bar |

### Config additions that unblock V2/V3

All tuneable values go into `FEATURE_CONFIG` in `src/lib/config.ts` now.
V2 features read the same config object — they only add new keys or change defaults.

| Config key | V1 use | V2/V3 extension |
|------------|--------|-----------------|
| `THERMAL_CALENDAR_DAYS: 28` | 4-week grid | V2 sets to 365 for year view |
| `AUTOCOMPLETE_MAX_TERMS: 500` | Vault terms cap | V2 raises when semantic matching added |
| `JANITOR_BATCH_SIZE: 50` | Rename propagation batch | V3 raises for bulk import rename |
| `GHOST_NODE_OPACITY: 0.35` | Unresolved link rendering | V2 adjusts on click-to-create hover |
| `FOLD_PERSIST: false` | Fold state session-only | V2 flips true, persists to Dexie |
| `TOOLBAR_ACTIONS` array | B/I/Code/Link buttons | V2 appends AI rewrite action to same array |
| `SERENDIPITY_INTERVAL_MS: 86400000` | Daily collision timer | V2 plugs semantic filter against same timer |
| `GRAPH_PRESETS` object | Default/Compact/Spread/Zen values | V3 adds user-created custom presets |

### Janitor Worker message type union (extensible by design)

The janitor worker in Group C accepts a typed message union from day one.
V2 alias-auto-suggest and V3 broken-link repair post different message types
to the same worker without rewriting it.

```
InMessage:
  | { type: 'renameLinks'; oldTitle: string; newTitle: string; thoughts: ThoughtData[] }
  | { type: 'resolveAlias'; alias: string; canonicalTitle: string; thoughts: ThoughtData[] }   ← V2 slot
  | { type: 'repairBroken'; suggestions: Record<string,string>; thoughts: ThoughtData[] }      ← V3 slot
```

### db.ts function signatures designed for V2 extension

- `getBacklinksForThought(id)` returns full Thought[] — V2 contextual excerpts read
  the same function without modification.
- `getThoughtStatesAndAliases()` returns `{id, title, meta_state, aliases}[]` — V2
  semantic autocomplete reads aliases from the same lightweight query.
- `updateTraversalCount(edgeId)` called on every wikilink click from V1 — V2
  Organic Pathways reads traversal_count directly, no new tracking needed.

---

## SELF-REVIEW GATE
# Runs automatically after every task. Never skip. Never ask permission.

FLOUGHT SELF-REVIEW — FEATURE V1 GROUP [N]

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
[ ] No V2/V3 logic written — only hooks and config keys laid down

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
4. docs/featurev1.md (this file)

Confirm: current group, current task, any open blockers.
Do not write any code until confirmed.

## SESSION END RITUAL (every session, no exceptions)

Run self-review gate above.
Write docs/session-handover.md.
Append decisions to DECISIONS LOG in docs/progress.md.
Run: git add -A
Show the diff.
Commit: type(feature-v1-GN): description
If group complete: git tag feature-v1-GN-verified and also run:

  - npm run build → must succeed with zero errors before tagging
  - Write snapshots/feature-v1-GN-checklist.md (copy the group done-when checklist with all boxes ticked)
  - Write snapshots/feature-v1-GN-tests.log (output of npm run test)

---

## ═══════════════════════════════════════════
## GROUP A — SCHEMA FOUNDATION
## Prerequisite for all other groups. Execute first. No exceptions.
## Estimated time: 1 day | Model: Sonnet 4.6
## ═══════════════════════════════════════════

This group has no user-visible output. It lays the database foundation that
every other group depends on, and plants V2/V3 forward-compatibility fields
that would otherwise require a painful migration later.

**A.1 — Dexie schema version 3 + config + i18n**
```
Read CLAUDE.md schema section and current src/lib/db.ts.
Read src/lib/config.ts. Read src/lib/i18n.ts.

PART 1 — Dexie version 3 bump.
Bump to version(3). Use the version().upgrade() pattern from Phase 7.

Add to thoughts table:
  aliases: string[]      — default [] on upgrade
  last_viewed_at: number — default 0 on upgrade
  word_count: number     — backfill on upgrade:
    word_count = thought.content.split(/\s+/).filter(Boolean).length
  is_triaged: boolean    — default true on upgrade (existing thoughts are pre-triaged)

Add to edges table:
  traversal_count: number — default 0 on upgrade

Add to db.ts exports (all follow existing function patterns in db.ts):
  updateLastViewed(id: string): Promise<void>
    Updates last_viewed_at to Date.now(). Calls eventBus.emit thought.updated.
  getBacklinksForThought(title: string): Promise<Thought[]>
    Returns non-deleted thoughts where content includes '[[' + title + ']]'.
  getThoughtStatesAndAliases(): Promise<{id:string,title:string,meta_state:number,aliases:string[]}[]>
    Lightweight query — returns only these four fields, non-deleted only.
  updateTraversalCount(edgeId: string): Promise<void>
    Increments traversal_count by 1.
  markTriaged(id: string): Promise<void>
    Sets is_triaged = true. Calls eventBus.emit thought.updated.

PART 2 — FEATURE_CONFIG in config.ts.
Add FEATURE_CONFIG export object:
  THERMAL_CALENDAR_DAYS: 28
  AUTOCOMPLETE_MAX_TERMS: 500
  JANITOR_BATCH_SIZE: 50
  GHOST_NODE_OPACITY: 0.35
  FOLD_PERSIST: false
  SERENDIPITY_INTERVAL_MS: 86400000
  TOOLBAR_ACTIONS: [
    { id: 'bold',   i18nKey: 'feature.toolbar.bold',   wrap: ['**','**'] },
    { id: 'italic', i18nKey: 'feature.toolbar.italic', wrap: ['*','*']   },
    { id: 'code',   i18nKey: 'feature.toolbar.code',   wrap: ['`','`']   },
    { id: 'link',   i18nKey: 'feature.toolbar.link',   wrap: ['[','](url)'] },
  ]
  GRAPH_PRESETS: {
    default: { nodeSize:6,  edgeOpacity:0.15, repulsion:200, linkDistance:120, settleSpeed:0.028 },
    compact: { nodeSize:5,  edgeOpacity:0.10, repulsion:120, linkDistance:70,  settleSpeed:0.04  },
    spread:  { nodeSize:7,  edgeOpacity:0.20, repulsion:340, linkDistance:180, settleSpeed:0.02  },
    zen:     { nodeSize:8,  edgeOpacity:0.06, repulsion:280, linkDistance:160, settleSpeed:0.015 },
  }

PART 3 — i18n keys in i18n.ts DEFAULT_STRINGS.
Add:
  'feature.backlinks.heading': 'Linked Mentions',
  'feature.backlinks.empty': 'Nothing links here yet',
  'feature.ghostNode.label': 'Not created yet',
  'feature.autocomplete.placeholder': 'Search your vault…',
  'feature.toolbar.bold': 'Bold',
  'feature.toolbar.italic': 'Italic',
  'feature.toolbar.code': 'Code',
  'feature.toolbar.link': 'Link',
  'feature.calendar.heading': 'Activity',
  'feature.serendipity.heading': 'Serendipity',
  'feature.serendipity.prompt': 'Is there a connection between',
  'feature.serendipity.cta': 'Create Link',
  'feature.triage.unread': 'New',
  'feature.copyWikilink.success': 'Wikilink copied',
  'feature.copyWikilink.error': 'Copy failed',
  'feature.createHere.label': 'Create thought here',
  'feature.fold.open': 'Expand section',
  'feature.fold.close': 'Collapse section',
  'feature.theme.midnight': 'Midnight',
  'feature.theme.light': 'Light',
  'feature.stageLabels.heading': 'Stage names',
  'feature.shortcuts.heading': 'Keyboard shortcuts',
  'feature.graphControls.heading': 'Graph Controls',
  'editor.linksUpdated': 'Updated {count} linked thoughts',
  'graph.copyWikilink': 'Copy Wikilink',
  'graph.createHere': 'Create thought here',
  'graph.resetViewport': 'Reset viewport',
  'graph.settleGraph': 'Settle graph',

Run: npm run check. Run: npm run test.
```

**Group A done when:**
- [ ] Dexie version 3 migration runs cleanly on existing data without data loss
- [ ] All 5 new thought fields and 1 new edge field present with correct defaults
- [ ] All 5 new db.ts functions exported, typed, and pass npm run check
- [ ] FEATURE_CONFIG exported from config.ts with all keys above
- [ ] All i18n keys added — verified by grepping DEFAULT_STRINGS
- [ ] npm run check passes zero errors
- [ ] npm run test passes all existing tests
- [ ] SESSION END RITUAL executed — session-handover.md written
- [ ] git tag feature-v1-GN-verified created and pushed
---

## ═══════════════════════════════════════════
## GROUP B — CM6 EDITOR EXTENSIONS
## 7 features. All touch ThoughtEditor.svelte once per task.
## Estimated time: 2–3 weeks | Model: Sonnet 4.6
## ═══════════════════════════════════════════

All 7 features share the same CM6 extension array in ThoughtEditor.svelte.
Build in dependency order. Each task adds one extension and closes the file.

**B.1 — Illusionist Formatting (Syntax Hiding)**
```
Read CLAUDE.md. Read src/components/editor/ThoughtEditor.svelte.
Read skill: epic-design.

Create src/components/editor/extensions/syntaxHiding.ts.
Export createSyntaxHiding(): Extension.

A CM6 ViewPlugin that walks the visible syntax tree on every update.
For each formatting node (StrongEmphasis, Emphasis, ATXHeadingMarker,
CodeMark, LinkMark): check if view.state.selection.main.head overlaps
the node's from/end positions.

If cursor is OUTSIDE the node:
  Apply Decoration.mark({ class: 'cm-syntax-hidden' })
If cursor is INSIDE the node:
  No decoration — raw syntax visible for editing.

Add to app.css:
  .cm-syntax-hidden { font-size: 0; opacity: 0; }

For ATXHeadingMarker lines apply line decorations using CSS variables only:
  Add to :root in app.css:
    --editor-h1-size: 1.5rem
    --editor-h2-size: 1.25rem
    --editor-h3-size: 1.1rem
  Classes .cm-h1 / .cm-h2 / .cm-h3 set font-size and font-weight only.
  No colour changes — heading text inherits var(--text-primary).

Wire into ThoughtEditor.svelte extensions array.
Execute self-review gate.
```

**B.2 — Semantic Folding (Collapse Sections)**
```
Read CLAUDE.md. Read ThoughtEditor.svelte.
Check package.json — @codemirror/language may already be installed (Phase 3).
Install only if missing.

Create src/components/editor/extensions/semanticFolding.ts.
Export createSemanticFolding(): Extension[].

Returns [foldGutter({ markerDOM }), keymap.of(foldKeymap)].

markerDOM(open: boolean): HTMLElement
  Returns a <span> with inline SVG chevron (6×6px).
  Uses var(--text-muted) fill — no hardcoded hex.
  Rotates 90deg when open via CSS class + transform — Rule 9.
  aria-label: open ? $t('feature.fold.open') : $t('feature.fold.close')
  data-line attribute set for V2 persistence hook.

FOLD_PERSIST from FEATURE_CONFIG is false in V1 — fold state is session-only.
V2 sets it to true and reads data-line to persist to Dexie.

Wire into ThoughtEditor.svelte after syntaxHiding.
Execute self-review gate.
```

**B.3 — Vault-Aware Autocomplete**
```
Read CLAUDE.md. Read ThoughtEditor.svelte. Read src/lib/db.ts.
Check package.json — @codemirror/autocomplete may already be installed.
Install only if missing.

Create src/components/editor/extensions/vaultAutocomplete.ts.
Export createVaultAutocomplete(terms: string[]): Extension.
Export vaultCompletionSource (function only, for V2 semantic wrapper).

Terms array built ONCE on editor mount from getThoughtStatesAndAliases().
Includes: all thought titles + all aliases + all unique topic values.
Capped at FEATURE_CONFIG.AUTOCOMPLETE_MAX_TERMS.
Zero Dexie reads per keystroke.

matchBefore targets /\w*/ for general words and /\[\[[\w\s]*/ for wikilinks.
Filtering: case-insensitive substring match.
Boost 2 for exact prefix matches, boost 1 for substring matches.

On thought navigation (thought ID changes): rebuild terms array once.

Wire into ThoughtEditor.svelte.
Execute self-review gate.
```

**B.4 — Floating Format Toolbar**
```
Read CLAUDE.md. Read ThoughtEditor.svelte.
Read skill: epic-design, ui-ux-pro-max.

Create src/components/editor/FloatingToolbar.svelte using Svelte 5 Runes.

Trigger: selectionchange event on editor wrapper div.
Hide if: selection.isCollapsed or selection length === 0.

Position math:
  rect = range.getBoundingClientRect()
  x = rect.left + rect.width / 2
  y = rect.top + window.scrollY - 48
  Clamp x: Math.max(8, Math.min(window.innerWidth - componentWidth - 8, x))
  Clamp y: Math.max(8, y)

Actions from FEATURE_CONFIG.TOOLBAR_ACTIONS array — not hardcoded in template.
On action click: dispatch CM6 transaction wrapping selection in action.wrap.
Re-focus editor after every dispatch.

Mobile guard: if Capacitor.isNativePlatform() do not render — OS handles selection.

Styling:
  position: fixed, z-index: 400
  background: var(--bg-panel)
  border: 1px solid var(--border-strong)
  backdrop-filter: blur(12px) gated behind @media (min-width: 768px) — FIX-20 pattern
  Appear: opacity 0→1 + translateY(-4px→0), 120ms — Rule 9
  Disappear: opacity 1→0 + translateY(0→-4px), 80ms — Rule 9

Mount FloatingToolbar inside ThoughtEditor.svelte wrapper div.
Execute self-review gate.
```

**B.5 — Ambient Backlink Footer**
```
Read CLAUDE.md. Read ThoughtEditor.svelte. Read src/lib/db.ts.
Read skill: epic-design.

Create src/components/editor/BacklinkFooter.svelte using Svelte 5 Runes.

Props: thoughtTitle: string

On mount and on thoughtTitle change:
  Call getBacklinksForThought(thoughtTitle) from db.ts.
  Returns full Thought[] — V2 excerpt reads same data, no function change.

Only render when backlinks.length > 0.

Layout:
  border-top: 1px solid var(--border), margin-top: 3rem, padding-top: 1.5rem
  Heading: $t('feature.backlinks.heading') — var(--text-muted), 11px uppercase
  List: each backlink as a navigation link to /thought/{id}
    Shows: title + pipeline stage pill using PIPELINE_STATES colour from config.ts
    Min tap target: 44×44px — mobile gate
    data-thought-id attribute set for V2 excerpt hook

Appear: opacity 0→1 on mount, 200ms — Rule 9.

Mount BacklinkFooter inside ThoughtEditor.svelte below the CodeMirror instance.
Execute self-review gate.
```

**B.6 — Read-State Anchor (Scroll Memory)**
```
Read CLAUDE.md. Read src/routes/(app)/thought/[id]/+page.svelte.

Create src/lib/scrollMemory.ts:
  export function saveScrollPosition(thoughtId: string, pos: number): void
    localStorage.setItem('scroll_' + thoughtId, String(pos))
  export function getScrollPosition(thoughtId: string): number
    return parseInt(localStorage.getItem('scroll_' + thoughtId) || '0', 10)
  export function clearScrollPosition(thoughtId: string): void
    localStorage.removeItem('scroll_' + thoughtId)

Storage is isolated in this module so V2 can swap backend to Dexie
by changing this file only — no component changes needed.

In thought/[id]/+page.svelte:
  onMount:
    scrollContainer.scrollTop = getScrollPosition(thoughtId)
    updateLastViewed(thoughtId)   ← db.ts function from Group A
  onDestroy:
    saveScrollPosition(thoughtId, scrollContainer.scrollTop)

Identify the scroll container element — use the existing editor wrapper div.
Add data-scroll-container attribute if no stable ref exists.

Execute self-review gate.
```

**B.7 — Smart Bullet Point Continuation**
```
Read CLAUDE.md. Read ThoughtEditor.svelte.
Check package.json — @codemirror/lang-markdown likely installed in Phase 3.

Create src/components/editor/extensions/smartLists.ts.
Export createSmartLists(): Extension.

Uses markdownKeymap from @codemirror/lang-markdown.
  Enter → insertNewlineContinueMarkup
    Continues - / * / N. lists. Exits list on empty item.
  Tab → indentMore (nests list item)
  Shift-Tab → indentLess (unnests list item)

Add to app.css for list visual alignment:
  .cm-content .cm-line[data-list] { padding-left: 1.5em; text-indent: -1.5em; }
  Uses var(--text-primary) — no colour changes.

Wire into ThoughtEditor.svelte as the final extension in the array.
Execute self-review gate.
```

**Group B done when:**
- [ ] Syntax characters hide when cursor is elsewhere, reveal on cursor entry
- [ ] H1/H2/H3 render with correct visual hierarchy via CSS variables
- [ ] Fold chevrons appear on headers and lists, collapse/expand correctly
- [ ] Autocomplete suggests vault titles and aliases, zero Dexie reads per keystroke
- [ ] Floating toolbar appears on text selection, desktop/web only
- [ ] All 4 toolbar actions wrap selection in correct markdown syntax
- [ ] Backlink footer populated and navigates correctly
- [ ] Scroll position restored on thought reopen
- [ ] last_viewed_at updated on every thought open
- [ ] Enter continues lists, Tab nests, Shift-Tab unnests
- [ ] No hardcoded hex values in any extension — verified
- [ ] No hardcoded strings — all via $t() — verified
- [ ] npm run check passes zero errors
- [ ] npm run test passes all tests
- [ ] SESSION END RITUAL executed — session-handover.md written
- [ ] git tag feature-v1-GN-verified created and pushed

---

## ═══════════════════════════════════════════
## GROUP C — GRAPH INTEGRITY
## 3 features. Most critical to user retention. Build before any visual work.
## Estimated time: 1.5–2 weeks | Model: Opus 4.6
## ═══════════════════════════════════════════

**C.1 — Auto-Refactoring Links (Janitor Worker)**
```
Read CLAUDE.md. Read src/workers/graphWorker.ts (pattern reference only).
Read src/lib/db.ts. Read skill: senior-frontend.

Create src/workers/janitorWorker.ts.
NO Dexie imports. NO DOM access. Pure computation — mirrors graphWorker pattern.

ThoughtData type: { id: string; content: string }

InMessage union — all three types defined now, only renameLinks has logic in V1:
  | { type: 'renameLinks'; oldTitle: string; newTitle: string; thoughts: ThoughtData[]; batchSize: number }
  | { type: 'resolveAlias'; alias: string; canonicalTitle: string; thoughts: ThoughtData[]; batchSize: number }
  | { type: 'repairBroken'; suggestions: Record<string,string>; thoughts: ThoughtData[]; batchSize: number }

OutMessage:
  | { type: 'renameResult'; updates: Array<{ id: string; content: string }>; batchIndex: number; totalBatches: number }
  | { type: 'unsupported'; requestedType: string }

Handler for 'renameLinks':
  oldLink = '[[' + oldTitle + ']]'
  newLink = '[[' + newTitle + ']]'
  Filter to thoughts containing oldLink.
  Replace all occurrences via replaceAll.
  Chunk into batches of batchSize.
  Post each batch as renameResult with batchIndex and totalBatches.

Handler for 'resolveAlias' and 'repairBroken':
  Post { type: 'unsupported', requestedType: msg.type }
  These handlers are V2/V3 — stubs only in V1.

Create src/lib/janitorService.ts:
  Singleton janitorWorker instance.
  export async function propagateRename(oldTitle: string, newTitle: string): Promise<number>
    1. getThoughtsByLibrary(activeLibraryId) from db.ts.
    2. Post renameLinks message with FEATURE_CONFIG.JANITOR_BATCH_SIZE.
    3. On each renameResult batch: call updateThought(id, { content }) per update.
    4. After final batch (batchIndex === totalBatches - 1):
       call rebuildEdgesForThought for each updated thought id.
       emit eventBus thought.updated for each.
    5. Return total update count.

Wire propagateRename into ThoughtEditor.svelte title input onBlur handler.
  Only fires if title changed (compare prev vs current).
  On return value > 0: toastStore.add($t('editor.linksUpdated').replace('{count}', count))

Execute self-review gate.
```

**C.2 — Ghost Nodes (Unresolved Wikilinks on Map)**
```
Read CLAUDE.md. Read src/workers/graphWorker.ts.
Read src/components/graph/GraphCanvas.svelte.
Read src/components/graph/GraphNode.ts.

In graphWorker.ts, extend the 'simulate' message handler:
  After building the nodes array, extract all [[link]] titles from content strings.
  Build Set of all existing thought titles.
  For each link title not in the set:
    Push ghost node: { id: 'ghost-' + title, title, isGhost: true, meta_state: 0, x: 0, y: 0 }
  Ghost nodes join the D3 simulation with charge strength divided by 2 to avoid
  dominating the layout.
  Receive ghostOpacity from message payload — never hardcoded.

Update worker InMessage type to include ghostOpacity: number in simulate payload.

In GraphCanvas.svelte:
  Resolve ghost colour using getComputedStyle pattern from Phase 9.
  Pass ghostOpacity: FEATURE_CONFIG.GHOST_NODE_OPACITY to worker.
  On ghost node click: set uiStore.sparkInputPrefill = node.title, open SparkInput.

In GraphNode.ts, extend drawNode():
  Add isGhost: boolean = false param.
  If isGhost:
    ctx.save()
    ctx.setLineDash([4, 4])
    ctx.globalAlpha = ghostOpacity  ← passed in, not hardcoded
    Draw stroke-only circle (no fill).
    ctx.setLineDash([])
    ctx.restore()
  Ghost nodes skip label render when zoom < labelZoomThreshold.

Execute self-review gate.
```

**C.3 — Phantom Edge / Alias Engine**
```
Read CLAUDE.md. Read src/lib/db.ts. Read ThoughtEditor.svelte.
Read src/components/editor/FrontmatterMask.svelte.
Read skill: senior-frontend.

aliases field was added to thoughts schema in Group A.

In db.ts, extend rebuildEdgesForThought():
  Current logic matches [[link]] text against thought titles.
  Extend: also match against aliases array.
  When a link matches an alias, the edge target is the canonical thought
  (the thought whose aliases array contains the matched alias).
  No change to edge schema — link_type differentiates if needed in V2.

Add to db.ts:
  export async function addAlias(thoughtId: string, alias: string): Promise<void>
    Get thought. Dedup. Push to aliases. Call updateThought(id, { aliases }).
  export async function removeAlias(thoughtId: string, alias: string): Promise<void>
    Get thought. Filter alias out. Call updateThought(id, { aliases }).

In FrontmatterMask.svelte, add Aliases row:
  Displays current aliases as removable pills.
  Uses existing pill styling in FrontmatterMask — no new CSS patterns introduced.
  Input field: on blur calls addAlias(thoughtId, value.trim()) if non-empty.
  Pill × button: calls removeAlias(thoughtId, alias).
  Label: $t('feature.aliases') — add this key to i18n.ts: 'feature.aliases': 'Aliases'

vaultAutocomplete (Group B.3) already includes aliases in terms array.
No changes to autocomplete needed.

Execute self-review gate.
```

**Group C done when:**
- [ ] Rename a thought title → all [[OldTitle]] in vault update to [[NewTitle]]
- [ ] Toast shows correct count of updated thoughts after rename
- [ ] Thoughts with unresolved [[links]] appear as dashed circles on graph
- [ ] Click ghost node → SparkInput opens with title pre-filled
- [ ] [[AI]] creates valid edge to "Artificial Intelligence" thought when AI is in aliases
- [ ] Aliases input in FrontmatterMask adds and removes correctly
- [ ] Aliases appear in vault autocomplete suggestions
- [ ] janitorWorker.ts has zero Dexie imports — verified by grep
- [ ] npm run check passes zero errors
- [ ] npm run test passes all tests
- [ ] SESSION END RITUAL executed — session-handover.md written
- [ ] git tag feature-v1-GN-verified created and pushed

---

## ═══════════════════════════════════════════
## GROUP D — SIDEBAR WIDGETS
## 3 features. Daily engagement hooks.
## Estimated time: 1 week | Model: Sonnet 4.6
## ═══════════════════════════════════════════

**D.1 — Thermal Calendar (Activity Grid)**
```
Read CLAUDE.md. Read src/components/layout/Sidebar.svelte.
Read skill: epic-design, ui-ux-pro-max.

Create src/components/layout/ThermalCalendar.svelte using Svelte 5 Runes.

On mount: query db.ts for updated_at timestamps of all non-deleted thoughts.
Bucket into FEATURE_CONFIG.THERMAL_CALENDAR_DAYS days (28 in V1).
Level mapping: 0=none (0 thoughts), 1=1–2, 2=3–5, 3=6–10, 4=11+.
Generalised bucketing — only THERMAL_CALENDAR_DAYS changes in V2.

Render: CSS Grid, 7 columns, rows = THERMAL_CALENDAR_DAYS / 7.
Cell size: 10×10px, border-radius: 2px, gap: 3px.
Colours via hexToRgb pattern (no color-mix, no hardcoded hex):
  level 0: var(--bg-surface)
  level 1–3: rgba of resolved --color-brand at 0.25 / 0.55 / 0.80
  level 4: var(--color-brand) fully resolved to rgba(r,g,b,1.0)
Resolve --color-brand via getComputedStyle on mount.

Heading: $t('feature.calendar.heading') — var(--text-muted), 11px uppercase.
Only render if thought count > 0.

Mount in Sidebar.svelte below PipelineMomentum.
Execute self-review gate.
```

**D.2 — Serendipity Collider**
```
Read CLAUDE.md. Read src/components/layout/Sidebar.svelte. Read src/lib/db.ts.

Create src/components/layout/SerendipityCollider.svelte using Svelte 5 Runes.

On mount:
  Check localStorage 'serendipity_last' timestamp.
  If within FEATURE_CONFIG.SERENDIPITY_INTERVAL_MS: restore saved pair from
    localStorage 'serendipity_a' and 'serendipity_b'. Skip re-roll.
  Else: roll new pair.
    1. Get all non-deleted thoughts.
    2. If count < 2: do not render.
    3. Pick nodeA randomly.
    4. Filter to thoughts not linked to nodeA and nodeA not linked to them.
    5. Pick nodeB randomly from filtered.
    6. Save nodeA.id, nodeB.id, Date.now() to localStorage.

V2 hook: let collisionFilter = null in V1. V2 assigns a semantic scoring
  function here without changing the component structure.

UI: card below ThermalCalendar.
  $t('feature.serendipity.heading') heading.
  Body: nodeA.title + ' & ' + nodeB.title with $t('feature.serendipity.prompt').
  Button $t('feature.serendipity.cta'):
    Calls createEdge(libraryId, nodeA.id, nodeB.id) from db.ts.
    Emits eventBus edge.created.
    Hides widget for rest of day (set 'serendipity_accepted' in localStorage).

Appear: opacity 0→1 + translateY(4px→0), 200ms — Rule 9.
Execute self-review gate.
```

**D.3 — Capture Triage Dots**
```
Read CLAUDE.md. Read src/components/capture/SparkInput.svelte.
Read src/components/layout/Sidebar.svelte.
Read src/routes/(app)/thought/[id]/+page.svelte. Read src/lib/db.ts.

is_triaged field added in Group A. Existing thoughts default to true.

In SparkInput.svelte:
  Pass is_triaged: false to createThought() call.
  This is the only path that creates untriaged thoughts.

In Sidebar.svelte thought list rows:
  If thought.is_triaged === false: render 6×6px dot after title.
  Dot: border-radius 50%, background var(--color-brand).
  Pulse: keyframe @keyframes triage-pulse using opacity only — Rule 9.
    opacity 1 → 0.3 → 1, 1.5s infinite.
  aria-label: $t('feature.triage.unread').

In thought/[id]/+page.svelte onMount:
  If thought.is_triaged === false:
    Start 5000ms timer: setTimeout(() => markTriaged(thoughtId), 5000)
  Store timer ref. Clear in onDestroy to prevent memory leak.

Execute self-review gate.
```

**Group D done when:**
- [ ] Thermal calendar renders 28-day grid, correct brightness per activity level
- [ ] Serendipity widget shows same pair all day, new pair next day
- [ ] Create Link button creates real edge and hides widget
- [ ] New thoughts from SparkInput show pulsing cyan dot in sidebar
- [ ] Dot disappears after 5 seconds in editor
- [ ] npm run check passes zero errors
- [ ] npm run test passes all tests
- [ ] SESSION END RITUAL executed — session-handover.md written
- [ ] git tag feature-v1-GN-verified created and pushed

---

## ═══════════════════════════════════════════
## GROUP E — CONTEXT MENU EXPANSION
## 2 features. High daily utility with minimal implementation cost.
## Estimated time: 3–4 days | Model: Sonnet 4.6
## ═══════════════════════════════════════════

**E.1 — Copy Wikilink (Node Context Menu)**
```
Read CLAUDE.md. Read src/components/graph/NodeContextMenu.svelte.

Add Copy Wikilink to existing NodeContextMenu.svelte.
This is an addition — not a rewrite. The existing menu structure is unchanged.

New item: label $t('graph.copyWikilink'), placed after Open, before Change Stage.

Handler:
  navigator.clipboard.writeText('[[' + node.title + ']]')
    .then(() => toastStore.add($t('feature.copyWikilink.success'), 'success'))
    .catch(() => toastStore.add($t('feature.copyWikilink.error'), 'error'))
  closeMenu()

navigator.clipboard already works in Cloudflare Pages (HTTPS) and Capacitor WebView.
The catch handler covers all failure cases — no additional guards needed.

Execute self-review gate.
```

**E.2 — Create Thought Here (Canvas Context Menu)**
```
Read CLAUDE.md. Read src/components/graph/GraphCanvas.svelte.
Read src/components/capture/SparkInput.svelte.
Read src/lib/stores/uiStore.svelte.ts. Read src/lib/db.ts.

Create src/components/graph/CanvasContextMenu.svelte using Svelte 5 Runes.

Props: x, y (screen), simX, simY (simulation coords), onClose: () => void.

Menu items from i18n:
  $t('graph.createHere')     → sets uiStore.sparkInputPrefillCoords = {x:simX, y:simY}
                                and opens SparkInput
  $t('graph.resetViewport')  → eventBus.emit('graph.resetViewport')
  $t('graph.settleGraph')    → eventBus.emit('graph.settleGraph')

Add to uiStore.svelte.ts:
  sparkInputPrefillCoords: { x: number; y: number } | null = null

In SparkInput.svelte:
  After createThought() succeeds:
    If uiStore.sparkInputPrefillCoords !== null:
      Call updateThought(newId, { x_pos: uiStore.sparkInputPrefillCoords.x,
                                   y_pos: uiStore.sparkInputPrefillCoords.y })
      Set uiStore.sparkInputPrefillCoords = null

In GraphCanvas.svelte:
  Add contextmenu event listener on the canvas element.
  Run node hit test first. If a node is under cursor: fire NodeContextMenu, return.
  If no node hit:
    event.preventDefault()
    rect = canvasElement.getBoundingClientRect()
    pixelX = event.clientX - rect.left
    pixelY = event.clientY - rect.top
    [simX, simY] = currentTransform.invert([pixelX, pixelY])
    Show CanvasContextMenu at event.clientX, event.clientY with simX, simY.

Add eventBus listeners in GraphCanvas.svelte for:
  'graph.resetViewport': animate camera to d3.zoomIdentity via 750ms transition
  'graph.settleGraph': worker.postMessage({ type: 'settle' })

Add 'settle' message type to graphWorker.ts:
  simulation.alpha(0.1).restart()

Execute self-review gate.
```

**Group E done when:**
- [ ] Right-click node → Copy Wikilink → clipboard contains [[Title]]
- [ ] Toast confirms success or failure
- [ ] Right-click empty canvas → CanvasContextMenu appears at cursor position
- [ ] Create thought here → new thought spawns at exact canvas coordinates
- [ ] Reset viewport → camera returns to origin smoothly
- [ ] Settle graph → physics re-heats briefly then settles
- [ ] npm run check passes zero errors
- [ ] npm run test passes all tests
- [ ] SESSION END RITUAL executed — session-handover.md written
- [ ] git tag feature-v1-GN-verified created and pushed

---

## ═══════════════════════════════════════════
## GROUP F — SETTINGS EXPANSION
## 4 features. All built on existing settings infrastructure.
## Estimated time: 1 week | Model: Sonnet 4.6
## Source: docs/peaceful-sparking-floyd.md (fully designed — follow that spec)
## ═══════════════════════════════════════════

Follow docs/peaceful-sparking-floyd.md Task A (F.1–F.3) and Task B (F.4) exactly.
The rules below are additive — they do not replace that spec, they extend it.

**F.1 — Theme Toggle (Light / Dark)**
```
Follow peaceful-sparking-floyd.md Task A Steps 1–4 exactly.
Additional rules:
  html.theme-light block uses CSS variable reassignments only.
  No component changes needed — all components already use CSS variables (Rule 8).
  Theme switch is purely app.css work.
  V2 hook: a 'system' theme option reads prefers-color-scheme — add
    'theme.system': 'System' to i18n.ts now so V2 only needs the logic.
Execute self-review gate.
```

**F.2 — Stage Label Renaming**
```
Follow peaceful-sparking-floyd.md Task A Step 5 (Pipeline section) exactly.
Additional rules:
  Changes update pipeline_label_overrides via updateUserSettings in db.ts.
  $t('stage.1') etc already reads string_overrides via i18n.ts — no component
  changes needed. Sidebar, FrontmatterMask, all labels update automatically.
  Save on blur only — never on keystroke (Rule 12 pattern for editor, same
  discipline applies here).
Execute self-review gate.
```

**F.3 — Keyboard Shortcut Remapping**
```
Follow peaceful-sparking-floyd.md Task A Step 5 (Keyboard Shortcuts section) exactly.
Additional rules:
  ShortcutManager.ts must re-read keyboard_shortcuts from userSettings on every
  keydown event OR set up a liveQuery that rebuilds the binding map on change.
  Verify which approach is currently used. If neither, add liveQuery rebuild now
  so new bindings are instant without app restart.
Execute self-review gate.
```

**F.4 — Graph Controls Panel**
```
Follow peaceful-sparking-floyd.md Task B exactly.
Additional rules:
  All 10 graph config values in uiStore are session-only in V1.
  Preset values come from FEATURE_CONFIG.GRAPH_PRESETS (Group A) — not hardcoded.
  V2 hook: add graphSettings field to userSettings Dexie schema and persist
    on panel change. uiStore fields are already the right shape — V2 only
    adds persistence wiring.
Execute self-review gate.
```

**Group F done when:**
- [ ] Theme toggle switches Midnight/Light, persists on reload
- [ ] Stage label rename saves on blur, propagates to all UI immediately
- [ ] Shortcut record captures combo, saves to Dexie, works without restart
- [ ] Graph controls panel opens/closes from Map toolbar
- [ ] Sliders update graph in real time, presets apply all values at once
- [ ] All peaceful-sparking-floyd.md verification checklists pass (Task A + Task B)
- [ ] npm run check passes zero errors
- [ ] npm run test passes all tests
- [ ] SESSION END RITUAL executed — session-handover.md written
- [ ] git tag feature-v1-GN-verified created and pushed

---

## EXECUTION ORDER

| Order | Group | Reason |
|-------|-------|--------|
| 1 | A — Schema | Unblocks all other groups. No UI output. |
| 2 | C — Graph Integrity | Most critical to retention. Build before any visual features. |
| 3 | B — CM6 Editor | Largest group, most user-visible improvement. |
| 4 | E — Context Menu | Fast wins, high daily utility. |
| 5 | D — Sidebar Widgets | Engagement hooks. Less critical than core features. |
| 6 | F — Settings | Already designed. Can run in parallel with D if bandwidth allows. |

---

## FILES MODIFIED

| File | Groups |
|------|--------|
| `src/lib/db.ts` | A, B.5, B.6, C.1, C.3, D.3 |
| `src/lib/config.ts` | A |
| `src/lib/i18n.ts` | A, C.1, C.3, E.1 |
| `src/app.css` | B.1, B.7, D.1, F.1 |
| `src/lib/stores/uiStore.svelte.ts` | E.2, F.4 |
| `src/components/editor/ThoughtEditor.svelte` | B.1–B.7, C.1 |
| `src/components/editor/FrontmatterMask.svelte` | C.3 |
| `src/components/graph/GraphCanvas.svelte` | C.2, E.2 |
| `src/components/graph/GraphNode.ts` | C.2 |
| `src/workers/graphWorker.ts` | C.2, E.2, F.4 |
| `src/components/layout/Sidebar.svelte` | D.1, D.2, D.3 |
| `src/components/capture/SparkInput.svelte` | D.3, E.2 |
| `src/components/graph/NodeContextMenu.svelte` | E.1 |
| `src/routes/(app)/thought/[id]/+page.svelte` | B.6, D.3 |
| `src/routes/(app)/settings/+page.svelte` | F.1, F.2, F.3, F.4 |
| `src/routes/(app)/map/+page.svelte` | F.4 |
| `src/lib/ShortcutManager.ts` | F.3 |

## NEW FILES CREATED

| File | Group |
|------|-------|
| `src/workers/janitorWorker.ts` | C.1 |
| `src/lib/janitorService.ts` | C.1 |
| `src/lib/scrollMemory.ts` | B.6 |
| `src/components/editor/BacklinkFooter.svelte` | B.5 |
| `src/components/editor/FloatingToolbar.svelte` | B.4 |
| `src/components/editor/extensions/syntaxHiding.ts` | B.1 |
| `src/components/editor/extensions/semanticFolding.ts` | B.2 |
| `src/components/editor/extensions/vaultAutocomplete.ts` | B.3 |
| `src/components/editor/extensions/smartLists.ts` | B.7 |
| `src/components/layout/ThermalCalendar.svelte` | D.1 |
| `src/components/layout/SerendipityCollider.svelte` | D.2 |
| `src/components/graph/CanvasContextMenu.svelte` | E.2 |
| `src/components/graph/GraphControlsPanel.svelte` | F.4 |

---

## WHAT NEEDS TO CHANGE IN OTHER FILES

### progress.md
Add phase entries for each group completion:
  [FEATURE V1-A] [FEATURE V1-B] ... [FEATURE V1-F]
Use existing DECISIONS LOG format.

### session-handover.md
Overwrite at end of every session with current group, task, and build status.

### verification-checklist.md
Add V1 feature gate section after existing gates:
  [ ] Auto-refactoring links: rename propagates silently
  [ ] Ghost nodes visible on map for every unresolved [[link]]
  [ ] Alias resolves to canonical thought in edge graph
  [ ] Backlink footer populated correctly
  [ ] Scroll memory persists across sessions
  [ ] Theme toggle persists on reload
  [ ] Stage labels propagate to all UI
  [ ] Shortcuts work without restart

### CLAUDE.md
No changes needed. All 12 rules are satisfied by this plan.
The FEATURE_CONFIG addition to config.ts is consistent with existing
PIPELINE_STATES, ANIMATION_CONFIG, and GRAPH_CONFIG patterns.

---

## V1 FEATURE COMPLETE WHEN

- [ ] All 6 groups pass their done-when checklists
- [ ] npm run check passes zero errors, zero warnings
- [ ] npm run test passes all tests
- [ ] Rename a thought → zero broken links in vault (manual test)
- [ ] Ghost nodes visible for every unresolved [[link]] (manual test)
- [ ] [[AI]] resolves to "Artificial Intelligence" node (manual test)
- [ ] Backlink footer populated on linked thoughts (manual test)
- [ ] Syntax hiding active throughout editor (manual test)
- [ ] Theme switch works and persists (manual test)
- [ ] Graph controls panel functional on map (manual test)
- [ ] git tag feature-v1-complete created
- [ ] session-handover.md updated
- [ ] progress.md DECISIONS LOG updated for all 6 groups
