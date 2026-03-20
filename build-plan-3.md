# FLOUGHT — COMPLETE BUILD PLAN
# Hand one task at a time to Claude Code.
# Never combine tasks. Never skip the session ritual.

---

## SESSION START RITUAL (every session, no exceptions)
```
Read these files before writing any code:
1. DEVELOPER_PERSONALITY.md
2. CLAUDE.md
3. docs/session-handover.md

Confirm: current phase, next task, any open blockers.
Do not write any code until I confirm.
```

## SESSION END RITUAL (every session, no exceptions)
```
1. Write docs/session-handover.md
2. Run: git add -a
3. Show me the diff
4. Commit: type(phase-N): description
```

---

## PHASE 0 — THE SHELL (2–3 days · Sonnet 4.6)

**0.1 — Init the project**
```bash
npx sv create .
# Choose: SvelteKit minimal, TypeScript yes, Tailwind yes, no other add-ons
```

**0.2 — Install dependencies**
```bash
npm install dexie uuid @supabase/supabase-js @fontsource/geist \
  lucide-svelte gray-matter flexsearch @capacitor/core @capacitor/cli \
  @capacitor/ios @capacitor/android

npm install -D vitest @vitest/ui @tauri-apps/cli
```

**0.3 — Init Capacitor**
```bash
npx cap init Flought com.flought.app --web-dir=build
```

**0.4 — Prompt: config and dynamic architecture files**
```
Read CLAUDE.md. Create these four files exactly as specified:

src/lib/config.ts — export PIPELINE_STATES array (id, colour, cssVar),
ANIMATION_CONFIG object (focusFadeDuration:300, nodeBloomDuration:400,
nodeBloomStagger:60, springEasing:'cubic-bezier(0.34,1.56,0.64,1)',
graphAlphaDecay:0.028, debounceEditor:800),
GRAPH_CONFIG object (neighbourhoodDepth:2, maxViewportNodes:500,
labelZoomThreshold:0.8, nodeFocusOpacity:1.0, nodeUnfocusedOpacity:0.12,
edgeFocusOpacity:0.4, edgeUnfocusedOpacity:0.04)

src/lib/i18n.ts — export DEFAULT_STRINGS covering all nav, pipeline
stage names, capture prompt, thought/topic/library singular and plural,
onboarding strings. Export $t(key) function that reads
userSettings string_overrides first, falls back to DEFAULT_STRINGS.

src/lib/eventBus.ts — export eventBus with emit(event) and on(type, fn)
functions. No listeners yet. FloughtEvent type covers thought.created,
thought.updated, thought.stage_changed, edge.created, library.switched,
sync.completed.

src/lib/stores/uiStore.ts — export uiStore as $state with: sidebarWidth,
sidebarCollapsed, sidebarPosition, activeView, focusedNodeId,
activeLibraryId, commandPaletteOpen, theme.
Bind --sidebar-width CSS variable to sidebarWidth.
```

**0.5 — Prompt: CSS and layout shell**
```
Read CLAUDE.md. Create src/app.css with exactly the colour variables
from CLAUDE.md. Add body rule: background var(--bg-deep),
color var(--text-primary), font-family Geist.
Import @fontsource/geist at the top.

Create src/routes/+layout.ts with export const ssr = false.

Create src/routes/+layout.svelte with the two-column desktop layout:
sidebar (220px, var(--bg-panel)) and main content (flex-1, var(--bg-deep)).
On screens below 768px switch to mobile layout: full-width main content
with a bottom dock nav bar.
Use uiStore for sidebar width. Use 100dvh not 100vh.
```

**0.6 — Prompt: platform files**
```
Create _headers file in project root for Cloudflare Pages CSP.
Create .env.example with PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.
Add .env.local to .gitignore.
Create capacitor.config.ts with appId: com.flought.app, appName: Flought.
```

**0.7 — Deploy**
Push to GitHub. Connect to Cloudflare Pages.
Build command: `npm run build`. Output directory: `build`.

**Phase 0 done when:**
- [ ] Live URL on Cloudflare Pages loads the shell
- [ ] `npm run check` passes
- [ ] All 4 dynamic architecture files exist
- [ ] Capacitor configured with correct app ID

