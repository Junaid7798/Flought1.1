# Flought — Milestone Verification Checklist
# Execute item by item before marking any phase complete.
# One failed item = phase not shipped.

## Architecture gates (all phases)
- [ ] No .svelte file imports Dexie directly
- [ ] No component contains a hardcoded hex colour
- [ ] No component contains a visible UI string (all use $t())
- [ ] No animation uses width, height, or background-color
- [ ] Every async db.ts write calls eventBus.emit()
- [ ] Telemetry cap (50 entries) is enforced on every write

## TypeScript gate
- [ ] npm run check — zero errors, zero warnings

## Test gate (Phase 1+)
- [ ] npm run test — zero failures

## Mobile gate (Phase 2+)
- [ ] All touch targets are minimum 44×44px
- [ ] No element uses 100vh (must be 100dvh)
- [ ] Bottom elements use env(safe-area-inset-bottom)
- [ ] No hover-only interactions

## Graph gate (Phase 4+)
- [ ] D3 simulation runs only inside graphWorker.ts
- [ ] Canvas 2D renders only on main thread
- [ ] Drag saves to Dexie on dragEnd only — never on dragMove
- [ ] Library switch terminates old worker, starts new one
- [ ] New thought added via addNode message — not full re-simulate

## Sync gate (Phase 6+)
- [ ] Google Drive API never called directly (only via SyncService)
- [ ] Payload chunked at 500 thoughts per file object
- [ ] JSON never sliced at byte boundaries
- [ ] Token expiry shows reconnect prompt, not a crash

## Commit gate
- [ ] git diff shows only intended changes
- [ ] Commit message: type(phase-N): description
- [ ] git tag created: phase-N-verified
