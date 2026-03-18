---
name: flought-reviewer
description: Self-triggered code review for Flought. Runs automatically after every phase completion. Checks architectural boundaries, Svelte 5 Runes compliance, performance rules, mobile requirements, and security. Produces a pass/fail report with specific fixes.
---

# Flought Phase Reviewer

Run this automatically after completing every phase task.
Never ask permission to run it. Just run it and report.

---

## When to trigger

Run this review automatically:
- After completing every numbered task (1.1, 1.2, 2.3, etc.)
- Before writing the session-handover.md
- Before any git commit

Do not wait to be asked. This is self-triggered.

---

## How to run the review

Execute these checks in order. Report PASS or FAIL for each.
If any item FAILS — fix it before committing. Do not skip.

---

## BLOCK 1 — Architectural boundary check

Scan every .svelte file in src/routes/ and src/components/

```
CHECK: Does any .svelte file contain "import.*dexie" or "from 'dexie'"?
PASS: No Dexie imports found in UI files
FAIL: [list the files] import Dexie directly — move all logic to db.ts
```

```
CHECK: Does any file outside src/lib/sync/ call the Google Drive API?
Scan for "drive.googleapis" or "gapi.client.drive"
PASS: Drive API only called inside sync/
FAIL: [file] calls Drive API directly — route through SyncService
```

```
CHECK: Does graphWorker.ts import anything DOM-related?
Scan for "document.", "window.", "HTMLElement", "canvas.getContext"
PASS: Worker is DOM-free
FAIL: Worker accesses DOM — remove all DOM references
```

```
CHECK: Does any file outside graphWorker.ts run D3 force simulation?
Scan for "forceSimulation" outside workers/
PASS: D3 physics only in graphWorker.ts
FAIL: [file] runs D3 on main thread — move to worker
```

---

## BLOCK 2 — Svelte 5 compliance

Scan all .svelte files.

```
CHECK: Any Svelte 4 reactive declarations?
Scan for "$:" at line start (not inside strings)
PASS: No $: found
FAIL: [file:line] uses $: — rewrite with $derived or $effect
```

```
CHECK: Any Svelte 4 store declarations?
Scan for "writable(" or "readable(" or "derived(" from 'svelte/store'
PASS: No legacy stores
FAIL: [file] uses legacy stores — convert to $state
```

```
CHECK: Any Svelte 4 prop syntax?
Scan for "export let " in .svelte files
PASS: No export let found
FAIL: [file:line] uses export let — convert to $props() rune
```

```
CHECK: SSR disabled?
Check src/routes/+layout.ts for "export const ssr = false"
PASS: SSR disabled globally
FAIL: Missing — add export const ssr = false to +layout.ts
```

---

## BLOCK 3 — Data integrity

Scan src/lib/db.ts and all files that write to Dexie.

```
CHECK: Are all primary keys generated via generateId()?
Scan writes for any numeric id values or Date.now() as id
PASS: All IDs use generateId()
FAIL: [function] uses non-UUID id — replace with generateId()
```

```
CHECK: Are all delete operations soft deletes?
Scan for .delete( calls on Dexie tables
PASS: No hard deletes found
FAIL: [function] calls .delete() — replace with is_deleted:true update
```

```
CHECK: Is telemetry capped at 50 entries?
Scan updateThought and any function that pushes to telemetry[]
Look for: .slice(-50) or equivalent
PASS: Telemetry cap found on every telemetry push
FAIL: [function] pushes to telemetry without cap — add .slice(-50)
```

```
CHECK: Does every db.ts write call eventBus.emit()?
Scan createThought, updateThought, softDeleteThought, createEdge, etc.
PASS: All writes emit events
FAIL: [function] writes to Dexie without emitting — add eventBus.emit()
```

---

## BLOCK 4 — Animation law

Scan all .svelte files and .css / .ts files for animation/transition code.

```
CHECK: Any CSS transitions on forbidden properties?
Scan for: transition.*width, transition.*height,
transition.*background-color, transition.*box-shadow,
transition.*padding, transition.*margin, transition.*border-width
PASS: No forbidden property transitions
FAIL: [file:line] animates [property] — change to transform or opacity only
```

