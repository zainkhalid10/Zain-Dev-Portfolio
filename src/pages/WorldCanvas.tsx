/**
 * WorldCanvas.tsx
 *
 * Full-screen background canvas for the Gateway page.
 * Concept: two "worlds" coexist and bleed into each other.
 *
 *   LEFT side  → CODE world  → purple (#c2a4ff) monospace glyphs
 *   RIGHT side → ART world   → amber  (#f0a500) painterly symbols
 *   CENTRE     → transition  → glyphs cross-dissolve as they drift across
 *
 * Each particle carries a codeGlyph and artGlyph.
 * At its current x-position, it draws BOTH with opposing opacities:
 *   code opacity = (1 − t) × life
 *   art  opacity =  t      × life
 * where t = x / W.  This makes symbols appear to morph as they drift.
 *
 * Performance: No libraries. Single RAF. ~50 particles max.
 */

import { useEffect, useRef } from "react";

// ─── Symbol sets ─────────────────────────────────────────────────────────────
const CODE_GLYPHS = [
  "</>", "{}", "=>", "fn", "&&", "01",
  "[]", "::", "if", "λ", "#!", "▸", "++",
];
const ART_GLYPHS = [
  "✦", "★", "◆", "◇", "∿", "✿", "~",
  "∞", "◉", "⬡", "✧", "▲", "〇",
];

// ─── Palette ──────────────────────────────────────────────────────────────────
const CODE_RGB = [194, 164, 255];   // purple
const ART_RGB  = [240, 165,   0];   // amber

function mixColor(t: number, alpha: number): string {
  const r = Math.round(CODE_RGB[0] + (ART_RGB[0] - CODE_RGB[0]) * t);
  const g = Math.round(CODE_RGB[1] + (ART_RGB[1] - CODE_RGB[1]) * t);
  const b = Math.round(CODE_RGB[2] + (ART_RGB[2] - CODE_RGB[2]) * t);
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
}

// ─── Particle ─────────────────────────────────────────────────────────────────
interface Particle {
  x:        number;
  y:        number;
  vx:       number;
  vy:       number;
  alpha:    number;   // current opacity [0,1]
  growing:  boolean;  // fading in vs fading out
  size:     number;   // font size in logical px
  code:     string;
  art:      string;
  rotation: number;   // subtle rotation for art glyphs (radians)
  vrot:     number;   // rotation speed
}

function rand(min: number, max: number) { return min + Math.random() * (max - min); }

function spawnParticle(W: number, H: number): Particle {
  return {
    x:       rand(0, W),
    y:       rand(0, H),
    vx:      rand(-0.18, 0.18),
    vy:      rand(-0.28, -0.08),     // drift upward gently
    alpha:   0,
    growing: true,
    size:    rand(11, 19),
    code:    CODE_GLYPHS[Math.floor(Math.random() * CODE_GLYPHS.length)],
    art:     ART_GLYPHS[Math.floor(Math.random() * ART_GLYPHS.length)],
    rotation:rand(-0.4, 0.4),
    vrot:    rand(-0.003, 0.003),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function WorldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx  = canvas.getContext("2d")!;
    let W = 0, H = 0, rafId = 0;
    const MAX_PARTICLES = 55;
    const FADE_SPEED    = 0.006;

    let particles: Particle[] = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const rect = canvas!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas!.width  = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawParticle(p: Particle) {
      if (!W) return;
      // t = 0 → full code identity, t = 1 → full art identity
      const t = Math.max(0, Math.min(1, p.x / W));

      // ── Code glyph (fades as particle moves right) ──────────────────────────
      const codeAlpha = p.alpha * (1 - t) * 0.72;
      if (codeAlpha > 0.008) {
        ctx.save();
        ctx.font         = `600 ${p.size}px "Geist Mono", "Courier New", monospace`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle    = mixColor(0, codeAlpha);
        ctx.shadowColor  = `rgba(${CODE_RGB.join(",")}, ${(codeAlpha * 0.8).toFixed(3)})`;
        ctx.shadowBlur   = 12;
        ctx.fillText(p.code, p.x, p.y);
        ctx.restore();
      }

      // ── Art glyph (fades in as particle moves right) ─────────────────────────
      const artAlpha = p.alpha * t * 0.72;
      if (artAlpha > 0.008) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font         = `400 ${p.size * 1.1}px serif`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle    = mixColor(1, artAlpha);
        ctx.shadowColor  = `rgba(${ART_RGB.join(",")}, ${(artAlpha * 0.8).toFixed(3)})`;
        ctx.shadowBlur   = 14;
        ctx.fillText(p.art, 0, 0);
        ctx.restore();
      }

      // ── Centre zone: draw a blended "hybrid" glyph at half-opacity ──────────
      // Only visible within 12% of centre to suggest the fusion moment
      const centreZone = Math.abs(p.x / W - 0.5);
      if (centreZone < 0.12) {
        const blend = (0.12 - centreZone) / 0.12;  // 0→1 near centre
        const hybridAlpha = p.alpha * blend * 0.30;
        ctx.save();
        ctx.font         = `400 ${p.size * 0.85}px serif`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle    = mixColor(0.5, hybridAlpha);
        ctx.shadowColor  = `rgba(225,134,127,${(hybridAlpha * 0.6).toFixed(3)})`;
        ctx.shadowBlur   = 18;
        ctx.fillText("⬡", p.x, p.y);
        ctx.restore();
      }
    }

    function tick() {
      rafId = requestAnimationFrame(tick);
      if (!W || !H) { resize(); return; }

      // Clear with a very slight trail (motion ghost effect)
      ctx.fillStyle = "rgba(8, 6, 10, 0.18)";
      ctx.fillRect(0, 0, W, H);

      // Spawn new particles up to max
      while (particles.length < MAX_PARTICLES) {
        particles.push(spawnParticle(W, H));
      }

      particles = particles.filter(p => {
        // Update
        p.x  += p.vx;
        p.y  += p.vy;
        p.rotation += p.vrot;

        // Wrap horizontally — so particles recirculate endlessly
        if (p.x < -30)  p.x = W + 30;
        if (p.x > W + 30) p.x = -30;

        // Recycle if drifted off top or bottom
        if (p.y < -40 || p.y > H + 40) {
          return false;   // remove; a fresh one spawns next frame
        }

        // Fade in/out
        if (p.growing) {
          p.alpha += FADE_SPEED;
          if (p.alpha >= rand(0.55, 0.85)) { p.growing = false; }
        } else {
          p.alpha -= FADE_SPEED * 0.65;
          if (p.alpha <= 0) return false;
        }

        // Draw
        drawParticle(p);
        return true;
      });
    }

    resize();
    rafId = requestAnimationFrame(tick);

    const ro = new ResizeObserver(resize);
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
        inset:         0,
        width:         "100%",
        height:        "100%",
        display:       "block",
        pointerEvents: "none",
        transform:     "translateZ(0)",
      }}
    />
  );
}