---

## PHASE 1 — DATA LAYER (3–5 days · Sonnet 4.6)
No UI. Database only. Do not touch any .svelte files.

**1.1 — Prompt: uuid utility**
```
Create src/lib/uuid.ts. Export one function: generateId(): string
using the uuid package v4. This is the only place in the entire
codebase that generates IDs.
```

**1.2 — Prompt: Dexie schema**
```
Read CLAUDE.md schema section. Create src/lib/db.ts with the complete
Dexie schema. Include full TypeScript interfaces for every table.
Add schema_version: 1. Do not write any CRUD functions yet.
Run npm run check.
```

**1.3 — Prompt: thoughts CRUD**
```
Read CLAUDE.md and current db.ts. Add to db.ts:
createThought(libraryId, title) — meta_state:1, telemetry:[], is_deleted:false
updateThought(id, changes) — appends timestamp to telemetry, caps at 50, 
  updates updated_at, emits eventBus thought.updated
softDeleteThought(id) — is_deleted:true, emits thought.updated
getThought(id) — returns Thought | undefined
getThoughtsByLibrary(libraryId) — liveQuery, non-deleted only
After every write: call eventBus.emit() with correct event type.
Run npm run check.
```

**1.4 — Prompt: edges CRUD**
```
Add to db.ts:
createEdge(libraryId, sourceId, targetId, linkType?)
softDeleteEdge(id)
getEdgesForThought(thoughtId) — source OR target, non-deleted
rebuildEdgesForThought(thoughtId, newLinkedTitles) — DIFF strategy:
  only delete edges no longer linked, only create genuinely new edges.
  Do NOT delete all and recreate. Compare existing vs new titles.
Run npm run check.
```

**1.5 — Prompt: libraries and user CRUD**
```
Add to db.ts:
createLibrary(name) — createThought pattern
getLibraries() — liveQuery, non-deleted
getDefaultLibrary() — returns first or creates "My Mind"
initUserProfile(displayName, useCase) — idempotent, sets schema_version:1
getUserProfile() / getUserSettings() / updateUserSettings(changes)
markOnboardingComplete()
Run npm run check.
```

**1.6 — Prompt: applyBlueprint**
```
Read src/lib/blueprints.ts (we will create this in Phase 2).
Add applyBlueprint(useCase) to db.ts:
1. Gets or creates default library
2. Updates userSettings pipeline_label_overrides from blueprint
3. Creates seed thoughts with correct meta_state values
4. Topic folders are a 'topic' string field on thoughts — NOT separate libraries
5. Sets userProfile.blueprint_applied = useCase
Run npm run check.
```

**1.7 — Prompt: Vitest tests**
```
Create src/lib/db.test.ts. Write tests for:
createThought — id is uuid, meta_state is 1, is_deleted is false
updateThought — telemetry capped at 50 after 60 updates
softDeleteThought — record exists but is_deleted is true
createEdge + getEdgesForThought — edge is retrievable
rebuildEdgesForThought — diff: old edges soft-deleted, new created,
  unchanged edges untouched
initUserProfile — idempotent (calling twice creates one record)
Run: npm run test
```

**Phase 1 done when:**
- [ ] `npm run check` passes zero errors
- [ ] `npm run test` passes all tests
- [ ] No Dexie import exists outside db.ts
- [ ] Every write calls eventBus.emit()

---

## PHASE 2 — CAPTURE UI & ONBOARDING (4–7 days · Sonnet 4.6)

**2.1 — Prompt: blueprints config**
```
Create src/lib/blueprints.ts. Export BLUEPRINTS object with 10 use cases:
freelance, research, writing, job-hunt, startup, journaling,
engineering, content, marketing, pkm.

Each blueprint has:
- label: display name
- category: 'work' | 'personal'
- pipelineLabels: [string, string, string, string]
- seedThoughts: Array<{title, meta_state}>
- topicFolders: string[] (these are topic field values, not libraries)
- kineticHookInstruction: string (use-case specific first action)

Make seed thoughts feel real and relevant for each use case.
```