```
CHECK: Any JS animations on forbidden properties?
Scan for: .style.width =, .style.height =, .style.backgroundColor =
inside animation loops or requestAnimationFrame callbacks
PASS: No forbidden JS animations
FAIL: [file:line] animates [property] via JS — use transform only
```

---

## BLOCK 5 — Colour system

Scan all .svelte, .css, and .ts files.

```
CHECK: Any hardcoded hex colour values?
Scan for /#[0-9A-Fa-f]{3,6}/ outside of src/app.css and src/lib/config.ts
PASS: No hardcoded hex found outside approved files
FAIL: [file:line] hardcodes [colour] — replace with CSS variable
```

```
CHECK: Any hardcoded colour names?
Scan for: color:'red', color:'blue', background:'black', etc.
PASS: No named colours found
FAIL: [file:line] uses named colour — replace with CSS variable
```

---

## BLOCK 6 — Mobile requirements (Phase 2+)

Scan all .svelte files for layout and sizing.

```
CHECK: Any 100vh usage?
Scan for "100vh" anywhere in .svelte or .css files
PASS: No 100vh found — 100dvh used correctly
FAIL: [file:line] uses 100vh — replace with 100dvh
```

```
CHECK: Safe area inset on bottom elements?
Scan bottom navigation, FAB, SparkInput for safe-area-inset-bottom
PASS: Safe area inset applied to all bottom elements
FAIL: [component] missing env(safe-area-inset-bottom) — add padding-bottom
```

---

## BLOCK 7 — Graph rules (Phase 4+)

Only run after Phase 4 begins.

```
CHECK: Sync payload chunked at object level?
Scan GoogleDriveAdapter.ts for chunking logic
Look for: thoughts.slice(0, 500) or similar object-level split
Scan for: JSON.stringify(largeString).slice() or similar byte-level slice
PASS: Chunking splits thoughts array at object boundaries
FAIL: Chunking slices raw JSON string — rewrite to split thoughts[] array
```

```
CHECK: Does drag save to Dexie on dragEnd only?
Scan GraphCanvas.svelte for db.updateThought calls
PASS: updateThought only called in dragEnd handler
FAIL: updateThought called in drag/mousemove handler — move to dragEnd only
```

```
CHECK: Does library switch terminate the old worker?
Scan for worker.terminate() in library switch logic
PASS: Worker terminated before new one starts
FAIL: Old worker not terminated — add worker.terminate() on library switch
```

---

## BLOCK 8 — TypeScript gate

```
RUN: npm run check
PASS: Zero TypeScript errors, zero warnings
FAIL: [list all errors] — fix every error before committing
```

---

## BLOCK 9 — Test gate (Phase 1+)

```
RUN: npm run test
PASS: All tests pass, zero failures
FAIL: [list failing tests] — fix before committing
```

---

## Review report format

After running all blocks, output this exact report:

```
## Flought Phase Review — Task [N.N]
Date: [today]

### Results
Block 1 — Architecture:  PASS / FAIL ([N] issues)
Block 2 — Svelte 5:      PASS / FAIL ([N] issues)
Block 3 — Data integrity: PASS / FAIL ([N] issues)
Block 4 — Animations:    PASS / FAIL ([N] issues)
Block 5 — Colours:       PASS / FAIL ([N] issues)
Block 6 — Mobile:        PASS / FAIL ([N] issues)
Block 7 — Graph:         PASS / N/A (not yet in scope)
Block 8 — TypeScript:    PASS / FAIL
Block 9 — Tests:         PASS / FAIL / N/A

### Overall: PASS — safe to commit / FAIL — fix required before commit

### Issues to fix (if any):
1. [file:line] [exact issue] [exact fix]
2. [file:line] [exact issue] [exact fix]

### Fixes applied this review:
- [what was fixed]
- [what was fixed]
```

---

## Escalation rule

If any FAIL cannot be fixed in one attempt:
- Do not attempt a second fix on the same issue
- Add it to the review report under "Escalated issues"
- Write it to docs/session-handover.md as a known issue
- Ask the developer how to proceed before committing
