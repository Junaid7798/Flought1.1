# FLOUGHT — BUILD PLAN V2 (PHASE 7 TO 11)
# Supersedes build-plan.md entirely. Do not use both simultaneously.
# Hand one task at a time to Claude Code. Never combine tasks. Never skip rituals.

---

## WHY THIS FILE EXISTS

Build-plan.md had architectural lapses found during pre-build review.
Every change below is traceable. Reasons are marked [FIX-N] inline.

| Fix | Lapse | Resolution |
|-----|-------|------------|
| FIX-1 | Tailwind in init contradicts CLAUDE.md `Add-ons: none` | Removed from task 0.1 |
| FIX-2 | blueprints.ts created in Phase 2 but imported in Phase 1 task 1.6 | Moved to Phase 0 |
| FIX-3 | (app)/+layout.svelte created twice — Phase 3 then overwritten in Phase 5 | Created once in 3.9, extended in 5.4 with explicit instruction never to overwrite |
| FIX-4 | FrontmatterMask uses Decoration.replace() but has no access to EditorView instance | ThoughtEditor exposes EditorView via Svelte context; FrontmatterMask reads it |
| FIX-5 | `topic` field used in sidebar, blueprints, applyBlueprint but missing from Dexie schema | Added to schema in task 1.2 |
| FIX-6 | All edges stuffed into sync chunk 0 — will exceed Drive file size at scale | Edges get their own manifest entry and separate file |
| FIX-7 | labelZoomThreshold config exists but no zoom/pan task was ever written | Zoom/pan task added as 4.5 |
| FIX-8 | addNode detection in GraphCanvas has no diff spec — can't tell new vs updated | Explicit prev/current array diff spec added to task 4.2 |
| FIX-9 | supabase_user_id tagged to userProfile in task 5.4 but field missing from schema | Added to schema in 1.2 with Dexie version().upgrade() migration |
| FIX-10 | uiStore.activeLibraryId never initialized on app start — always undefined | Explicit init task added in 2.6 |
| FIX-11 | TOPBAR component visible in CLAUDE.md UI diagram but no task ever creates it | Added as task 2.7 |
| FIX-12 | Search worker used in 3.5 and 3.7 before being instantiated in 3.9 | Worker instantiated in 3.9, passed via context; 3.5 and 3.7 receive it as prop/context |
| FIX-13 | Root layout (2.6) and (app) layout (5.4) both check onboarding_complete — duplicate | Root layout check removed; single source of truth in (app)/+layout.svelte |
| FIX-14 | flought-reviewer-SKILL.md referenced in CLAUDE.md but never created | New Phase 0.5 creates it before any code is written |
| FIX-15 | No schema migration strategy for version changes | Dexie version().upgrade() pattern specified in 1.2 |
| FIX-16 | Tailwind syntax slipped into task 7.3 | Removed. Replaced with pure CSS instructions. |
| FIX-17 | clip-path in 7.4 violated Rule 9 | Replaced with strict opacity/translateY fade-in for accordions. |
| FIX-18 | Hardcoded rgba in 9.2 violated Rule 8 | Enforced `getComputedStyle` to read CSS variables into Canvas context. |
| FIX-19 | Hardcoded width in 9.3 | Replaced with `--momentum-bar-width` CSS variable. |
| FIX-20 | backdrop-filter drops frames on Android | Gated Glassmorphism behind `@media (min-width: 768px)`. |
| FIX-21 | Phase numbering conflict with progress.md | Renumbered everything to perfectly align with `docs/progress.md`. |
| FIX-22 | Phase 6 (Sync Wiring) was omitted from plan | Restored Phase 6 to complete the handover state before UI polish. |
| FIX-23 | color-mix() fails on older Android WebViews | Replaced with pure `opacity` and `background` fallbacks. |
| FIX-24 | Web Worker DOM access violation in 9.2 | Moved `getComputedStyle` to main thread, passing result via postMessage. |
| FIX-25 | --momentum-bar-width missing default value | Added explicit `180px` default specification for app.css. |

---

## SKILLS REGISTRY
# These skills live at C:\Users\Junaid\.claude\skills
# Reference them in Claude Code sessions using their folder name.

