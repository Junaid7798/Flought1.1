# Flought Template Catalog
# 55 templates across 12 user archetypes
# Reference: Templet.txt (confirmed architecture) + market research 2025/2026
# Setup difficulty is rated against the existing Flought CM6/Dexie/D3 stack

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ Confirmed | Already in Templet.txt or featurev1.md — build as specified |
| 🔧 Small change | Uses existing widget patterns with minor additions |
| 🟡 Medium | New CM6 widget needed, uses established patterns |
| 🔴 Complex | New rendering or data pattern not yet established |
| 👥 Multi-type | Covers 3+ user archetypes |

---

## Templates that cover 3+ user types (build these first — maximum ROI)

| Template | User Types | Impact |
|----------|-----------|--------|
| Daily Operating System | All archetypes | 10/10 |
| Project & Task Kanban | Engineers, PMs, Founders, Freelancers | 10/10 |
| Second Brain / Zettelkasten | Researchers, Writers, Students, Knowledge Workers | 10/10 |
| Habit Tracker | All archetypes | 9.5/10 |
| Weekly Planner | All archetypes | 9.5/10 |
| Meeting Notes | Founders, PMs, Engineers, Legal, Freelancers | 9/10 |
| Goal & OKR Tracker | Founders, PMs, Students, Individuals | 9/10 |
| Reading / Media Log | Writers, Researchers, Students, Consumers | 8.5/10 |
| Personal CRM | Founders, Freelancers, Legal, Sales | 8.5/10 |
| Financial Tracker | Founders, Freelancers, Individuals | 8/10 |

---

---

# GROUP 1 — FOUNDERS & PROFESSIONALS

---

## T-01: Project & Task Kanban ✅ 👥

**Target users:** Founders, Product Managers, Engineers, Freelancers, Educators

**Impact / Rating:** 10/10

**What the template is about:**
A grouped task board with columns for task name, status pill, assignee, due date, priority badge, tags, and dependency tracking. Projects are H2 headers; tasks are markdown table rows beneath each. Supports Board view (by status) and List view (grouped by project). This is the template shown in the screenshot you provided.

**What issue it solves:**
Teams and individuals lose context across tasks scattered in email, chat, and documents. This template creates a single source of truth for all active work, with visual pipeline status that updates as tasks move from To Do → In Progress → Done.

**Setup in existing Flought architecture:**
✅ **Confirmed in Templet.txt and image validation.** Requires:
- `StatusPillWidget` (vanilla JS) reading from `db.metadata` color map
- `PriorityBadgeWidget` (vanilla JS) with same pattern
- `TableMacroWidget.svelte` for the grid shell
- `FastCheckboxWidget` for inline task completion
- Assignee rendered as initial-avatar from string hash (V1 approach — no photos)
- COMPLETE N/M count derived at render time by counting Done rows per group

---

## T-02: Company OS / Wiki ✅

**Target users:** Founders, Startup teams

**Impact / Rating:** 9.5/10

**What the template is about:**
A top-level knowledge base with nested sections for onboarding, processes, team handbook, product decisions, and meeting notes. Uses wikilinks to connect all sub-pages into a navigable graph. The D3 canvas visualizes the company knowledge structure spatially.

**What issue it solves:**
New hires spend weeks learning unwritten knowledge. Processes live in the founder's head. This template externalizes institutional memory into a searchable, interconnected graph.

**Setup in existing Flought architecture:**
✅ **Confirmed in Templet.txt.** This is a pure wikilink + YAML frontmatter template — no new CM6 widgets needed. The D3 graph already visualizes it. Seed with 8–10 starter linked notes on template creation.

---

## T-03: OKR Dashboard ✅ 👥

**Target users:** Founders, Product Managers, Students (goal-setting)

**Impact / Rating:** 9/10

**What the template is about:**
Quarterly Objectives with 3–4 Key Results each. Each KR has a progress bar (derived from linked task completion), a confidence rating (1–5), and a weekly check-in log. The graph shows KRs linked to the Projects driving them.

**What issue it solves:**
Goals get set in January and forgotten by February. By linking OKRs directly to active project notes via wikilinks, progress is visible every time a project is updated.

**Setup in existing Flought architecture:**
✅ **Confirmed in Templet.txt.**
🔧 Progress bars use the `<ProgressBar value="X%">` CM6 widget confirmed in Templet.txt. Confidence rating is a vanilla JS star widget — small addition to existing widget system.

---

## T-04: Meeting Notes ✅ 👥

**Target users:** Founders, PMs, Engineers, Legal, Freelancers

**Impact / Rating:** 9/10

**What the template is about:**
Structured meeting note with YAML frontmatter for date, attendees, and project reference. Body sections: Agenda, Discussion, Decisions, Action Items (with assignees and due dates as inline `[Action: ...]` widgets). All action items auto-backlink to the assignee's personal task list note.

**What issue it solves:**
Action items from meetings disappear. This template converts every meeting into a searchable, linked record with tasks that appear in the graph alongside the project they belong to.

**Setup in existing Flought architecture:**
✅ **Confirmed pattern — uses FrontmatterMask + existing wikilink system.**
🔧 `ActionItemWidget` is a small addition: parses `[Action: text @person due:date]` syntax, renders as a card. Vanilla JS, follows FastCheckboxWidget pattern.

---

## T-05: Content Planner ✅

**Target users:** Founders, Content Creators, Marketers

**Impact / Rating:** 8.5/10

**What the template is about:**
Editorial calendar with a markdown table of content pieces: title, channel (Blog / Twitter / YouTube), status, publish date, and a notes column. A kanban section below groups pieces by pipeline stage (Idea → Draft → Review → Published).

**What issue it solves:**
Content teams produce inconsistently because there is no system connecting ideas to published output. This template makes the full pipeline visible.

**Setup in existing Flought architecture:**
🔧 **Small change on T-01.** Same `TableMacroWidget` + `StatusPillWidget` pattern. Add `ChannelBadgeWidget` (icon + label for Blog/Social/Video) — new badge type, same vanilla JS pattern.

---

## T-06: Client CRM ✅ 👥

**Target users:** Founders, Freelancers, Legal, Sales professionals

**Impact / Rating:** 8.5/10

**What the template is about:**
A contact database with one note per client (linked from master index). Each client note has: contact details in frontmatter, relationship status pill (Lead / Active / Churned), last contact date, deal value, and a log of all interactions as a reverse-chronological list.

