/**
 * PaintCanvas — Canvas 2D paintbrush + paint stroke.
 *
 * Performance contract:
 *  • Canvas is ONLY redrawn when scroll position changes (no RAF loop).
 *  • All drawing is O(N) with N ≈ 38 segments — takes < 1ms per frame.
 *  • Motion blur via ctx.filter on brush only (not entire canvas).
 *  • Zero React re-renders during animation.
 */
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ── Constants ────────────────────────────────────────────────────────────────
// All in pixels at scale = 1.0  (brush oriented: handle LEFT, tip RIGHT)
const BL = 84;   // bristle length
const BW = 47;   // bristle max half-width
const FL = 23;   // ferrule length
const FW = 16;   // ferrule half-width
const HL = 192;  // handle length
const HW = 12;   // handle half-width
export const BRUSH_TOTAL = BL + FL + HL; // 299 px tip→handle-end

// ── Helpers ──────────────────────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Deterministic pseudo-random — same seed → same value every time. */
function rand(seed: number): number {
  const x = Math.sin(seed + 1.7) * 10000;
  return x - Math.floor(x);
}

/** Rounded rectangle path helper (replaces ctx.roundRect for Safari compat). */
function rr(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h,     x, y + h - r,     r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y,         x + r, y,         r);
  ctx.closePath();
}

// ── Draw Brush ───────────────────────────────────────────────────────────────
/**
 * Draws the full paintbrush.
 *  tipX/tipY = position of the bristle tip (rightmost point).
 *  Brush extends to the LEFT: bristles → ferrule → handle.
 *  angle = rotation in radians (+ve = clockwise).
 *  s = uniform scale multiplier.
 */
