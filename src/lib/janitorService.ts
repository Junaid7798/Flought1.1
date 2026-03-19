/**
 * Janitor Service — singleton that owns the janitor worker lifetime.
 * Main-thread orchestrator: sends work to janitorWorker, receives results,
 * and writes updates via db.ts exported functions (Rule 2: no direct Dexie here).
 */

import { db } from '$lib/db';
import { rebuildEdgesForThought, updateThought } from '$lib/db';
import { eventBus } from '$lib/eventBus';
import { uiStore } from '$lib/stores/uiStore.svelte';
import { FEATURE_CONFIG } from '$lib/config';
// ── Types ────────────────────────────────────────────────────────────────────

interface ThoughtData {
  id: string;
  content: string;
}

// ── Worker singleton ─────────────────────────────────────────────────────────

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('../workers/janitorWorker.ts', import.meta.url),
      { type: 'module' },
    );
  }
  return worker;
}

// ── propagateRename ──────────────────────────────────────────────────────────

/**
 * Rename all [[OldTitle]] → [[NewTitle]] occurrences across the active library.
 * Batched through janitorWorker (pure computation, no Dexie in worker).
 * Returns the total number of thoughts updated.
 */
export async function propagateRename(
  oldTitle: string,
  newTitle: string,
): Promise<number> {
  const libraryId = uiStore.activeLibraryId;
  if (!libraryId || !oldTitle || !newTitle || oldTitle === newTitle) return 0;

  // Fetch all non-deleted thoughts in this library
  const thoughts = await db.thoughts
    .where('library_id')
    .equals(libraryId)
    .filter((t) => !t.is_deleted)
    .toArray();

  const thoughtData: ThoughtData[] = thoughts.map((t) => ({
    id:      t.id,
    content: t.content,
  }));

  const w = getWorker();

  return new Promise<number>((resolve) => {
    let totalUpdated = 0;
    const updatedIds: string[] = [];

    w.addEventListener('message', async function handler(e: MessageEvent) {
      const msg = e.data;

      if (msg.type === 'renameResult') {
        // Write each updated thought to Dexie
        for (const update of msg.updates) {
          await updateThought(update.id, { content: update.content });
          updatedIds.push(update.id);
          totalUpdated++;
        }

        // Final batch — rebuild edges for all updated thoughts
        if (msg.batchIndex === msg.totalBatches - 1) {
          w.removeEventListener('message', handler);

          // Rebuild edges for each thought whose content changed (Rule 12: blur/unmount)
          // Called from the janitor (rename = content change) — not a keypress
          for (const id of updatedIds) {
            const updated = await db.thoughts.get(id);
            if (!updated) continue;
            const links = extractWikilinks(updated.content);
            await rebuildEdgesForThought(id, links);
            eventBus.emit({ type: 'thought.updated', payload: { id } });
          }

          resolve(totalUpdated);
        }
      } else if (msg.type === 'unsupported') {
        w.removeEventListener('message', handler);
        resolve(0);
      }
    });

    w.postMessage({
      type:      'renameLinks',
      oldTitle,
      newTitle,
      thoughts:  thoughtData,
      batchSize: FEATURE_CONFIG.JANITOR_BATCH_SIZE,
    });
  });
}

// ── Wikilink extractor (mirrors linkParser.ts pattern) ───────────────────────

function extractWikilinks(content: string): string[] {
  const pattern = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;
  while ((match = pattern.exec(content)) !== null) {
    links.push(match[1].trim());
  }
  return links;
}
