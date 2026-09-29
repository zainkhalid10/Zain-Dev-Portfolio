/**
 * HouseCanvas.tsx — v2 (global / fixed)
 *
 * A fixed-position canvas that sits behind the page as a persistent background layer.
 * The animation lifecycle:
 *
 *   HERO      → pile visible (progress = 0, no building)
 *   ABOUT     → construction begins (progress 0 → ~0.4)
 *   PROCESS   → walls + roof continue (progress ~0.4 → ~0.85)
 *   TOOLKIT   → chimney completes; house is done (progress 1)
 *   WORK+     → canvas fades to 0; opaque sections take over
 *
 * Performance contract:
 *  - No requestAnimationFrame loop — only redraws on ScrollTrigger.onUpdate
 *  - No ctx.filter — replaced with gradient + grain lines
 *  - GPU layer via transform:translateZ(0) + will-change: contents
 *  - Lazy-loadable (default export, no side-effects at module level)
 */

import { useEffect, useRef } from 'react';
import { gsap }         from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Virtual canvas design space ─────────────────────────────────────────────
const VW = 600;
const VH = 420;
const CX = VW / 2;          // centre = 300

// House geometry constants
const LOG_THICK = 20;
const WALL_HALF = 140;      // half-width of the log-cabin walls
const WALL_L    = CX - WALL_HALF;  // 160
const WALL_R    = CX + WALL_HALF;  // 440
const WALL_BOT  = 374;
const NUM_WALL  = 8;
const WALL_STEP = LOG_THICK + 2;        // 22 px per wall log layer
const WALL_TOP_Y = WALL_BOT - NUM_WALL * WALL_STEP;  // ≈ 198
const APEX_Y    = 88;

// Roof slope vectors (left side)
const SLOPE_DX  = CX - WALL_L;                               // 140
const SLOPE_DY  = APEX_Y - WALL_TOP_Y;                       // negative
const SLOPE_LEN = Math.hypot(SLOPE_DX, Math.abs(SLOPE_DY)); // ≈ 192
const SLOPE_UX  = SLOPE_DX / SLOPE_LEN;
const SLOPE_UY  = SLOPE_DY / SLOPE_LEN;
const ROOF_ANG_L = Math.atan2(SLOPE_DY, SLOPE_DX);  // ≈ −0.73 rad
const ROOF_ANG_R = -ROOF_ANG_L;

// Wood colours
const PALETTE = [
  '#3B1E07', '#54290D', '#6B3812', '#7A4418',
  '#5E3010', '#4A2308', '#663615', '#6E3C17',
];

// ─── Log definition ───────────────────────────────────────────────────────────
interface LogDef {
  ex: number; ey: number; ea: number; ew: number; eh: number; // end (house)
  sx: number; sy: number; sa: number;                         // start (pile)
  color: string;
  delay: number;   // stagger: 0 = first to move, 0.55 = last
}

/** Deterministic pseudo-random (no Math.random → consistent across renders) */
function sr(n: number) {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Per-log eased progress accounting for stagger */
function logT(globalP: number, delay: number, dur = 0.50): number {
  return easeInOutCubic(Math.max(0, Math.min(1, (globalP - delay) / dur)));
}

// ─── Build the complete log array (runs once at module init) ──────────────────
function buildLogs(): LogDef[] {
  const logs: LogDef[] = [];
  let idx = 0;

  function add(
    ex: number, ey: number, ea: number,
    ew: number, eh: number, delay: number
  ) {
    const i = idx++;
    logs.push({
      ex, ey, ea, ew, eh,
      // Pile: scatter around (CX, VH*0.82) — bottom-centre of canvas
      sx: CX + (sr(i * 7)     - 0.5) * 460,
      sy: VH  * 0.82 + (sr(i * 7 + 1) - 0.5) * 110,
      sa: (sr(i * 7 + 2) - 0.5) * Math.PI * 1.85,
      color: PALETTE[i % PALETTE.length],
      delay,
    });
  }

  // ─ Wall logs (8, bottom first → delay 0 → 0.216) ─────────────────────────
  for (let i = 0; i < NUM_WALL; i++) {
    const cy = WALL_BOT - i * WALL_STEP - LOG_THICK / 2;
    add(CX, cy, 0, WALL_HALF * 2, LOG_THICK, i * 0.027);
  }

  // ─ Roof left (4 diagonal logs, inner → outer) ────────────────────────────
  const RW = [160, 136, 110, 74];
  [0.22, 0.44, 0.66, 0.84].forEach((t, i) =>
    add(
      WALL_L + SLOPE_UX * SLOPE_LEN * t,
      WALL_TOP_Y + SLOPE_UY * SLOPE_LEN * t,
      ROOF_ANG_L, RW[i], LOG_THICK,
      0.27 + i * 0.042
    )
  );

  // ─ Roof right (mirrored) ─────────────────────────────────────────────────
  [0.22, 0.44, 0.66, 0.84].forEach((t, i) =>
    add(
      WALL_R - SLOPE_UX * SLOPE_LEN * t,
      WALL_TOP_Y + SLOPE_UY * SLOPE_LEN * t,
      ROOF_ANG_R, RW[i], LOG_THICK,
      0.27 + i * 0.042
    )
  );

  // ─ Ridge beam ────────────────────────────────────────────────────────────
  add(CX, APEX_Y + LOG_THICK / 2, 0, 80, LOG_THICK, 0.46);

  // ─ Chimney (3 stacked, right of ridge) ───────────────────────────────────
  add(CX + 52, APEX_Y - 6,  0, 40, 15, 0.49);
  add(CX + 52, APEX_Y - 23, 0, 40, 15, 0.51);
  add(CX + 52, APEX_Y - 40, 0, 40, 15, 0.53);

  return logs;
}

const LOGS = buildLogs();

// ─── Canvas drawing utilities ─────────────────────────────────────────────────

function rrect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);             ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h,     x, y + h - r,     r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y,         x + r, y,         r);
  ctx.closePath();
}

