# Phase 3 Checklist — Verified 2026-03-18

- [x] npm run check — 0 errors, 0 warnings
- [x] npm run test — 42/42 pass (3 test files)
- [x] Clicking a thought opens the editor with content
      → src/routes/(app)/thought/[id]/+page.svelte loads via getThought(), renders ThoughtEditor with full content
- [x] Typing updates Dexie (verify in DevTools IndexedDB)
      → 800ms debounce → updateThought(); immediate flush on blur
- [x] [[links]] create edges in the edges table (check on editor blur)
      → flushEdges() → rebuildEdgesForThought() called in blur handler and onDestroy only
- [x] YAML is hidden — properties shown as UI controls
      → hideFrontmatterField (Decoration.replace) hides --- block; FrontmatterMask renders stage/date/custom keys
- [x] Cmd+K opens search and returns results
      → CommandPalette wired in +layout.svelte with global keydown; searchWorker in uiStore
- [x] No Dexie import outside db.ts
      → grep clean across routes/, components/, workers/, stores/
- [x] No hardcoded hex colours
      → grep clean — all colours via CSS vars in app.css
- [x] All strings via $t()
      → i18n.ts has all keys; thought/[id] page and CommandPalette use t() for all visible strings
- [x] rebuildEdgesForThought called only on blur/unmount — never on keystrokes
      → ThoughtEditor.svelte lines 143–151 (blur) and 159–170 (onDestroy) only
- [x] All touch targets ≥ 44×44px
      → Verified: SparkInput, MobileDock (centre pip 48px), Sidebar buttons, CommandPalette results, back button
- [x] No 100vh anywhere
      → All layout uses 100dvh; grep clean

## Files added in Phase 3

- src/lib/frontmatterParser.ts + .test.ts
- src/lib/linkParser.ts + .test.ts
- src/lib/hideFrontmatter.ts
- src/workers/searchWorker.ts
- src/components/editor/ThoughtEditor.svelte
- src/components/editor/FrontmatterMask.svelte
- src/components/search/CommandPalette.svelte
- src/routes/(app)/+layout.svelte  ← search index subscription
- src/routes/(app)/map/+page.svelte
- src/routes/(app)/thought/[id]/+page.svelte

## Files modified in Phase 3

- src/lib/i18n.ts — added editor.*, search.*, map.* keys
- src/lib/stores/uiStore.svelte.ts — added searchWorker, commandPaletteOpen
- src/routes/+layout.svelte — searchWorker init, Cmd+K handler, CommandPalette mount
- src/components/editor/ThoughtEditor.svelte — hideFrontmatterField extension added
