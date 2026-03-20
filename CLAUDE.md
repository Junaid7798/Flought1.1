## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: none

---

# FLOUGHT — ARCHITECTURAL CONSTITUTION
# Read this file at the start of every session before writing any code.
# Also read: DEVELOPER_PERSONALITY.md, docs/session-handover.md

---

## What this app is

Local-first knowledge graph and pipeline tracker.
Users capture Thoughts, link them with [[wikilinks]], and see
connections on an interactive graph. Data lives on the device.
Google Drive is optional backup only. V1 is 100% free.

---

## 12 rules — never break these

1.  SvelteKit 5 Runes ONLY: `$state`, `$derived`, `$effect`
    Never use Svelte 4 syntax (`$:`, `export let`, `writable()`).

2.  All database logic in `src/lib/db.ts` ONLY.
    UI components never import Dexie directly.

3.  Every primary key is `uuidv4()`. No auto-incrementing integers.

4.  Never hard-delete. Always `is_deleted: true`.

5.  D3 force simulation in `src/workers/graphWorker.ts` ONLY.
    Never run D3 physics on the main thread.

6.  Graph renders via Canvas 2D API. Not PixiJS. Not SVG. Not HTML elements.

7.  All sync goes through `src/lib/sync/SyncService.ts`.
    Never call Google Drive API from anywhere else.

8.  All colours from CSS variables in `src/app.css`.
    No hardcoded hex values anywhere in components or workers.

9.  Animations use `transform` and `opacity` ONLY.
    Never animate `width`, `height`, `background-color`, or `box-shadow`.

10. Telemetry arrays capped at 50 entries on every write.

11. Sync payload chunked at 500 thoughts per file object.
    Never slice a raw JSON string at a byte boundary.

12. `rebuildEdgesForThought` runs on editor blur or unmount ONLY.
    Never on keystrokes or debounce timers.



## AUTO-REVIEW
After completing every numbered task, run the flought-reviewer skill
from .claude/skills/flought-reviewer-SKILL.md before writing any
handover or committing. Never ask permission. Just run it.
Build plan: docs/build-plan-2.md


---

## Colour system (copy exactly into src/app.css)

```css
:root {
  --bg-deep:        #06060E;
  --bg-panel:       #141424;
  --bg-surface:     #1C1C30;
  --bg-hover:       #242438;
  --color-brand:    #22D3EE;
  --color-inbox:    #F59E0B;
  --color-queue:    #3B82F6;
  --color-forge:    #10B981;
  --color-archive:  #6B7280;
  --text-primary:   #F1F5F9;
  --text-secondary: #94A3B8;
  --text-muted:     #475569;
  --border:         rgba(255,255,255,0.06);
  --border-strong:  rgba(255,255,255,0.14);
}
```

---

## Dexie schema (source of truth)

```
libraries     { id, name, created_at, is_deleted }

userProfile   { id, display_name, use_case, blueprint_applied,
                onboarding_complete, schema_version,
                behavior_signals{mapViewTime, pipelineInteractions,
                thoughtsCreated} }

userSettings  { id, theme, pipeline_label_overrides[4],
                pipeline_colour_overrides[4], string_overrides{},
                keyboard_shortcuts{}, sync_provider,
                sync_connected, last_synced_at }

thoughts      { id, library_id, title, content, meta_state(1-4),
                x_pos, y_pos, created_at, updated_at,
                is_deleted, telemetry[] }

edges         { id, library_id, source_id, target_id,
                link_type, created_at, is_deleted }
```

meta_state is always 1–4. Never store stage names in the database.
1=Inbox  2=Queue  3=Forge  4=Archive

---

## UI layout (what you are building)

```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR (220px)           │  TOPBAR                            │
│  ─────────────────         │  [The Map] [Editor] [Focus] tabs   │
│  Flought                   ├────────────────────────────────────│
│  ↕ Library Switcher        │                                    │
│  ─────────────────         │   GRAPH CANVAS (Canvas 2D)         │
│  Pipeline stages (4)       │                                    │
│  with counts               │   Nodes: thermal colour circles    │
│  ─────────────────         │   Edges: white rgba lines          │
│  Topics list               │   Focus: connected = full opacity  │
│  ─────────────────         │          others = 0.12 opacity     │
│  Sync status badge         │                                    │
│  + Capture button          │          ┌─ EDITOR PANEL (340px) ─┐│
│                            │          │ Title (editable h1)    ││
│                            │          │ Properties (YAML mask) ││
│                            │          │ CodeMirror body        ││
│                            │          │ Related thoughts panel ││
│                            │          └───────────────────────┘│
│                            │  ┌─ SPARK INPUT (bottom bar) ────┐ │
│                            │  │ + Capture a thought...  ↵    │ │
│                            │  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

MOBILE (< 768px):
- Sidebar collapses to bottom dock (Map / Editor / Capture tabs)
- Spark becomes a FAB button above the dock
- Editor takes full screen when a thought is open
- Graph takes full screen in Map view
```

---

## File boundary law

```
src/routes/ and src/components/
  → import from src/lib/db.ts exports ONLY
  → import from src/lib/config.ts ONLY for constants
  → import from src/lib/i18n.ts ONLY for strings
  → NEVER import Dexie directly

src/lib/db.ts
  → imports Dexie, src/lib/uuid.ts, src/lib/eventBus.ts ONLY

src/workers/
  → NO DOM access
  → NO Dexie imports
  → NO Svelte imports
  → Pure computation: receive via postMessage, return via postMessage
```

---

## Dynamic architecture (use these, never hardcode)

- **Strings**: `$t('key')` from `src/lib/i18n.ts`
- **Pipeline states/colours**: `PIPELINE_STATES` from `src/lib/config.ts`
- **Animation values**: `ANIMATION_CONFIG` from `src/lib/config.ts`
- **Graph settings**: `GRAPH_CONFIG` from `src/lib/config.ts`
- **Layout state**: `uiStore` from `src/lib/stores/uiStore.ts`
- **Events**: `eventBus.emit()` from `src/lib/eventBus.ts` after every db write

---

## Platform targets

V1 ships on all platforms:
- Web PWA (Cloudflare Pages) — day one
- Android (Google Play via Capacitor) — Phase 6.5
- iOS (App Store via Capacitor) — Phase 6.5
- Windows (Microsoft Store via Tauri) — Phase 6.5
- Mac (Mac App Store via Tauri) — Phase 6.5

Mobile rules (apply to every component from Phase 2):
- Use `100dvh` not `100vh`
- Bottom elements use `env(safe-area-inset-bottom)`
- Minimum tap target: 44×44px
- No hover-only interactions

---

## Do not build in V1

PixiJS · E2EE/AES-GCM · CRDTs/Yjs · WebRTC ·
Import/Export engine · Plugin API · Pricing/Paywall ·
SQLite WASM · Semantic Gravity · Block-level transclusion ·
Universal Insights Engine · Thematic Vibe Engine

---

## 🔒 PROTECTED FILES — DO NOT MODIFY
**Whatever changes we have to core, NEVER change it. If a core file or functionality requires to be edited, you MUST obtain explicit developer permission before proceeding.**

The following files contain migrated core logic and must NEVER be changed:
- FrontmatterMask.svelte
- ThoughtEditor.svelte
- Convex Hulls (drawHulls)
- drawNode 
- addEventListener('wheel')
- onwheel,onpointerdown

If any task seems to require editing these files, STOP and ask the user first.
