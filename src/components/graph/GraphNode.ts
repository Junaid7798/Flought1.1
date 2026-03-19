/**
 * Pure Canvas 2D draw function for a graph node.
 * No Svelte, no Dexie, no DOM — just ctx calls.
 */

const LABEL_FONT = '11px Geist, sans-serif';
const LABEL_OFFSET_Y = 6;
const ACTIVE_RING_RADIUS = 12;
const ACTIVE_RING_OPACITY = 0.4;
const LABEL_ZOOM_THRESHOLD = 0.8;

export function drawNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  colour: string,
  isActive: boolean,
  label: string,
  zoom: number,
  showLabels = true,
  isGhost = false,
): void {
  if (isGhost) {
    // ── Ghost node — dashed stroke-only circle, no fill ────────────────
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    // Ghost nodes skip label below zoom threshold
    return;
  }

  // ── Active ring ────────────────────────────────────────────────────────
  if (isActive) {
    ctx.save();
    ctx.globalAlpha = ACTIVE_RING_OPACITY;
    ctx.beginPath();
    ctx.arc(x, y, ACTIVE_RING_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // ── Node circle ────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = colour;
  ctx.fill();

  // ── Label ──────────────────────────────────────────────────────────────
  if (showLabels && zoom >= LABEL_ZOOM_THRESHOLD && label) {
    ctx.font = LABEL_FONT;
    ctx.fillStyle = colour;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, x, y + radius + LABEL_OFFSET_Y);
  }
}
