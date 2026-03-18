export const PIPELINE_STATES = [
  { id: 1, colour: '#F59E0B', cssVar: '--color-inbox' },
  { id: 2, colour: '#3B82F6', cssVar: '--color-queue' },
  { id: 3, colour: '#10B981', cssVar: '--color-forge' },
  { id: 4, colour: '#6B7280', cssVar: '--color-archive' },
] as const;

export type PipelineStateId = (typeof PIPELINE_STATES)[number]['id'];

export const ANIMATION_CONFIG = {
  focusFadeDuration: 300,
  nodeBloomDuration: 400,
  nodeBloomStagger: 60,
  springEasing: 'cubic-bezier(0.34,1.56,0.64,1)',
  graphAlphaDecay: 0.028,
  debounceEditor: 800,
} as const;

export const GRAPH_CONFIG = {
  neighbourhoodDepth: 2,
  maxViewportNodes: 500,
  labelZoomThreshold: 0.8,
  nodeFocusOpacity: 1.0,
  nodeUnfocusedOpacity: 0.12,
  edgeFocusOpacity: 0.4,
  edgeUnfocusedOpacity: 0.04,
} as const;