**2.2 — Prompt: onboarding page**
```
Read CLAUDE.md and src/lib/blueprints.ts.
Create src/routes/onboarding/+page.svelte using Svelte 5 Runes.

Step 1: "What should we call you?" — name input, required.
Step 2: Two large buttons — Work/Professional and Personal/Creative.
Step 3: Five blueprint cards relevant to chosen category.

On blueprint selection:
- Call db.initUserProfile(name, useCase)
- Call db.applyBlueprint(useCase)
- Call db.markOnboardingComplete()
- Navigate to /map

Midnight theme. Electric Cyan accent on hover and selection.
Use $t() for all visible strings.
Mobile: full-screen single-column layout, 44px minimum tap targets.
```

**2.3 — Prompt: sidebar**
```
Create src/components/layout/Sidebar.svelte using Svelte 5 Runes.
Layout top to bottom:
1. Brand header: "Flought" + tagline
2. Library Switcher (shows active library name, dropdown arrow)
   - On click: dropdown list of all libraries
   - Plus button creates new library via db.createLibrary()
3. "Pipeline" section label
4. Four stage buttons from PIPELINE_STATES using pipeline_label_overrides
   - Each shows label + thought count from liveQuery
   - Active stage shows cyan left border accent
5. "Topics" section label
6. Topic list derived from thoughts (unique topic field values)
   - Each shows a colour dot + label
7. Sync status badge at bottom (icon + "Synced X min ago")
8. "+ Capture a Thought" button at very bottom

Props: activeLibraryId string
Mobile: this component is hidden. MobileDock replaces it.
Use $t() for all strings. Colours from CSS variables only.
```

**2.4 — Prompt: SparkInput**
```
Read CLAUDE.md UI section. 
Create src/components/capture/SparkInput.svelte using Svelte 5 Runes.

A single text input on the pitch-black background.
When unfocused: --border thin and barely visible.
When focused: 1px Electric Cyan border (--color-brand).
  Add a very subtle cyan glow behind the border — not a neon explosion,
  a whisper of light (box-shadow: 0 0 12px rgba(34,211,238,0.12)).
Placeholder: $t('capture.prompt') at 40% opacity.
Input text: --text-primary, full opacity.

On Enter:
- Call db.createThought(libraryId, inputValue)
- Clear input with spring scale(0.97)→scale(1) animation
- 150ms spring easing: cubic-bezier(0.34,1.56,0.64,1)

On Escape: clear without saving.

Props: libraryId string
Mobile: this becomes the FAB and bottom sheet.
```

**2.5 — Prompt: mobile dock**
```
Create src/components/layout/MobileDock.svelte.
Shows only on screens below 768px.
Three tabs: Map (graph icon), Editor (edit icon), Capture (plus icon).
Fixed to bottom. Background --bg-panel.
Uses safe-area-inset-bottom padding.
Capture tab opens SparkInput as a bottom sheet modal.
Uses lucide-svelte icons.
```

**2.6 — Prompt: wire the layout**
```
Update src/routes/+layout.svelte.
On mount: check db.getUserProfile().
If onboarding_complete is false → redirect to /onboarding.
If true → show main layout with Sidebar and main content slot.
On desktop: sidebar visible, MobileDock hidden.
On mobile (< 768px): sidebar hidden, MobileDock visible.
SparkInput appears in bottom of main content area on desktop.
Pass activeLibraryId from uiStore to Sidebar and SparkInput.
```

**Phase 2 done when:**
- [ ] New user → onboarding → blueprint selected → layout visible
- [ ] SparkInput creates a thought (verify in DevTools IndexedDB)
- [ ] Sidebar shows correct counts from liveQuery
- [ ] Library switcher works
- [ ] Mobile layout shows dock, not sidebar
- [ ] `npm run check` passes

---

## PHASE 3 — THE EDITOR (1–2 weeks · Sonnet 4.6)
Warning: CodeMirror integration is the hardest phase. One task at a time.

**3.1 — Install CodeMirror**
```bash
npm install @codemirror/view @codemirror/state @codemirror/lang-markdown \
  @codemirror/commands @codemirror/language @codemirror/theme-one-dark
```

