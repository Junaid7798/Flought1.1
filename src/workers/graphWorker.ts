/**
 * Graph layout worker — runs D3 force simulation off the main thread.
 * No DOM access. No Dexie. No Svelte.
 *
 * Messages IN:
 *   { type: 'simulate', nodes: NodeData[], edges: EdgeData[] }
 *   { type: 'drag',     id: string, fx: number, fy: number }
 *   { type: 'dragEnd',  id: string }
 *   { type: 'addNode',  node: NodeData }
 *   { type: 'focusStage', stageId: number }
 *   { type: 'clearFocusStage' }
 *
 * Messages OUT:
 *   { type: 'positions', buffer: Float32Array, nodeIndex: Record<string, number> }
 */

import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import { polygonHull } from 'd3-polygon';

// ── Types ────────────────────────────────────────────────────────────────────

export interface NodeData {
  id: string;
  title: string;
  content?: string;   // present for real nodes only — used to extract unresolved wikilinks
  x?: number;
  y?: number;
  meta_state: number;
  isGhost?: boolean;
}

export interface EdgeData {
  source: string;
  target: string;
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  title: string;
  meta_state: number;
  isGhost: boolean;
}

interface SimEdge extends SimulationLinkDatum<SimNode> {
  source: SimNode | string;
  target: SimNode | string;
}

type InMessage =
  | { type: 'simulate'; nodes: NodeData[]; edges: EdgeData[]; ghostOpacity: number }
  | { type: 'drag'; id: string; fx: number; fy: number }
  | { type: 'dragEnd'; id: string }
  | { type: 'addNode'; node: NodeData }
  | { type: 'focusStage'; stageId: number }
  | { type: 'clearFocusStage' }
  | { type: 'updateForces'; repulsion: number; linkDistance: number; settleSpeed: number }
  | { type: 'settle' };

// ── State ────────────────────────────────────────────────────────────────────

import { GRAPH_PHYSICS_DEFAULTS } from '$lib/graphDefaults';

let ALPHA_DECAY:        number = GRAPH_PHYSICS_DEFAULTS.alphaDecay;
let MANY_BODY_STRENGTH: number = GRAPH_PHYSICS_DEFAULTS.manyBodyStrength;
let LINK_DISTANCE:      number = GRAPH_PHYSICS_DEFAULTS.linkDistance;
const GRAVITY_FOCUS_STRENGTH: number = GRAPH_PHYSICS_DEFAULTS.gravityCenterX;
const GRAVITY_PUSH_STRENGTH:  number = GRAPH_PHYSICS_DEFAULTS.gravityPushStrength;

let nodes: SimNode[] = [];
let edges: SimEdge[] = [];
let ghostOpacity = 0.35; // updated from each simulate message

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sim: ReturnType<typeof forceSimulation<SimNode>> | null = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function nodeMap(): Map<string, SimNode> {
  return new Map(nodes.map((n) => [n.id, n]));
}

function computeHulls(): Record<number, [number, number][]> {
  // Group node positions by meta_state — exclude ghost nodes (meta_state 0)
  const groups = new Map<number, [number, number][]>();
  for (const n of nodes) {
    if (n.isGhost) continue;
    const pts = groups.get(n.meta_state);
    const pt: [number, number] = [n.x ?? 0, n.y ?? 0];
    if (pts) {
      pts.push(pt);
    } else {
      groups.set(n.meta_state, [pt]);
    }
  }

  const hulls: Record<number, [number, number][]> = {};
  for (const [stageId, pts] of groups) {
    // polygonHull needs ≥3 non-collinear points
    if (pts.length < 3) continue;
    const hull = polygonHull(pts);
    if (hull) hulls[stageId] = hull;
  }
  return hulls;
}

function postPositions() {
  const nodeIndex: Record<string, number> = {};
  const buffer = new Float32Array(nodes.length * 2);
  // Ghost metadata map: nodeId → { title, isGhost }
  const ghostMap: Record<string, { title: string; isGhost: boolean }> = {};

  for (let i = 0; i < nodes.length; i++) {
    nodeIndex[nodes[i].id] = i;
    buffer[i * 2]     = nodes[i].x ?? 0;
    buffer[i * 2 + 1] = nodes[i].y ?? 0;
    if (nodes[i].isGhost) {
      ghostMap[nodes[i].id] = { title: nodes[i].title, isGhost: true };
    }
  }

  const hulls = computeHulls();
  self.postMessage({ type: 'positions', buffer, nodeIndex, hulls, ghostMap, ghostOpacity });
}

function buildSimulation(): ReturnType<typeof forceSimulation<SimNode>> {
  const s = forceSimulation<SimNode>(nodes)
    .alphaDecay(ALPHA_DECAY)
    .force(
      'charge',
      // Ghost nodes get half the charge to avoid dominating the layout
      forceManyBody<SimNode>().strength((d) => d.isGhost ? MANY_BODY_STRENGTH / 2 : MANY_BODY_STRENGTH),
    )
    .force(
      'link',
      forceLink<SimNode, SimEdge>(edges)
        .id((d) => d.id)
        .distance(LINK_DISTANCE),
    )
    .force('center', forceCenter<SimNode>(0, 0))
    .stop(); // we'll manually tick to completion

  return s;
}

