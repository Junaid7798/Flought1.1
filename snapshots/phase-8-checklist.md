# Phase 8 — The Hybrid Editor & Shortcut Engine — Sign-off Checklist
Date: 2026-03-19

## Task 8.1 — Global Shortcut Manager
- [x] ShortcutManager.ts created: initializeShortcuts(), onAction(), destroyShortcuts()
- [x] DEFAULT_BINDINGS: Cmd+K, Cmd+N, Cmd+F, Cmd+1/2/3
- [x] Overrides read from userSettings.keyboard_shortcuts
- [x] Single global keydown listener (no duplicate attach)
- [x] Bindings not fired inside input/textarea (except global actions)
- [x] Root layout wired: initializeShortcuts on mount, destroyShortcuts on destroy
- [x] commandPalette, goMap, goEditor, goFocus actions connected to uiStore

## Task 8.2 — Document Outline Panel
- [x] editorContext.ts: EDITOR_VIEW_KEY Symbol + EditorViewGetter type
- [x] ThoughtEditor.svelte: setContext(EDITOR_VIEW_KEY, () => view)
- [x] DocumentOutline.svelte: getContext, syntaxTree ATXHeading1/2/3 extraction
- [x] 400ms interval poll (decoupled from CM6 updateListener)
- [x] scrollToHeading() via view.dispatch({ selection, scrollIntoView })
- [x] Outline panel: right sidebar, 200px, desktop-only (min-width: 1100px)
- [x] H1/H2/H3 indentation via padding-left

## Task 8.3 — Block-Level Transclusion
- [x] embedWidget.ts: EmbedWidget WidgetType renders title + pipeline pill + 2-line snippet
- [x] Stage pill colour via var(${state.cssVar}) — Rule 8 compliant
- [x] embedField StateField with updateEmbedMap StateEffect
- [x] makeSnippet() strips frontmatter, embeds, markdown syntax, 120-char limit
- [x] ThoughtEditor: embedSub via getThoughtsByLibrary() liveQuery
- [x] embedField + embedTheme added to CM6 extensions
- [x] embedSub.unsubscribe() on onDestroy

## Verification gates
- [x] npm run check: 0 errors, 0 warnings
- [x] npm test: 42/42 passing
- [x] Flought reviewer blocks 1-9: all PASS