**3.2 — Prompt: frontmatter parser**
```
Create src/lib/frontmatterParser.ts.
Export parseFrontmatter(content) → {data, body} using gray-matter.
Export serializeFrontmatter(data, body) → string using gray-matter.
NEVER use regex to parse YAML.
Create frontmatterParser.test.ts: roundtrip test (parse then serialize
returns original string). Run npm run test.
```

**3.3 — Prompt: link parser**
```
Create src/lib/linkParser.ts.
Export extractLinks(content) → string[].
Finds [[wikilink]] patterns. Returns inner text array.
Handles: empty brackets (ignore), nested brackets (ignore),
brackets inside code blocks (ignore).
Create linkParser.test.ts for all edge cases.
Run npm run test.
```

**3.4 — Prompt: search worker**
```
Create src/workers/searchWorker.ts. Web Worker — no DOM, no Dexie, no Svelte.
Uses FlexSearch. Handles three message types:
{type:'index', thoughts:[{id,title,content}]} → rebuild full index
{type:'update', thought:{id,title,content}} → patch single entry
{type:'search', query:string} → postMessage {type:'results', ids:string[]}
```

**3.5 — Prompt: CodeMirror editor**
```
Create src/components/editor/ThoughtEditor.svelte using Svelte 5 Runes.
Props: thought (Thought type from db.ts)

On mount: initialise CodeMirror 6 with Markdown language support.
Dark theme matching Midnight (use EditorView.theme()).
No toolbar. Clean writing surface.
Text column max-width: 600px. Generous line height: 1.7.
Use Geist font in the editor.

On content change (800ms debounce):
1. Call db.updateThought(id, {content: newContent})
2. Post {type:'update'} to searchWorker (NOT full index rebuild)

On blur or unmount (ONLY here):
3. Call extractLinks(newContent)
4. Call db.rebuildEdgesForThought(id, linkedTitles)

Run npm run check.
```

**3.6 — Prompt: frontmatter mask**
```
Create src/components/editor/FrontmatterMask.svelte using Svelte 5 Runes.
Props: thoughtId string

On mount: read thought, call parseFrontmatter, extract YAML data.
Render a properties panel showing:
- meta_state as tap-friendly dropdown (shows pipeline label from userSettings)
  On change: update meta_state in db, emit thought.stage_changed on eventBus
- created_at as read-only formatted date
- Any custom YAML keys as editable text inputs

CRITICAL: The raw YAML must never be visible.
Use CodeMirror Decoration.replace() to hide the frontmatter range
(line 0 to closing ---) in the editor.
FrontmatterMask renders above the editor and reads/writes the same YAML
via parseFrontmatter/serializeFrontmatter.

Run npm run check.
```

**3.7 — Prompt: command palette**
```
Create src/components/search/CommandPalette.svelte using Svelte 5 Runes.
Opens on Cmd+K (Ctrl+K on Windows). Closes on Escape.
Overlay modal. Background --bg-surface. Rounded corners.
Text input. On keystroke: post {type:'search'} to searchWorker.
Results list. Clicking a result navigates to /thought/[id].
Wire Cmd+K shortcut in root +layout.svelte via keydown listener.
```

**3.8 — Prompt: thought page**
```
Create src/routes/(app)/thought/[id]/+page.svelte.
Load thought from db.getThought(id).
Render: editable h1 title → FrontmatterMask → ThoughtEditor.
Title changes call db.updateThought(id, {title}).
Handle missing thought: redirect to /map.
Mobile: full-screen editor, back button returns to map.
```

**3.9 — Prompt: re-index on thought changes**
```
In src/routes/(app)/+layout.svelte:
Instantiate searchWorker on mount.
Subscribe to db.getThoughtsByLibrary(activeLibraryId) via $effect.
When result changes: post {type:'index'} to searchWorker.
Debounce the index rebuild at 2000ms.
Pass worker instance to CommandPalette via context.
```

**Phase 3 done when:**
- [ ] Clicking a thought opens the editor with content
- [ ] Typing updates Dexie (verify in DevTools)
- [ ] [[links]] create edges in the edges table
- [ ] YAML is hidden — properties shown as UI controls
- [ ] Cmd+K opens search and returns results
- [ ] `npm run check` and `npm run test` pass

