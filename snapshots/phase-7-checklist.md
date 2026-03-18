# Phase 7 — AAA UI & The Adaptive Shell — Sign-off Checklist
Date: 2026-03-19

## Task 7.1 — Route transitions
- [x] fly transition (y:20, 250ms) wraps route outlet
- [x] Grid overlap fix: `.route-shell { display: grid }` + `.route-view { grid-area: 1/1 }`
- [x] No layout shift on transition
- [x] Rule 9 compliant (transform only)

## Task 7.2 — Editor engine extensions
- [x] Slash command menu (`/` triggers overlay, H1/H2/Checkbox options)
- [x] Checkboxes: CM6 StateField replaces `[ ]`/`[x]` with clickable widgets
- [x] Thermal pills: CM6 StateField replaces `[[Title]]` with stage-coloured pills
- [x] Typing rhythm bar: 2px scaleX bar, opacity-only pulse, auto-hides after 2s
- [x] All extensions use `StateField.define` + `EditorView.decorations.from()`
- [x] Rule 8 compliant: pill colours from CSS vars via getComputedStyle

## Task 7.3 — Adaptive sidebar
- [x] Horizontal resize drag: mousemove updates `uiStore.sidebarWidth`
- [x] Drag persists to Dexie via debounced `updateUserSettings({ sidebar_width })`
- [x] Resize handle is `<button>` (a11y compliant)
- [x] Pinned/Recent sections with `togglePin()` function
- [x] Collapsible accordions: display:none/block instant + @keyframes bodyIn (opacity+translateY)
- [x] Glassmorphism gated `@media (min-width: 768px)` (FIX-20)
- [x] onMount is sync (async work via .then())

## Task 7.4 — Settings page schema & UI
- [x] `UserSettings` interface: `font_size`, `sidebar_width`, `pinned_thought_ids` added
- [x] Dexie version(2) with `.upgrade()` migrating existing records
- [x] Settings route `/settings` with Appearance + Pipeline accordions
- [x] Font size picker: 3-button toggle (14/16/18px), applies `--editor-font-size` live
- [x] Pipeline colour grid: 6 swatches per stage, no `<input type=color>`
- [x] Colours resolved via `getComputedStyle()` — Rule 8 compliant
- [x] Saved flash badge: opacity transition only — Rule 9 compliant
- [x] FIX-17 compliant: accordion animation is opacity+translateY @keyframes only

## Task 7.5 — Ghost toast system
- [x] `toastStore.svelte.ts`: `$state<Toast[]>`, `showToast()`, `dismissToast()`
- [x] Max 3 toasts visible (oldest ejected on overflow)
- [x] `ToastManager.svelte`: fixed bottom-centre, above mobile dock
- [x] `fly` transition (y:20) — Rule 9 compliant
- [x] `aria-live="polite"` on toast region
- [x] SparkInput fires "Captured to Inbox" toast on submit
- [x] ToastManager mounted in root `+layout.svelte`
- [x] `env(safe-area-inset-bottom)` on toast region — mobile safe

## Verification gates
- [x] `npm run check`: 0 errors, 0 warnings
- [x] `npm test`: 42/42 passing
- [x] Flought reviewer blocks 1-9: all PASS
