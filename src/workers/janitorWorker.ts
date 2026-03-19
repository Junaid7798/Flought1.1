/**
 * Janitor Worker — pure computation for link integrity operations.
 * No DOM access. No Dexie. No Svelte.
 *
 * Messages IN:
 *   { type: 'renameLinks'; oldTitle: string; newTitle: string; thoughts: ThoughtData[]; batchSize: number }
 *   { type: 'resolveAlias'; alias: string; canonicalTitle: string; thoughts: ThoughtData[]; batchSize: number }  ← V2 slot
 *   { type: 'repairBroken'; suggestions: Record<string,string>; thoughts: ThoughtData[]; batchSize: number }     ← V3 slot
 *
 * Messages OUT:
 *   { type: 'renameResult'; updates: Array<{ id: string; content: string }>; batchIndex: number; totalBatches: number }
 *   { type: 'unsupported'; requestedType: string }
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface ThoughtData {
  id: string;
  content: string;
}

type InMessage =
  | { type: 'renameLinks';   oldTitle: string; newTitle: string;                       thoughts: ThoughtData[]; batchSize: number }
  | { type: 'resolveAlias'; alias: string;    canonicalTitle: string;                  thoughts: ThoughtData[]; batchSize: number }
  | { type: 'repairBroken'; suggestions: Record<string, string>;                       thoughts: ThoughtData[]; batchSize: number };

type OutMessage =
  | { type: 'renameResult'; updates: Array<{ id: string; content: string }>; batchIndex: number; totalBatches: number }
  | { type: 'unsupported';  requestedType: string };

// ── Message handler ──────────────────────────────────────────────────────────

self.onmessage = (e: MessageEvent<InMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'renameLinks': {
      const oldLink = '[[' + msg.oldTitle + ']]';
      const newLink = '[[' + msg.newTitle + ']]';

      // Filter to only thoughts that contain the old link
      const matching = msg.thoughts.filter((t) => t.content.includes(oldLink));

      // Apply replacement
      const updates = matching.map((t) => ({
        id:      t.id,
        content: t.content.replaceAll(oldLink, newLink),
      }));

      // Chunk into batches
      const batchSize    = Math.max(1, msg.batchSize);
      const totalBatches = Math.max(1, Math.ceil(updates.length / batchSize));

      if (updates.length === 0) {
        // Nothing to update — post a single empty final batch so the caller resolves
        const result: OutMessage = { type: 'renameResult', updates: [], batchIndex: 0, totalBatches: 1 };
        self.postMessage(result);
        break;
      }

      for (let i = 0; i < totalBatches; i++) {
        const batch = updates.slice(i * batchSize, (i + 1) * batchSize);
        const result: OutMessage = {
          type:         'renameResult',
          updates:      batch,
          batchIndex:   i,
          totalBatches,
        };
        self.postMessage(result);
      }
      break;
    }

    case 'resolveAlias':
    case 'repairBroken': {
      // V2/V3 stubs — notify caller this type is not yet implemented
      const result: OutMessage = { type: 'unsupported', requestedType: msg.type };
      self.postMessage(result);
      break;
    }
  }
};