**What issue it solves:**
Relationship context lives in email history and fades fast. This gives a local, private, zero-subscription CRM that visualizes client relationships on the graph.

**Setup in existing Flought architecture:**
✅ **Confirmed in Templet.txt.**
🔧 `LastContactWidget` auto-calculates days since last interaction log entry — small date-math widget, vanilla JS.

---

## T-07: Financial Tracker ✅ 👥

**Target users:** Founders, Freelancers, Individuals

**Impact / Rating:** 8/10

**What the template is about:**
Monthly budget table with income, fixed expenses, variable expenses, and savings rows. A derived summary row at the bottom calculates net. Yearly view links to 12 monthly sub-notes. Expense categories shown as colored tags.

**What issue it solves:**
Most people have no real-time visibility into their financial position without opening a bank app. This keeps a running record locally, privately, offline.

**Setup in existing Flought architecture:**
✅ **Confirmed in Templet.txt.**
🔧 The `= formula` Dynamic Calculations widget (confirmed in featurev1.md Group B research) handles the math. Net row uses `= {income} - {fixed} - {variable}` inline syntax.

---

---

# GROUP 2 — SOFTWARE ENGINEERS

---

## T-08: System Architecture Map 👥

**Target users:** Software Engineers, Product Managers, Technical Founders

**Impact / Rating:** 10/10

**What the template is about:**
An architecture decision record (ADR) hub. Each architectural decision is an atomic note with frontmatter: `decision`, `status` (Proposed / Accepted / Deprecated), `date`, and `alternatives-considered`. All decision notes link to the system they modify. The D3 graph becomes a live architectural dependency map.

**What issue it solves:**
New engineers on a team have no idea why things are built the way they are. ADRs leave a permanent, searchable rationale trail that lives in the codebase's knowledge graph.

**Setup in existing Flought architecture:**
🔧 **Primarily wikilinks + frontmatter — no new widgets needed.**
Status pill widget (already in T-01) handles `status` field. The real value is the D3 graph showing ADR relationships.

---

## T-09: Code Snippet Vault

**Target users:** Software Engineers

**Impact / Rating:** 9/10

**What the template is about:**
A searchable library of reusable code snippets. Each snippet is a note with frontmatter tags (`language`, `framework`, `use-case`). The body contains CM6 code blocks with syntax highlighting. Search via Cmd+K returns snippets by tag or keyword instantly.

**What issue it solves:**
Engineers re-solve the same problems repeatedly. A local snippet vault eliminates context-switching to Stack Overflow for patterns they've already figured out.

**Setup in existing Flought architecture:**
🟡 **Medium.** Requires CM6 code fence syntax highlighting (install `@codemirror/lang-javascript`, `@codemirror/lang-python`, etc. — not yet in Phase 3 install list). Copy-to-clipboard button per code block is a vanilla JS widget addition.

---

## T-10: Bug Tracker & Sprint Board 👥

**Target users:** Software Engineers, Product Managers

**Impact / Rating:** 9/10

**What the template is about:**
Issue tracking with severity badges (Critical / High / Medium / Low), status (Open / In Progress / Resolved), linked PR note, and reproduction steps. Sprint board groups issues by milestone. Each issue links to the component it affects in the architecture map.

**What issue it solves:**
Linear, Jira, and GitHub Issues are overkill for solo developers and small teams. A local bug tracker that links to architecture decisions and changelogs keeps everything in one graph.

**Setup in existing Flought architecture:**
🔧 **Extends T-01 (Kanban) with a severity badge widget.** Severity uses the same `PriorityBadgeWidget` color system — just different label set. Small change.

---

## T-11: Changelog & Release Notes

**Target users:** Software Engineers, Product Managers

**Impact / Rating:** 8/10

**What the template is about:**
Reverse-chronological log of software releases. Each version is an H2 header with date. Sections: Added, Changed, Fixed, Deprecated. Wikilinks connect changes to the ADRs and bugs that motivated them.

**What issue it solves:**
Release documentation is typically an afterthought. This template builds it incrementally alongside development, making it usable for both technical and non-technical audiences.

**Setup in existing Flought architecture:**
🔧 **Pure markdown + wikilinks — no new widgets.** Template engine seeds the structure; user fills it in. Setup: trivial.

---

## T-12: Engineering Runbook

**Target users:** Software Engineers

**Impact / Rating:** 8.5/10

**What the template is about:**
Operational procedures for a system: deployment steps, rollback procedures, on-call escalation paths, and common incident patterns. Each procedure is an atomic linked note. Severity levels and resolution times tracked in frontmatter.

**What issue it solves:**
On-call engineers at 2am cannot afford to search for procedures. Local-first, offline access to runbooks is a direct operational advantage over cloud-based wikis that go down during incidents.

**Setup in existing Flought architecture:**
🟡 **Medium.** Requires collapsible step sections — Semantic Folding (Group B.2 in featurev1.md) handles this. If B.2 is built, setup is trivial.

---

---

# GROUP 3 — PRODUCT MANAGERS

---

## T-13: PRD (Product Requirements Document) 👥

**Target users:** Product Managers, Founders, Engineers

**Impact / Rating:** 9/10

**What the template is about:**
Structured product spec with sections: Problem Statement, Goals & Non-Goals, User Stories (as checkbox list), Designs (wikilinks to design decision notes), Success Metrics, and Open Questions. The Flow Ring widget signals when the document is reaching atomic size and should be split.

**What issue it solves:**
PRDs written in Google Docs become stale and disconnected from the implementation. A graph-linked PRD stays connected to the bugs, ADRs, and meeting notes that shape the product.

**Setup in existing Flought architecture:**
🔧 **Uses existing frontmatter + wikilink + checkbox patterns.** Flow Ring widget (confirmed in featurev1.md) provides the length signal.

---

## T-14: User Research Synthesis 👥

**Target users:** Product Managers, Academic Researchers, UX Designers

**Impact / Rating:** 9/10

**What the template is about:**
Interview notes template with frontmatter (participant ID, date, role, segment). Body: verbatim quotes log, behavioral observations, pain points, and affinity tags. A synthesis note aggregates all interview notes via backlinks and groups quotes by theme using the Tributary Reader pattern.

**What issue it solves:**
User research insights get lost in transcripts and Dovetail. This keeps insights in the same graph as the features they influence, creating a direct traceability chain from user pain to product decision.