---

## PHASE 4 — THE GRAPH (2–3 weeks · Sonnet for canvas, Opus for worker)

**4.1 — Prompt (OPUS 4.6): graph worker**
```
Create src/workers/graphWorker.ts. Web Worker — no DOM access.
Install: npm install d3-force

Handles message {type:'simulate', nodes:NodeData[], edges:EdgeData[]}
NodeData: {id:string, x?:number, y?:number, meta_state:number}
EdgeData: {source:string, target:string}

Run D3 forceSimulation:
- forceManyBody strength: -200
- forceLink distance: 120  
- forceCenter at (0,0)
- alphaDecay: from GRAPH_CONFIG (0.028)

Run to completion (alpha < 0.001). Do NOT stream results every tick.
Post back ONCE: {type:'positions', buffer:Float32Array, nodeIndex:Record<string,number>}
Buffer format: [index0, x0, y0, index1, x1, y1, ...] — 3 floats per node.

Also handle:
{type:'drag', id:string, fx:number, fy:number} → pin node at fx/fy, alpha(0.3).restart()
{type:'dragEnd', id:string} → set fx/fy to null, release
{type:'addNode', node:NodeData} → add to simulation, alpha(0.1).restart()
```

**4.2 — Prompt (Sonnet): graph canvas component**
```
Create src/components/graph/GraphCanvas.svelte using Svelte 5 Runes.
Props: libraryId:string, activeThoughtId:string|null

1. Instantiate graphWorker on mount. Terminate on unmount.

2. Load thoughts + edges via liveQuery ($effect on libraryId).
   NEIGHBOURHOOD FILTER:
   If activeThoughtId: only pass nodes within depth-2 of that node.
   If no active thought: all nodes, capped at GRAPH_CONFIG.maxViewportNodes,
   sorted by updated_at descending.

3. On liveQuery update with new thought added:
   Post {type:'addNode'} — NOT a full re-simulate.

4. Send filtered nodes + edges to worker via postMessage.

5. On worker message 'positions':
   Receive Float32Array, draw on <canvas> using Canvas 2D.
   
   Drawing (use pure functions GraphNode.ts and GraphEdge.ts):
   Node: circle radius 8px, colour from PIPELINE_STATES by meta_state
   Active node: second circle radius 12px, --color-brand stroke, opacity 0.4
   Node label: 11px, --text-secondary, centred 6px below node
   Labels hidden when zoom < GRAPH_CONFIG.labelZoomThreshold
   Edge: 1px line, rgba(255,255,255,0.15)

6. Focus mode (when activeThoughtId set):
   Connected nodes → full opacity
   Connected edges → PIPELINE_STATES colour of active node, opacity 0.4
   All other nodes → GRAPH_CONFIG.nodeUnfocusedOpacity (0.12)
   All other edges → GRAPH_CONFIG.edgeUnfocusedOpacity (0.04)
   Transition over ANIMATION_CONFIG.focusFadeDuration (300ms) using
   requestAnimationFrame lerp. Do NOT snap.

7. On node click: update uiStore.focusedNodeId, navigate to /thought/[id].

8. On node drag start: post {type:'drag'} to worker.
   On drag move (throttled to rAF): post {type:'drag'} with new fx/fy.
   On drag end: post {type:'dragEnd'}. Call db.updateThought(id, {x_pos, y_pos}).
   Save to Dexie ONLY on dragEnd, never on dragMove.
```

**4.3 — Prompt: graph canvas helper files**
```
Create src/components/graph/GraphNode.ts
Export drawNode(ctx, x, y, radius, colour, isActive, label, zoom)
Pure function. No imports from db or Svelte.

Create src/components/graph/GraphEdge.ts  
Export drawEdge(ctx, x1, y1, x2, y2, colour, opacity)
Pure function. No imports from db or Svelte.
```

**4.4 — Prompt: map page**
```
Create src/routes/(app)/map/+page.svelte using Svelte 5 Runes.
Full-height GraphCanvas filling main content area.
Floating toolbar top-right:
- "Show full graph" toggle (removes neighbourhood filter)
- Thought count: "342 thoughts · showing 47"
On node click from GraphCanvas: navigate to /thought/[id].
```

