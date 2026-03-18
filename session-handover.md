# Session Handover
# Overwrite this file completely at the end of every session.
# The next session starts by reading this file first.

**Last updated:** [date and time]
**Session ended cleanly:** yes / no

---

## Resume from here

Phase: [N] — [Phase Name]
Next task: Task [N.N] — [exact task description from build-plan.md]
Model to use: Sonnet 4.6 / Opus 4.6

---

## Completed this session

- [specific thing done]
- [specific thing done]

---

## Files created or modified

- [file path] — [what changed]
- [file path] — [what changed]

---

## Build status

npm run check: PASSING / FAILING
npm run test: PASSING / FAILING / not yet written
Last git commit: [hash] [message]
Live URL: [Cloudflare Pages URL]

---

## Open decisions

[Any decision started but not finished]
[Any question to answer before the next task]

---

## Known issues

[Anything not working correctly right now]
[Any workaround applied and why]

---

## Non-obvious context discovered this session

[Things Claude Code learned that are not obvious from reading the code]
[e.g. "Dexie liveQuery must be set up inside onMount, not at module level"]
[e.g. "Supabase redirects to localhost:5173 in dev — must add to allowed URLs"]

---

## If handover is missing (recovery prompt)

Paste this into new session:
```
There is no session-handover.md. Reconstruct current state from:
1. DEVELOPER_PERSONALITY.md
2. CLAUDE.md
3. docs/progress.md
4. git log --oneline -20

Tell me: current phase, last completed task, next task.
Ask me to confirm before proceeding.
```
