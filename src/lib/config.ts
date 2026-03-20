import { GRAPH_PRESETS } from '$lib/graphDefaults';

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
  nodeRadius: 6,              // default node radius in px (also in graphDefaults.ts)
} as const;

// ── Input length constraints ──────────────────────────────────────────────────
// Referenced by any component with a maxlength attribute.
// Change here to update everywhere.

export const INPUT_CONSTRAINTS = {
  captureMaxLength:      300,   // SparkInput thought capture
  libraryNameMaxLength:   60,   // Sidebar library name
  displayNameMaxLength:   60,   // Onboarding user name
  stageLabelMaxLength:    24,   // Settings pipeline stage rename
  thoughtTitleMaxLength: 120,   // Editor thought title
} as const;

// ── Feature config ────────────────────────────────────────────────────────────
// All tuneable V1 feature values. V2 reads from here and extends without rewriting.
// GRAPH_PRESETS re-exported from graphDefaults — single source of truth.

export const FEATURE_CONFIG = {
  THERMAL_CALENDAR_DAYS:   28,
  AUTOCOMPLETE_MAX_TERMS: 500,
  JANITOR_BATCH_SIZE:      50,
  GHOST_NODE_OPACITY:    0.35,
  FOLD_PERSIST:          false as boolean,   // V2 flips to true to persist fold state
  SERENDIPITY_INTERVAL_MS: 86_400_000,       // 24 hours in ms
  TOOLBAR_ACTIONS: [
    { id: 'bold',   i18nKey: 'feature.toolbar.bold',   wrap: ['**', '**']     },
    { id: 'italic', i18nKey: 'feature.toolbar.italic', wrap: ['*',  '*']      },
    { id: 'code',   i18nKey: 'feature.toolbar.code',   wrap: ['`',  '`']      },
    { id: 'link',   i18nKey: 'feature.toolbar.link',   wrap: ['[',  '](url)'] },
    { id: 'h1',     i18nKey: 'feature.toolbar.h1',     wrap: ['# ', '']       },
    { id: 'h2',     i18nKey: 'feature.toolbar.h2',     wrap: ['## ', '']      },
    { id: 'h3',     i18nKey: 'feature.toolbar.h3',     wrap: ['### ', '']     },
    { id: 'list',   i18nKey: 'feature.toolbar.list',   wrap: ['- ', '']       },
    { id: 'checklist', i18nKey: 'feature.toolbar.checklist', wrap: ['- [ ] ', ''] },
    { id: 'quote',  i18nKey: 'feature.toolbar.quote',  wrap: ['> ', '']       },
    { id: 'emoji',  i18nKey: 'feature.toolbar.emoji',  wrap: ['😊 ', '']      },
    { id: 'color',  i18nKey: 'feature.toolbar.color',  wrap: ['', '']         },
  ],
  GRAPH_PRESETS,
} as const;

export const EDITOR_COLORS = [
  { name: 'Default', value: 'var(--text-primary)' },
  { name: 'Red',     value: '#ef4444' },
  { name: 'Orange',  value: '#f97316' },
  { name: 'Yellow',  value: '#eab308' },
  { name: 'Green',   value: '#22c55e' },
  { name: 'Blue',    value: '#3b82f6' },
  { name: 'Purple',  value: '#a855f7' },
  { name: 'Pink',    value: '#ec4899' },
] as const;