**Setup in existing Flought architecture:**
🟡 **Medium.** Requires the Ambient Backlink Footer (Group B.5) to work properly. Quote tagging uses the auto-color hashtag system (Batch 10 research). Both are in the confirmed build plan.

---

## T-15: Roadmap Planner 👥

**Target users:** Product Managers, Founders, Engineers

**Impact / Rating:** 8.5/10

**What the template is about:**
Quarterly roadmap as a table with columns: initiative, status, owner, quarter, and linked PRD. A NOW / NEXT / LATER grouping section provides strategic prioritization. Wikilinks connect each initiative to its PRD and relevant user research.

**What issue it solves:**
Roadmaps in slides get outdated instantly. A living, linked roadmap in the knowledge graph stays current because every linked note update is reflected immediately.

**Setup in existing Flought architecture:**
🔧 **Extends T-01 table pattern with a quarter column.** Quarter value is a colored tag using the auto-color hashtag system.

---

---

# GROUP 4 — ACADEMIC RESEARCHERS

---

## T-16: Research Dossier ✅

**Target users:** Academic Researchers, Students, Lawyers, Journalists

**Impact / Rating:** 9.5/10

**What the template is about:**
Literature review hub. Each paper/source is an atomic note with frontmatter: `author`, `year`, `journal`, `doi`, `rating`. The body contains structured sections: Summary, Key Argument, Methodology, Limitations, Quotes, and Links to Related Work. The D3 graph shows the citation and conceptual relationship network.

**What issue it solves:**
Researchers lose track of what they've read and cannot see how sources relate. The graph canvas makes the literature review spatially navigable — a unique advantage over Zotero and reference managers.

**Setup in existing Flought architecture:**
✅ **Confirmed in Templet.txt.** Uses FrontmatterMask for paper metadata. Block-level transclusion (featurev1.md Group B reference) pulls key quotes into a synthesis note.

---

## T-17: Thesis Outliner 👥

**Target users:** Academic Researchers, Graduate Students, Writers

**Impact / Rating:** 9/10

**What the template is about:**
Chapter-by-chapter outline with argument structure (Claim → Evidence → Analysis). Each chapter is a linked sub-note. The master thesis note shows chapter completion status via derived progress bars. Backlinks pull in all related source notes automatically.

**What issue it solves:**
Thesis writers struggle to maintain argument coherence across 50,000+ words and hundreds of sources. The graph makes the logical architecture of the argument visible and navigable.

**Setup in existing Flought architecture:**
🔧 **Uses Semantic Folding (B.2) for chapter collapse + ProgressBar widget (Templet.txt).** The Ambient Backlink Footer (B.5) pulls in related research automatically.

---

## T-18: Academic Planner ✅

**Target users:** Students, Academic Researchers

**Impact / Rating:** 9/10

**What the template is about:**
Semester dashboard with course notes, assignment tracker (due dates + status), exam schedule, and grade tracker. Each course is a linked sub-note. Assignment rows use the same status pill system as T-01.

**What issue it solves:**
Students scatter course notes, assignment deadlines, and study plans across multiple apps. This unifies them in a single offline, searchable graph.

**Setup in existing Flought architecture:**
✅ **Confirmed in Templet.txt.** Extends T-01 pattern with a grade column (numeric input widget — small addition).

---

## T-19: Lab Notes / Experiment Log

**Target users:** Scientists, Academic Researchers, Engineers

**Impact / Rating:** 8.5/10

**What the template is about:**
Structured experiment record with frontmatter: `hypothesis`, `date`, `protocol-version`, `outcome`. Body: Materials, Procedure (numbered list), Observations, Results, Analysis, and Next Steps. Links to related experiments and source papers.

**What issue it solves:**
Lab notebooks are paper-based or in Word documents — neither searchable nor connected to the literature. A graph-linked experiment log surfaces connections between experiments that inform each other.

**Setup in existing Flought architecture:**
🟡 **Medium.** Smart bullet lists (B.7 in featurev1.md) handle the numbered procedure. Otherwise uses existing frontmatter + wikilink patterns. Numbered list auto-continuation covers the procedure steps.

---

---

# GROUP 5 — CREATIVE WRITERS & NOVELISTS

---

## T-20: World-Building Bible ✅

**Target users:** Fiction Writers, TTRPG Game Masters, Screenwriters

**Impact / Rating:** 9.5/10

**What the template is about:**
Master index for a fictional world. Sub-notes cover: Characters (with trait frontmatter), Locations (with geography links), Factions (with relationship edges), Timeline Events (chronological log), and Lore Fragments. The D3 graph maps relationships between characters, places, and events spatially.

**What issue it solves:**
Writers maintaining complex fictional universes constantly contradict themselves. A linked graph makes it impossible to forget that Character A and Location B have a canonical relationship — it's literally drawn on the map.

**Setup in existing Flought architecture:**
✅ **Confirmed in Templet.txt.** The D3 graph is the primary value here — no special widgets needed beyond frontmatter and wikilinks.

---

## T-21: Character Arc Sheet 👥

**Target users:** Fiction Writers, TTRPG Game Masters

**Impact / Rating:** 9/10

**What the template is about:**
Per-character note with frontmatter: `role`, `archetype`, `motivation`, `flaw`. Body sections: Background, Arc Beats (checkbox list of story milestones), Relationships (wikilinks to other characters), and Voice Notes (sample dialogue). Tracks arc completion via ProgressBar widget.

**What issue it solves:**
Writers lose track of where a character is in their arc, especially in long projects. The arc beats checklist provides a visual progress tracker per character, and the relationship wikilinks keep the graph updated.

**Setup in existing Flought architecture:**
🔧 **Uses FrontmatterMask + CheckboxWidget + ProgressBar.** All confirmed patterns. Small addition: `ArchetypeTagWidget` renders the archetype as a styled pill.

---

## T-22: Chapter Kanban 👥

**Target users:** Fiction Writers, Non-Fiction Authors, Screenwriters

**Impact / Rating:** 8.5/10

**What the template is about:**
Manuscript pipeline board. Columns: Outlined → Drafted → Revised → Polished → Final. Each chapter card links to the chapter note. Word count per chapter shown as a small inline badge derived from the linked note's content length.

**What issue it solves:**
Long-form writing projects have no obvious completion signal. A kanban board makes manuscript progress tangible and motivating.

