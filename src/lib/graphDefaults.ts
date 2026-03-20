// ── graphDefaults.ts ────────────────────────────────────────────────────────
// Single source of truth for graph physics defaults and slider constraints.
//
// This file is intentionally plain TypeScript — no Svelte, no DOM, no Dexie —
// so it can be safely imported by BOTH:
//   • src/workers/graphWorker.ts  (worker boundary: no DOM/Svelte imports)
//   • src/lib/stores/uiStore.svelte.ts
//   • src/components/graph/GraphControlsPanel.svelte
//
// CLAUDE.md file boundary law:
//   Workers may only import pure computation modules.
//   This file qualifies — zero side-effects, zero runtime dependencies.

// ── Physics defaults ─────────────────────────────────────────────────────────
// These must stay in sync with graphWorker.ts initial values.
// Update both places if changing a default.

export const GRAPH_PHYSICS_DEFAULTS = {
  alphaDecay:          0.028,   // D3 alphaDecay (higher = faster settle)
  manyBodyStrength:   -200,     // negative = repulsion
  linkDistance:        120,     // pixels between connected nodes at rest
  gravityCenterX:      0.3,     // center gravity strength (focus mode)
  gravityPushStrength: -0.1,    // push gravity (non-focus)
} as const;

// ── Display defaults ─────────────────────────────────────────────────────────

export const GRAPH_DISPLAY_DEFAULTS = {
  nodeRadius:         6,        // px — matches GRAPH_CONFIG.nodeRadius
  edgeOpacity:        0.15,     // rgba white channel for edges
  showLabels:         true,
  showHulls:          true,
  showOrphans:        true,
  neighbourhoodDepth: 2,        // focus radius: 1 | 2 | 3
  dimStrength:        0.12,     // unfocused node opacity
} as const;

// ── Slider constraints ────────────────────────────────────────────────────────
// Used by GraphControlsPanel.svelte to drive <input type="range"> attributes.
// Values are [min, max, step].

export const GRAPH_SLIDER_CONSTRAINTS = {
  nodeRadius:         { min: 3,     max: 14,   step: 1     },
  edgeOpacity:        { min: 0.02,  max: 0.6,  step: 0.01  },
  repulsion:          { min: 50,    max: 600,  step: 10    },
  linkDistance:       { min: 40,    max: 300,  step: 10    },
  settleSpeed:        { min: 0.005, max: 0.08, step: 0.005 },
  dimStrength:        { min: 0.04,  max: 0.4,  step: 0.01  },
  neighbourhoodDepth: { min: 1,     max: 3,    step: 1     },
} as const;

// ── Graph presets ─────────────────────────────────────────────────────────────
// Named layout presets applied by GraphControlsPanel.

export const GRAPH_PRESETS = {
  default: { nodeRadius: 6,  edgeOpacity: 0.15, repulsion: 200, linkDistance: 120, settleSpeed: 0.028 },
  compact: { nodeRadius: 5,  edgeOpacity: 0.10, repulsion: 120, linkDistance: 70,  settleSpeed: 0.04  },
  spread:  { nodeRadius: 7,  edgeOpacity: 0.20, repulsion: 340, linkDistance: 180, settleSpeed: 0.02  },
  zen:     { nodeRadius: 8,  edgeOpacity: 0.06, repulsion: 280, linkDistance: 160, settleSpeed: 0.015 },
} as const;

export type GraphPreset = keyof typeof GRAPH_PRESETS;