function runToCompletion(s: ReturnType<typeof forceSimulation<SimNode>>) {
  // Tick until alpha drops below threshold
  while (s.alpha() > 0.001) {
    s.tick();
  }
  postPositions();
}

// ── Semantic Gravity ─────────────────────────────────────────────────────────

function applyGravity(s: ReturnType<typeof forceSimulation<SimNode>>, stageId: number) {
  s.force(
    'gravityX',
    forceX<SimNode>(0).strength((d) =>
      d.meta_state === stageId ? GRAVITY_FOCUS_STRENGTH : GRAVITY_PUSH_STRENGTH
    ),
  );
  s.force(
    'gravityY',
    forceY<SimNode>(0).strength((d) =>
      d.meta_state === stageId ? GRAVITY_FOCUS_STRENGTH : GRAVITY_PUSH_STRENGTH
    ),
  );
}

function clearGravity(s: ReturnType<typeof forceSimulation<SimNode>>) {
  s.force('gravityX', null);
  s.force('gravityY', null);
}

// ── Wikilink extractor ───────────────────────────────────────────────────────

function extractWikilinks(content: string): string[] {
  const pattern = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;
  while ((match = pattern.exec(content)) !== null) {
    links.push(match[1].trim());
  }
  return links;
}

// ── Message handler ──────────────────────────────────────────────────────────

self.onmessage = (e: MessageEvent<InMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'simulate': {
      ghostOpacity = msg.ghostOpacity;

      // Build real nodes
      const realNodes: SimNode[] = msg.nodes.map((n) => ({
        id:         n.id,
        title:      n.title,
        x:          n.x,
        y:          n.y,
        meta_state: n.meta_state,
        isGhost:    false,
      }));

      // Extract ghost nodes from unresolved [[wikilinks]]
      const existingTitles = new Set(realNodes.map((n) => n.title.toLowerCase()));
      const ghostTitles = new Set<string>();

      for (const n of msg.nodes) {
        if (!n.content) continue;
        for (const link of extractWikilinks(n.content)) {
          const lower = link.toLowerCase();
          if (!existingTitles.has(lower) && !ghostTitles.has(lower)) {
            ghostTitles.add(lower);
          }
        }
      }

      const ghostNodes: SimNode[] = [...ghostTitles].map((title) => ({
        id:         'ghost-' + title,
        title:      title,
        x:          undefined,
        y:          undefined,
        meta_state: 0,
        isGhost:    true,
      }));

      nodes = [...realNodes, ...ghostNodes];

      edges = msg.edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      }));

      sim = buildSimulation();
      runToCompletion(sim);
      break;
    }

    case 'drag': {
      if (!sim) break;
      const lookup = nodeMap();
      const node = lookup.get(msg.id);
      if (!node) break;

      node.fx = msg.fx;
      node.fy = msg.fy;
      sim.alpha(0.3).restart().stop();

      // Run a few ticks so surrounding nodes settle
      runToCompletion(sim);
      break;
    }

    case 'dragEnd': {
      if (!sim) break;
      const lookup = nodeMap();
      const node = lookup.get(msg.id);
      if (!node) break;

      node.fx = null;
      node.fy = null;
      break;
    }

    case 'addNode': {
      const newNode: SimNode = {
        id:         msg.node.id,
        title:      msg.node.title,
        x:          msg.node.x,
        y:          msg.node.y,
        meta_state: msg.node.meta_state,
        isGhost:    msg.node.isGhost ?? false,
      };
      nodes.push(newNode);

      if (sim) {
        sim.nodes(nodes);
        sim.alpha(0.1).restart().stop();
        runToCompletion(sim);
      } else {
        sim = buildSimulation();
        runToCompletion(sim);
      }
      break;
    }

    case 'focusStage': {
      if (!sim) {
        sim = buildSimulation();
      }
      applyGravity(sim, msg.stageId);
      sim.alpha(0.4).restart().stop();
      runToCompletion(sim);
      break;
    }

    case 'clearFocusStage': {
      if (!sim) break;
      clearGravity(sim);
      sim.alpha(0.4).restart().stop();
      runToCompletion(sim);
      break;
    }

    case 'settle': {
      if (sim) {
        sim.alpha(0.1).restart().stop();
        runToCompletion(sim);
      }
      break;
    }

    case 'updateForces': {
      MANY_BODY_STRENGTH = -msg.repulsion;
      LINK_DISTANCE = msg.linkDistance;
      ALPHA_DECAY = msg.settleSpeed;
      if (sim) {
        sim
          .force('charge', forceManyBody<SimNode>().strength(MANY_BODY_STRENGTH))
          .force(
            'link',
            forceLink<SimNode, SimEdge>(edges).id((d) => d.id).distance(LINK_DISTANCE),
          )
          .alphaDecay(ALPHA_DECAY)
          .alpha(0.3)
          .restart()
          .stop();
        runToCompletion(sim);
      }
      break;
    }
  }
};