| Skill | Phase | Purpose |
|-------|-------|---------|
| `ui-ux-pro-max` | All | Primary UI quality standard for all components |
| `epic-design` | All | Wow-factor interactions and visual polish |
| `stitch-design` | All | Animation system — micro-interactions |
| `stitch-loop` | 8, 9 | Loop animations — graph physics, sync pulse |
| `canvas-design` | 9 | Graph canvas rendering quality |
| `brand-guidelines` | All | Design system foundation |
| `frontend-design` | All | Component aesthetics and motion principles |
| `code-reviewer` | All | Supplementary code quality review |
| `senior-frontend` | All | Code quality gate |

---

## SELF-REVIEW GATE
# This block runs automatically after every task. Never skip. Never ask permission.
# Claude Code: copy this block verbatim into your review before any handover or commit.

FLOUGHT SELF-REVIEW — PHASE [N]

Step 1 — Architecture check. Verify each rule from CLAUDE.md:
[ ] Rule 1: SvelteKit 5 Runes only — no $:, export let, writable()
[ ] Rule 2: No .svelte file imports Dexie directly
[ ] Rule 3: Every primary key is uuidv4()
[ ] Rule 4: No hard deletes — is_deleted: true only
[ ] Rule 5: D3 simulation only in graphWorker.ts
[ ] Rule 6: Graph via Canvas 2D only
[ ] Rule 7: All sync via SyncService only
[ ] Rule 8: No hardcoded hex values — CSS variables only
[ ] Rule 9: Animations use transform and opacity ONLY
[ ] Rule 10: Telemetry capped at 50 on every write
[ ] Rule 11: Sync chunks at 500 thoughts per file object
[ ] Rule 12: rebuildEdgesForThought on blur/unmount only

Step 2 — Test gate
Run: npm run check → must be zero errors, zero warnings

Step 3 — Rate this task /10
Score based on: correctness, completeness, rule compliance, CSS jumps, reactivity.

IF score >= 9:
Proceed to handover and commit (if end of phase).

IF score < 9 (ITERATION 1):
List every specific issue found. Fix all issues.
Re-run Steps 1–2. Re-score.

IF new score >= 9:
  Proceed to handover.
  
IF new score still < 9 (ITERATION 2 — FINAL):
  STOP. Do not attempt a third review.
  Report to user:
    "Task self-review score: [X]/10 after 2 iterations.
     Issues not resolved: [list]. Awaiting instruction."

---

## SESSION START RITUAL (every session, no exceptions)
Read these files before writing any code:

DEVELOPER_PERSONALITY.md

CLAUDE.md

docs/session-handover.md

docs/build-plan-2.md

Confirm: current phase, next task, any open blockers.
Do not write any code until confirmed.


## SESSION END RITUAL (every session, no exceptions)
Run self-review gate above

Write docs/session-handover.md

For every non-obvious decision made during this session,
append it to the DECISIONS LOG in docs/progress.md using format:
[PHASE N] Decision: what. Reason: why. Alternative: what was rejected.
Do this automatically. Never ask permission. Never skip.

Run: git add -A

Show the diff

Commit: type(phase-N): description (If milestone hit: create git tag phase-N-verified)


---

## ═══════════════════════════════════════════
## PHASE 7 — AAA UI & THE ADAPTIVE SHELL
## Estimated time: 1 week | Model: Sonnet 4.6
## ═══════════════════════════════════════════

