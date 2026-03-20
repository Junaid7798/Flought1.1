Markdown ZIP Import and Export (Phase 1)
Implement a robust Markdown file ZIP import/export system for Flought V2 based on the specifications in 
flought-zip.md
 Phase 1.

Proposed Changes
1. Install Dependencies
Run: npm install jszip and npm install -D @types/jszip JSZip is required to cleanly build and parse zip files natively in the browser without backend dependencies.

2. Update 
SettingsModal.svelte
 with Phase 1 Features
[MODIFY] 
src/components/settings/SettingsModal.svelte
A. Markdown ZIP Export

exportAsZip(): Retrieves all active thoughts from the DB.
1.3 Progress Bar: Show an indeterminate or determinate progress UI state while packing thoughts.
1.6 Smart Naming: The downloaded file will be named dynamically using today's date (e.g., flought-export-2026-03-20.zip).
1.4 Error Handling: Wrap in try/catch and dispatch success/error toast notifications via showToast().
B. Markdown ZIP Import & Validation

importFromZip(event): Triggers from a hidden <input type="file" accept=".zip">.
1.5 ZIP Validation: Validate ZIP structure, reject files over a safe limit, and ignore non-md files.
1.1 Import Preview: Before saving anything to the DB, read all 
.md
 files into memory, count them, and identify duplicates (matching titles). Display a confirmation block to the user comparing "New" vs "Duplicates".
1.2 Conflict Resolution: If duplicates exist, expose radio buttons or select dropdowns to either Skip, Overwrite, or Import as Copy.
1.7 Title Priority: Extract titles using the frontmatter title field first, falling back to a sanitized filename if missing.
1.3 Progress Bar: Show a visual progress state during unzipping and DB injection.
1.4 Error Handling: Wrap in try/catch and dispatch success/error toast notifications.
1.8 Graph Refresh: End by explicitly calling eventBus.emit({ type: 'library.switched' }) or uiStore triggers to invalidate the graph store so nodes appear instantly.
3. Settings UI Layout
Inject the new Export Markdown ZIP button under the "Data Management" section (next to JSON export).
Inject the Import Markdown ZIP button and its associated hidden input.
Add a new reactive overlay/modal UI specifically for the Import Preview and Conflict Resolution steps that appears after picking a ZIP file but before the database write.
Verification Plan
Automated Tests
Build test to verify TypeScript typings for jszip.
Manual Testing Protocol (1.9 Round-Trip Verification)
Launch dev server.
Create 2 test thoughts with custom YAML parameters.
Click export and download the ZIP. Check smart naming format.
Delete the 2 thoughts from the UI.
Re-import the ZIP. Validate that the Preview UI appears successfully and correctly flags them as "New".
Complete import and verify Graph refreshes instantly and the thoughts are byte-for-byte identical (body + frontmatter).
Import the exact same ZIP again. Validate that the Conflict Resolution UI catches them as duplicates and allows Overwrite, Skip, or Copy mechanisms cleanly.
