<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { goto } from "$app/navigation";
	import { uiStore } from "$lib/stores/uiStore.svelte";
	import {
		getThoughtsByLibrary,
		getEdgesByLibrary,
		updateThought,
		getThought,
		type Thought,
		type Edge,
	} from "$lib/db";
	import { eventBus } from "$lib/eventBus";
	import {
		PIPELINE_STATES,
		GRAPH_CONFIG,
		ANIMATION_CONFIG,
		FEATURE_CONFIG,
	} from "$lib/config";
	import { drawNode } from "./GraphNode";
	import { drawEdge } from "./GraphEdge";
	import { getUserSettings } from "$lib/db";
	import NodeContextMenu from "./NodeContextMenu.svelte";
	import CanvasContextMenu from "./CanvasContextMenu.svelte";

	// ── Props ─────────────────────────────────────────────────────────────────

	interface Props {
		libraryId: string;
		activeThoughtId: string | null;
		renderedCount?: number;
		stageFilter?: number | null;
	}
	let { libraryId, activeThoughtId, renderedCount = $bindable(0), stageFilter = null }: Props = $props();

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
	let hasCentered = false;

	// Drag state
	let dragNodeId: string | null = null;
	let isPanning = false;
	let panStartX = 0;
	let panStartY = 0;
	let camStartX = 0;
	let camStartY = 0;

	// Hover state
	let hoveredNodeId = $state<string | null>(null);
	let neighborIds = $state(new Set<string>());

	// Focus fade lerp
	let focusOpacity: Map<string, number> = new Map();
	let fadeAnimId: number | null = null;

	// Node entrance animation — tracks when each node first appeared
	const nodeBirth: Map<string, number> = new Map();
	const NODE_ENTRANCE_DURATION = 400; // ms

	// Pinch state
	let lastPinchDist = 0;

	// Subscriptions
	let thoughtsSub: { unsubscribe(): void } | null = null;
	let edgesSub: { unsubscribe(): void } | null = null;
	let unsubCreated: (() => void) | null = null;
	let graphUnsubs: (() => void)[] = [];

	// RAF throttle for drag
	let dragRafPending = false;

	// Node context menu state
	let contextMenuOpen = $state(false);
	let contextMenuX = $state(0);
	let contextMenuY = $state(0);
	let contextNodeId = $state<string | null>(null);
	let contextNodeTitle = $state("");
	let contextNodeStage = $state(1);
	let contextNodePinned = $state(false);

	// Canvas context menu state
	let canvasMenuOpen = $state(false);
	let canvasMenuX = $state(0);
	let canvasMenuY = $state(0);
	let canvasMenuSimX = $state(0);
	let canvasMenuSimY = $state(0);

	// Hull data from worker
	let hullData: Record<number, [number, number][]> = {};

	// Ghost node metadata from worker
	let ghostMap: Record<string, { title: string; isGhost: boolean }> = {};
	let ghostOpacityFromWorker = FEATURE_CONFIG.GHOST_NODE_OPACITY;

	// Resolved ghost colour (muted, from CSS var — resolved on main thread)
	let ghostColour = "";

	// ── Colour lookup ────────────────────────────────────────────────────────

	const PIPELINE_COLOUR: Record<number, string> = {};
	for (const s of PIPELINE_STATES) {
		PIPELINE_COLOUR[s.id] = s.colour;
	}

	// Resolved CSS colours for hull rendering (FIX-18/FIX-24: read on main thread)
	const HULL_COLOUR: Record<number, string> = {};

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
				if (
					frontier.has(edge.source_id) &&
					!visited.has(edge.target_id)
				) {
					next.add(edge.target_id);
				}
				if (
					frontier.has(edge.target_id) &&
					!visited.has(edge.source_id)
				) {
					next.add(edge.source_id);
				}
			}
			for (const id of next) visited.add(id);
			frontier = next;
			if (frontier.size === 0) break;
		}
		return visited;
	}

	// ── Geometry Helpers ───────────────────────────────────────────────────

	function crossProduct(
		a: { x: number; y: number },
		b: { x: number; y: number },
		o: { x: number; y: number },
	) {
		return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
	}

	function fitToView(padding = 80) {
		if (!posBuffer || !canvasEl) return;
		const ids = Object.keys(nodeIndex);
		if (ids.length === 0) return;

		let minX = Infinity,
			maxX = -Infinity;
		let minY = Infinity,
			maxY = -Infinity;

		for (const id of ids) {
			const idx = nodeIndex[id];
			const x = posBuffer[idx * 2];
			const y = posBuffer[idx * 2 + 1];
			minX = Math.min(minX, x);
			maxX = Math.max(maxX, x);
			minY = Math.min(minY, y);
			maxY = Math.max(maxY, y);
		}

		if (minX === Infinity) return;

		const graphW = maxX - minX;
		const graphH = maxY - minY;
		const dpr = window.devicePixelRatio || 1;
		const viewW = canvasEl.width / dpr;
		const viewH = canvasEl.height / dpr;

		if (graphW === 0 && graphH === 0) {
			camX = minX;
			camY = minY;
			zoom = 1.2;
		} else {
			const scaleX = (viewW - padding * 2) / Math.max(1, graphW);
			const scaleY = (viewH - padding * 2) / Math.max(1, graphH);
			zoom = Math.min(1.5, Math.max(0.3, Math.min(scaleX, scaleY)));
			camX = minX + graphW / 2;
			camY = minY + graphH / 2;
		}
		draw();
	}

	function centerOnNode(id: string) {
		const idx = nodeIndex[id];
		if (idx === undefined || !posBuffer) return;
		camX = posBuffer[idx * 2];
		camY = posBuffer[idx * 2 + 1];
		zoom = Math.max(zoom, 1.0);
		draw();
	}

	function getConvexHull(points: { x: number; y: number }[]) {
		if (points.length <= 2) return points;
		const sorted = [...points].sort((a, b) =>
			a.x !== b.x ? a.x - b.x : a.y - b.y,
		);

		const upper: { x: number; y: number }[] = [];
		for (const p of sorted) {
			while (
				upper.length >= 2 &&
				crossProduct(
					upper[upper.length - 2],
					upper[upper.length - 1],
					p,
				) <= 0
			) {
				upper.pop();
			}
			upper.push(p);
		}

		const lower: { x: number; y: number }[] = [];
		for (let i = sorted.length - 1; i >= 0; i--) {
			const p = sorted[i];
			while (
				lower.length >= 2 &&
				crossProduct(
					lower[lower.length - 2],
					lower[lower.length - 1],
					p,
				) <= 0
			) {
				lower.pop();
			}
			lower.push(p);
		}

		upper.pop();
		lower.pop();
		return upper.concat(lower);
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
			const cx = hull.reduce((s: number, p: [number, number]) => s + p[0], 0) / hull.length;
			const cy = hull.reduce((s: number, p: [number, number]) => s + p[1], 0) / hull.length;
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

		// Stage filter: when an orb is selected, show only that meta_state
		if (stageFilter !== null && stageFilter !== undefined) {
			nodes = nodes.filter((t) => t.meta_state === stageFilter);
		}

		const nodeIds = new Set(nodes.map((n) => n.id));
		const edges = allEdges.filter(
			(e) => nodeIds.has(e.source_id) && nodeIds.has(e.target_id),
		);

		if (!uiStore.graphShowOrphans) {
			const connectedIds = new Set<string>();
			for (const edge of edges) {
				connectedIds.add(edge.source_id);
				connectedIds.add(edge.target_id);
			}
			nodes = nodes.filter((n) => connectedIds.has(n.id));
		}

		return { nodes, edges };
	}

	// ── Send to worker ───────────────────────────────────────────────────────

	function sendSimulate() {
		if (!worker) return;
		const { nodes, edges } = getFilteredData();
		
		if (renderedCount !== nodes.length) renderedCount = nodes.length;

		worker.postMessage({
			type: "simulate",
			nodes: nodes.map((t) => ({
				id: t.id,
				title: t.title,
				content: t.content,
				x: t.x_pos || undefined,
				y: t.y_pos || undefined,
				meta_state: t.meta_state,
			})),
			edges: edges.map((e) => ({
				source: e.source_id,
				target: e.target_id,
			})),
			ghostOpacity: FEATURE_CONFIG.GHOST_NODE_OPACITY,
		});
	}

	// ── Drawing ──────────────────────────────────────────────────────────────

	function getThoughtById(id: string): Thought | undefined {
		return allThoughts.find((t) => t.id === id);
	}

	function worldToScreen(wx: number, wy: number): [number, number] {
		if (!canvasEl) return [0, 0];
		const dpr = window.devicePixelRatio || 1;
		const cx = canvasEl.width / dpr / 2;
		const cy = canvasEl.height / dpr / 2;
		return [(wx - camX) * zoom + cx, (wy - camY) * zoom + cy];
	}

	function screenToWorld(sx: number, sy: number): [number, number] {
		if (!canvasEl) return [0, 0];
		const dpr = window.devicePixelRatio || 1;
		const cx = canvasEl.width / dpr / 2;
		const cy = canvasEl.height / dpr / 2;
		return [(sx - cx) / zoom + camX, (sy - cy) / zoom + camY];
	}

	function getNodeOpacity(id: string): number {
		const base =
			focusOpacity.get(id) ??
			(activeThoughtId
				? uiStore.graphDimStrength
				: GRAPH_CONFIG.nodeFocusOpacity);

		// Entrance animation: fade in from 0 over NODE_ENTRANCE_DURATION ms
		const birth = nodeBirth.get(id);
		if (birth !== undefined) {
			const age = performance.now() - birth;
			if (age < NODE_ENTRANCE_DURATION) {
				const t = age / NODE_ENTRANCE_DURATION;
				// Ease-out cubic
				const eased = 1 - Math.pow(1 - t, 3);
				return base * eased;
			}
		}
		return base;
	}

	function getEdgeOpacity(srcId: string, tgtId: string): number {
		// Constellation effect: If a node is hovered, its edges are high opacity
		if (hoveredNodeId) {
			if (srcId === hoveredNodeId || tgtId === hoveredNodeId) return 0.8;
			return 0.05; // Dim others significantly
		}

		if (!activeThoughtId) return GRAPH_CONFIG.edgeFocusOpacity;
		const dimStrength = uiStore.graphDimStrength;
		const srcOp = focusOpacity.get(srcId) ?? dimStrength;
		const tgtOp = focusOpacity.get(tgtId) ?? dimStrength;
		const connected =
			srcOp > dimStrength + 0.01 && tgtOp > dimStrength + 0.01;
		return connected
			? GRAPH_CONFIG.edgeFocusOpacity
			: GRAPH_CONFIG.edgeUnfocusedOpacity;
	}

	function draw() {
		if (!ctx || !canvasEl || !posBuffer) return;
		const w = canvasEl.width;
		const h = canvasEl.height;

		ctx.clearRect(0, 0, w, h);

		drawHulls();

		const { edges } = getFilteredData();

		// Draw edges
		for (const edge of edges) {
			const si = nodeIndex[edge.source_id];
			const ti = nodeIndex[edge.target_id];
			if (si === undefined || ti === undefined) continue;

			const [sx, sy] = worldToScreen(
				posBuffer[si * 2],
				posBuffer[si * 2 + 1],
			);
			const [tx, ty] = worldToScreen(
				posBuffer[ti * 2],
				posBuffer[ti * 2 + 1],
			);

			// Performance: Cull edges entirely outside the viewport
			const pad = 100;
			if (
				(sx < -pad && tx < -pad) ||
				(sx > w + pad && tx > w + pad) ||
				(sy < -pad && ty < -pad) ||
				(sy > h + pad && ty > h + pad)
			) {
				continue;
			}

			const edgeBaseColour = `rgba(255,255,255,${uiStore.graphEdgeOpacity})`;
			let colour = edgeBaseColour;
			let opacity = getEdgeOpacity(edge.source_id, edge.target_id);

			// Connected edges use active node colour in focus mode
			if (
				activeThoughtId &&
				opacity > GRAPH_CONFIG.edgeUnfocusedOpacity + 0.001
			) {
				const activeT = getThoughtById(activeThoughtId);
				if (activeT)
					colour =
						PIPELINE_COLOUR[activeT.meta_state] ?? edgeBaseColour;
			}

			drawEdge(ctx, sx, sy, tx, ty, colour, opacity);
		}

		// Pre-compute edge counts per node for hub sizing
		const edgeCountMap = new Map<string, number>();
		for (const edge of edges) {
			edgeCountMap.set(
				edge.source_id,
				(edgeCountMap.get(edge.source_id) ?? 0) + 1,
			);
			edgeCountMap.set(
				edge.target_id,
				(edgeCountMap.get(edge.target_id) ?? 0) + 1,
			);
		}

		// Draw nodes (real and ghost)
		for (const [id, idx] of Object.entries(nodeIndex)) {
			const [sx, sy] = worldToScreen(
				posBuffer[idx * 2],
				posBuffer[idx * 2 + 1],
			);

			// Performance: Cull nodes entirely outside the viewport
			const pad = 100;
			if (sx < -pad || sx > w + pad || sy < -pad || sy > h + pad) {
				continue;
			}

			if (ghostMap[id]) {
				const ghost = ghostMap[id];
				ctx.save();
				ctx.globalAlpha = ghostOpacityFromWorker;
				drawNode(
					ctx,
					sx,
					sy,
					uiStore.graphNodeSize,
					ghostColour,
					false,
					ghost.title,
					zoom,
					uiStore.graphShowLabels,
					true,
					0,
					false,
				);
				ctx.restore();
			} else {
				const t = getThoughtById(id);
				if (!t) continue;

				const colour =
					PIPELINE_COLOUR[t.meta_state] ?? PIPELINE_COLOUR[1];
				const isActive = id === activeThoughtId;
				let opacity = getNodeOpacity(id);
				const edgeCount = edgeCountMap.get(id) ?? 0;

				// Constellation: Dim non-neighbors when someone is hovered
				if (
					hoveredNodeId &&
					id !== hoveredNodeId &&
					!neighborIds.has(id)
				) {
					opacity *= 0.2;
				}

				// Semantic Zoom: Hide labels if zoomed out too far
				const showLabels = uiStore.graphShowLabels && zoom > 0.45;

				ctx.save();
				ctx.globalAlpha = opacity;
				// Draw node dots but slightly smaller (4px) to satisfy "minimal" look while allowing visibility
				drawNode(
					ctx,
					sx,
					sy,
					uiStore.graphNodeSize,
					colour,
					isActive,
					t.title,
					zoom,
					showLabels,
					false,
					edgeCount,
					false,
				);
				ctx.restore();
			}
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
				uiStore.graphNeighbourhoodDepth,
			);
			for (const t of allThoughts) {
				targets.set(
					t.id,
					hood.has(t.id)
						? GRAPH_CONFIG.nodeFocusOpacity
						: uiStore.graphDimStrength,
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
		ctx = canvasEl.getContext("2d");
		if (ctx) ctx.scale(dpr, dpr);
		draw();
	}

	// ── Hit testing ──────────────────────────────────────────────────────────

	function hitTestNode(sx: number, sy: number): string | null {
		if (!posBuffer) return null;
		const hitRadius = (uiStore.graphNodeSize + 8) / zoom; // generous hit area

		for (const [id, idx] of Object.entries(nodeIndex)) {
			const wx = posBuffer[idx * 2];
			const wy = posBuffer[idx * 2 + 1];
			const [nx, ny] = worldToScreen(wx, wy);
			const dx = sx - nx;
			const dy = sy - ny;
			if (dx * dx + dy * dy < hitRadius * hitRadius * zoom * zoom)
				return id;
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
				worker?.postMessage({
					type: "drag",
					id: dragNodeId,
					fx: wx,
					fy: wy,
				});
			});
		} else if (isPanning) {
			const dx = (px - panStartX) / zoom;
			const dy = (py - panStartY) / zoom;
			camX = camStartX - dx;
			camY = camStartY - dy;
			draw();
		} else {
			// Hover test
			const hit = hitTestNode(px, py);
			if (hit !== hoveredNodeId) {
				hoveredNodeId = hit;
				if (hit) {
					neighborIds = getNeighbourhood(
						hit,
						allThoughts,
						allEdges,
						1,
					);
				} else {
					neighborIds = new Set();
				}
				draw();
			}
		}
	}

	async function handlePointerUp(e: PointerEvent) {
		if (!canvasEl) return;
		canvasEl.releasePointerCapture(e.pointerId);

		if (dragNodeId) {
			// If ghost node — solidify it into a real Inbox thought on click
			if (ghostMap[dragNodeId]) {
				const [px, py] = getPointerPos(e);
				const hit = hitTestNode(px, py);
				if (hit === dragNodeId) {
					const ghostTitle = ghostMap[dragNodeId].title;
					// Solidify: create a real thought from the ghost
					const { createThought } = await import('$lib/db');
					await createThought(libraryId, ghostTitle);
					// Ghost will disappear on next data refresh via eventBus
				}
				worker?.postMessage({ type: "dragEnd", id: dragNodeId });
				dragNodeId = null;
				isPanning = false;
				return;
			}

			// Save position to Dexie ONLY on dragEnd
			const idx = nodeIndex[dragNodeId];
			if (posBuffer && idx !== undefined) {
				const x = posBuffer[idx * 2];
				const y = posBuffer[idx * 2 + 1];
				await updateThought(dragNodeId, { x_pos: x, y_pos: y });
			}
			worker?.postMessage({ type: "dragEnd", id: dragNodeId });

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
			// No node hit — show canvas context menu
			contextMenuOpen = false;
			const [simX, simY] = screenToWorld(px, py);
			canvasMenuSimX = simX;
			canvasMenuSimY = simY;
			canvasMenuX = e.clientX;
			canvasMenuY = e.clientY;
			canvasMenuOpen = true;
			return;
		}

		// Ghost node right-click — treat same as empty canvas for "Create Thought Here"
		if (ghostMap[nodeId]) {
			contextMenuOpen = false;
			const [simX, simY] = screenToWorld(px, py);
			canvasMenuSimX = simX;
			canvasMenuSimY = simY;
			canvasMenuX = e.clientX;
			canvasMenuY = e.clientY;
			canvasMenuOpen = true;
			return;
		}

		const thought = getThoughtById(nodeId);
		if (!thought) return;

		// Check if pinned
		const settings = await getUserSettings();
		const pinnedIds = new Set<string>(settings?.pinned_thought_ids ?? []);

		contextNodeId = nodeId;
		contextNodeTitle = thought.title;
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

	function closeCanvasMenu() {
		canvasMenuOpen = false;
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
		if (e.data?.type === "positions") {
			posBuffer = e.data.buffer;
			const oldIndex = { ...nodeIndex };
			nodeIndex = e.data.nodeIndex;
			hullData = e.data.hulls ?? {};
			ghostMap = e.data.ghostMap ?? {};
			ghostOpacityFromWorker =
				e.data.ghostOpacity ?? FEATURE_CONFIG.GHOST_NODE_OPACITY;

			// Track birth time for newly appeared nodes
			const now = performance.now();
			for (const id of Object.keys(nodeIndex)) {
				if (!(id in oldIndex) && !nodeBirth.has(id)) {
					nodeBirth.set(id, now);
				}
			}

			// Auto-center on first data load
			if (!hasCentered && Object.keys(nodeIndex).length > 0) {
				hasCentered = true;
				if (activeThoughtId) {
					// Wait a tiny bit for the worker to settle initial positions
					setTimeout(
						() => centerOnNode(activeThoughtId as string),
						50,
					);
				} else {
					setTimeout(() => fitToView(), 50);
				}
			}

			draw();
		}
	}

	// ── React to display setting changes — redraw canvas ─────────────────────

	$effect(() => {
		// Subscribe to all display settings — any change triggers redraw
		void uiStore.graphNodeSize;
		void uiStore.graphEdgeOpacity;
		void uiStore.graphShowLabels;
		void uiStore.graphShowHulls;
		void uiStore.graphDimStrength;
		draw();
	});

	// ── React to physics setting changes — update worker forces ──────────────

	$effect(() => {
		const { graphRepulsion, graphLinkDistance, graphSettleSpeed } = uiStore;
		worker?.postMessage({
			type: "updateForces",
			repulsion: graphRepulsion,
			linkDistance: graphLinkDistance,
			settleSpeed: graphSettleSpeed,
		});
	});

	// ── React to activeThoughtId and orphan visibility changes ─────────────────────────────────────

	let prevActiveId: string | null = null;
    let prevShowOrphans: boolean | null = null;

	$effect(() => {
		if (activeThoughtId !== prevActiveId) {
			prevActiveId = activeThoughtId;
			startFocusFade();
			sendSimulate();
		}
	});

    $effect(() => {
        if (prevShowOrphans !== null && prevShowOrphans !== uiStore.graphShowOrphans) {
            sendSimulate();
        }
        prevShowOrphans = uiStore.graphShowOrphans;
    });

	// ── React to stage focus (Semantic Gravity) ──────────────────────────────

	let prevStageId: number | null = null;

	$effect(() => {
		const stageId = uiStore.focusedStageId;
		if (stageId === prevStageId) return;
		prevStageId = stageId;
		if (!worker) return;
		if (stageId !== null) {
			worker.postMessage({ type: "focusStage", stageId });
		} else {
			worker.postMessage({ type: "clearFocusStage" });
		}
	});

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	onMount(() => {
		if (!canvasEl) return;
		ctx = canvasEl.getContext("2d");
		resizeCanvas();

		// Resolve CSS variables for hull and ghost colours (main thread only)
		const styles = getComputedStyle(document.body);
		for (const s of PIPELINE_STATES) {
			HULL_COLOUR[s.id] = styles.getPropertyValue(s.cssVar).trim();
		}
		// Ghost nodes use the muted text colour (no fill, stroke only)
		ghostColour =
			styles.getPropertyValue("--text-muted").trim() || "#475569";

		// Worker
		worker = new Worker(
			new URL("../../workers/graphWorker.ts", import.meta.url),
			{ type: "module" },
		);
		worker.addEventListener("message", handleWorkerMessage);

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
		unsubCreated = eventBus.on("thought.created", async (event) => {
			if (event.type !== "thought.created") return;
			const t = await getThought(event.payload.id);
			if (!t || t.library_id !== libraryId) return;

			worker?.postMessage({
				type: "addNode",
				node: {
					id: t.id,
					title: t.title,
					x: t.x_pos || undefined,
					y: t.y_pos || undefined,
					meta_state: t.meta_state,
				},
			});
		});

		// Listen for canvas graph events (from CanvasContextMenu)
		graphUnsubs.push(
			eventBus.on("graph.resetViewport", () => {
				camX = 0;
				camY = 0;
				zoom = 1;
				draw();
			}),
			eventBus.on("graph.settleGraph", () => {
				worker?.postMessage({ type: "settle" });
			}),
		);

		// Event listeners
		canvasEl.addEventListener("wheel", handleWheel, { passive: false });
		canvasEl.addEventListener("touchstart", handleTouchStart, {
			passive: true,
		});
		canvasEl.addEventListener("touchmove", handleTouchMove, {
			passive: false,
		});
		canvasEl.addEventListener("touchend", handleTouchEnd, {
			passive: true,
		});

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
		for (const unsub of graphUnsubs) unsub();
		canvasEl?.removeEventListener("wheel", handleWheel);
		canvasEl?.removeEventListener("touchstart", handleTouchStart);
		canvasEl?.removeEventListener("touchmove", handleTouchMove);
		canvasEl?.removeEventListener("touchend", handleTouchEnd);
	});
</script>

<canvas
	class="graph-canvas"
	bind:this={canvasEl}
	style:background-position="{-camX * 0.5}px {-camY * 0.5}px"
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	oncontextmenu={handleContextMenu}
></canvas>

{#if contextMenuOpen && contextNodeId}
	<NodeContextMenu
		thoughtId={contextNodeId}
		thoughtTitle={contextNodeTitle}
		currentStage={contextNodeStage}
		isPinned={contextNodePinned}
		x={contextMenuX}
		y={contextMenuY}
		onclose={closeContextMenu}
	/>
{/if}

{#if canvasMenuOpen}
	<CanvasContextMenu
		x={canvasMenuX}
		y={canvasMenuY}
		simX={canvasMenuSimX}
		simY={canvasMenuSimY}
		onClose={closeCanvasMenu}
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
