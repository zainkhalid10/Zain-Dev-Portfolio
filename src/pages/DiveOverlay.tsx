/**
 * DiveOverlay.tsx
 *
 * Full-screen canvas that plays a cinematic "dive into the card" sequence
 * when the user selects a world on the Gateway page.
 *
 * SEQUENCE (1 400 ms total):
 *  0 ms  → 600 ms   Phase A — 160 ambient particles rush/converge to card center
 *  300 ms→ 900 ms   Phase B — hyperspace speed-lines radiate from center (warp)
 *  600 ms→1 100 ms  Phase C — concentric portal rings expand from center
 *  900 ms→1 300 ms  Phase D — full-screen colour wash & bright flash
 *  1 400 ms         → onComplete() fires → navigate
 */

import { useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DiveTarget {
  cx:    number;   // card centre x (px)
  cy:    number;   // card centre y (px)
  color: [number, number, number];   // [r, g, b]
}

interface Props {
  target:     DiveTarget;
  onComplete: () => void;
}

// ─── Easing ───────────────────────────────────────────────────────────────────
function easeInCubic(t: number)    { return t * t * t; }
function easeOutCubic(t: number)   { return 1 - Math.pow(1 - t, 3); }
function easeInOutQuart(t: number) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp01(v: number)                    { return Math.max(0, Math.min(1, v)); }

/** Map t from [inMin,inMax] → [0,1] clamped */
function phase(t: number, start: number, end: number): number {
  return clamp01((t - start) / (end - start));
}

// ─── Particle ─────────────────────────────────────────────────────────────────
interface Particle {
  sx: number; sy: number;          // start position
  size: number;
  speed: number;                   // individual speed multiplier
  angle: number;                   // spiral angle offset
}

function makeParticles(W: number, H: number, count = 160): Particle[] {
  return Array.from({ length: count }, () => ({
    sx:    Math.random() * W,
    sy:    Math.random() * H,
    size:  2 + Math.random() * 4,
    speed: 0.6 + Math.random() * 0.8,
    angle: Math.random() * Math.PI * 2,
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DiveOverlay({ target, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx    = canvas.getContext("2d")!;
    const dpr    = Math.min(window.devicePixelRatio, 2);
    const W      = window.innerWidth;
    const H      = window.innerHeight;

    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { cx, cy, color: [cr, cg, cb] } = target;

    const DURATION  = 1400;         // ms
    const particles = makeParticles(W, H);
    const startTime = performance.now();
    let rafId = 0;
    let done  = false;

    function draw(now: number) {
      if (done) return;
      rafId = requestAnimationFrame(draw);

      const elapsed = now - startTime;
      const t       = clamp01(elapsed / DURATION);  // 0 → 1

      ctx.clearRect(0, 0, W, H);

      // ── A: dim background early ──────────────────────────────────────────────
      const bgAlpha = phase(t, 0, 0.35) * 0.55;
      ctx.fillStyle = `rgba(8,6,10,${bgAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);

      // ── A: particles rushing to center ───────────────────────────────────────
      const pPhase  = phase(t, 0, 0.65);
      const pEased  = easeInCubic(pPhase);

      particles.forEach(p => {
        // Spiral toward centre: slightly rotate as they converge
        const spiralFactor = pEased * 0.6 * p.angle;
        const dx = cx - p.sx;
        const dy = cy - p.sy;
        const dist = Math.hypot(dx, dy);
        const nx = dist > 0 ? dx / dist : 0;
        const ny = dist > 0 ? dy / dist : 0;
        // Perpendicular for spiral
        const px_perp = -ny * Math.sin(spiralFactor);
        const py_perp =  nx * Math.sin(spiralFactor);

        const x = lerp(p.sx, cx, pEased * p.speed) + px_perp * dist * 0.22 * (1 - pEased);
        const y = lerp(p.sy, cy, pEased * p.speed) + py_perp * dist * 0.22 * (1 - pEased);

        const particleAlpha = (1 - pEased * pEased) * 0.85;
        const size = lerp(p.size, 0.5, pEased);

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${particleAlpha.toFixed(3)})`;
        ctx.shadowColor = `rgba(${cr},${cg},${cb},${(particleAlpha * 0.6).toFixed(3)})`;
        ctx.shadowBlur  = size * 5;
        ctx.fill();
        ctx.shadowBlur  = 0;
      });

      // ── B: hyperspace speed-lines (warp) ─────────────────────────────────────
      const warpT = phase(t, 0.22, 0.80);
      if (warpT > 0) {
        const warpE    = easeOutCubic(warpT);
        const numLines = 72;
        const maxLen   = Math.max(W, H) * 1.4;

        ctx.save();
        for (let i = 0; i < numLines; i++) {
          const angle    = (i / numLines) * Math.PI * 2;
          const minLen   = warpE * maxLen * 0.08;
          const lineLen  = warpE * maxLen * (0.3 + (i % 3) * 0.12);
          const alpha    = warpE * 0.55 * (0.4 + 0.6 * ((i % 7) / 7));

          const x1 = cx + Math.cos(angle) * minLen;
          const y1 = cy + Math.sin(angle) * minLen;
          const x2 = cx + Math.cos(angle) * lineLen;
          const y2 = cy + Math.sin(angle) * lineLen;

          const grad = ctx.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`);
          grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);

          ctx.lineWidth   = lerp(2.2, 0.4, i / numLines);
          ctx.strokeStyle = grad;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // ── C: portal concentric rings ────────────────────────────────────────────
      const ringT = phase(t, 0.42, 1.00);
      if (ringT > 0) {
        const NUM_RINGS = 10;
        const maxRadius = Math.max(W, H) * 1.1;

        ctx.save();
        for (let i = 0; i < NUM_RINGS; i++) {
          // Each ring is offset in time so they cascade outward
          const rt     = clamp01(ringT - i * 0.07);
          if (rt <= 0) continue;
          const rEased = easeInOutQuart(rt);
          const radius = rEased * maxRadius;
          const alpha  = (1 - rEased) * 0.65;
          const width  = lerp(3.5, 0.6, rEased);

          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(0, radius), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`;
          ctx.lineWidth   = width;
          ctx.shadowColor = `rgba(${cr},${cg},${cb},${(alpha * 0.4).toFixed(3)})`;
          ctx.shadowBlur  = width * 8;
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // ── D: bright glow at origin ──────────────────────────────────────────────
      const glowT = phase(t, 0.30, 0.80);
      if (glowT > 0) {
        const glowR  = glowT * 280;
        const glow   = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
        glow.addColorStop(0,   `rgba(${cr},${cg},${cb},${(glowT * 0.55).toFixed(3)})`);
        glow.addColorStop(0.4, `rgba(${cr},${cg},${cb},${(glowT * 0.15).toFixed(3)})`);
        glow.addColorStop(1,   `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── D: full-screen colour wash → white flash ──────────────────────────────
      const fillT = phase(t, 0.78, 1.00);
      if (fillT > 0) {
        const fillE = easeInOutQuart(fillT);
        // Sweep from destination colour to white
        const r = Math.round(lerp(cr, 255, fillE * 0.4));
        const g = Math.round(lerp(cg, 255, fillE * 0.4));
        const b = Math.round(lerp(cb, 255, fillE * 0.4));
        ctx.fillStyle = `rgba(${r},${g},${b},${fillE.toFixed(3)})`;
        ctx.fillRect(0, 0, W, H);
      }

      // ── Done ─────────────────────────────────────────────────────────────────
      if (t >= 1 && !done) {
        done = true;
        cancelAnimationFrame(rafId);
        onComplete();
      }
    }

    rafId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafId); };
  }, [target, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      "fixed",
        inset:         0,
        width:         "100vw",
        height:        "100vh",
        zIndex:        9998,
        pointerEvents: "none",
        transform:     "translateZ(0)",
      }}
      aria-hidden="true"
    />
  );
}
