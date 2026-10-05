/**
 * MiniPaint.tsx  —  Interactive brush paint for Creative Portfolio
 *
 * Visitors paint directly on the canvas using stylised brush strokes
 * that match the creative portfolio aesthetic. Download button lets them
 * keep what they made → highly shareable.
 *
 * Features:
 *  - 4 colour presets + custom colour
 *  - 3 brush sizes
 *  - Eraser mode
 *  - Clear canvas
 *  - Download as PNG
 *  - Touch / pointer events for mobile too
 */

import { useCallback, useEffect, useRef, useState } from "react";
import "./MiniPaint.css";

const PRESETS = ["#c2a4ff", "#ff6b9d", "#00d4ff", "#ffd97d", "#7fff5a", "#ff9f43"];
const SIZES   = [4, 10, 22];

interface Pt { x: number; y: number }

export default function MiniPaint() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const wrapRef    = useRef<HTMLDivElement>(null);
  const drawing    = useRef(false);
  const lastPt     = useRef<Pt | null>(null);

  const [color,   setColor]   = useState(PRESETS[0]);
  const [size,    setSize]    = useState(SIZES[1]);
  const [eraser,  setEraser]  = useState(false);
  const [strokes, setStrokes] = useState(0);

  // ── Resize canvas to fill wrapper ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap   = wrapRef.current!;
    const resize = () => {
      // Save existing drawing
      const img = canvas.toDataURL();
      canvas.width  = wrap.clientWidth;
      canvas.height = wrap.clientHeight;
      // Restore drawing
      const imgEl = new Image();
      imgEl.onload = () => {
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(imgEl, 0, 0);
      };
      imgEl.src = img;
      initCtx(canvas);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const initCtx = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d")!;
    ctx.lineCap   = "round";
    ctx.lineJoin  = "round";
  };

  // ── Drawing helpers ───────────────────────────────────────────────────────
  const getPos = (e: PointerEvent | React.PointerEvent): Pt => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = useCallback((e: React.PointerEvent) => {
    drawing.current = true;
    const pt = getPos(e);
    lastPt.current  = pt;
    // Draw a dot on mousedown
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.globalCompositeOperation = eraser ? "destination-out" : "source-over";
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    setStrokes(s => s + 1);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [color, size, eraser]);

  const doDraw = useCallback((e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx   = canvasRef.current!.getContext("2d")!;
    const pt    = getPos(e);
    const last  = lastPt.current ?? pt;

    ctx.globalCompositeOperation = eraser ? "destination-out" : "source-over";
    ctx.strokeStyle = color;
    ctx.lineWidth   = size;

    // Smooth curve through points
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);

    // Slight pressure simulation via pointer pressure
    const pressure = (e.pressure > 0 ? e.pressure : 0.5);
    ctx.lineWidth = size * (0.5 + pressure);

    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    lastPt.current = pt;
  }, [color, size, eraser]);

  const stopDraw = useCallback(() => {
    drawing.current = false;
    lastPt.current  = null;
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes(0);
  };

  const download = () => {
    const canvas = canvasRef.current!;
    const link   = document.createElement("a");
    link.download = "my-painting.png";
    link.href     = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="mp-root">
      <div className="mp-header">
        <span className="mp-title">🎨 Paint Your Own</span>
        <span className="mp-subtitle">
          {strokes === 0 ? "Start painting — it's yours to keep" : `${strokes} stroke${strokes !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Toolbar */}
      <div className="mp-toolbar">
        {/* Colour presets */}
        <div className="mp-colours">
          {PRESETS.map(c => (
            <button
              key={c}
              className={`mp-colour-btn${color === c && !eraser ? " mp-colour-active" : ""}`}
              style={{ background: c }}
              onClick={() => { setColor(c); setEraser(false); }}
              aria-label={`Colour ${c}`}
            />
          ))}
          {/* Custom colour */}
          <label className="mp-colour-btn mp-colour-custom" title="Custom colour">
            <input
              type="color"
              value={color}
              onChange={e => { setColor(e.target.value); setEraser(false); }}
            />
            <span>+</span>
          </label>
        </div>

        <div className="mp-divider" />

        {/* Brush sizes */}
        <div className="mp-sizes">
          {SIZES.map(s => (
            <button
              key={s}
              className={`mp-size-btn${size === s && !eraser ? " mp-size-active" : ""}`}
              onClick={() => { setSize(s); setEraser(false); }}
              aria-label={`Brush size ${s}`}
            >
              <span style={{
                width: Math.min(s, 22),
                height: Math.min(s, 22),
                background: color,
                borderRadius: "50%",
                display: "block",
              }} />
            </button>
          ))}
        </div>

        <div className="mp-divider" />

        {/* Eraser */}
        <button
          className={`mp-tool-btn${eraser ? " mp-tool-active" : ""}`}
          onClick={() => setEraser(e => !e)}
          title="Eraser"
        >
          ⌫
        </button>

        {/* Clear */}
        <button className="mp-tool-btn" onClick={clearCanvas} title="Clear canvas">
          ✕
        </button>

        {/* Download */}
        <button className="mp-tool-btn mp-download" onClick={download} title="Download PNG">
          ↓
        </button>
      </div>

      {/* Canvas */}
      <div className="mp-canvas-wrap" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          className="mp-canvas"
          style={{ cursor: eraser ? "cell" : "crosshair" }}
          onPointerDown={startDraw}
          onPointerMove={doDraw}
          onPointerUp={stopDraw}
          onPointerLeave={stopDraw}
        />
        {strokes === 0 && (
          <div className="mp-placeholder" aria-hidden="true">
            <span>✦</span>
            <p>Click or tap to paint</p>
          </div>
        )}
      </div>
    </div>
  );
}
