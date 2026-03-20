/**
 * Pure Canvas 2D draw function for a graph node.
 * No Svelte, no Dexie, no DOM — just ctx calls.
 */

const LABEL_FONT = "500 11px 'Inter', system-ui, sans-serif";
const LABEL_SHORT_FONT = "400 9px 'Inter', system-ui, sans-serif";
const LABEL_OFFSET_Y = 6;
const ACTIVE_RING_RADIUS = 12;
const ACTIVE_RING_OPACITY = 0.3;
const LABEL_ZOOM_THRESHOLD = 0.42;
const LABEL_SHORT_THRESHOLD = 0.22;
const LABEL_MAX_CHARS = 12;

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
  edgeCount = 0,
  hideCircle = false,
): void {
  // ── Hub scaling: nodes with more edges get slightly larger ────────────
  const hubBonus = edgeCount > 0 ? Math.log(edgeCount + 1) * 2.5 : 0;
  const effectiveRadius = radius + hubBonus;

  if (isGhost) {
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, effectiveRadius, 0, Math.PI * 2);
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    return;
  }

  // ── Active ring ────────────────────────────────────────────────────────
  if (isActive) {
    ctx.save();
    ctx.globalAlpha = ACTIVE_RING_OPACITY;
    ctx.beginPath();
    ctx.arc(x, y, ACTIVE_RING_RADIUS + hubBonus, 0, Math.PI * 2);
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // ── Node circle ────────────────────────────────────────────────────────
  if (!hideCircle) {
    ctx.beginPath();
    ctx.arc(x, y, effectiveRadius, 0, Math.PI * 2);
    ctx.fillStyle = colour;
    ctx.fill();
  }

  // ── Label ──────────────────────────────────────────────────────────────
  if (!showLabels || !label) return;

  if (zoom >= LABEL_ZOOM_THRESHOLD) {
    // Full label
    ctx.font = LABEL_FONT;
    ctx.fillStyle = 'rgba(240,244,255,0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, x, y + effectiveRadius + LABEL_OFFSET_Y);
  } else if (zoom >= LABEL_SHORT_THRESHOLD) {
    // Short label: truncate
    const short = label.length > LABEL_MAX_CHARS
      ? label.slice(0, LABEL_MAX_CHARS - 1) + '\u2026'
      : label;
    ctx.font = LABEL_SHORT_FONT;
    ctx.fillStyle = 'rgba(240,244,255,0.45)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(short, x, y + effectiveRadius + LABEL_OFFSET_Y);
  }
}
