/**
 * PlasmaArc.tsx — v2
 *
 * Reliable Canvas 2D plasma / lightning arc between the two Gateway cards.
 * Uses a simple iterative midpoint-displacement (no recursion / no splice tricks).
 *
 * Each "bolt" is an array of points generated in one pass, then drawn with
 * a two-layer stroke: outer glow + bright white core.
 */

import { useEffect, useRef } from "react";

// ─── Palette ──────────────────────────────────────────────────────────────────
const DEV_HEX    = "#c2a4ff";   // purple  – developer side
const CREATE_HEX = "#f0a500";   // amber   – creative side
const MID_HEX    = "#e070c8";   // magenta – midpoint blend

// ─── Helpers ──────────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function lerpColor(a: string, b: string, t: number): string {
  const h = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [ar, ag, ab] = h(a);
  const [br, bg, bb] = h(b);
  return `rgb(${Math.round(lerp(ar, br, t))},${Math.round(lerp(ag, bg, t))},${Math.round(lerp(ab, bb, t))})`;
}

// Pick a colour from the dev→mid→creative gradient (t ∈ [0,1])
function arcColor(t: number): string {
  return t < 0.5
    ? lerpColor(DEV_HEX, MID_HEX, t * 2)
    : lerpColor(MID_HEX, CREATE_HEX, (t - 0.5) * 2);
}

// ─── Lightning generation ─────────────────────────────────────────────────────
interface Point { x: number; y: number; }

/**
 * Generate a jagged arc from (x1,y1) → (x2,y2) using iterative midpoint
 * displacement.  `roughness` controls how wide the zigzag spreads;
 * `segments` is the number of intermediate vertices.
 */
function generateArc(
  x1: number, y1: number,
  x2: number, y2: number,
  segments = 28,
  roughness = 0.45,
  horizontal = false,
): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= segments; i++) {
    const t    = i / segments;
    const base = horizontal
      ? { x: lerp(x1, x2, t), y: lerp(y1, y2, t) }
      : { x: lerp(x1, x2, t), y: lerp(y1, y2, t) };
    const maxSpread = Math.hypot(x2 - x1, y2 - y1) * roughness;
    // Middle points displaced; endpoints are fixed
    const spread = (i === 0 || i === segments) ? 0 : (Math.random() - 0.5) * maxSpread;
    pts.push(
      horizontal
        ? { x: base.x, y: base.y + spread }
        : { x: base.x + spread, y: base.y }
    );
  }
  return pts;
}

// ─── Drawing ──────────────────────────────────────────────────────────────────
interface Arc {
  pts:   Point[];
  color: string;
  width: number;   // logical px
  alpha: number;   // current opacity (fades per frame)
  forks: Arc[];
}

function drawArc(ctx: CanvasRenderingContext2D, arc: Arc) {
  if (arc.pts.length < 2 || arc.alpha < 0.02) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1, arc.alpha);
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";
  ctx.strokeStyle = arc.color;

  // Glow pass
  ctx.shadowColor = arc.color;
  ctx.shadowBlur  = arc.width * 8;
  ctx.lineWidth   = arc.width;
  ctx.beginPath();
  arc.pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke();

  // Core pass (bright white, thinner)
  ctx.shadowBlur  = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth   = arc.width * 0.28;
  ctx.globalAlpha = arc.alpha * 0.7;
  ctx.stroke();

  ctx.restore();
  arc.forks.forEach(f => drawArc(ctx, { ...f, alpha: f.alpha * arc.alpha * 0.6 }));
}

// ─── Strike factory ───────────────────────────────────────────────────────────
function createStrike(W: number, H: number, horizontal: boolean): Arc[] {
  const arcs: Arc[] = [];

  // 2-3 main bolts
  const count = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const t     = Math.random();         // colour position along gradient
    const color = arcColor(t);
    const width = 1.4 + Math.random() * 1.6;

    let x1: number, y1: number, x2: number, y2: number;
    if (horizontal) {
      // Arc runs left → right (mobile divider)
      x1 = 0;  y1 = H * 0.5 + (Math.random() - 0.5) * H * 0.4;
      x2 = W;  y2 = H * 0.5 + (Math.random() - 0.5) * H * 0.4;
    } else {
      // Arc runs top → bottom (desktop divider column)
      x1 = W * 0.5 + (Math.random() - 0.5) * W * 0.3;  y1 = 0;
      x2 = W * 0.5 + (Math.random() - 0.5) * W * 0.3;  y2 = H;
    }

    const pts = generateArc(x1, y1, x2, y2, 28, 0.55, horizontal);

    // Spawn 1-2 small fork branches off a random mid-point
    const forks: Arc[] = [];
    const forkCount = 1 + Math.floor(Math.random() * 2);
    for (let f = 0; f < forkCount; f++) {
      const midIdx = 6 + Math.floor(Math.random() * (pts.length - 12));
      const mid    = pts[midIdx];
      const fLen   = Math.hypot(x2 - x1, y2 - y1) * (0.12 + Math.random() * 0.18);
      const fAngle = Math.random() * Math.PI * 2;
      const fPts   = generateArc(
        mid.x, mid.y,
        mid.x + Math.cos(fAngle) * fLen,
        mid.y + Math.sin(fAngle) * fLen,
        12, 0.4, horizontal
      );
      forks.push({ pts: fPts, color, width: width * 0.4, alpha: 0.85, forks: [] });
    }

    arcs.push({ pts, color, width, alpha: 1.0, forks });
  }
  return arcs;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function PlasmaArc() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let W = 0, H = 0;
    let rafId = 0;
    let arcs: Arc[]  = [];
    let nextStrike   = 0;

    function resize() {
      const dpr  = Math.min(window.devicePixelRatio, 2);
      const rect = canvas!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      if (W === 0 || H === 0) return;
      canvas!.width  = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function tick(now: number) {
      rafId = requestAnimationFrame(tick);
      if (!W || !H) { resize(); return; }

      ctx.clearRect(0, 0, W, H);

      const horizontal = W > H;   // mobile: divider is wider than tall

      // Trigger new strike
      if (now >= nextStrike) {
        arcs = createStrike(W, H, horizontal);
        nextStrike = now + 550 + Math.random() * 750;
      }

      // Fade
      arcs.forEach(a => { a.alpha *= 0.86; });
      arcs = arcs.filter(a => a.alpha > 0.015);

      // Draw
      arcs.forEach(a => drawArc(ctx, a));

      // "OR" label — always visible in the centre
      ctx.save();
      ctx.font          = `700 10px "Geist", sans-serif`;
      ctx.textAlign     = "center";
      ctx.textBaseline  = "middle";
      ctx.shadowColor   = "#e070c8";
      ctx.shadowBlur    = 14;
      ctx.fillStyle     = "rgba(255,255,255,0.60)";
      ctx.fillText("OR", W / 2, H / 2);
      // Second pass: brighter core
      ctx.shadowBlur    = 0;
      ctx.fillStyle     = "rgba(255,255,255,0.30)";
      ctx.fillText("OR", W / 2, H / 2);
      ctx.restore();
    }

    // Initial size — retry in RAF if canvas not yet laid out
    resize();
    nextStrike = performance.now() + 80;
    rafId = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => { resize(); });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      "absolute",
        top:           0,
        left:          0,
        width:         "100%",
        height:        "100%",
        display:       "block",
        pointerEvents: "none",
        transform:     "translateZ(0)",
        willChange:    "contents",
      }}
    />
  );
}
