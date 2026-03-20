# Sidebar & Navigation UX Refinement

The goal is to provide explicit, always-accessible buttons to toggle sidebars and return from the settings page.

## Proposed Changes

### TopBar / Navigation Component
Add sidebar toggle buttons to the global `TopBar` to allow easy collapsing/expanding from the top header.

#### [MODIFY] [TopBar.svelte](file:///d:/Flought%20V2/src/components/layout/TopBar.svelte)
- Add `PanelLeftOpen`, `PanelLeftClose`, `PanelRightOpen`, `PanelRightClose` icons.
- Add a left sidebar toggle button (before tabs).
- Add a right sidebar toggle button (after actions, only on Editor page).

### Settings Page
Improve the "Come Back" experience with a standard back button in the header.

#### [MODIFY] [Settings +page.svelte](file:///d:/Flought%20V2/src/routes/(app)/settings/+page.svelte)
- Add a `ChevronLeft` icon in the top left of the content header.
- Wire it to `history.back()`.

## Verification Plan
- Manual testing of sidebar toggles across all viewports.
- Verification of the "Back" button functionality in settings.
