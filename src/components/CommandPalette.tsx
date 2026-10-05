/**
 * CommandPalette.tsx
 *
 * Secret Cmd+K (or Ctrl+K) terminal for the developer portfolio.
 * Developers WILL find this and WILL share it.
 *
 * Commands:
 *   whoami       → bio
 *   skills       → tech stack
 *   projects     → project list
 *   contact      → socials + email
 *   hire me      → confetti + email
 *   matrix       → matrix rain easter egg
 *   clear        → clear output
 *   help         → list commands
 *   exit / q     → close
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { config } from "../config";
import "./styles/CommandPalette.css";

// ─── Types ─────────────────────────────────────────────────────────────────
type LineType = "input" | "output" | "error" | "success" | "accent";
interface Line { type: LineType; text: string }

// ─── Confetti ──────────────────────────────────────────────────────────────
function launchConfetti() {
  const colors = ["#c2a4ff", "#f0a500", "#ff6b9d", "#00d4ff", "#7fff5a"];
  for (let i = 0; i < 120; i++) {
    const el = document.createElement("div");
    el.style.cssText = `
      position:fixed; top:${Math.random() * 40}vh; left:${Math.random() * 100}vw;
      width:${6 + Math.random() * 8}px; height:${6 + Math.random() * 8}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      pointer-events:none; z-index:99999;
      animation: confettiFall ${1.2 + Math.random() * 1.8}s ease-in forwards;
      animation-delay:${Math.random() * 0.4}s;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

// ─── Matrix rain canvas ────────────────────────────────────────────────────
function MatrixCanvas({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    c.width  = window.innerWidth;
    c.height = window.innerHeight;
    const cols = Math.floor(c.width / 16);
    const drops: number[] = Array(cols).fill(1);
    const chars = "アイウエオカキクケコabcdefghijklmnopqrstuvwxyz0123456789</>{}[]=>&&||";

    const tick = setInterval(() => {
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#c2a4ff";
      ctx.font = "14px monospace";
      drops.forEach((y, i) => {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, i * 16, y * 16);
        if (y * 16 > c.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    }, 40);

    const t = setTimeout(() => { clearInterval(tick); onDone(); }, 4000);
    return () => { clearInterval(tick); clearTimeout(t); };
  }, [onDone]);

  return (
    <canvas ref={ref} style={{
      position: "fixed", inset: 0, zIndex: 99997, pointerEvents: "none",
    }} />
  );
}

// ─── Command handler ────────────────────────────────────────────────────────
function runCommand(raw: string): { lines: Line[]; special?: "matrix" | "hire" | "exit" } {
  const cmd = raw.trim().toLowerCase();

  switch (cmd) {
    case "whoami":
      return { lines: [
        { type: "accent",  text: `▸ ${config.developer.fullName}` },
        { type: "output",  text: `  ${config.developer.title}` },
        { type: "output",  text: `  📍 ${config.social.location}` },
        { type: "output",  text: `  ${config.developer.description}` },
      ]};

    case "skills":
      return { lines: [
        { type: "accent", text: "▸ Tech Stack" },
        { type: "output", text: "  Languages  · Python · TypeScript · JavaScript · C++" },
        { type: "output", text: "  Frontend   · React · Next.js · Three.js · GSAP" },
        { type: "output", text: "  Backend    · Node.js · FastAPI · PostgreSQL · Redis" },
        { type: "output", text: "  AI / ML    · PyTorch · LangChain · OpenAI · HuggingFace" },
        { type: "output", text: "  DevOps     · Docker · AWS · Vercel · GitHub Actions" },
      ]};

    case "projects":
      return { lines: [
        { type: "accent", text: "▸ Selected Projects" },
        ...config.projects.slice(0, 5).map((p, i) => ({
          type: "output" as LineType,
          text: `  ${String(i + 1).padStart(2, "0")}. ${p.title} — ${p.category}`,
        })),
        { type: "output", text: "  → /myworks for full archive" },
      ]};

    case "contact":
      return { lines: [
        { type: "accent", text: "▸ Get In Touch" },
        { type: "output", text: `  ✉  ${config.social.email}` },
        { type: "output", text: `  🐙  github.com/${config.social.github}` },
        { type: "output", text: `  💼  ${config.contact.linkedin}` },
      ]};

    case "hire me":
    case "hireme":
      return { lines: [
        { type: "success", text: "🎉 You have great taste." },
        { type: "success", text: `→ Opening ${config.social.email} ...` },
      ], special: "hire" };

    case "matrix":
      return { lines: [
        { type: "accent", text: "// Initialising reality distortion..." },
      ], special: "matrix" };

    case "clear":
      return { lines: [] };   // handled specially

    case "help":
      return { lines: [
        { type: "accent",  text: "▸ Available commands" },
        { type: "output",  text: "  whoami     → who is this person?" },
        { type: "output",  text: "  skills     → tech stack" },
        { type: "output",  text: "  projects   → selected work" },
        { type: "output",  text: "  contact    → socials & email" },
        { type: "output",  text: "  hire me    → 👀" },
        { type: "output",  text: "  matrix     → 🐇" },
        { type: "output",  text: "  clear      → clear screen" },
        { type: "output",  text: "  exit       → close terminal" },
      ]};

    case "exit":
    case "q":
    case ":q":
      return { lines: [], special: "exit" };

    case "":
      return { lines: [] };

    default:
      return { lines: [
        { type: "error", text: `bash: ${cmd}: command not found. Type 'help' for available commands.` },
      ]};
  }
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function CommandPalette() {
  const [open, setOpen]     = useState(false);
  const [lines, setLines]   = useState<Line[]>([
    { type: "accent",  text: "// Portfolio Terminal v1.0.0" },
    { type: "output",  text: "Type 'help' to see available commands." },
    { type: "output",  text: "Press Escape or type 'exit' to close." },
  ]);
  const [input, setInput]   = useState("");
  const [matrix, setMatrix] = useState(false);
  const inputRef            = useRef<HTMLInputElement>(null);
  const bottomRef           = useRef<HTMLDivElement>(null);

  // ── Keyboard shortcut ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Focus input when open ───────────────────────────────────────────────
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const submit = useCallback(() => {
    const cmd = input.trim();
    const echo: Line = { type: "input", text: `❯ ${cmd || " "}` };

    if (cmd.toLowerCase() === "clear") {
      setLines([]);
      setInput("");
      return;
    }

    const { lines: newLines, special } = runCommand(cmd);
    setLines(prev => [...prev, echo, ...newLines]);
    setInput("");

    if (special === "exit") setTimeout(() => setOpen(false), 300);
    if (special === "matrix") setTimeout(() => setMatrix(true), 200);
    if (special === "hire") {
      launchConfetti();
      setTimeout(() => window.open(`mailto:${config.social.email}`, "_blank"), 800);
    }
  }, [input]);

  if (!open && !matrix) return (
    <button
      className="cmd-hint"
      onClick={() => setOpen(true)}
      aria-label="Open terminal"
    >
      <span className="cmd-hint-key">⌘</span>
      <span className="cmd-hint-key">K</span>
    </button>
  );

  return (
    <>
      {matrix && (
        <MatrixCanvas onDone={() => { setMatrix(false); setOpen(true); }} />
      )}

      {open && (
        <div className="cmd-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      {open && (
        <div className="cmd-terminal" role="dialog" aria-label="Terminal">
          {/* Title bar */}
          <div className="cmd-titlebar">
            <div className="cmd-dots">
              <button className="cmd-dot cmd-dot-red"   onClick={() => setOpen(false)} aria-label="Close" />
              <span   className="cmd-dot cmd-dot-yellow" />
              <span   className="cmd-dot cmd-dot-green"  />
            </div>
            <span className="cmd-title">portfolio — bash</span>
            <span className="cmd-shortcut">ESC to close</span>
          </div>

          {/* Output */}
          <div className="cmd-output" aria-live="polite">
            {lines.map((l, i) => (
              <div key={i} className={`cmd-line cmd-line-${l.type}`}>
                {l.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div className="cmd-input-row">
            <span className="cmd-prompt">❯</span>
            <input
              ref={inputRef}
              className="cmd-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              spellCheck={false}
              autoComplete="off"
              aria-label="Terminal input"
              placeholder="type a command..."
            />
          </div>
        </div>
      )}

      {/* Global confetti keyframe injected once */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(80vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </>
  );
}