**Setup in existing Flought architecture:**
🔧 **Extends T-01 Kanban.** Word count badge is a new vanilla JS widget that reads `word_count` from the Dexie schema (added in featurev1.md Group A).

---

## T-23: Story Beat Planner (Three-Act / Save the Cat)

**Target users:** Screenwriters, Fiction Writers

**Impact / Rating:** 8/10

**What the template is about:**
Story structure template with the 15 Save the Cat beats as H2 headers, or a three-act breakdown. Each beat is a section with a status checkbox and a synopsis paragraph. The Semantic Folding feature collapses completed beats to reduce visual noise.

**What issue it solves:**
Writers know their story beats intellectually but lose them mid-draft. This template externalizes the structure so the writer stays on track without rereading hundreds of pages.

**Setup in existing Flought architecture:**
🟡 **Medium.** Semantic Folding (B.2) is the key feature. Otherwise pure markdown. If B.2 is built, setup difficulty is trivial.

---

## T-24: Resonance Calendar ✅ 👥

**Target users:** Writers, Knowledge Workers, Researchers, Creatives

**Impact / Rating:** 8.5/10

**What the template is about:**
A log of media that made an impact. Each entry: title, type (Book / Article / Film / Podcast), date consumed, rating, key insight, and quotes. Insights wikilink to related notes in the knowledge graph. The D3 graph connects books to ideas they influenced.

**What issue it solves:**
People consume enormous amounts of media and retain almost nothing. A resonance log forces active engagement and connects consumed ideas to the user's existing thinking.

**Setup in existing Flought architecture:**
✅ **Confirmed in Templet.txt.**
🔧 Star rating widget — vanilla JS, 5 clickable stars updating a frontmatter field. Small addition.

---

---

# GROUP 6 — KNOWLEDGE WORKERS & STUDENTS

---

## T-25: Second Brain / Zettelkasten ✅ 👥

**Target users:** Knowledge Workers, Researchers, Writers, Students

**Impact / Rating:** 10/10

**What the template is about:**
A PARA-structured knowledge base (Projects / Areas / Resources / Archive) implemented as a graph. Atomic notes follow the Zettelkasten convention: one idea per note, heavy wikilinks, unique IDs in frontmatter. The D3 graph is the primary navigation interface.

**What issue it solves:**
Information hoarding without retrieval is useless. The Zettelkasten method forces connection-making that produces novel insight. Flought's graph canvas is architecturally identical to what Zettelkasten describes — this is the native use case.

**Setup in existing Flought architecture:**
✅ **Confirmed in Templet.txt.** This is essentially the default Flought use case — no special widgets required. Seeds 5–7 starter atomic notes on creation to demonstrate the pattern.

---

## T-26: Progressive Summarization Hub ✅

**Target users:** Knowledge Workers, Students, Researchers

**Impact / Rating:** 9/10

**What the template is about:**
A reading and highlighting workflow. Source notes contain full text passages. The user applies Progressive Summarization: first pass bolds key sentences (Cmd+H cycle — confirmed in featurev1.md Batch 3), second pass highlights the best bolded sections. A synthesis note transcluded above shows only the highlights.

**What issue it solves:**
Highlights without synthesis are useless. This template creates a layered reading system where each pass extracts more signal from the same source material.

**Setup in existing Flought architecture:**
✅ **Confirmed in Templet.txt.** Progressive Summarization is Feature #3 in Batch 3 of the feature research. The Cmd+H cycling mechanism is specified. Setup is moderate complexity in the CM6 extension layer.

---

## T-27: Flashcard Engine ✅

**Target users:** Students, Language Learners, Medical Students, Lawyers

**Impact / Rating:** 9/10

**What the template is about:**
Active recall cards using the confirmed `Q: ... :: A: ...` syntax. Cards are embedded inline within subject notes — the question appears while reading, and the answer reveals on click. A spaced repetition log in frontmatter tracks last review date and difficulty rating.

**What issue it solves:**
Active recall is the most evidence-backed learning technique, but it requires a separate app (Anki). Embedding cards in the same note as the source material eliminates the export friction.

**Setup in existing Flought architecture:**
✅ **Confirmed in Templet.txt.** FlashcardWidget is specified. Spaced repetition scheduling (compute next review date from difficulty) is a small addition to the widget's click handler — stores next review date to frontmatter via db.ts.

---

## T-28: Weekly Planner 👥

**Target users:** All archetypes (universal)

**Impact / Rating:** 9.5/10

**What the template is about:**
A weekly dashboard note with daily sections (Mon–Sun). Each day has a priority list (top 3 tasks), a scheduled blocks section, and an evening reflection prompt. Weekly goals at the top link to the OKR/goals note. The thermal calendar sidebar widget shows consistency over time.

**What issue it solves:**
Most productivity failures are planning failures. A structured weekly note that links to goals prevents the common trap of staying busy without making progress on what matters.

**Setup in existing Flought architecture:**
🔧 **Uses existing checkbox + wikilink patterns.** The Thermal Calendar sidebar widget (featurev1.md Group D.1) provides the streak visualization automatically.

---

## T-29: Daily Journal ✅ 👥

**Target users:** General Consumers, Knowledge Workers, Neurodivergent Users, Writers

**Impact / Rating:** 9/10

**What the template is about:**
Date-stamped daily note with: morning intention (3 priorities), a free-writing zone, an evening reflection (wins, blockers, gratitude), and a mood rating. Automatically wikilinks to the weekly note. The Serendipity Collider (featurev1.md D.2) surfaces related old entries.

**What issue it solves:**
Journaling without structure produces noise. Structure without flexibility produces abandonment. This template balances both — the free-writing zone has no constraints, but the bookend prompts ensure capture of the minimum useful data.

**Setup in existing Flought architecture:**
✅ **Confirmed in Templet.txt.**
🔧 Mood rating is a simple 1–5 emoji picker widget (vanilla JS, 5 clickable spans writing to frontmatter). Small addition.

---

## T-30: Book Summary 👥

**Target users:** Knowledge Workers, Researchers, Writers, Students

**Impact / Rating:** 8.5/10

**What the template is about:**
A structured book note: frontmatter with author, genre, rating, and read date. Body sections: Core Argument, Key Concepts (atomic linked notes), Chapter-by-Chapter highlights, and Applied Insights (personal conclusions wikilinked to existing knowledge). The Flow Ring signals when a book note is getting too long and should be split into atomic concept notes.

