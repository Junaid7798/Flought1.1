export const uiStore = $state({
  sidebarWidth: 220,
  sidebarCollapsed: false,
  activeView: 'map' as 'map' | 'editor' | 'focus',
  focusedNodeId: null as string | null,
  activeLibraryId: '' as string,
  commandPaletteOpen: false,
  theme: 'midnight' as 'midnight' | 'light',
});