**Phase 4 done when:**
- [ ] /map shows a graph of thoughts with coloured nodes
- [ ] Clicking a node navigates to the editor
- [ ] Focus mode fades unconnected nodes
- [ ] Dragging a node persists position in Dexie
- [ ] Library switch reloads the graph cleanly
- [ ] 100 imported thoughts do not freeze the UI
- [ ] `npm run check` passes

---

## PHASE 5 — AUTH (3–5 days · Sonnet 4.6)

**5.1 — Create Supabase project**
- Create at supabase.com (free tier)
- Enable: Google, GitHub, Email (magic link)
- Add site URL: Cloudflare Pages URL + localhost:5173
- Copy URL + anon key to .env.local

**5.2 — Prompt: Supabase client**
```
Create src/lib/supabase.ts.
Initialise and export Supabase client using PUBLIC_SUPABASE_URL
and PUBLIC_SUPABASE_ANON_KEY from $env/static/public.
Export getSession() helper.
```

**5.3 — Prompt: login page**
```
Create src/routes/login/+page.svelte using Svelte 5 Runes.
Three sign-in options as large buttons:
1. Continue with Google → signInWithOAuth({provider:'google'})
2. Continue with GitHub → signInWithOAuth({provider:'github'})
3. Email link → text input + signInWithOtp({email})
Midnight theme. Buttons full-width. 44px minimum height.
After auth: Supabase redirects back to app automatically.
```

**5.4 — Prompt: auth guard**
```
Create src/routes/(app)/+layout.svelte.
On mount: getSession(). If no session → redirect to /login.
If session: tag userProfile in Dexie with supabase user id.
Set up onAuthStateChange for token refresh.
Check db.getUserProfile().onboarding_complete.
If false → redirect to /onboarding.
```

**5.5 — Prompt: sync status badge**
```
Create src/components/layout/SyncStatusBadge.svelte.
Props: status ('local'|'synced'|'syncing'|'offline'|'error')
5px coloured dot + text label.
Colours: local=grey, synced=green, syncing=blue(pulse), 
  offline=amber, error=red.
Status 'local': shows "Local only"
Status 'synced': shows "Synced X min ago"
```

**Phase 5 done when:**
- [ ] New user → /login → Google OAuth works
- [ ] Email OTP works
- [ ] Authenticated user lands on /onboarding or /map correctly
- [ ] Token refresh works after browser restart

---

## PHASE 6 — SYNC ENGINE (1–2 weeks · Opus 4.6)

**6.1 — Prompt (Opus): SyncService interface**
```
Create src/lib/sync/SyncService.ts.
Export SyncAdapter interface: push(payload), pull(), getStatus(), isConnected()
Export SyncPayload type: {thoughts:Thought[], edges:Edge[], exportedAt:string}
Export SyncResult type: {success:boolean, error?:string}
Export SyncStatus type: 'local'|'synced'|'syncing'|'offline'|'error'
Export SyncService class with setAdapter(), push(), pull(), getStatus()
If no adapter: getStatus() returns 'local'
Export singleton: export const syncService = new SyncService()
```

**6.2 — Prompt: Google Drive connect flow**
```
Update SyncStatusBadge. When clicked and status is 'local':
Show modal: "Back up your thoughts to Google Drive?"
"Connect Google Drive" button calls:
supabase.auth.signInWithOAuth({
  provider:'google',
  options:{scopes:'https://www.googleapis.com/auth/drive.appdata'}
})
After connect: db.updateUserSettings({sync_connected:true, sync_provider:'google'})
```

**6.3 — Prompt (Opus): GoogleDriveAdapter**
```
Create src/lib/sync/GoogleDriveAdapter.ts implementing SyncAdapter.

push(payload):
1. Split payload.thoughts into chunks of 500 thoughts each
   (OBJECT-LEVEL chunking — never slice raw JSON strings)
2. For each chunk: JSON.stringify the chunk object → upload as
   'flought-sync-chunk-N.json' to Drive appdata folder
3. Upload manifest: 'flought-sync-manifest.json' with
   {totalChunks, exportedAt, version:1}
4. Return {success:true}
Handle network errors: return {success:false, error:message}
Handle 401: return {success:false, error:'token_expired'}
Never throw. Always return SyncResult.

pull():
1. Fetch manifest from appdata. If not found: return null.
2. Fetch all chunks listed in manifest.
3. Reassemble: concatenate all thoughts arrays, take edges from chunk 0.
4. Return complete SyncPayload.
```