function drawBrush(
  ctx: CanvasRenderingContext2D,
  tipX: number,
  tipY: number,
  angle: number,
  s: number
) {
  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(angle);

  // Fast drop shadow — single ellipse fill, zero blur cost
  const totalLen = (BL + FL + HL) * s;
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(
    -totalLen * 0.50,   // center x (midpoint of brush length)
    10 * s,             // dropped down
    totalLen * 0.50,    // rx
    9 * s,              // ry
    0, 0, Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  // Main brush
  _brushBody(ctx, s, false);
  ctx.restore();
}

function _brushBody(ctx: CanvasRenderingContext2D, s: number, ghost: boolean) {
  const bl = BL * s, bw = BW * s;
  const fl = FL * s, fw = FW * s;
  const hl = HL * s, hw = HW * s;

  // ─ Handle (dark wood) ───────────────────────────────────────
  if (!ghost) {
    const wg = ctx.createLinearGradient(0, -hw, 0, hw);
    wg.addColorStop(0,    '#0a0603');
    wg.addColorStop(0.10, '#2c1408');
    wg.addColorStop(0.28, '#7a3c14');
    wg.addColorStop(0.50, '#9e4e1c');
    wg.addColorStop(0.72, '#6c2e0e');
    wg.addColorStop(0.90, '#281005');
    wg.addColorStop(1,    '#0a0603');
    ctx.fillStyle = wg;
  } else {
    ctx.fillStyle = '#000';
  }
  const hx0 = -(bl + fl + hl);
  const hx1 = -(bl + fl);
  ctx.beginPath();
  ctx.moveTo(hx1,           -hw);
  ctx.lineTo(hx0 + hl*0.05, -hw * 0.44);
  ctx.lineTo(hx0,            -hw * 0.20);
  ctx.lineTo(hx0,             hw * 0.20);
  ctx.lineTo(hx0 + hl*0.05,  hw * 0.44);
  ctx.lineTo(hx1,             hw);
  ctx.closePath();
  ctx.fill();

  if (!ghost) {
    // Wood grain
    for (let i = 0; i < 5; i++) {
      const gy = lerp(-hw * 0.38, hw * 0.38, i / 4);
      ctx.beginPath();
      ctx.moveTo(hx1 - 1, gy);
      ctx.lineTo(hx0 + hl * 0.05, gy * 0.82);
      ctx.strokeStyle = 'rgba(35,14,3,0.10)';
      ctx.lineWidth = 0.38 * s;
      ctx.stroke();
    }
    // Handle highlight (top chamfer illusion)
    const hh = ctx.createLinearGradient(0, -hw * 0.30, 0, -hw * 0.04);
    hh.addColorStop(0, 'rgba(180,105,38,0.22)');
    hh.addColorStop(1, 'rgba(180,105,38,0)');
    ctx.beginPath();
    ctx.moveTo(hx1, -hw * 0.30);
    ctx.lineTo(hx0 + hl * 0.08, -hw * 0.26);
    ctx.lineTo(hx0 + hl * 0.08, -hw * 0.06);
    ctx.lineTo(hx1, -hw * 0.06);
    ctx.closePath();
    ctx.fillStyle = hh;
    ctx.fill();
  }

  // ─ Ferrule (metallic) ───────────────────────────────────────
  if (!ghost) {
    const fg = ctx.createLinearGradient(0, -fw, 0, fw);
    fg.addColorStop(0,    '#111');
    fg.addColorStop(0.18, '#888');
    fg.addColorStop(0.40, '#eee');
    fg.addColorStop(0.50, '#fff');
    fg.addColorStop(0.62, '#bbb');
    fg.addColorStop(0.85, '#555');
    fg.addColorStop(1,    '#111');
    ctx.fillStyle = fg;
  } else {
    ctx.fillStyle = '#000';
  }
  rr(ctx, -(bl + fl), -fw, fl, fw * 2, 1.5 * s);
  ctx.fill();

  if (!ghost) {
    // Seam rings
    for (let i = 0; i < 3; i++) {
      const rx = -(bl + fl) + fl * (0.22 + i * 0.28);
      ctx.beginPath();
      ctx.moveTo(rx, -fw * 0.44);
      ctx.lineTo(rx,  fw * 0.44);
      ctx.strokeStyle = `rgba(170,170,170,${0.22 + i * 0.09})`;
      ctx.lineWidth = 0.7 * s;
      ctx.stroke();
    }
  }

  // ─ Bristles (paint-loaded) ──────────────────────────────────
  if (!ghost) {
    // Gradient: dark loaded root → glowing wet tip (premium paint quality)
    const bg = ctx.createLinearGradient(-bl, 0, 4, 0);
    bg.addColorStop(0,    '#06020f');   // deep root — very dark
    bg.addColorStop(0.06, '#120535');
    bg.addColorStop(0.18, '#2c0878');
    bg.addColorStop(0.34, '#5a14cc');
    bg.addColorStop(0.50, '#8050ee');
    bg.addColorStop(0.65, '#a87cf8');
    bg.addColorStop(0.80, '#d4baff');
    bg.addColorStop(0.92, '#f0e8ff');
    bg.addColorStop(1,    '#ffffff');   // wet glowing tip
    ctx.fillStyle = bg;
  } else {
    ctx.fillStyle = '#000';
  }
  // Tapered bristle silhouette
  ctx.beginPath();
  ctx.moveTo(2 * s, -1.5 * s);
  ctx.bezierCurveTo(-bl * 0.27, -bw * 0.17, -bl * 0.65, -bw * 0.44, -bl, -bw * 0.50);
  ctx.lineTo(-bl - 1, -fw * 0.34);
  ctx.lineTo(-bl - 1,  fw * 0.34);
  ctx.lineTo(-bl,       bw * 0.50);
  ctx.bezierCurveTo(-bl * 0.65, bw * 0.44, -bl * 0.27, bw * 0.17, 2 * s, 1.5 * s);
  ctx.closePath();
  ctx.fill();

  if (!ghost) {
    // Individual bristle strands
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-2 * s, i * bw * 0.08);
      ctx.lineTo(-bl,    i * bw * 0.43);
      ctx.strokeStyle = `rgba(255,248,255,${0.04 + Math.abs(i) * 0.012})`;
      ctx.lineWidth = 0.55 * s;
      ctx.stroke();
    }
    // Gloss highlight on bristle top half
    const hg = ctx.createLinearGradient(0, -bw * 0.50, 0, -bw * 0.04);
    hg.addColorStop(0,   'rgba(255,255,255,0)');
    hg.addColorStop(0.4, 'rgba(255,255,255,0.26)');
    hg.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.moveTo(-1 * s, -1.5 * s);
    ctx.bezierCurveTo(-bl * 0.27, -bw * 0.10, -bl * 0.65, -bw * 0.36, -bl * 0.90, -bw * 0.44);
    ctx.lineTo(-bl * 0.90, -bw * 0.17);
    ctx.bezierCurveTo(-bl * 0.65, -bw * 0.08, -bl * 0.27, -bw * 0.03, -1 * s, -0.5 * s);
    ctx.closePath();
    ctx.fillStyle = hg;
    ctx.fill();

    // Wet paint glow at tip
    const tg = ctx.createRadialGradient(0, 0, 0, 0, 0, 11 * s);
    tg.addColorStop(0,   'rgba(200,175,255,0.92)');
    tg.addColorStop(0.55,'rgba(170,140,255,0.38)');
    tg.addColorStop(1,   'rgba(170,140,255,0)');
    ctx.beginPath();
    ctx.arc(0, 0, 11 * s, 0, Math.PI * 2);
    ctx.fillStyle = tg;
    ctx.fill();

    // Tiny drip dot
    ctx.beginPath();
    ctx.arc(3 * s, 2.5 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(185,155,255,0.78)';
    ctx.fill();
  }
}

