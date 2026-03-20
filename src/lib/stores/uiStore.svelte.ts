import type { SyncStatus } from '$lib/sync/SyncService';
import { GRAPH_DISPLAY_DEFAULTS, GRAPH_PHYSICS_DEFAULTS } from '$lib/graphDefaults';
import type { GraphPreset } from '$lib/graphDefaults';

export const uiStore = $state({
  sidebarWidth: 220,
  rightSidebarWidth: 280,
  sidebarCollapsed: false,
  editorSidebarCollapsed: false,
  rightSidebarCollapsed: false,
  activeView: 'map' as 'map' | 'editor' | 'focus',
  focusedNodeId: null as string | null,
  activeLibraryId: '' as string,
  commandPaletteOpen: false,
  isSparkInputOpen: false,
  isSettingsOpen: false,
  theme: 'modern-dark' as 'modern-dark' | 'modern-light',
  layoutWidth: 'normal' as 'normal' | 'wide' | 'full',
  brandColor: '#8B5CF6',
  searchWorker: null as Worker | null,
  syncStatus: 'local' as SyncStatus,
  lastSyncedAt: null as string | null,
  focusedStageId: null as number | null,
  sparkInputPrefill: '' as string,
  sparkInputPrefillCoords: null as { x: number; y: number } | null,

  // Graph controls — session-only, never persisted to DB
  graphNodeSize:           GRAPH_DISPLAY_DEFAULTS.nodeRadius   as number,
  graphEdgeOpacity:        GRAPH_DISPLAY_DEFAULTS.edgeOpacity  as number,
  graphShowLabels:         GRAPH_DISPLAY_DEFAULTS.showLabels   as boolean,
  graphShowHulls:          GRAPH_DISPLAY_DEFAULTS.showHulls    as boolean,
  graphShowOrphans:        GRAPH_DISPLAY_DEFAULTS.showOrphans  as boolean,
  graphRepulsion:          Math.abs(GRAPH_PHYSICS_DEFAULTS.manyBodyStrength) as number,
  graphLinkDistance:       GRAPH_PHYSICS_DEFAULTS.linkDistance  as number,
  graphSettleSpeed:        GRAPH_PHYSICS_DEFAULTS.alphaDecay   as number,
  graphNeighbourhoodDepth: GRAPH_DISPLAY_DEFAULTS.neighbourhoodDepth as number,
  graphDimStrength:        GRAPH_DISPLAY_DEFAULTS.dimStrength  as number,
  graphPreset:             'default' as GraphPreset,
});