**What issue it solves:**
Book notes written as a dump are never revisited. This template forces extraction of the minimum reusable unit — the insight linked to existing thinking — rather than a passive summary.

**Setup in existing Flought architecture:**
🔧 **Uses FrontmatterMask + existing wikilink patterns.** Flow Ring (featurev1.md research) provides the split signal.

---

---

# GROUP 7 — GENERAL CONSUMERS / LIFESTYLE

---

## T-31: Atomic Habit Tracker ✅ 👥

**Target users:** General Consumers, Neurodivergent Users, Students, Professionals

**Impact / Rating:** 9.5/10

**What the template is about:**
Monthly habit grid: habits as row headers, days of month as columns, checkboxes at each intersection. A derived streak counter per habit shows consecutive days. A progress bar per habit shows monthly completion rate. Streak data feeds the Thermal Calendar sidebar widget.

**What issue it solves:**
Habit apps lock data in proprietary clouds. A local-first habit tracker that is private, offline, and connected to the user's broader knowledge graph is a meaningful differentiator. The streak visualization creates accountability without gamification.

**Setup in existing Flought architecture:**
✅ **Confirmed in Templet.txt.**
The grid of checkboxes uses `FastCheckboxWidget` (vanilla JS, confirmed). Progress bars are derived at render time. Streak calculation runs in a Web Worker. This is explicitly the template shown in `desktop.avif`.

---

## T-32: Ultimate Life Planner ✅

**Target users:** General Consumers

**Impact / Rating:** 8.5/10

**What the template is about:**
A master dashboard note linking to: Daily Journal, Weekly Planner, Habit Tracker, Goals, Financial Tracker, Health Log, and Reading List. Acts as the entry point for a complete personal OS. Frontmatter shows quick stats derived from linked notes.

**What issue it solves:**
Users with multiple template types need a unified launch pad. Without it, every session begins with searching for the right note.

**Setup in existing Flought architecture:**
✅ **Confirmed in Templet.txt.** This is a pure wikilink hub note — no new widgets. Seed on creation with links to 6 pre-created sub-notes.

---

## T-33: Travel & Itinerary Planner ✅

**Target users:** General Consumers, Families, Digital Nomads

**Impact / Rating:** 8.5/10

**What the template is about:**
Trip overview note linking to per-day itinerary sub-notes. Each day note: date, location, activities (checklist), accommodation details, transport notes, budget log, and packing list status. The master note shows a day-by-day timeline with completion status per day.

**What issue it solves:**
Travel planning is spread across booking confirmations, Google Maps lists, and group chats. This template centralizes everything locally — critical in low-connectivity destinations where cloud apps fail.

**Setup in existing Flought architecture:**
✅ **Confirmed in Templet.txt.** Uses checklist + wikilink pattern. Packing list uses `FastCheckboxWidget`. Budget uses inline math widget.

---

## T-34: Media Watchlist ✅

**Target users:** General Consumers, Writers, Researchers

**Impact / Rating:** 8/10

**What the template is about:**
A table of movies, shows, books, podcasts, and games to consume. Columns: title, type badge, status (Want / Watching / Done), rating, date completed, and a linked note for insights. Status badges use the same `StatusPillWidget` as T-01.

**What issue it solves:**
Watchlists scattered across streaming apps, Letterboxd, and Goodreads are fragmented and don't connect to personal knowledge. A unified local media tracker that links consumed content to idea notes turns passive consumption into knowledge building.

**Setup in existing Flought architecture:**
✅ **Confirmed in Templet.txt.** Directly reuses T-01 table infrastructure.

---

## T-35: Recipe Collection

**Target users:** General Consumers, Families

**Impact / Rating:** 7.5/10

**What the template is about:**
Per-recipe note with frontmatter: cuisine, prep time, cook time, servings, rating, and dietary tags. Body sections: Ingredients (checklist), Instructions (numbered steps), Notes, and a linked Meal Plan note. A master index note groups recipes by cuisine and dietary tag.

**What issue it solves:**
Recipes bookmarked online are inaccessible offline and unconnected to meal planning. A local recipe vault that links to a weekly meal plan reduces the daily friction of "what's for dinner."

**Setup in existing Flought architecture:**
🟡 **Medium.** Ingredient checklist uses `FastCheckboxWidget`. Numbered instructions use `SmartBulletWidget` (B.7). The serving-size scaler (change `servings: 4` to `servings: 2` → all quantities halve) requires a new inline math widget. This is the most complex piece.

---

## T-36: Meal Planner

**Target users:** General Consumers, Health-focused users

**Impact / Rating:** 8/10

**What the template is about:**
Weekly meal plan table: Mon–Sun columns, Breakfast/Lunch/Dinner rows. Each cell links to a recipe note. A grocery list section auto-aggregates ingredients from linked recipes (requires a Dexie query across linked notes).

**What issue it solves:**
Weekly meal planning reduces food waste and decision fatigue. Linking the plan to actual recipe notes (with ingredient lists) makes grocery shopping a single derived action.

**Setup in existing Flought architecture:**
🔴 **Complex.** The grocery aggregation feature requires querying ingredient checklists from multiple linked notes and deduplicating — new Dexie query pattern not yet established. The table view itself is straightforward using T-01 infrastructure.

---

## T-37: Bucket List & Life Goals

**Target users:** General Consumers, All archetypes

**Impact / Rating:** 8/10

**What the template is about:**
A tiered goal list: Life Goals (big picture), 5-Year Goals, and This Year's Goals. Each goal has a status (Not Started / In Progress / Complete), a deadline, and a wikilink to the project or habit tracker driving it. The D3 graph visually connects life goals to the daily work serving them.

**What issue it solves:**
Goals written in New Year's resolution lists are abandoned by February because they're disconnected from daily action. Wikilinks make the chain from life goal → project → daily task spatially visible on the graph.

**Setup in existing Flought architecture:**
🔧 **Uses StatusPillWidget + wikilinks.** Goal hierarchy uses H1/H2/H3 headers with Semantic Folding. Small additions only.

---

---

# GROUP 8 — FREELANCERS & AGENCIES

---

## T-38: Client Project Dashboard 👥

**Target users:** Freelancers, Agencies, Founders

**Impact / Rating:** 9/10

