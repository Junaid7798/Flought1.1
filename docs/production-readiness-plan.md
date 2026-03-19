# Flought — Complete Production Readiness Plan
# Style: Ultra-minimal · Premium dark/white glass · Subtle gradients · Sharp · Readable
# Reference: Obsidian + Linear + Raycast design patterns
# Dual-theme: Midnight (dark) + Blanc (light) — both fully designed
# Assessed: 2026-03-19

---

## IMMEDIATE TASK (before implementation begins)

1. Copy this plan file to `e:\Flought V2\docs\production-readiness-plan.md`
2. `git add docs/production-readiness-plan.md docs/session-handover.md`
3. Commit with message: `docs(phase-11): production readiness plan + session handover`

---

---

## CURRENT STATE vs WHAT PKM USERS EXPECT

Based on Obsidian, Linear, Raycast, and Roam research.

### What users immediately notice is missing:
1. **No word/character count** in editor (Obsidian has it in status bar bottom-right)
2. **No mobile formatting toolbar** above keyboard (Obsidian's most-praised mobile feature)
3. **Editor tab on Android opens blank** — no navigation to most recent thought
4. **Topics in sidebar are display-only** — clicking should filter graph + show thought list
5. **Command palette (⌘K)** — power user core; Linear and Raycast both have it
6. **No icon-only sidebar rail** when collapsed — currently shows nothing
7. **Graph labels invisible** at default zoom
8. **No feature discovery** — SerendipityCollider, triage dots etc are invisible to users

### What's already done well:
- Glass panels with backdrop-filter ✅
- Canvas-based graph with D3 force ✅
- Wikilink autocomplete ✅
- Backlink footer in editor ✅
- Thermal Calendar + SerendipityCollider ✅
- Keyboard shortcuts + command palette infrastructure ✅ (but no visible palette)
- Triage system ✅

---

## PHASE 1 — DESIGN SYSTEM (Do this first, everything else inherits)

### 1A — Token expansion in `src/app.css`

Replace current `:root` and `html.theme-light` with expanded token set:

```css
:root {
  /* ── Backgrounds — 5-layer depth ───────────────────────────────────── */
  --bg-canvas:      #000000;    /* true black — graph canvas             */
  --bg-deep:        #0A0A14;    /* app shell base                        */
  --bg-panel:       #111120;    /* sidebar, topbar                       */
  --bg-surface:     #181830;    /* cards, dropdowns, accordions          */
  --bg-elevated:    #202038;    /* selected rows, active states          */
  --bg-hover:       #252545;    /* transient hover                       */

  /* ── Text — 4-level hierarchy ──────────────────────────────────────── */
  --text-primary:   #F0F4FF;
  --text-secondary: #8892B0;
  --text-muted:     #4A5280;
  --text-disabled:  #2E3456;

  /* ── Brand (unchanged) ──────────────────────────────────────────────── */
  --color-brand:    #22D3EE;
  --brand-tint:     rgba(34,211,238,0.10);
  --brand-tint-subtle: rgba(34,211,238,0.05);
  --brand-glow:     rgba(34,211,238,0.25);
  --brand-glow-strong: rgba(34,211,238,0.45);

  /* ── Pipeline (unchanged) ───────────────────────────────────────────── */
  --color-inbox:    #F59E0B;
  --color-queue:    #3B82F6;
  --color-forge:    #10B981;
  --color-archive:  #6B7280;

  /* ── Semantic ───────────────────────────────────────────────────────── */
  --color-error:    #FF4444;
  --color-warning:  #F59E0B;
  --color-success:  #10B981;

  /* ── Borders ────────────────────────────────────────────────────────── */
  --border:           rgba(255,255,255,0.05);
  --border-strong:    rgba(255,255,255,0.10);
  --border-focus:     rgba(34,211,238,0.60);
  --border-separator: rgba(255,255,255,0.04);

  /* ── Glass surfaces ─────────────────────────────────────────────────── */
  --glass-panel:    rgba(10,10,20,0.75);
  --glass-surface:  rgba(18,18,32,0.82);
  --glass-overlay:  rgba(8,8,18,0.90);
  --glass-blur:     saturate(180%) blur(24px);
  --glass-blur-sm:  saturate(160%) blur(12px);

  /* ── Shadows ────────────────────────────────────────────────────────── */
  --shadow-sm:       0 1px 3px rgba(0,0,0,0.5);
  --shadow-md:       0 4px 16px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4);
  --shadow-lg:       0 16px 48px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5);
  --shadow-dropdown: rgba(0,0,0,0.5);

  /* ── Overlays ───────────────────────────────────────────────────────── */
  --overlay-backdrop: rgba(0,0,0,0.65);

  /* ── Gradients — subtle, directional ───────────────────────────────── */
  --gradient-panel:   linear-gradient(160deg, rgba(34,211,238,0.03) 0%, transparent 60%);
  --gradient-surface: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 100%);
  --gradient-brand:   linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%);

  /* ── Graph ──────────────────────────────────────────────────────────── */
  --edge-colour:    rgba(255,255,255,0.12);

  /* ── Radii ──────────────────────────────────────────────────────────── */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-pill: 999px;

  /* ── Transitions ────────────────────────────────────────────────────── */
  --transition-fast: 120ms ease-out;
  --transition-base: 180ms ease-out;
  --transition-slow: 280ms ease-out;

  /* ── Layout ─────────────────────────────────────────────────────────── */
  --momentum-bar-width: 180px;
  --topbar-height:  48px;
  --dock-height:    60px;
}

html.theme-light {
  --bg-canvas:      #F0F2F5;
  --bg-deep:        #FAFBFC;
  --bg-panel:       #FFFFFF;
  --bg-surface:     #F4F6F9;
  --bg-elevated:    #ECEEF3;
  --bg-hover:       #E5E8EF;
  --text-primary:   #0D1117;
  --text-secondary: #4B5563;
  --text-muted:     #9CA3AF;
  --text-disabled:  #D1D5DB;
  --border:           rgba(0,0,0,0.06);
  --border-strong:    rgba(0,0,0,0.12);
  --border-focus:     rgba(34,211,238,0.70);
  --border-separator: rgba(0,0,0,0.04);
  --glass-panel:    rgba(255,255,255,0.82);
  --glass-surface:  rgba(244,246,249,0.90);
  --glass-overlay:  rgba(255,255,255,0.95);
  --shadow-sm:      0 1px 3px rgba(0,0,0,0.08);
  --shadow-md:      0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06);
  --shadow-lg:      0 16px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08);
  --shadow-dropdown: rgba(0,0,0,0.12);
  --overlay-backdrop: rgba(240,242,245,0.80);
  --gradient-panel: linear-gradient(160deg, rgba(34,211,238,0.04) 0%, transparent 60%);
  --gradient-surface: linear-gradient(135deg, rgba(255,255,255,0.60) 0%, transparent 100%);
  --edge-colour:    rgba(0,0,0,0.10);
  --brand-tint:     rgba(34,211,238,0.08);
  --brand-glow:     rgba(34,211,238,0.20);
}
```

### 1B — Font switch: Geist → Inter

`src/app.html`: add Inter Google Fonts link in `<head>`
`src/app.css` line 1: change `@import '@fontsource/geist'` → `@import '@fontsource/inter'`
`body`: change `font-family: 'Geist'` → `font-family: 'Inter', system-ui, sans-serif`

---

## PHASE 2 — SHELL REDESIGN (CSS only, 0 logic changes)

### 2A — Sidebar (`src/components/layout/Sidebar.svelte`)

**Visual changes:**
- Background: `var(--glass-panel)` + `var(--glass-blur)` + `var(--gradient-panel)`
- Section labels: 11px, 600 weight, `letter-spacing: 0.08em`, uppercase, `var(--text-muted)`
- Thought rows: 34px height, `var(--radius-md)` on hover bg, smooth transition
- Pipeline stage pills: pill shape, colored 7px dot, count badge redesigned
- Capture button: `var(--gradient-brand)` background, box-shadow glow on hover
- **Icon-only collapsed rail**: When `sidebarCollapsed = true`, show a 44px-wide icon rail instead of `display:none`. Icons: graph node icon (Map), document icon (recent), pin icon (pinned), + icon (capture)
- Resize handle: 1px, brand color flash on hover

**New: Icon-only collapsed state**
```css
.sidebar.collapsed {
  width: 44px;
  overflow: hidden;
}
.sidebar.collapsed .sidebar-icon-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-top: 12px;
}
.sidebar.collapsed .sidebar-content { display: none; }
```

### 2B — Topbar (`src/components/layout/Topbar.svelte`)

- Height: 48px
- Background: `var(--glass-panel)` + `var(--glass-blur)`
- Bottom border: `1px solid var(--border-separator)`
- Tabs: Inter 500 15px, active = `var(--color-brand)` text + 2px brand underline
- Inactive tabs: `var(--text-muted)` → hover `var(--text-secondary)`
- Search: pill shape `var(--radius-pill)`, `var(--bg-surface)`, ⌘K badge as `<kbd>` element
- **NEW: ? button** on right → opens feature discovery page `/features`

### 2C — Mobile Dock (`src/components/layout/MobileDock.svelte`)

**Logic fix (P0 — mobile editor broken):**
```typescript
import { goto } from '$app/navigation';
import { getThoughtsByLibrary } from '$lib/db';

async function selectTab(view: 'map' | 'editor') {
  captureOpen = false;
  if (view === 'editor') {
    const targetId = uiStore.focusedNodeId;
    if (targetId) {
      await goto(`/thought/${targetId}`);
    } else {
      const all = await getThoughtsByLibrary(uiStore.activeLibraryId);
      const recent = all
        .filter(t => !t.is_deleted)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
      if (recent) await goto(`/thought/${recent.id}`);
      else uiStore.activeView = 'editor';
    }
  } else {
    uiStore.activeView = view;
  }
}
```

**Visual redesign:**
- Background: `var(--glass-panel)` + `var(--glass-blur)` + top border `1px solid var(--border)`
- Tab icons: 22px, `var(--text-muted)` inactive → `var(--color-brand)` active
- Active indicator: 2px brand line ABOVE the icon (not below)
- FAB (+ button): `var(--gradient-brand)` background, 56px circle, `var(--shadow-lg)`, scale 0.95 on press

---

## PHASE 3 — EDITOR OVERHAUL

### 3A — Persistent formatting toolbar

**File: `src/routes/(app)/thought/[id]/+page.svelte`**

Add a 40px toolbar bar between YAML mask and CodeMirror editor.
Hidden on Capacitor native (iOS/Android use the keyboard accessory row instead — see 3B).

```svelte
{#if !Capacitor.isNativePlatform()}
  <div class="fmt-toolbar" role="toolbar" aria-label="Formatting">
    <button class="fmt-btn" onclick={() => applyWrap('**','**')} title="Bold (⌘B)" type="button">
      <Bold size={14} strokeWidth={2.5} />
    </button>
    <button class="fmt-btn" onclick={() => applyWrap('*','*')} title="Italic (⌘I)" type="button">
      <Italic size={14} strokeWidth={2.5} />
    </button>
    <button class="fmt-btn" onclick={() => applyWrap('`','`')} title="Code" type="button">
      <Code size={14} strokeWidth={2.5} />
    </button>
    <button class="fmt-btn" onclick={() => applyWrap('[','](url)')} title="Link" type="button">
      <Link size={14} strokeWidth={2.5} />
    </button>
    <div class="fmt-divider"></div>
    <span class="word-count">{wordCount} words</span>
  </div>
{/if}
```

`applyWrap` dispatches a CodeMirror transaction via exposed `editorView` ref.
`ThoughtEditor.svelte` needs to expose `editorView` via `bind:this` or a callback.

Word count:
```typescript
const wordCount = $derived(
  thought?.content?.trim().split(/\s+/).filter(Boolean).length ?? 0
);
```

### 3B — Mobile formatting toolbar (above keyboard)

**File: `src/routes/(app)/thought/[id]/+page.svelte`**

On Capacitor native: a `position: fixed; bottom: 0` accessory bar that moves up with the keyboard.
Use `@capacitor/keyboard` `keyboardWillShow` event to get keyboard height, then set `bottom` to that value.

```svelte
{#if Capacitor.isNativePlatform()}
  <div class="mobile-fmt-bar" style="bottom: {kbHeight}px">
    <!-- same buttons as 3A -->
  </div>
{/if}
```

### 3C — Editor status bar (bottom of editor page)

```svelte
<div class="editor-status">
  <span>{wordCount} words · {charCount} chars</span>
  {#if thought?.updated_at}
    <span>Saved {relativeTime(thought.updated_at)}</span>
  {/if}
</div>
```

### 3D — CodeMirror theme update

**File: `src/components/editor/ThoughtEditor.svelte`** — update the `EditorView.theme({})` call:

```typescript
EditorView.theme({
  '&': {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '15px',
    lineHeight: '1.75',
    color: 'var(--text-primary)',
    background: 'transparent',
  },
  '.cm-content': {
    padding: '0 0 40vh 0',
    caretColor: 'var(--color-brand)',
  },
  '.cm-cursor': { borderLeft: '2px solid var(--color-brand)', borderRight: 'none' },
  '.cm-selectionBackground, ::selection': { background: 'var(--bg-elevated) !important' },
  '.cm-activeLine': { background: 'transparent' },
  '.cm-gutters': { display: 'none' },
  // Heading styles
  '.cm-header-1': { fontSize: '1.4em', fontWeight: '700', letterSpacing: '-0.02em' },
  '.cm-header-2': { fontSize: '1.2em', fontWeight: '600' },
  '.cm-header-3': { fontSize: '1.05em', fontWeight: '600' },
})
```

### 3E — YAML mask visual improvement

**File: `src/routes/(app)/thought/[id]/+page.svelte`** CSS:
```css
.yaml-section {
  background: var(--bg-surface);
  border-left: 2px solid var(--border-strong);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  margin: 0 0 1.5rem;
}
```

---

## PHASE 4 — GRAPH IMPROVEMENTS

### 4A — Label visibility fix

**File: `src/components/graph/GraphNode.ts`**

Reduce label zoom threshold. Add short-label fallback at very low zoom.

```typescript
const LABEL_ZOOM_THRESHOLD = 0.42;       // was likely ~0.7
const LABEL_SHORT_THRESHOLD = 0.22;      // show truncated label below this

// In drawNode:
if (zoom >= LABEL_ZOOM_THRESHOLD && label) {
  // full label (existing code)
} else if (zoom >= LABEL_SHORT_THRESHOLD && label) {
  // short label: first 12 chars
  const short = label.length > 12 ? label.slice(0, 11) + '…' : label;
  ctx.font = `400 9px 'Inter', system-ui`;
  ctx.fillStyle = 'rgba(240,244,255,0.45)';
  ctx.fillText(short, x, y + radius + 12);
}
```

### 4B — Node visual improvement

**File: `src/components/graph/GraphNode.ts`**

- Active node: draw a subtle outer ring `2px stroke var(--color-brand) at 30% opacity`
- Hub nodes (many edges): slightly larger radius (base + `Math.min(edges.length * 0.4, 4)`)

---

## PHASE 5 — COMMAND PALETTE & QUICK SWITCHER

The infrastructure (`ShortcutManager`, `commandPaletteOpen` state) exists but there is NO visible command palette component. This is Tier 1 critical.

### 5A — Command Palette component

**File: `src/components/layout/CommandPalette.svelte`** — check if it exists first.
If it does, audit its completeness. If not, create it.

**Visual spec (Raycast-style):**
- Full-screen backdrop `var(--overlay-backdrop)`
- Centered card: 560px wide, `var(--glass-overlay)` + `var(--glass-blur)` + `var(--shadow-lg)`
- Top border: `1px solid var(--border-strong)` with brand glow: `box-shadow: 0 0 0 1px var(--brand-glow)`
- Input: 48px tall, Inter 16px 400, no inner border, placeholder `var(--text-muted)`
- Results: 40px rows, icon (20px) + title (Inter 500 14px) + kbd badge right-aligned
- Active row: `var(--bg-elevated)` solid background, `var(--radius-md)`
- Section headers: 11px 600 uppercase muted
- Groups: Navigation, Actions, Recent

---

## PHASE 6 — FEATURE DISCOVERY PAGE

**New file: `src/routes/(app)/features/+page.svelte`**

A scannable card grid showing every Flought feature. This is the "internal store" the user wants.

**Entry points:**
- Topbar `?` button → `/features`
- Settings page bottom → "Feature Guide" link
- After first onboarding completion → auto-redirect

**Cards structure:**
```svelte
{#each FEATURE_CARDS as card, i}
  <div class="feature-card" style="animation-delay: {i * 40}ms">
    <div class="card-icon"><svelte:component this={card.icon} size={20} /></div>
    <h3 class="card-title">{card.title}</h3>
    <p class="card-desc">{card.desc}</p>
    {#if card.shortcut}<kbd class="card-kbd">{card.shortcut}</kbd>{/if}
    <button class="card-cta" onclick={card.action} type="button">Try it</button>
  </div>
{/each}
```

**Feature cards to include:**
| Feature | Description | Action |
|---------|-------------|--------|
| Knowledge Graph | See all your thoughts as a connected web | goto('/map') |
| Wikilinks | Type `[[title]]` to link thoughts | goto recent thought |
| Serendipity Collider | Daily random connection suggestions | scroll to sidebar |
| Triage Dots | New thoughts get a pulsing dot until read | show demo |
| Activity Calendar | 28-day heat map of your writing | show in sidebar |
| Focus Mode | Click a stage to dim unrelated thoughts | goto('/map') |
| Graph Controls | Live physics + display tuning | open panel |
| Keyboard Shortcuts | Navigate without the mouse | goto('/settings') |
| Semantic Gravity | Stage grouping on the graph | goto('/map') |
| Document Outline | Jump to any heading | open editor |
| Google Drive Sync | Automatic cloud backup | goto('/settings') |
| Stage Pipeline | Track ideas from inbox to archive | goto('/map') |

---

## PHASE 7 — SETTINGS COMPLETION

### 7A — Sync section

New accordion in `src/routes/(app)/settings/+page.svelte`:
- Google Drive status (connected/disconnected)
- Connect / Disconnect button
- Last synced timestamp
- Manual sync button → calls `SyncService.push()`

### 7B — About section

- App version (from `import.meta.env.VITE_APP_VERSION`)
- Link to `/features` page
- "What's new" placeholder

### 7C — Data section

- Export all thoughts as JSON (client-side Blob download)
- Word count total across all thoughts

---

## PHASE 8 — ANIMATIONS

All Rule 9 compliant (transform + opacity only):

### 8A — Sidebar thought rows: staggered entrance
```css
.thought-row { animation: row-in 180ms ease both; }
.thought-row:nth-child(1) { animation-delay: 0ms; }
.thought-row:nth-child(2) { animation-delay: 30ms; }
.thought-row:nth-child(3) { animation-delay: 60ms; }
.thought-row:nth-child(4) { animation-delay: 90ms; }
.thought-row:nth-child(5) { animation-delay: 120ms; }
@keyframes row-in {
  from { opacity: 0; transform: translateX(-6px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

### 8B — Graph node entrance
After first positions received from worker: `nodeOpacity` goes from 0 → 1 over 400ms.
Multiply node opacity by `nodeOpacity` during `drawNode()` call.

### 8C — Route transition enhancement
```css
.route-view {
  animation: route-in 280ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes route-in {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### 8D — Capture button breathing glow
```css
@keyframes brand-breathe {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,211,238,0.4); }
  50%       { box-shadow: 0 0 0 8px rgba(34,211,238,0); }
}
.capture-btn { animation: brand-breathe 3s ease-in-out infinite; }
```

---

## EXECUTION ORDER

| Phase | Files | Impact | Type |
|-------|-------|--------|------|
| 1 — Design tokens | `src/app.css`, `src/app.html` | Foundation | CSS |
| 2A — Sidebar | `Sidebar.svelte` | High visual | CSS + icon rail logic |
| 2B — Topbar | `Topbar.svelte` | High visual | CSS |
| 2C — Mobile dock | `MobileDock.svelte` | Critical fix + visual | Logic + CSS |
| 3A/B/C — Editor | `thought/[id]/+page.svelte` | High | HTML + CSS + logic |
| 3D — CM6 theme | `ThoughtEditor.svelte` | High | JS |
| 4A/B — Graph | `GraphNode.ts`, `GraphCanvas.svelte` | High | JS |
| 5A — Command palette | `CommandPalette.svelte` | Critical | HTML + CSS |
| 6 — Feature page | `features/+page.svelte` | High | New page |
| 7 — Settings | `settings/+page.svelte` | Medium | HTML + CSS |
| 8 — Animations | Sidebar, GraphCanvas, layout | Polish | CSS |

---

## VERIFICATION

1. `npm run check` → 0 errors, 0 warnings after each phase
2. `npm run test` → all 42 tests pass (no logic touched except phase 2C + 3A)
3. Dark theme: true black canvas, glass panels visible, cyan accent
4. Light theme: toggle → white glass, dark text, same cyan accent
5. Editor: formatting toolbar always visible, word count shown
6. Graph: labels visible at default zoom
7. Mobile Android: Editor tab navigates to most recent thought
8. Mobile: formatting toolbar appears above keyboard
9. Command palette: ⌘K opens, fuzzy search works, Escape closes
10. Feature page: accessible from `?` button in topbar

---

## OUT OF SCOPE (CLAUDE.md rules)

- Daily notes (architecture change)
- Block-level IDs / block references (Roam pattern, not in V1)
- Side-by-side note comparison
- Import/export engine
- Reading mode (always edits in live-preview)
- Mermaid/LaTeX (heavy dependency)
