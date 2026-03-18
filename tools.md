# Flought — Tools Research Log
# Before any new domain: check here first. If under 90 days old, use it.

## Framework
Tool: SvelteKit 5 | Researched: March 2026 | Verdict: adopted
Reason: Compiler-first, zero VDOM, best performance for local-first SPA
Note: Svelte 5 Runes ONLY — $state, $derived, $effect. Never Svelte 4 syntax.
Stale after: December 2026

## Local database
Tool: Dexie.js 3.x | Researched: March 2026 | Verdict: adopted
Reason: liveQuery integrates with Svelte 5 stores natively
Alternative rejected: SQLite WASM — breaks Supabase Auth COOP/COEP headers
Stale after: December 2026

## Graph physics
Tool: d3-force | Researched: March 2026 | Verdict: adopted (Web Worker only)
Note: Runs ONLY in graphWorker.ts. Never on main thread.
Stale after: December 2026

## Graph rendering
Tool: Canvas 2D API (native browser) | Researched: March 2026 | Verdict: adopted V1
Note: Canvas 2D is CPU-bound. NOT GPU-accelerated. Do not claim otherwise.
PixiJS adopted for V2 when vault size demands it.
Stale after: December 2026

## Editor
Tool: CodeMirror 6 | Researched: March 2026 | Verdict: adopted
Reason: Raw text performance, supports Decoration.replace() for YAML mask
Stale after: December 2026

## Search
Tool: FlexSearch | Researched: March 2026 | Verdict: adopted (Web Worker only)
Note: Three message types: index (rebuild), update (single patch), search
Stale after: December 2026

## Auth
Tool: Supabase | Researched: March 2026 | Verdict: adopted (auth ONLY)
Note: We use Supabase for auth only. No Supabase database or storage.
Free tier: 50,000 MAU. Pro: $25/month for 100,000 MAU.
Stale after: September 2026

## Sync
Tool: Google Drive appdata API | Researched: March 2026 | Verdict: adopted
Note: Via SyncService adapter. Chunked at 500 thoughts per file. LWW merge.
Never slice raw JSON strings.
Stale after: December 2026

## Mobile wrapper
Tool: Capacitor | Researched: March 2026 | Verdict: adopted (V1)
App ID: com.flought.app
Note: Use 100dvh not 100vh. Use safe-area-inset-bottom. Min 44px tap targets.
Stale after: December 2026

## Desktop wrapper
Tool: Tauri | Researched: March 2026 | Verdict: adopted (Phase 6.5)
Reason: 5MB binary vs Electron 150MB. Uses OS web viewer.
Stale after: December 2026

## Hosting
Tool: Cloudflare Pages | Researched: March 2026 | Verdict: adopted
Reason: Unlimited bandwidth free tier. Vercel has 100GB cap.
Stale after: September 2026

## Fonts
Tool: Geist via @fontsource/geist | Verdict: adopted permanently (brand)

## Icons
Tool: lucide-svelte | Verdict: adopted permanently (brand)
Note: No emoji in UI. Only lucide-svelte SVG icons.
