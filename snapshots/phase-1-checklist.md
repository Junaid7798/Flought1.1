# Phase 1 — Data Layer — Verification Checklist
Date: 2026-03-18

## Completion criteria

- [x] `npm run check` — 0 errors, 0 warnings (356 files checked)
- [x] `npm run test` — 22/22 tests passing
- [x] No Dexie import exists outside `src/lib/db.ts`
- [x] Every thought/edge write calls `eventBus.emit()`
- [x] Telemetry arrays capped at 50 entries on every write (`.slice(-50)` in updateThought + softDeleteThought)

## Files created this phase

| File | Purpose |
|------|---------|
| `src/lib/uuid.ts` | Single source of `generateId()` — uuidv4 only |
| `src/lib/db.ts` | Full Dexie schema + all CRUD functions |
| `src/lib/blueprints.ts` | Blueprint data for 10 use cases (stub, expanded in Phase 2) |
| `src/lib/db.test.ts` | 22 Vitest tests covering all CRUD functions |
| `vite.config.ts` | Added vitest config (jsdom env, $lib alias) |
| `package.json` | Added `test` script |

## CRUD functions exported from db.ts

### Thoughts
- `createThought(libraryId, title)` → id
- `updateThought(id, changes)` → void
- `softDeleteThought(id)` → void
- `getThought(id)` → Thought | undefined
- `getThoughtsByLibrary(libraryId)` → liveQuery

### Edges
- `createEdge(libraryId, sourceId, targetId, linkType?)` → id
- `softDeleteEdge(id)` → void
- `getEdgesForThought(thoughtId)` → Edge[]
- `rebuildEdgesForThought(thoughtId, newLinkedTitles)` → void (diff strategy)

### Libraries
- `createLibrary(name)` → id
- `getLibraries()` → liveQuery
- `getDefaultLibrary()` → Library (creates "My Mind" if none exists)

### User
- `initUserProfile(displayName, useCase)` → void (idempotent)
- `getUserProfile()` → UserProfile | undefined
- `getUserSettings()` → UserSettings | undefined
- `updateUserSettings(changes)` → void
- `markOnboardingComplete()` → void
- `applyBlueprint(useCase)` → void

## Architecture rules verified

- Rule 2: Dexie only in db.ts ✓
- Rule 3: All PKs are uuidv4() via generateId() ✓
- Rule 4: No hard deletes — all use is_deleted: true ✓
- Rule 10: Telemetry capped at 50 ✓
- Rule 12: rebuildEdgesForThought designed for blur/unmount call only ✓
