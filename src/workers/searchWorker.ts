/**
 * Search worker — runs off the main thread.
 * No DOM, no Dexie, no Svelte imports.
 *
 * Message types in:
 *   { type: 'index',  thoughts: ThoughtEntry[] }   → rebuild full index
 *   { type: 'update', thought: ThoughtEntry }       → patch single entry
 *   { type: 'search', query: string }               → return matching ids
 *
 * Message types out:
 *   { type: 'results', ids: string[] }
 */

import { Document } from 'flexsearch';

interface ThoughtEntry {
  id: string;
  title: string;
  content: string;
}

type InMessage =
  | { type: 'index'; thoughts: ThoughtEntry[] }
  | { type: 'update'; thought: ThoughtEntry }
  | { type: 'search'; query: string };

// ── Index ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let index = buildIndex([]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildIndex(thoughts: ThoughtEntry[]): Document<any> {
  // Document<any> used to avoid FlexSearch's recursive DocumentData constraint
  const idx = new Document<any>({
    document: {
      id: 'id',
      field: ['title', 'content'],
    },
    tokenize: 'forward',
    resolution: 9,
  });
  for (const t of thoughts) {
    idx.add(t);
  }
  return idx;
}

// ── Message handler ────────────────────────────────────────────────────────

const VALID_MESSAGE_TYPES = new Set(['index', 'update', 'search']);

function isValidMessage(msg: unknown): msg is InMessage {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as Record<string, unknown>;
  if (typeof m.type !== 'string' || !VALID_MESSAGE_TYPES.has(m.type)) return false;
  if (m.type === 'update' && (!m.thought || typeof m.thought !== 'object')) return false;
  return true;
}

self.onmessage = (e: MessageEvent<InMessage>) => {
  const msg = e.data;

  if (!isValidMessage(msg)) {
    console.warn('[searchWorker] Invalid message:', msg);
    return;
  }

  switch (msg.type) {
    case 'index': {
      index = buildIndex(msg.thoughts);
      break;
    }

    case 'update': {
      // update() replaces if exists, add() inserts if new
      index.update(msg.thought);
      break;
    }

    case 'search': {
      const query = msg.query.trim();
      if (!query) {
        self.postMessage({ type: 'results', ids: [] });
        return;
      }

      // Search across both fields; merge and deduplicate ids
      const results = index.search(query, { enrich: false });
      const seen = new Set<string>();
      for (const fieldResult of results) {
        for (const id of fieldResult.result as string[]) {
          seen.add(id);
        }
      }

      self.postMessage({ type: 'results', ids: [...seen] });
      break;
    }
  }
};
