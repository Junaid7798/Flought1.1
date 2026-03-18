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
  x?: number;
  y?: number;
  meta_state: number;
}

export interface EdgeData {
  source: string;
  target: string;
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  meta_state: number;
}

interface SimEdge extends SimulationLinkDatum<SimNode> {
  source: SimNode | string;
  target: SimNode | string;
}

type InMessage =
  | { type: 'simulate'; nodes: NodeData[]; edges: EdgeData[] }
  | { type: 'drag'; id: string; fx: number; fy: number }
  | { type: 'dragEnd'; id: string }
  | { type: 'addNode'; node: NodeData }
  | { type: 'focusStage'; stageId: number }
  | { type: 'clearFocusStage' };

// ── State ────────────────────────────────────────────────────────────────────

const ALPHA_DECAY = 0.028;
const MANY_BODY_STRENGTH = -200;
const LINK_DISTANCE = 120;
const GRAVITY_FOCUS_STRENGTH = 0.3;
const GRAVITY_PUSH_STRENGTH = -0.1;

let nodes: SimNode[] = [];
let edges: SimEdge[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sim: ReturnType<typeof forceSimulation<SimNode>> | null = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function nodeMap(): Map<string, SimNode> {
  return new Map(nodes.map((n) => [n.id, n]));
}

function computeHulls(): Record<number, [number, number][]> {
  // Group node positions by meta_state
  const groups = new Map<number, [number, number][]>();
  for (const n of nodes) {
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

  for (let i = 0; i < nodes.length; i++) {
    nodeIndex[nodes[i].id] = i;
    buffer[i * 2] = nodes[i].x ?? 0;
    buffer[i * 2 + 1] = nodes[i].y ?? 0;
  }

  const hulls = computeHulls();
  self.postMessage({ type: 'positions', buffer, nodeIndex, hulls });
}

function buildSimulation(): ReturnType<typeof forceSimulation<SimNode>> {
  const s = forceSimulation<SimNode>(nodes)
    .alphaDecay(ALPHA_DECAY)
    .force(
      'charge',
      forceManyBody<SimNode>().strength(MANY_BODY_STRENGTH),
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

// ── Message handler ──────────────────────────────────────────────────────────

self.onmessage = (e: MessageEvent<InMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'simulate': {
      nodes = msg.nodes.map((n) => ({
        id: n.id,
        x: n.x,
        y: n.y,
        meta_state: n.meta_state,
      }));

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
        id: msg.node.id,
        x: msg.node.x,
        y: msg.node.y,
        meta_state: msg.node.meta_state,
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
  }
};
