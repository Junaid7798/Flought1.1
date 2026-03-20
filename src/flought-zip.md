# Flought V2 — Markdown ZIP Import/Export Feature Roadmap

---

## Phase 1 — Core Reliability (Do Now)

### 1.1 Import Preview Before Committing
- Before writing to DB, show the user a list of all thoughts found in the ZIP
- Display count of new vs duplicate thoughts
- User must confirm before anything is imported
- Example prompt: *"Found 12 thoughts — 3 already exist. Import anyway?"*

### 1.2 Conflict Resolution UI
- When a duplicate thought is detected on import, give the user options:
  - **Skip** — leave existing thought untouched
  - **Overwrite** — replace existing with imported version
  - **Import as Copy** — create a new thought alongside the existing one

### 1.3 Progress Bar During Import/Export
- Show real-time progress for large vaults
- Example: *"Exporting 45 of 200 thoughts..."*
- Prevent UI from appearing frozen during long operations

### 1.4 Error Handling & User Feedback
- Wrap all import/export logic in try/catch
- Show a toast notification on completion:
  - ✅ *"Imported 18 thoughts — 2 skipped (duplicates)"*
  - ❌ *"Import failed — ZIP file appears to be corrupted"*

### 1.5 ZIP Validation on Import
- Validate ZIP structure before processing
- Warn if files inside are not `.md` format
- Reject ZIPs that exceed a safe file size limit

### 1.6 Smart Export File Naming
- Auto-name the exported ZIP with timestamp:
  ```
  flought-export-2026-03-20.zip
  ```

### 1.7 Title Priority Fix
- During import, use the frontmatter `title` field first
- Fall back to filename only if no title field exists in YAML
- Sanitize filename-derived titles (replace `-`, `_`, encoded characters)

### 1.8 Graph Refresh After Import
- After import completes, explicitly invalidate the graph store
- New thoughts must appear immediately without requiring a page reload

### 1.9 Round-Trip Verification
- After implementing, run this test internally:
  1. Create 2 test thoughts
  2. Export as ZIP
  3. Delete the thoughts
  4. Re-import the ZIP
  5. Verify titles, body, and frontmatter are byte-for-byte identical

---

## Phase 2 — Better User Control (Next)

### 2.1 Selective Export
- Let users choose which thoughts to export before downloading
- UI options:
  - Checkbox list of all thoughts
  - Filter by tag
  - Filter by date range
  - Filter by search query

### 2.2 Export Folder Structure
- Organize the ZIP by tags or creation date instead of flat structure
- Example structure:
  ```
  vault-export/
    work/
      project-alpha.md
      meeting-notes.md
    personal/
      journal.md
    untagged/
      quick-note.md
  ```

### 2.3 Import from Single `.md` File
- Allow importing a single markdown file directly, not just ZIPs
- Add drag and drop support on the settings panel
- Parse frontmatter and body the same way as ZIP import

### 2.4 Multiple Export Formats
- Not just ZIP of `.md` files — also offer:
  - **Single merged `.md`** — all thoughts in one long file
  - **JSON export** — raw DB state for full backup and restore
  - **CSV export** — metadata only (title, tags, date, aliases)

### 2.5 Import History Log
- Keep a running log of past import operations
- Display in settings panel:
  ```
  March 20, 2026 — Imported 24 thoughts from vault-backup.zip
  March 15, 2026 — Imported 6 thoughts from notes-export.zip
  ```

---

## Phase 3 — Automation & Polish (Later)

### 3.1 Auto Backup
- Scheduled automatic ZIP export every X days (user configurable)
- Show last backup date in settings:
  - *"Last backup: 3 days ago"*
- Trigger download automatically or notify user to download

### 3.2 Export with Attachments
- If thoughts contain linked images or files, include them in the ZIP
- Maintain correct relative links inside the markdown files
- Example ZIP structure:
  ```
  vault-export/
    my-thought.md
    assets/
      diagram.png
      screenshot.jpg
  ```

### 3.3 Keyboard Shortcut for Quick Export
- Trigger full export without opening settings
- Suggested shortcut: `Ctrl+Shift+E`
- Show brief toast confirming download started

### 3.4 Diff View on Re-import
- If importing a thought that already exists in the DB, show a side-by-side diff
- Highlight what changed between the existing and incoming version
- User picks which version to keep field by field

### 3.5 Drag and Drop ZIP onto Vault
- Allow users to drag a `.zip` directly onto the main vault interface
- Triggers the import preview flow automatically
- No need to open settings at all

---

## Phase 4 — Advanced Features (Future)

### 4.1 Encryption on Export
- Optional password protection for the ZIP before downloading
- Uses JSZip's built-in encryption support
- User sets a password in the export dialog
- Required on import to decrypt

### 4.2 Obsidian Vault Compatibility
- Import directly from an Obsidian-compatible ZIP structure
- Respect Obsidian's frontmatter conventions (`aliases`, `tags`, `created`)
- Allow Flought users to migrate from Obsidian cleanly

### 4.3 Cloud Export Integration
- Export directly to Google Drive or Dropbox
- Requires OAuth authentication setup
- Auto-sync vault to a cloud folder on a schedule


---

## Build Order Summary

| Phase | Focus | When |
|---|---|---|
| Phase 1 | Core reliability, error handling, validation | Now |
| Phase 2 | User control, selective export, more formats | Next sprint |
| Phase 3 | Automation, polish, keyboard shortcuts | Later |
| Phase 4 | Encryption, cloud, Obsidian sync | Future |

---

## Claude Code Prompt to Start Phase 1

```
Implement Phase 1 of the Markdown ZIP import/export feature.

Follow this exact order:
1. Import preview UI before committing to DB
2. Conflict resolution — skip, overwrite, or import as copy
3. Progress indicator during import and export
4. try/catch error handling with toast notifications on success and failure
5. ZIP validation before processing
6. Smart auto-naming of exported ZIP with today's date
7. Title priority — frontmatter title first, filename as fallback
8. Graph store invalidation after import completes

Rules:
- Only modify src/components/settings/SettingsModal.svelte
- Do NOT touch any protected core logic files
- Implement one item at a time and confirm with me before moving to the next
- Show me the code diff before applying any change
```
