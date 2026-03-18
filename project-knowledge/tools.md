# Flought — Tools Research

| Tool | Domain | Researched | Verdict | Reason | Stale after |
|------|--------|------------|---------|--------|-------------|
| SvelteKit 5 | Frontend framework | 2026-03-18 | adopted | Runes ($state/$derived/$effect) replace writable stores; compile-time reactivity; CLAUDE.md mandates it | 2026-06-18 |
| Dexie.js | IndexedDB ORM | 2026-03-18 | adopted | Best-in-class IndexedDB wrapper; liveQuery for reactive subscriptions; all db logic in db.ts | 2026-06-18 |
| Supabase | Auth + session | 2026-03-18 | adopted | Google OAuth provider_token gives Drive access; @supabase/ssr is current package (auth-helpers deprecated) | 2026-06-18 |
| @supabase/ssr | Supabase SvelteKit integration | 2026-03-18 | adopted | Replaces deprecated @supabase/auth-helpers-sveltekit | 2026-06-18 |
| Google Drive appDataFolder | Sync backend | 2026-03-18 | adopted | Hidden from user's Drive UI; free; no extra auth beyond Google OAuth scope | 2026-06-18 |
| Vitest | Test runner | 2026-03-18 | adopted | Native Vite integration; fast; used for db/config/i18n unit tests | 2026-06-18 |
| D3 force simulation | Graph layout | 2026-03-18 | adopted (worker only) | Physics simulation in graphWorker.ts only per CLAUDE.md rule 5 | 2026-06-18 |
| Canvas 2D API | Graph rendering | 2026-03-18 | adopted | CLAUDE.md rule 6 mandates Canvas 2D; no PixiJS/SVG/HTML elements | 2026-06-18 |
| CodeMirror 6 | Editor | 2026-03-18 | adopted | Used in ThoughtEditor; wikilink syntax highlighting via custom extension | 2026-06-18 |
| Capacitor | Mobile packaging | 2026-03-18 | deferred | Android/iOS target for Phase 6.5; init requires build/ output first | 2026-09-18 |
| Tauri | Desktop packaging | 2026-03-18 | deferred | Windows/Mac target for Phase 6.5 | 2026-09-18 |
| Cloudflare Pages | Web hosting | 2026-03-18 | adopted | adapter-static output; _headers file for security headers; day-one PWA target | 2026-06-18 |