**What the template is about:**
Per-client project hub: frontmatter with client name, contract value, start/end dates, and billing rate. Sections: Project Brief, Deliverables (checklist with due dates), Time Log (manual entries summed via inline math), Invoice Status, and Meeting Notes (wikilinks). A master index tracks all active clients with pipeline status.

**What issue it solves:**
Freelancers manage client context across email, Notion, invoicing apps, and time trackers. This consolidates everything locally with zero subscription cost.

**Setup in existing Flought architecture:**
🔧 **Extends T-01 + T-04 patterns.** Time log uses inline math widget for sum. Invoice status uses StatusPillWidget. No fundamentally new widgets.

---

## T-39: Invoice Tracker

**Target users:** Freelancers, Agencies

**Impact / Rating:** 8.5/10

**What the template is about:**
Table of invoices: invoice number, client (wikilink to CRM note), amount, issue date, due date, payment status (Unpaid / Paid / Overdue), and notes. Overdue detection is a derived status comparing `due_date` to `Date.now()` — pill turns red automatically.

**What issue it solves:**
Freelancers frequently forget to chase unpaid invoices. A local invoice log with automatic overdue detection removes the mental overhead of tracking payment status.

**Setup in existing Flought architecture:**
🟡 **Medium.** Requires a `DateComparisonWidget` that reads a date frontmatter field and applies a status pill color based on whether the date has passed. New widget type but follows the vanilla JS FastCheckboxWidget pattern.

---

## T-40: Proposal & Contract Template

**Target users:** Freelancers, Agencies, Lawyers

**Impact / Rating:** 7.5/10

**What the template is about:**
A structured proposal document with: Executive Summary, Scope of Work (numbered deliverables), Timeline (milestone checklist), Investment (pricing table), Terms, and Next Steps. Exported to a clean markdown document for client delivery.

**What issue it solves:**
Freelancers write proposals from scratch each time, wasting hours on structure. A standard template reduces proposal time from hours to minutes.

**Setup in existing Flought architecture:**
🔧 **Pure markdown template.** The numbered deliverables use SmartBulletWidget (B.7). The pricing table uses TableMacroWidget. No new patterns.

---

---

# GROUP 9 — NEURODIVERGENT USERS (ADHD / AUTISM)

---

## T-41: Hyper-Focus Sandbox 👥

**Target users:** ADHD users, Researchers, Writers

**Impact / Rating:** 9/10