**7.1 — Prompt: Route Transitions & Overlap Fix**
Read skill: ui-ux-pro-max
Update (app)/+layout.svelte. Wrap <slot /> in a {#key} block keyed to the URL. Apply Svelte fly transitions (y: 20, 250ms, cubic-bezier). CRITICAL OVERLAP FIX: The parent container wrapping the {#key} MUST have display: grid. The inner blocks must have grid-area: 1/1 so old and new elements stack perfectly during the 250ms crossfade. Execute Auto-Eval Protocol.


**7.2 — Prompt: Editor Engine Extensions (CodeMirror)**
Read skill: epic-design
Update ThoughtEditor.svelte and db.ts.

Slash Commands: '/' opens a Svelte menu (H1, H2, Checkbox).

Checkboxes: Render - [ ] as clickable, toggles markdown.

Live Thermal Pills: In db.ts, create a lightweight liveQuery fetching ONLY {id, meta_state} for ALL thoughts (to prevent memory bloat). Use this store for a CM6 WidgetType that replaces [[Title]] with a colored pipeline pill.

Typing Rhythm: Add a 2px line below the editor status bar that pulses cyan while typing, fading out on debounce. Execute Auto-Eval Protocol.


**7.3 — Prompt: The Adaptive Sidebar** [FIX-16, FIX-20, FIX-23]
Update Sidebar.svelte. Make it horizontally resizable (min 200px, max 400px), save width to userSettings. Add Pinned Thoughts and Recent Thoughts sections. Add a collapsible Chevron interaction.
GLASSMORPHISM: Apply deep Glassmorphism using pure CSS variables and opacity:
background: var(--bg-panel); opacity: 0.92;
CRITICAL PERFORMANCE: Wrap the backdrop-filter: blur(24px); rule in a @media (min-width: 768px) query. Mobile views must NOT process backdrop-filter to prevent Android Capacitor frame drops. Execute Auto-Eval Protocol.


**7.4 — Prompt: Settings Page Schema & UI** [FIX-17]
Task A: Update db.ts to bump schema_version: 2 using Dexie upgrade pattern. Add font_size and sidebar_width to userSettings.
Task B: Create src/routes/(app)/settings/+page.svelte. Build accordion sections. TO STRICTLY OBEY RULE 9: Do NOT animate height or use clip-path. Toggle display: block/none instantly, and animate the inner content using ONLY opacity: 0 -> 1 and transform: translateY(-4px -> 0) over 150ms. Build a custom color picker grid for pipeline stages (no native inputs). Execute Auto-Eval Protocol.


**7.5 — Prompt: Ghost Toast System**
Create ToastManager.svelte using Svelte 5 Runes. Global state: {id, message, type}[]. Design: Minimalist dark pill, fly up (y: 20). Trigger "Captured to [Stage]" from SparkInput. Execute Auto-Eval Protocol. (End of Phase 7: Trigger R8 Snapshot).


---

## ═══════════════════════════════════════════
## PHASE 8 — THE HYBRID EDITOR & SHORTCUT ENGINE
## Estimated time: 2 weeks | Model: Opus 4.6
## ═══════════════════════════════════════════

**8.1 — Prompt: Global Shortcut Manager**
Create ShortcutManager.ts. Export initializeShortcuts() that attaches a global keydown listener, checks userSettings.keyboard_shortcuts, and fires mapped Actions (e.g., Cmd+K, Cmd+N). Execute Auto-Eval Protocol.


**8.2 — Prompt: Document Outline Panel**
Create DocumentOutline.svelte. Use CM6 @codemirror/language syntaxTree to extract H1-H3 nodes from the active editor state. Render as a clickable, nested tree that scrolls the editor to that line on click. Execute Auto-Eval Protocol.


**8.3 — Prompt: Block-Level Transclusion**
Create ThoughtEmbedWidget.ts. CM6 WidgetType that listens for ![[Thought Title]]. Hide the syntax and render a read-only Svelte component showing the embedded thought's title, stage, and a 2-line snippet. Execute Auto-Eval Protocol. (End of Phase 8: Trigger R8 Snapshot).


---

## ═══════════════════════════════════════════
## PHASE 9 — GRAPH INTELLIGENCE & WIDGETS
## Estimated time: 2 weeks | Model: Opus 4.6
## ═══════════════════════════════════════════

**9.1 — Prompt: Semantic Gravity & Focus Pull**
Update graphWorker.ts. Listen for {type:'focusStage', stageId}. Apply d3.forceX and forceY to pull nodes matching the stageId toward the center (strength 0.3) and gently push unfocused nodes outward (strength -0.1). Run alpha(0.4).restart(). Execute Auto-Eval Protocol.


**9.2 — Prompt: Subgroup Clustering (Convex Hulls)** [FIX-18, FIX-24]
Update graphWorker.ts and GraphCanvas.svelte. Group nodes by topic. Use d3.polygonHull to calculate bounding coordinates for each group.
RULE 8 FIX: CSS variables cannot be read inside a Web Worker (no DOM access). Read the colour on the MAIN THREAD in GraphCanvas.svelte using: getComputedStyle(document.body).getPropertyValue('--color-brand').trim(). Pass the resolved hex/rgb string to the worker via postMessage alongside the hull coordinates. Worker uses the passed value directly. Draw a faint colored blob underneath the grouped nodes on the Canvas 2D context. Execute Auto-Eval Protocol.


**9.3 — Prompt: Node Context Menu & Widgets** [FIX-19, FIX-25]
Create NodeContextMenu.svelte. On right-click of a node in GraphCanvas, show a floating menu: Open, Change Stage (submenu), Pin, Delete.
Create PipelineMomentum.svelte in the sidebar: a progress bar showing percentage of thoughts per stage.
RULE 8/9 FIX: Add to app.css: --momentum-bar-width: 180px;. Set the container width using this CSS variable. Animate the fill using transform: scaleX(X), transform-origin: left. Execute Auto-Eval Protocol. (End of Phase 9: Trigger R8 Snapshot).


---

## ═══════════════════════════════════════════
## PHASE 10 — PLATFORM NATIVE OPTIMIZATION
## Estimated time: 1 week | Model: Sonnet 4.6
## ═══════════════════════════════════════════

**10.1 — Prompt: Native Mobile APIs**
Install @capacitor/haptics, @capacitor/share, @capacitor/keyboard, and @capacitor/navigation-bar.

Update ThoughtEditor: On mobile, add an Export button that triggers Share.share().

Update MobileDock: Hide dock when Keyboard.addListener('keyboardWillShow') fires.

Update App Root: Set Android Nav Bar color to var(--bg-deep) via NavigationBar.setColor (lookup via getComputedStyle).

Trigger light haptics on stage changes. Execute Auto-Eval Protocol.


**10.2 — Prompt: Web Drag-and-Drop**
Update main layout. Add event listeners for dragover and drop. If a user drops a .md file onto the window, parse it, create a new thought in Dexie with the filename as the title and content as the body, and navigate to it. Execute Auto-Eval Protocol. (End of Phase 10: Trigger R8 Snapshot).


---

## ═══════════════════════════════════════════
## PHASE 11 — DEPLOYMENT, WRAPPERS & STORE SUBMISSIONS
## Estimated time: 1 week
## ═══════════════════════════════════════════

**11.1 — Prompt: App Icons**
Install @capacitor/assets as a dev dependency. Ensure a master 1024x1024 icon is at resources/icon.png. Generate assets using npx capacitor-assets generate. Execute Auto-Eval Protocol.


**11.2 — Prompt: Android Build Prep**
Add android target: npx cap add android and npx cap sync. Open Android Studio → Build → Generate Signed AAB. Execute Auto-Eval Protocol.


**11.3 — Prompt: iOS Build Prep**
Add ios target: npx cap add ios and npx cap sync. Open Xcode → configure signing → archive. Execute Auto-Eval Protocol.


**11.4 — Prompt: Desktop Build Prep (Tauri)**
Initialize Tauri using npx tauri init. Configure tauri.conf.json to point the build path to our SvelteKit output directory (build). Setup the build scripts in package.json for Mac and Windows. Execute Auto-Eval Protocol. (End of Phase 11: Trigger R8 Snapshot).


---

## POST-LAUNCH — MANUAL VERIFICATION CHECKLIST
[ ] Fresh browser profile — run full onboarding end to end
[ ] Create 10 thoughts, add [[links]] between them, verify graph shows edges
[ ] Disconnect internet — verify app opens and works fully offline
[ ] Reconnect — verify sync status updates and merge is correct
[ ] Test on real iPhone Safari (not simulator)
[ ] Test on real Android Chrome (not emulator)
[ ] npm run build — zero errors, zero warnings
[ ] git log --all -- .env.local — returns nothing (not committed)
[ ] npm run check — zero errors
[ ] npm run test — zero failures