**6.4 — Prompt: sync on app start and merge logic**
```
Update src/routes/(app)/+layout.svelte.
After auth check:
If userSettings.sync_connected:
  1. Initialise GoogleDriveAdapter with Google token from Supabase session
  2. syncService.setAdapter(adapter)
  3. Call syncService.pull()
  4. If payload returned: merge into Dexie using LWW rule:
     if incoming thought.updated_at > local thought.updated_at → overwrite
     if local thought does not exist → create
     Never delete local thoughts during merge
  5. Call syncService.push() with current local state
  6. Update uiStore or pass sync status to SyncStatusBadge
Handle token_expired: show "Reconnect Google Drive" prompt.
```

**Phase 6 done when:**
- [ ] Connecting Drive stores the auth token
- [ ] On next app open, thoughts merge from Drive
- [ ] SyncStatusBadge shows correct state
- [ ] Token expiry shows reconnect prompt, not a crash

---

## PHASE 7 — INTELLIGENT GRAPH & PIPELINES (1-2 weeks · Opus 4.6)

**7.1 — Prompt: Database Upgrades for Links & Pipelines**
```
Update src/lib/db.ts.
Add `linksTo?: string[]` to the Thought interface to store explicit graph relationships.
Create a new table `pipelines` with schema: { id: string, name: string, color: string, order: number }.
Add CRUD functions for pipelines: createPipeline, updatePipeline, deletePipeline, getPipelines().
Run npm run check.
```

**7.2 — Prompt: Custom Pipelines in Sidebar**
```
Update src/components/layout/Sidebar.svelte.
Replace the hardcoded `PIPELINE_STATES` with a liveQuery subscribing to `db.getPipelines()`.
Render a list of customizable Pipelines under the main navigation.
Each pipeline item has a glowing dot corresponding to its `color`.
Add inline editing: click a pipeline to rename it or pick a new color.
Add a "+ New Pipeline" button at the bottom of the list to create subgroups on the fly.
```

**7.3 — Prompt: WikiLinks Parsing in Editor**
```
Update src/components/editor/ThoughtEditor.svelte.
Before calling db.updateThought in the `debouncedSave` function:
1. Run a regex match over the editor content to find all `[[Thought Title]]` links.
2. Extract the titles into an array.
3. Save this array to the `linksTo` field in the database.
Add CodeMirror syntax highlighting to visibly style `[[Links]]` with the brand color.
Add a click event listener in CodeMirror. If a user clicks a `[[Link]]`:
query db for the title, if exists navigate to it, else create a new thought and navigate to it.
```

**7.4 — Prompt: Edges & Glowing Sphere Minimap**
```
Update src/routes/(app)/map/+page.svelte and src/components/graph/GraphCanvas.svelte.
1. Edges: Using the `linksTo` array, generate an array of `{source, target}` edge objects and pass to GraphWorker to draw dynamic lines between nodes.
2. Sphere Minimap: At the bottom-center of the Map view, add a glowing circular UI element (`<div class="minimap-orb">`).
   - Inside the orb, render miniature glowing dots proportional to the Pipeline colors in the current query.
   - Show a tiny viewport box representing the user's current pan/zoom.
3. Focus Mode: Clicking a specific color inside the orb triggers a Focus Event. 
   - Highlight all nodes of that Pipeline and their connected edges (100% opacity).
   - Fade all other non-connected nodes to low opacity (0.12).
```

**Phase 7 done when:**
- [ ] Users can create and color custom Pipelines in the Sidebar.
- [ ] Typing `[[Link]]` saves the link metadata and becomes visually clickable.
- [ ] The Map view draws visible lines connecting linked thoughts.
- [ ] The Minimap Orb is visible and filters node focus on click.