// ── Draw Paint Stroke ────────────────────────────────────────────────────────
const SEED = 137; // fixed seed = consistent organic stroke every time

function drawStroke(
  ctx: CanvasRenderingContext2D,
  strokeEndX: number,
  progress: number,    // overall transition progress 0-1 (for fade timing)
  vel: number,
  W: number,
  H: number,
  isMobile: boolean
) {
  if (strokeEndX < 1) return;

  ctx.save();

  const cy  = H * 0.50;
  const baseThick = H * 0.19;
  const thick = baseThick + vel * H * 0.045;
  const SEGS = isMobile ? 18 : 38;

  // Pre-compute organic edge points (seeded = stable across redraws)
  const topPts: [number, number][] = [];
  const botPts: [number, number][] = [];

  for (let i = 0; i <= SEGS; i++) {
    const t = i / SEGS;
    const x = t * strokeEndX;
    // Taper at very start and very end
    const taper = t < 0.055 ? t / 0.055 : t > 0.945 ? (1 - t) / 0.055 : 1;
    const halfH = thick * 0.5 * taper;
    // Organic edge noise (±28% of halfH)
    const vari = halfH * 0.28;
    const tv = (rand(SEED + i)      - 0.5) * vari;
    const bv = (rand(SEED + i + 50) - 0.5) * vari;
    // Subtle center sag
    const sag = Math.sin(t * Math.PI) * thick * 0.03;

    topPts.push([x, cy - halfH + tv - sag]);
    botPts.push([x, cy + halfH + bv + sag]);
  }

  // ── Main stroke fill (cream/white paint) ──────────────────────
  const sg = ctx.createLinearGradient(0, cy - thick, 0, cy + thick);
  sg.addColorStop(0,    'rgba(250, 246, 236, 0.0)');
  sg.addColorStop(0.07, 'rgba(250, 246, 236, 0.84)');
  sg.addColorStop(0.34, 'rgba(255, 253, 246, 0.96)');
  sg.addColorStop(0.50, 'rgba(255, 255, 255, 0.97)');
  sg.addColorStop(0.66, 'rgba(255, 253, 246, 0.96)');
  sg.addColorStop(0.93, 'rgba(244, 238, 224, 0.84)');
  sg.addColorStop(1,    'rgba(244, 238, 224, 0.0)');

  ctx.beginPath();
  // Top edge
  ctx.moveTo(topPts[0][0], topPts[0][1]);
  for (let i = 1; i < topPts.length; i++) {
    const [px, py] = topPts[i - 1];
    const [nx, ny] = topPts[i];
    const mx = px + (nx - px) * 0.5;
    ctx.bezierCurveTo(mx, py, mx, ny, nx, ny);
  }
  // Right cap (rounded)
  const lastT = topPts[SEGS];
  const lastB = botPts[SEGS];
  const capCY = (lastT[1] + lastB[1]) * 0.5;
  const capR  = (lastB[1] - lastT[1]) * 0.5;
  ctx.arc(strokeEndX, capCY, Math.max(1, capR), -Math.PI / 2, Math.PI / 2);
  // Bottom edge (reverse)
  for (let i = SEGS - 1; i >= 0; i--) {
    const [px, py] = botPts[i + 1];
    const [nx, ny] = botPts[i];
    const mx = px - (px - nx) * 0.5;
    ctx.bezierCurveTo(mx, py, mx, ny, nx, ny);
  }
  ctx.closePath();
  ctx.fillStyle = sg;
  ctx.fill();

  // ── Gloss highlight (additive, top-lit) ───────────────────────
  ctx.globalCompositeOperation = 'lighter';
  const gg = ctx.createLinearGradient(0, cy - thick * 0.52, 0, cy - thick * 0.06);
  gg.addColorStop(0,   'rgba(255,255,255,0)');
  gg.addColorStop(0.4, 'rgba(255,255,255,0.14)');
  gg.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.fillStyle = gg;
  ctx.fillRect(0, cy - thick * 0.56, strokeEndX, thick * 0.52);
  ctx.globalCompositeOperation = 'source-over';

  // ── Paint splatters ───────────────────────────────────────────
  const numS = isMobile ? 5 : 13;
  for (let i = 0; i < numS; i++) {
    const sx    = rand(SEED + i + 200) * strokeEndX * 0.94;
    const sign  = rand(SEED + i + 300) > 0.5 ? 1 : -1;
    const dist  = thick * (0.53 + rand(SEED + i + 400) * 0.92);
    const sy    = cy + sign * dist;
    // Scale dot size with stroke progress
    const sr    = (1.5 + rand(SEED + i + 500) * 9) * (strokeEndX / W);

    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(0.5, sr), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(248,244,234,${0.20 + rand(SEED + i + 600) * 0.56})`;
    ctx.fill();
  }

  // ── Bristle drag marks at edges ───────────────────────────────
  if (!isMobile) {
    for (let i = 0; i < 10; i++) {
      const bFrac = rand(SEED + i + 700);
      const bx    = bFrac * strokeEndX;
      const side  = rand(SEED + i + 800) > 0.5 ? 1 : -1;
      const idx   = Math.min(Math.round(bFrac * SEGS), SEGS);
      const edgeY = side > 0 ? botPts[idx][1] : topPts[idx][1];
      const len   = 8 + rand(SEED + i + 900) * 18;

      ctx.save();
      ctx.translate(bx, edgeY);
      ctx.rotate((rand(SEED + i + 1000) - 0.5) * 0.45);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, side * len);
      ctx.strokeStyle = `rgba(232,227,216,${0.28 + rand(SEED + i + 1100) * 0.42})`;
      ctx.lineWidth   = 0.8 + rand(SEED + i + 1200) * 1.8;
      ctx.lineCap     = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }

  // ── Fade left→right as brush exits (reveals next section) ────
  // Once progress > 0.68, the left side of the stroke melts away
  if (progress > 0.68) {
    const fp = (progress - 0.68) / 0.30; // 0→1
    const eased = fp * fp * (3 - 2 * fp); // smoothstep
    const fadeGrad = ctx.createLinearGradient(0, 0, W * 0.90, 0);
    fadeGrad.addColorStop(0,   `rgba(9, 8, 13, ${eased * 0.94})`);
    fadeGrad.addColorStop(0.55,`rgba(9, 8, 13, ${eased * 0.55})`);
    fadeGrad.addColorStop(1,   'rgba(9, 8, 13, 0)');
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
}

// ── React Component ───────────────────────────────────────────────────────────

interface Props {
  /** CSS selector for the section this transition reveals (e.g. ".cp-about"). */
  triggerSelector: string;
  isMobile: boolean;
  /** Scroll start offset, e.g. "top 88%" */
  start?: string;
  /** Scroll end offset, e.g. "top 12%" */
  end?: string;
}

export default function PaintCanvas({
  triggerSelector,
  isMobile,
  start = 'top 88%',
  end   = 'top 12%',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 1, H = 1;
    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Compute scale once (re-resize would need to recompute, but it's fine for Phase 1)
    const scale = isMobile
      ? 0.60
      : Math.min(1.0, Math.max(0.72, window.innerWidth / 1440));
    const brushTotal = BRUSH_TOTAL * scale;

    let lastP     = -1;
    let prevTipX  = -999; // track previous tip position for trail direction

    const st = ScrollTrigger.create({
      trigger: triggerSelector,
      start,
      end,
      scrub: 0.12, // ~120ms lag — physically attached to scroll
      onUpdate(self) {
        const p = self.progress;
        if (Math.abs(p - lastP) < 0.0005) return;

        const rawVel    = Math.abs(self.getVelocity()); // px / s
        const vel       = Math.min(rawVel / 2600, 1);   // 0 – 1
        const direction = p > lastP ? 1 : -1;           // +1 = moving right
        lastP = p;

        const active = p > 0.007 && p < 0.994;
        if (!active) {
          if (canvas.style.opacity !== '0') {
            canvas.style.opacity = '0';
            ctx.clearRect(0, 0, W, H);
          }
          prevTipX = -999;
          return;
        }

        canvas.style.opacity = '1';

        // ── Brush position ─────────────────────────────────────────
        const tipX = lerp(-60, W + brushTotal + 60, p);
        // Gentle arc: brush floats 1.8% of viewport height above center at midpoint
        const tipY = H * 0.50 - Math.sin(p * Math.PI) * H * 0.018;
        // Rotation: enters tilted slightly down, exits tilted slightly up
        const baseAngle = lerp(-0.080, 0.058, p);
        // Pitch from velocity — brush "drags" its tail at high speed
        const velPitch  = vel * direction * -0.28;
        const angle     = baseAngle + velPitch;

        // Stroke end trails the bristle tip
        const strokeEndX = Math.max(0, tipX - 16 * scale);

        // ── CLEAR ─────────────────────────────────────────────────
        ctx.clearRect(0, 0, W, H);

        // ── STROKE ────────────────────────────────────────────────
        if (tipX > 5) {
          drawStroke(ctx, strokeEndX, p, vel, W, H, isMobile);
        }

        // ── MOTION TRAIL (ghost passes — NO ctx.filter, alpha-only) ─
        // Multiple offset copies create the motion blur feel without
        // any software-rasterized filter — keeps the frame budget ~0ms.
        if (vel > 0.05 && prevTipX > -900) {
          const trailDist = tipX - prevTipX;
          const passes    = isMobile ? 2 : 3;
          for (let i = passes; i >= 1; i--) {
            const t        = i / (passes + 1);
            const trailX   = tipX - trailDist * t * 2.2;
            const trailY   = tipY + vel * direction * -t * 3;
            const trailAng = angle - velPitch * t * 0.45;
            const alpha    = vel * (1 - t * 0.72) * 0.20;
            ctx.save();
            ctx.globalAlpha = Math.max(0, alpha);
            drawBrush(ctx, trailX, trailY, trailAng, scale);
            ctx.restore();
          }
        }

        prevTipX = tipX;

        // ── MAIN BRUSH — fully crisp, no filter ──────────────────
        drawBrush(ctx, tipX, tipY, angle, scale);
      },
    });

    return () => {
      st.kill();
      window.removeEventListener('resize', resize);
    };
  }, [triggerSelector, isMobile, start, end]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 50,
        pointerEvents: 'none',
        opacity: 0,
        willChange: 'opacity',
        transform: 'translateZ(0)',  /* own compositor layer */
      }}
    />
  );
}
