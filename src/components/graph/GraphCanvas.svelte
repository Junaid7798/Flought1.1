<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { uiStore } from '$lib/stores/uiStore.svelte';
	import {
		getThoughtsByLibrary,
		getEdgesByLibrary,
		updateThought,
		getThought,
		type Thought,
		type Edge,
	} from '$lib/db';
	import { eventBus } from '$lib/eventBus';
	import { PIPELINE_STATES, GRAPH_CONFIG, ANIMATION_CONFIG } from '$lib/config';
	import { drawNode } from './GraphNode';
	import { drawEdge } from './GraphEdge';
	import { getUserSettings } from '$lib/db';
	import NodeContextMenu from './NodeContextMenu.svelte';

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		libraryId: string;
		activeThoughtId: string | null;
	}
	let { libraryId, activeThoughtId }: Props = $props();

	// ── State ─────────────────────────────────────────────────────────────────

	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let ctx: CanvasRenderingContext2D | null = null;
	let worker: Worker | null = null;

	let allThoughts: Thought[] = [];
	let allEdges: Edge[] = [];

	// Position buffer from worker
	let posBuffer: Float32Array | null = null;
	let nodeIndex: Record<string, number> = {};

	// Camera transform
	let camX = $state(0);
	let camY = $state(0);
	let zoom = $state(1);

	// Drag state
	let dragNodeId: string | null = null;
	let isPanning = false;
	let panStartX = 0;
	let panStartY = 0;
	let camStartX = 0;
	let camStartY = 0;

	// Focus fade lerp
	let focusOpacity: Map<string, number> = new Map();
	let fadeAnimId: number | null = null;

	// Pinch state
	let lastPinchDist = 0;

	// Subscriptions
	let thoughtsSub: { unsubscribe(): void } | null = null;
	let edgesSub: { unsubscribe(): void } | null = null;
	let unsubCreated: (() => void) | null = null;

	// RAF throttle for drag
	let dragRafPending = false;

	// Context menu state
	let contextMenuOpen = $state(false);
	let contextMenuX = $state(0);
	let contextMenuY = $state(0);
	let contextNodeId = $state<string | null>(null);
	let contextNodeStage = $state(1);
	let contextNodePinned = $state(false);

	// Hull data from worker
	let hullData: Record<number, [number, number][]> = {};

	// ── Colour lookup ────────────────────────────────────────────────────────

	const PIPELINE_COLOUR: Record<number, string> = {};
	for (const s of PIPELINE_STATES) {
		PIPELINE_COLOUR[s.id] = s.colour;
	}

	// Resolved CSS colours for hull rendering (FIX-18/FIX-24: read on main thread)
	const HULL_COLOUR: Record<number, string> = {};
	const EDGE_COLOUR = 'rgba(255,255,255,0.15)';

	const NODE_RADIUS = 6;

	// ── Neighbourhood filter ─────────────────────────────────────────────────

	function getNeighbourhood(
		centerId: string,
		thoughts: Thought[],
		edges: Edge[],
		depth: number,
	): Set<string> {
		const visited = new Set<string>([centerId]);
		let frontier = new Set<string>([centerId]);

		for (let d = 0; d < depth; d++) {
			const next = new Set<string>();
			for (const edge of edges) {
				if (frontier.has(edge.source_id) && !visited.has(edge.target_id)) {
					next.add(edge.target_id);
				}
				if (frontier.has(edge.target_id) && !visited.has(edge.source_id)) {
					next.add(edge.source_id);
				}
			}
			for (const id of next) visited.add(id);
			frontier = next;
			if (frontier.size === 0) break;
		}
		return visited;
	}

	function getFilteredData(): { nodes: Thought[]; edges: Edge[] } {
		let nodes: Thought[];

		if (activeThoughtId) {
			const hood = getNeighbourhood(
				activeThoughtId,
				allThoughts,
				allEdges,
				GRAPH_CONFIG.neighbourhoodDepth,
			);
			nodes = allThoughts.filter((t) => hood.has(t.id));
		} else {
			nodes = [...allThoughts]
				.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
				.slice(0, GRAPH_CONFIG.maxViewportNodes);
		}

		const nodeIds = new Set(nodes.map((n) => n.id));
		const edges = allEdges.filter(
			(e) => nodeIds.has(e.source_id) && nodeIds.has(e.target_id),
		);

		return { nodes, edges };
	}

	// ── Send to worker ───────────────────────────────────────────────────────

	function sendSimulate() {
		if (!worker) return;
		const { nodes, edges } = getFilteredData();

		worker.postMessage({
			type: 'simulate',
			nodes: nodes.map((t) => ({
				id: t.id,
				x: t.x_pos || undefined,
				y: t.y_pos || undefined,
				meta_state: t.meta_state,
			})),
			edges: edges.map((e) => ({
				source: e.source_id,
				target: e.target_id,
			})),
		});
	}

	// ── Drawing ──────────────────────────────────────────────────────────────

	function getThoughtById(id: string): Thought | undefined {
		return allThoughts.find((t) => t.id === id);
	}

	function worldToScreen(wx: number, wy: number): [number, number] {
		const cx = (canvasEl?.width ?? 0) / 2;
		const cy = (canvasEl?.height ?? 0) / 2;
		return [(wx - camX) * zoom + cx, (wy - camY) * zoom + cy];
	}

	function screenToWorld(sx: number, sy: number): [number, number] {
		const cx = (canvasEl?.width ?? 0) / 2;
		const cy = (canvasEl?.height ?? 0) / 2;
		return [(sx - cx) / zoom + camX, (sy - cy) / zoom + camY];
	}

	function getNodeOpacity(id: string): number {
		return focusOpacity.get(id) ?? (activeThoughtId ? GRAPH_CONFIG.nodeUnfocusedOpacity : GRAPH_CONFIG.nodeFocusOpacity);
	}

	function getEdgeOpacity(srcId: string, tgtId: string): number {
		if (!activeThoughtId) return GRAPH_CONFIG.edgeFocusOpacity;
		const srcOp = focusOpacity.get(srcId) ?? GRAPH_CONFIG.nodeUnfocusedOpacity;
		const tgtOp = focusOpacity.get(tgtId) ?? GRAPH_CONFIG.nodeUnfocusedOpacity;
		const connected =
			srcOp > GRAPH_CONFIG.nodeUnfocusedOpacity + 0.01 &&
			tgtOp > GRAPH_CONFIG.nodeUnfocusedOpacity + 0.01;
		return connected ? GRAPH_CONFIG.edgeFocusOpacity : GRAPH_CONFIG.edgeUnfocusedOpacity;
	}

	function drawHulls() {
		if (!ctx) return;
		for (const [stageId, hull] of Object.entries(hullData)) {
			const colour = HULL_COLOUR[Number(stageId)] ?? PIPELINE_COLOUR[Number(stageId)];
			if (!colour || hull.length < 3) continue;

			ctx.save();
			ctx.globalAlpha = 0.06;
			ctx.beginPath();

			// Draw hull with padding — expand each point outward from centroid
			const cx = hull.reduce((s, p) => s + p[0], 0) / hull.length;
			const cy = hull.reduce((s, p) => s + p[1], 0) / hull.length;
			const padding = 30;

			for (let i = 0; i < hull.length; i++) {
				const dx = hull[i][0] - cx;
				const dy = hull[i][1] - cy;
				const dist = Math.hypot(dx, dy) || 1;
				const px = hull[i][0] + (dx / dist) * padding;
				const py = hull[i][1] + (dy / dist) * padding;
				const [sx, sy] = worldToScreen(px, py);
				if (i === 0) ctx.moveTo(sx, sy);
				else ctx.lineTo(sx, sy);
			}

			ctx.closePath();
			ctx.fillStyle = colour;
			ctx.fill();
			ctx.restore();
		}
	}

	function draw() {
		if (!ctx || !canvasEl || !posBuffer) return;
		const w = canvasEl.width;
		const h = canvasEl.height;

		ctx.clearRect(0, 0, w, h);

		// Draw convex hull blobs underneath everything
		drawHulls();

		const { edges } = getFilteredData();

		// Draw edges
		for (const edge of edges) {
			const si = nodeIndex[edge.source_id];
			const ti = nodeIndex[edge.target_id];
			if (si === undefined || ti === undefined) continue;

			const [sx, sy] = worldToScreen(posBuffer[si * 2], posBuffer[si * 2 + 1]);
			const [tx, ty] = worldToScreen(posBuffer[ti * 2], posBuffer[ti * 2 + 1]);

			let colour = EDGE_COLOUR;
			let opacity = getEdgeOpacity(edge.source_id, edge.target_id);

			// Connected edges use active node colour in focus mode
			if (activeThoughtId && opacity > GRAPH_CONFIG.edgeUnfocusedOpacity + 0.001) {
				const activeT = getThoughtById(activeThoughtId);
				if (activeT) colour = PIPELINE_COLOUR[activeT.meta_state] ?? EDGE_COLOUR;
			}

			drawEdge(ctx, sx, sy, tx, ty, colour, opacity);
		}

		// Draw nodes
		for (const [id, idx] of Object.entries(nodeIndex)) {
			const t = getThoughtById(id);
			if (!t) continue;

			const [sx, sy] = worldToScreen(posBuffer[idx * 2], posBuffer[idx * 2 + 1]);
			const colour = PIPELINE_COLOUR[t.meta_state] ?? PIPELINE_COLOUR[1];
			const isActive = id === activeThoughtId;
			const opacity = getNodeOpacity(id);

			ctx.save();
			ctx.globalAlpha = opacity;
			drawNode(ctx, sx, sy, NODE_RADIUS, colour, isActive, t.title, zoom);
			ctx.restore();
		}
	}

	// ── Focus fade animation ─────────────────────────────────────────────────

	function computeFocusTargets(): Map<string, number> {
		const targets = new Map<string, number>();

		if (!activeThoughtId) {
			// No focus — all nodes full opacity
			for (const t of allThoughts) {
				targets.set(t.id, GRAPH_CONFIG.nodeFocusOpacity);
			}
		} else {
			const hood = getNeighbourhood(
				activeThoughtId,
				allThoughts,
				allEdges,
				GRAPH_CONFIG.neighbourhoodDepth,
			);
			for (const t of allThoughts) {
				targets.set(
					t.id,
					hood.has(t.id) ? GRAPH_CONFIG.nodeFocusOpacity : GRAPH_CONFIG.nodeUnfocusedOpacity,
				);
			}
		}
		return targets;
	}

	function startFocusFade() {
		if (fadeAnimId !== null) cancelAnimationFrame(fadeAnimId);

		const targets = computeFocusTargets();
		const duration = ANIMATION_CONFIG.focusFadeDuration;
		const startTime = performance.now();

		// Snapshot current opacities
		const startValues = new Map<string, number>();
		for (const [id, target] of targets) {
			startValues.set(id, focusOpacity.get(id) ?? target);
		}

		function tick(now: number) {
			const t = Math.min((now - startTime) / duration, 1);
			// Ease-out quadratic
			const ease = 1 - (1 - t) * (1 - t);

			for (const [id, target] of targets) {
				const start = startValues.get(id) ?? target;
				focusOpacity.set(id, start + (target - start) * ease);
			}

			draw();

			if (t < 1) {
				fadeAnimId = requestAnimationFrame(tick);
			} else {
				fadeAnimId = null;
			}
		}

		fadeAnimId = requestAnimationFrame(tick);
	}

	// ── Resize ───────────────────────────────────────────────────────────────

	function resizeCanvas() {
		if (!canvasEl) return;
		const dpr = window.devicePixelRatio || 1;
		const rect = canvasEl.getBoundingClientRect();
		canvasEl.width = rect.width * dpr;
		canvasEl.height = rect.height * dpr;
		ctx = canvasEl.getContext('2d');
		if (ctx) ctx.scale(dpr, dpr);
		draw();
	}

	// ── Hit testing ──────────────────────────────────────────────────────────

	function hitTestNode(sx: number, sy: number): string | null {
		if (!posBuffer) return null;
		const hitRadius = (NODE_RADIUS + 8) / zoom; // generous hit area

		for (const [id, idx] of Object.entries(nodeIndex)) {
			const wx = posBuffer[idx * 2];
			const wy = posBuffer[idx * 2 + 1];
			const [nx, ny] = worldToScreen(wx, wy);
			const dx = sx - nx;
			const dy = sy - ny;
			if (dx * dx + dy * dy < hitRadius * hitRadius * zoom * zoom) return id;
		}
		return null;
	}

	// ── Pointer events ───────────────────────────────────────────────────────

	function getPointerPos(e: PointerEvent): [number, number] {
		if (!canvasEl) return [0, 0];
		const rect = canvasEl.getBoundingClientRect();
		return [e.clientX - rect.left, e.clientY - rect.top];
	}

	function handlePointerDown(e: PointerEvent) {
		if (!canvasEl) return;
		const [px, py] = getPointerPos(e);

		const nodeId = hitTestNode(px, py);
		if (nodeId) {
			dragNodeId = nodeId;
			canvasEl.setPointerCapture(e.pointerId);
			e.preventDefault();
		} else {
			isPanning = true;
			panStartX = px;
			panStartY = py;
			camStartX = camX;
			camStartY = camY;
			canvasEl.setPointerCapture(e.pointerId);
		}
	}

	function handlePointerMove(e: PointerEvent) {
		if (!canvasEl) return;
		const [px, py] = getPointerPos(e);

		if (dragNodeId && worker) {
			if (dragRafPending) return;
			dragRafPending = true;

			const [wx, wy] = screenToWorld(px, py);
			requestAnimationFrame(() => {
				dragRafPending = false;
				worker?.postMessage({ type: 'drag', id: dragNodeId, fx: wx, fy: wy });
			});
		} else if (isPanning) {
			const dx = (px - panStartX) / zoom;
			const dy = (py - panStartY) / zoom;
			camX = camStartX - dx;
			camY = camStartY - dy;
			draw();
		}
	}

	async function handlePointerUp(e: PointerEvent) {
		if (!canvasEl) return;
		canvasEl.releasePointerCapture(e.pointerId);

		if (dragNodeId) {
			// Save position to Dexie ONLY on dragEnd
			const idx = nodeIndex[dragNodeId];
			if (posBuffer && idx !== undefined) {
				const x = posBuffer[idx * 2];
				const y = posBuffer[idx * 2 + 1];
				await updateThought(dragNodeId, { x_pos: x, y_pos: y });
			}
			worker?.postMessage({ type: 'dragEnd', id: dragNodeId });

			// If no significant movement, treat as click
			const [px, py] = getPointerPos(e);
			const hit = hitTestNode(px, py);
			if (hit === dragNodeId) {
				uiStore.focusedNodeId = dragNodeId;
				goto(`/thought/${dragNodeId}`);
			}

			dragNodeId = null;
		}

		isPanning = false;
	}

	// ── Context menu ─────────────────────────────────────────────────────────

	async function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		if (!canvasEl) return;
		const rect = canvasEl.getBoundingClientRect();
		const px = e.clientX - rect.left;
		const py = e.clientY - rect.top;
		const nodeId = hitTestNode(px, py);
		if (!nodeId) {
			contextMenuOpen = false;
			return;
		}

		const thought = getThoughtById(nodeId);
		if (!thought) return;

		// Check if pinned
		const settings = await getUserSettings();
		const pinnedIds = new Set<string>(settings?.pinned_thought_ids ?? []);

		contextNodeId = nodeId;
		contextNodeStage = thought.meta_state;
		contextNodePinned = pinnedIds.has(nodeId);
		contextMenuX = e.clientX;
		contextMenuY = e.clientY;
		contextMenuOpen = true;
	}

	function closeContextMenu() {
		contextMenuOpen = false;
		contextNodeId = null;
	}

	// ── Zoom ─────────────────────────────────────────────────────────────────

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const factor = e.deltaY > 0 ? 0.92 : 1.08;
		zoom = Math.max(0.1, Math.min(5, zoom * factor));
		draw();
	}

	// ── Pinch zoom ───────────────────────────────────────────────────────────

	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length === 2) {
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			lastPinchDist = Math.hypot(dx, dy);
		}
	}

	function handleTouchMove(e: TouchEvent) {
		if (e.touches.length === 2) {
			e.preventDefault();
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			const dist = Math.hypot(dx, dy);

			if (lastPinchDist > 0) {
				const factor = dist / lastPinchDist;
				zoom = Math.max(0.1, Math.min(5, zoom * factor));
				draw();
			}
			lastPinchDist = dist;
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (e.touches.length < 2) lastPinchDist = 0;
	}

	// ── Worker message ───────────────────────────────────────────────────────

	function handleWorkerMessage(e: MessageEvent) {
		if (e.data?.type === 'positions') {
			posBuffer = e.data.buffer;
			nodeIndex = e.data.nodeIndex;
			hullData = e.data.hulls ?? {};
			draw();
		}
	}

	// ── React to activeThoughtId changes ─────────────────────────────────────

	let prevActiveId: string | null = null;

	$effect(() => {
		if (activeThoughtId !== prevActiveId) {
			prevActiveId = activeThoughtId;
			startFocusFade();
			sendSimulate();
		}
	});

	// ── React to stage focus (Semantic Gravity) ──────────────────────────────

	let prevStageId: number | null = null;

	$effect(() => {
		const stageId = uiStore.focusedStageId;
		if (stageId === prevStageId) return;
		prevStageId = stageId;
		if (!worker) return;
		if (stageId !== null) {
			worker.postMessage({ type: 'focusStage', stageId });
		} else {
			worker.postMessage({ type: 'clearFocusStage' });
		}
	});

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	onMount(() => {
		if (!canvasEl) return;
		ctx = canvasEl.getContext('2d');
		resizeCanvas();

		// Resolve CSS variables for hull colours (FIX-18/FIX-24: main thread only)
		const styles = getComputedStyle(document.body);
		for (const s of PIPELINE_STATES) {
			HULL_COLOUR[s.id] = styles.getPropertyValue(s.cssVar).trim();
		}

		// Worker
		worker = new Worker(
			new URL('../../workers/graphWorker.ts', import.meta.url),
			{ type: 'module' },
		);
		worker.addEventListener('message', handleWorkerMessage);

		// Resize observer
		const ro = new ResizeObserver(() => resizeCanvas());
		ro.observe(canvasEl);

		// Subscribe to live data
		thoughtsSub = getThoughtsByLibrary(libraryId).subscribe((thoughts) => {
			allThoughts = thoughts;
			sendSimulate();
		});

		edgesSub = getEdgesByLibrary(libraryId).subscribe((edges) => {
			allEdges = edges;
			sendSimulate();
		});

		// Listen for new thoughts → addNode instead of full re-simulate
		unsubCreated = eventBus.on('thought.created', async (event) => {
			if (event.type !== 'thought.created') return;
			const t = await getThought(event.payload.id);
			if (!t || t.library_id !== libraryId) return;

			worker?.postMessage({
				type: 'addNode',
				node: {
					id: t.id,
					x: t.x_pos || undefined,
					y: t.y_pos || undefined,
					meta_state: t.meta_state,
				},
			});
		});

		// Event listeners
		canvasEl.addEventListener('wheel', handleWheel, { passive: false });
		canvasEl.addEventListener('touchstart', handleTouchStart, { passive: true });
		canvasEl.addEventListener('touchmove', handleTouchMove, { passive: false });
		canvasEl.addEventListener('touchend', handleTouchEnd, { passive: true });

		return () => {
			ro.disconnect();
		};
	});

	onDestroy(() => {
		if (fadeAnimId !== null) cancelAnimationFrame(fadeAnimId);
		worker?.terminate();
		worker = null;
		thoughtsSub?.unsubscribe();
		edgesSub?.unsubscribe();
		unsubCreated?.();
		canvasEl?.removeEventListener('wheel', handleWheel);
		canvasEl?.removeEventListener('touchstart', handleTouchStart);
		canvasEl?.removeEventListener('touchmove', handleTouchMove);
		canvasEl?.removeEventListener('touchend', handleTouchEnd);
	});
</script>

<canvas
	class="graph-canvas"
	bind:this={canvasEl}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	oncontextmenu={handleContextMenu}
></canvas>

{#if contextMenuOpen && contextNodeId}
	<NodeContextMenu
		thoughtId={contextNodeId}
		currentStage={contextNodeStage}
		isPinned={contextNodePinned}
		x={contextMenuX}
		y={contextMenuY}
		onclose={closeContextMenu}
	/>
{/if}

<style>
	.graph-canvas {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: none;
		background-color: var(--bg-deep);
		cursor: grab;
	}

	.graph-canvas:active {
		cursor: grabbing;
	}
</style>