function adj(hex: string, delta: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + delta)));
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}

function drawLog(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, angle: number,
  w: number, h: number, color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const hx = -w / 2, hy = -h / 2;

  // Barrel gradient (light top → mid → dark bottom)
  const grad = ctx.createLinearGradient(hx, hy, hx, hy + h);
  grad.addColorStop(0,    adj(color,  70));
  grad.addColorStop(0.28, adj(color,  28));
  grad.addColorStop(0.72, color);
  grad.addColorStop(1,    adj(color, -55));

  rrect(ctx, hx, hy, w, h, h * 0.48);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // Wood grain lines
  const grainN = Math.max(1, Math.floor(w / 55));
  ctx.strokeStyle = 'rgba(0,0,0,0.10)';
  ctx.lineWidth = 0.5;
  for (let g = 1; g <= grainN; g++) {
    const gx = hx + (w / (grainN + 1)) * g;
    ctx.beginPath();
    ctx.moveTo(gx, hy + h * 0.14);
    ctx.lineTo(gx, hy + h * 0.86);
    ctx.stroke();
  }

  ctx.restore();
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function HouseCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let W = 0, H = 0;
    let scale = 1, ox = 0, oy = 0;
    let buildProgress = 0;   // 0 = pile, 1 = house

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      W = canvas!.offsetWidth;
      H = canvas!.offsetHeight;
      canvas!.width  = W * dpr;
      canvas!.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Uniform scale with breathing room
      scale = Math.min(W / VW, H / VH) * 0.80;
      ox = W / 2 - CX * scale;
      oy = H / 2 - (VH / 2) * scale;

      render();
    }

    function render() {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);

      // Dark background (same as --void so transparent sections look right)
      ctx.fillStyle = '#08060e';
      ctx.fillRect(0, 0, W, H);

      // Warm glow grows as house is built
      if (buildProgress > 0.05) {
        const glowX = CX * scale + ox;
        const glowY = ((WALL_TOP_Y + WALL_BOT) / 2) * scale + oy;
        const glowR = 240 * scale;
        const glow  = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowR);
        const ga    = Math.min(buildProgress * 0.18, 0.18);
        glow.addColorStop(0,   `rgba(140, 65, 12, ${ga})`);
        glow.addColorStop(0.5, `rgba(90,  35,  6, ${ga * 0.55})`);
        glow.addColorStop(1,   'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);
      }

      // Draw logs: pile → house via buildProgress
      LOGS.forEach(log => {
        const t = logT(buildProgress, log.delay);
        if (t <= 0) return;

        const x = lerp(log.sx, log.ex, t) * scale + ox;
        const y = lerp(log.sy, log.ey, t) * scale + oy;
        const a = lerp(log.sa, log.ea, t);
        const w = log.ew * scale;
        const h = log.eh * scale;

        drawLog(ctx, x, y, a, w, h, log.color);
      });
    }

    resize();
    window.addEventListener('resize', resize);

    // ── ScrollTrigger 1: drive the house-building animation ──────────────────
    // Starts when About section enters viewport; ends at Creative Toolkit bottom
    const stBuild = ScrollTrigger.create({
      trigger:    '.cp2-about',
      start:      'top bottom',   // About section enters viewport → build starts
      endTrigger: '.cp2-skills-wrap',
      end:        'bottom center',
      scrub:      0.65,           // smooth, physically tethered feel
      onUpdate(self) {
        buildProgress = self.progress;
        render();
      },
    });

    // ── ScrollTrigger 2: fade canvas out when Work section arrives ───────────
    // Canvas fades away so Work section feels separate from the canvas narrative
    const stFade = ScrollTrigger.create({
      trigger: '#work',
      start:   'top 80%',
      end:     'top top',
      scrub:   true,
      onUpdate(self) {
        if (canvas) canvas.style.opacity = String(1 - self.progress);
      },
      onLeave()      { if (canvas) canvas.style.opacity = '0'; },
      onLeaveBack()  { if (canvas) canvas.style.opacity = '1'; },
    });

    return () => {
      stBuild.kill();
      stFade.kill();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        width:         '100%',
        height:        '100%',
        display:       'block',
        zIndex:        0,         // behind sections that have backgrounds
        pointerEvents: 'none',
        transform:     'translateZ(0)',
        willChange:    'contents',
        opacity:       1,
      }}
    />
  );
}
