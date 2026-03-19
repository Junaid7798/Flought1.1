export type FloughtEvent =
  | { type: 'thought.created';      payload: { id: string } }
  | { type: 'thought.updated';      payload: { id: string } }
  | { type: 'thought.stage_changed'; payload: { id: string; meta_state: number } }
  | { type: 'edge.created';         payload: { id: string } }
  | { type: 'edge.updated';         payload: { id: string } }
  | { type: 'library.switched';     payload: { id: string } }
  | { type: 'sync.completed';       payload: { provider: string } }
  | { type: 'graph.resetViewport';  payload: Record<string, never> }
  | { type: 'graph.settleGraph';    payload: Record<string, never> };

type Listener = (event: FloughtEvent) => void;

function createEventBus() {
  const listeners = new Map<string, Set<Listener>>();

  function emit(event: FloughtEvent): void {
    const fns = listeners.get(event.type);
    if (fns) {
      for (const fn of fns) fn(event);
    }
  }

  function on(type: FloughtEvent['type'], fn: Listener): () => void {
    if (!listeners.has(type)) {
      listeners.set(type, new Set());
    }
    listeners.get(type)!.add(fn);
    return () => listeners.get(type)?.delete(fn);
  }

  return { emit, on };
}

export const eventBus = createEventBus();