**What the template is about:**
A capture-first zone designed for hyperfocus sessions. No structure — just a large free-writing area, a running list of tangential thoughts to park (so they don't interrupt the main thread), and a timer widget. At session end, a structured section prompts: "What did I actually produce? What are the 3 actions from this?"

**What issue it solves:**
ADHD users lose the output of productive hyperfocus sessions because there is no structure to land in. This template captures everything without interrupting flow, then processes it at the natural end of the session.

**Setup in existing Flought architecture:**
🔧 **Mostly free-form markdown.** The timer widget is new — a `TimerWidget` that shows elapsed time since note was opened. Vanilla JS, reads `Date.now()` on mount. Small addition.

---

## T-42: Daily Operating System (ADHD Edition) 👥

**Target users:** Neurodivergent Users, General Consumers, Professionals

**Impact / Rating:** 9.5/10

**What the template is about:**
A minimal daily note designed for ADHD executive function support. ONE priority for the day (large, prominent). Three supporting tasks. A time-blocking table for the day. An evening dump zone for racing thoughts. The Blind Draft Mode (featurev1.md Batch 9 research) prevents editing previous content while in flow.

**What issue it solves:**
ADHD users experience decision paralysis from too many options. This template forces singular focus and provides structure that reduces the cognitive overhead of starting.

**Setup in existing Flought architecture:**
🔧 **Primarily uses existing time-blocking table (extends T-28) with a visual emphasis on the ONE priority.** Large heading + colored box using CM6 line decoration. Blind Draft Mode would be a separate toggle.

---

## T-43: Brain Dump & Triage

**Target users:** Neurodivergent Users, Researchers, Journalists

**Impact / Rating:** 8.5/10

**What the template is about:**
A zero-friction capture note. No frontmatter visible. One giant text area. After capture, a triage section prompts sorting of entries into: Action / Reference / Someday / Delete. Triaged items get wikilinked to the appropriate project or archive note.

**What issue it solves:**
The cost of capture must be lower than the cost of forgetting. ADHD users especially need a zero-decision capture mechanism. This template makes the capture act instantaneous and defers all organization to a dedicated triage pass.

**Setup in existing Flought architecture:**
🔧 **SparkInput already handles rapid capture.** This is a full-screen version of that concept with a structured triage section. Extends existing capture patterns.

---

---

# GROUP 10 — LEGAL PROFESSIONALS

---

## T-44: Case Brief

**Target users:** Lawyers, Legal Researchers, Law Students

**Impact / Rating:** 8.5/10

**What the template is about:**
Structured case summary with frontmatter: case name, citation, court, year, and ruling. IRAC body structure: Issue, Rule, Application, Conclusion. Related cases wikilink to their own briefs in the graph, creating a precedent network.

**What issue it solves:**
Legal research is expensive and non-cumulative without a connected system. A precedent graph where each case links to the rule it applies and the cases it cites creates compound research value over time.

**Setup in existing Flought architecture:**
🔧 **Pure frontmatter + structured markdown.** FrontmatterMask handles case metadata. The IRAC sections are standard H2 headers. Semantic Folding collapses completed briefs.

---

## T-45: Client Dossier 👥

**Target users:** Lawyers, Freelancers, Consultants

**Impact / Rating:** 8/10

**What the template is about:**
Comprehensive client record: contact details, matter type, key dates (retainer start, statute of limitations), linked case notes, billing log, and a communication timeline. Sensitive content uses the Cognitive Vault blur feature (hold-to-reveal).

**What issue it solves:**
Client privilege requires that confidential information never touches a cloud server. Local-first is not a convenience feature for lawyers — it is a professional requirement.

**Setup in existing Flought architecture:**
🟡 **Medium.** The Cognitive Vault (hold-to-reveal blur for `#private` tagged content) is confirmed in featurev1.md Batch 6, item 2. Billing log extends T-39 invoice pattern.

---

## T-46: Timeline Reconstruction

**Target users:** Lawyers, Journalists, Researchers, Historians

**Impact / Rating:** 8/10

**What the template is about:**
Chronological event log with date, event description, source evidence (wikilink), and significance rating. A visual timeline widget renders events on a horizontal axis. Events link to relevant document notes and case briefs.

**What issue it solves:**
Complex litigation, investigative journalism, and historical research all require reconstructing a chain of events. A linked, searchable timeline that connects events to source documents eliminates the manual cross-referencing work.

**Setup in existing Flought architecture:**
🟡 **Medium.** The timeline widget is a new CM6 widget — renders a horizontal SVG timeline from a structured list of `[date] event` lines. New widget type but straightforward vanilla JS / SVG.

---

---

# GROUP 11 — TTRPG GAME MASTERS

---

## T-47: Campaign Dashboard ✅

**Target users:** TTRPG Game Masters

**Impact / Rating:** 9/10

**What the template is about:**
Master hub linking to: World Bible, NPC Database, Session Logs, Location Maps, Faction Relations, and Encounter Builder. The D3 graph shows the entire campaign structure spatially — factions linked to NPCs, locations linked to events.

**What issue it solves:**
GMs managing a living campaign world need instant recall during live sessions. The graph canvas provides spatial navigation that is faster than any folder structure when a player asks an unexpected question about a NPC from 10 sessions ago.

**Setup in existing Flought architecture:**
✅ **Confirmed in Templet.txt.** World-Building Bible (T-20) is the foundation. Campaign Dashboard is the master index for it.

---

## T-48: Session Log

**Target users:** TTRPG Game Masters, Writers

**Impact / Rating:** 8.5/10

**What the template is about:**
Per-session record with frontmatter: session number, date, players, location. Body: recap summary, NPC appearances (wikilinks), locations visited (wikilinks), plot threads advanced (checklist), and unresolved hooks (checklist). Unresolved hooks persist as Ghost Nodes on the graph until addressed.

**What issue it solves:**
GMs frequently forget what unresolved plot threads are still hanging. Unresolved hooks as ghost nodes on the D3 graph create a persistent visual reminder that something is waiting to be addressed.

**Setup in existing Flought architecture:**
🔧 **Uses Ghost Nodes (featurev1.md Group C.2) as the key feature.** Unresolved hooks typed as `[[Plot Thread Name]]` without a corresponding note appear as ghost circles on the map. This is the confirmed Ghost Node use case.

---

## T-49: NPC Database

**Target users:** TTRPG Game Masters, Fiction Writers

**Impact / Rating:** 8/10

**What the template is about:**
Per-NPC note with frontmatter: name, role, faction (wikilink), location (wikilink), disposition toward players, and secret (Cognitive Vault blur). Body: appearance, personality, motivation, relationship graph. Tags drive the D3 spatial clustering.

**What issue it solves:**
GMs with 50+ NPCs cannot keep track of relationships and secrets during live play. The graph visually clusters NPCs by faction and shows relationship edges.

**Setup in existing Flought architecture:**
🔧 **FrontmatterMask handles all NPC metadata.** Cognitive Vault blur for the `secret` field is a small extension of the confirmed blur pattern.

---

---

# GROUP 12 — CONTENT CREATORS & EDUCATORS

---

## T-50: Creator Content OS 👥

**Target users:** Content Creators, Marketers, Founders

**Impact / Rating:** 9/10

**What the template is about:**
Full content pipeline: Idea Capture → Research → Script/Draft → Production Notes → Published → Performance Log. Each piece is an atomic note. Content pieces link to source research and inspiration notes. The kanban view shows pipeline position.

**What issue it solves:**
Content creators have ideas constantly but struggle to systematize production. This turns sporadic creation into a repeatable pipeline while keeping all research and source material connected in the graph.

**Setup in existing Flought architecture:**
🔧 **Extends T-05 (Content Planner) with deeper per-piece note structure.** No new widgets.

---

## T-51: Podcast Episode Tracker

**Target users:** Podcasters, Content Creators

**Impact / Rating:** 8/10

**What the template is about:**
Per-episode note with: guest (wikilink to CRM), topic, recording date, outline (numbered list), show notes draft, timestamps for key moments, sponsor slots, and publish status. A master index shows the full episode backlog with status badges.

**What issue it solves:**
Podcast production has 8–12 distinct steps per episode. Without a system, details fall through the gaps. This template tracks every step from pitch to publish.

**Setup in existing Flought architecture:**
🔧 **Extends T-01 table + T-04 meeting notes patterns.** No new widgets needed.

---

## T-52: Lesson Plan Builder

**Target users:** Educators, Teachers, Tutors

**Impact / Rating:** 8.5/10

**What the template is about:**
Per-lesson note with: learning objectives (checklist), timing breakdown (table with minutes per section), materials needed, activity instructions (numbered steps), and assessment criteria. Links to curriculum map and student progress notes.

**What issue it solves:**
Teachers rebuild lesson plans from scratch each year. A linked lesson plan vault where plans reference each other and connect to curriculum standards reduces planning time and improves consistency.

**Setup in existing Flought architecture:**
🔧 **Pure markdown + SmartBulletWidget (B.7) + TableMacroWidget.** No new patterns.

---

## T-53: Student Progress Tracker

**Target users:** Educators, Tutors, Coaches

**Impact / Rating:** 8/10

**What the template is about:**
Per-student note with: current level, learning goals (checklist), session log (reverse-chronological), and progress notes. A master class index shows all students with completion status bars.

**What issue it solves:**
Tutors working with multiple students lose track of individual progress between sessions. Local-first student notes are private by design — no GDPR concerns about student data in cloud apps.

**Setup in existing Flought architecture:**
🔧 **Extends T-18 (Academic Planner) pattern from the teacher's perspective.** Progress bars use confirmed ProgressBar widget.

---

---

# GROUP 13 — HEALTH & WELLNESS

---

## T-54: Health & Fitness Log 👥

**Target users:** Health-focused individuals, Athletes, General Consumers

**Impact / Rating:** 8.5/10

**What the template is about:**
Daily health log with: workout (type, duration, intensity), sleep (hours, quality rating), nutrition notes (freeform or checkboxes for macro targets), and a symptoms/energy log. Weekly summaries link to daily logs. Trends visualized via the Thermal Calendar widget.

**What issue it solves:**
Health apps are fragmented — one for sleep, one for workouts, one for nutrition. A unified local log that connects all three and links health patterns to journal entries (e.g., "poor sleep correlates with high-stress work weeks") creates insight that siloed apps cannot.

**Setup in existing Flought architecture:**
🔧 **Uses existing checkbox + frontmatter patterns.** Intensity rating is the same 1–5 star widget as T-24. Thermal Calendar already visualizes daily engagement.

---

## T-55: Mental Health Check-In

**Target users:** General Consumers, Therapists (personal use), Neurodivergent Users

**Impact / Rating:** 8.5/10

**What the template is about:**
A private, offline journaling template focused on emotional tracking. Sections: Mood rating (1–10), Energy rating, Today's Triggers (free text), Coping Actions used, and a Gratitude section (3 items). Cognitive Vault blur applies to the entire note via `#private` tag. Weekly pattern note aggregates 7 daily entries.

**What issue it solves:**
Mental health journaling requires absolute privacy. Cloud-based wellness apps are a non-starter for users who want genuine confidentiality. Local-first + hold-to-reveal blur is a meaningful differentiator.

**Setup in existing Flought architecture:**
🔧 **Extends Daily Journal (T-29) with Cognitive Vault blur.** Mood and energy ratings use the vanilla JS 1–10 slider widget (new, but follows established pattern).

---

---

# GROUP 14 — FINANCE & TRADERS

---

## T-56: Trading Journal

**Target users:** Traders, Investors

**Impact / Rating:** 8/10

**What the template is about:**
Per-trade note: ticker, entry price, exit price, position size, trade thesis (written reasoning), outcome (P&L derived via inline math), and lessons. A master journal aggregates all trades. Filter by outcome (Winner / Loser) using status pills. Pattern recognition emerges as similar-thesis trades wikilink to each other.

**What issue it solves:**
Most traders fail because they do not systematically review their decision-making process. A trading journal forces articulation of the thesis before entry, making emotional decisions visible in retrospect.

**Setup in existing Flought architecture:**
🟡 **Medium.** P&L calculation uses inline math widget. Status pills (Winner/Loser/Breakeven) are new color mappings in `db.metadata` — small addition. Wikilinks between similar-thesis trades are manual but the graph visualizes them naturally.

---

## T-57: Investment Research Log 👥

**Target users:** Investors, Analysts, Academic Researchers

**Impact / Rating:** 7.5/10

**What the template is about:**
Per-company research note: ticker, sector tag, thesis statement, bear case, valuation notes, and a risk checklist. Links to earnings call notes and news event logs. The D3 graph clusters companies by sector and shows competitive relationship edges.

**What issue it solves:**
Investment research is time-intensive. A structured, linked research system prevents re-reading old notes, makes competitive analysis spatial, and preserves the reasoning behind decisions.

**Setup in existing Flought architecture:**
🔧 **FrontmatterMask + wikilinks + checkbox patterns.** Risk checklist uses FastCheckboxWidget. No new widgets.

---

---

# Summary Tables

## By setup complexity

| Complexity | Count | Templates |
|-----------|-------|-----------|
| ✅ Confirmed | 11 | T-01, T-02, T-03, T-04, T-05, T-06, T-07, T-16, T-18, T-20, T-25, T-26, T-27, T-29, T-31, T-32, T-33, T-34, T-47 |
| 🔧 Small change | 24 | T-05, T-08, T-10, T-11, T-13, T-14, T-15, T-21, T-22, T-24, T-28, T-30, T-37, T-38, T-40, T-41, T-42, T-43, T-44, T-48, T-49, T-50, T-51, T-52, T-53, T-55, T-56 |
| 🟡 Medium | 10 | T-09, T-14, T-17, T-19, T-35, T-36, T-39, T-45, T-46, T-56 |
| 🔴 Complex | 1 | T-36 (grocery aggregation) |

## By impact rating

| Rating | Templates |
|--------|-----------|
| 10/10 | T-01, T-08, T-25, T-28 |
| 9.5/10 | T-03, T-16, T-20, T-28, T-31 |
| 9/10 | T-02, T-04, T-13, T-14, T-17, T-18, T-21, T-26, T-27, T-29, T-38, T-41, T-47, T-50 |
| 8.5/10 | T-05, T-06, T-09, T-10, T-12, T-19, T-22, T-24, T-30, T-33, T-39, T-43, T-44, T-48, T-51, T-54, T-55 |
| 8/10 | T-07, T-11, T-15, T-23, T-32, T-34, T-36, T-37, T-42, T-45, T-46, T-49, T-52, T-56 |
| 7.5/10 | T-35, T-40, T-57 |

## Templates covering 3+ user types (highest ROI)

| Template | User Types Covered |
|----------|-------------------|
| T-01 Project & Task Kanban | Founders, PMs, Engineers, Freelancers, Educators |
| T-25 Second Brain | Knowledge Workers, Researchers, Writers, Students |
| T-28 Weekly Planner | All archetypes |
| T-29 Daily Journal | Consumers, Knowledge Workers, Neurodivergent, Writers |
| T-31 Habit Tracker | All archetypes |
| T-04 Meeting Notes | Founders, PMs, Engineers, Legal, Freelancers |
| T-03 OKR Dashboard | Founders, PMs, Students |
| T-06 Client CRM | Founders, Freelancers, Legal, Sales |
| T-16 Research Dossier | Researchers, Students, Lawyers, Journalists |
| T-20 World-Building Bible | Writers, TTRPG GMs, Screenwriters |
| T-42 Daily OS (ADHD) | Neurodivergent, Consumers, Professionals |

---

## Recommended build order

**Phase 1 (build first — maximum coverage, confirmed architecture):**
T-28 Weekly Planner, T-29 Daily Journal, T-31 Habit Tracker, T-01 Project & Task Kanban, T-25 Second Brain, T-02 Company OS

**Phase 2 (high-impact, small additions):**
T-03 OKR, T-04 Meeting Notes, T-06 CRM, T-07 Financial, T-16 Research Dossier, T-27 Flashcard, T-32 Life Planner, T-33 Travel, T-34 Media Watchlist, T-47 Campaign Dashboard

**Phase 3 (medium complexity, specialist archetypes):**
T-08 Architecture Map, T-09 Code Snippets, T-17 Thesis, T-18 Academic Planner, T-20 World-Building, T-38 Client Project, T-41 Hyper-Focus, T-44 Case Brief, T-54 Health Log

**Phase 4 (complex or niche):**
T-36 Meal Planner (grocery aggregation), T-46 Timeline Reconstruction, T-56 Trading Journal, T-57 Investment Research
