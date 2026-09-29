import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import WorldCanvas from "./WorldCanvas";
import DiveOverlay, { DiveTarget } from "./DiveOverlay";
import "./Gateway.css";

// Card identity colours [r, g, b]
const DEV_COLOR:    [number, number, number] = [194, 164, 255];
const CREATE_COLOR: [number, number, number] = [240, 165,   0];

const Gateway = () => {
  const navigate      = useNavigate();
  const containerRef  = useRef<HTMLDivElement>(null);
  const devCardRef    = useRef<HTMLButtonElement>(null);
  const createCardRef = useRef<HTMLButtonElement>(null);

  const [transitioning, setTransitioning] = useState(false);
  const [dive, setDive] = useState<{ target: DiveTarget; path: string } | null>(null);

  // ── Lock body scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.height   = "100vh";
    return () => {
      document.body.style.overflow = "";
      document.body.style.height   = "";
    };
  }, []);

  // ── Entrance animations ─────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.15 });

      tl.fromTo(
        ".gw-eyebrow",
        { opacity: 0, y: 14, filter: "blur(6px)" },
        { opacity: 1, y: 0,  filter: "blur(0px)", duration: 0.8, ease: "power3.out" }
      )
        .fromTo(
          ".gw-title",
          { opacity: 0, y: 56, filter: "blur(14px)" },
          { opacity: 1, y: 0,  filter: "blur(0px)", duration: 1.1, ease: "power3.out" },
          "-=0.55"
        )
        .fromTo(
          ".gw-subtitle",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0,  duration: 0.7, ease: "power3.out" },
          "-=0.7"
        )
        .fromTo(
          ".gw-card",
          { opacity: 0, y: 70, scale: 0.88 },
          { opacity: 1, y: 0,  scale: 1, duration: 1.0, stagger: 0.13, ease: "back.out(1.6)" },
          "-=0.5"
        )
        .fromTo(
          ".gw-divider",
          { opacity: 0, scaleY: 0 },
          { opacity: 1, scaleY: 1, duration: 0.6, ease: "power2.out" },
          "-=0.8"
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // ── Magnetic hover ──────────────────────────────────────────────────────────
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(".gw-card");
    const cleanups: (() => void)[] = [];

    cards.forEach(card => {
      const onMove = (e: MouseEvent) => {
        if (transitioning) return;
        const rect = card.getBoundingClientRect();
        const dx   = e.clientX - (rect.left + rect.width  / 2);
        const dy   = e.clientY - (rect.top  + rect.height / 2);
        const dist = Math.hypot(dx, dy);
        if (dist < 300) {
          const pull = (1 - dist / 300) * 0.14;
          gsap.to(card, { x: dx * pull, y: dy * pull, duration: 0.55, ease: "power2.out" });
        } else {
          gsap.to(card, { x: 0, y: 0, duration: 0.7, ease: "power2.out" });
        }
      };
      const onLeave = () => gsap.to(card, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1,0.5)" });

      document.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        document.removeEventListener("mousemove", onMove);
        card.removeEventListener("mouseleave", onLeave);
      });
    });

    return () => cleanups.forEach(fn => fn());
  }, [transitioning]);

  // ── Card select → fire dive ─────────────────────────────────────────────────
  const handleSelect = (
    path: string,
    type: "dev" | "creative",
    cardEl: HTMLButtonElement | null
  ) => {
    if (transitioning || !cardEl) return;
    setTransitioning(true);

    // Measure card centre in viewport coordinates
    const rect = cardEl.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;

    // Animate: cards + UI fade / scale out toward the click point
    gsap.to(".gw-content", {
      opacity:  0,
      scale:    0.94,
      duration: 0.5,
      ease:     "power3.in",
    });

    // Trigger dive canvas
    setDive({
      path,
      target: {
        cx,
        cy,
        color: type === "dev" ? DEV_COLOR : CREATE_COLOR,
      },
    });
  };

  // Called when DiveOverlay animation finishes
  const onDiveComplete = useCallback(() => {
    if (dive) navigate(dive.path);
  }, [dive, navigate]);

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <div className="gw-root" ref={containerRef}>

      {/* ── World canvas + ambient bg ────────────────────────────── */}
      <div className="gw-bg" aria-hidden="true">
        <WorldCanvas />
        <div className="gw-orb gw-orb-purple" />
        <div className="gw-orb gw-orb-amber" />
        <div className="gw-orb gw-orb-center" />
        <div className="gw-grid" />
        <div className="gw-vignette" />
        <div className="gw-noise" />
      </div>

      {/* ── Dive overlay (mounts on click) ───────────────────────── */}
      {dive && (
        <DiveOverlay target={dive.target} onComplete={onDiveComplete} />
      )}

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="gw-content">
        {/* Header */}
        <header className="gw-header">
          <span className="gw-eyebrow">
            <span className="gw-dot" />
            Muhammad Zain · Select Experience
          </span>
          <h1 className="gw-title">
            Choose Your
            <br />
            <em>World</em>
          </h1>
          <p className="gw-subtitle">Two identities. One creator.</p>
        </header>

        {/* Cards row */}
        <div className="gw-selector">

          {/* ─── Developer Card ─── */}
          <button
            type="button"
            ref={devCardRef}
            className="gw-card gw-card-dev"
            onClick={() => handleSelect("/dev", "dev", devCardRef.current)}
            disabled={transitioning}
            aria-label="Enter Developer Portfolio"
          >
            <div className="gw-card-border" />
            <div className="gw-card-glow-fill" />
            <div className="gw-scanlines" />
            <div className="gw-card-inner">
              <div className="gw-icon gw-icon-dev">
                <span className="bracket">&lt;</span>
                <span className="slash">/</span>
                <span className="bracket">&gt;</span>
              </div>
              <div className="gw-card-label">Full-Stack · AI / ML</div>
              <h2 className="gw-card-name">Developer</h2>
              <p className="gw-card-desc">
                Systems, algorithms,
                <br />
                intelligent products.
              </p>
              <span className="gw-enter">
                Enter
                <span className="gw-arrow">→</span>
              </span>
              <div className="gw-chips">
                <span>React</span>
                <span>Python</span>
                <span>AI / ML</span>
              </div>
            </div>
          </button>

          {/* ─── Divider ─── */}
          <div className="gw-divider" aria-hidden="true">
            <div className="gw-divider-line" />
            <span className="gw-divider-or">or</span>
            <div className="gw-divider-line" />
          </div>

          {/* ─── Creative Card ─── */}
          <button
            type="button"
            ref={createCardRef}
            className="gw-card gw-card-creative"
            onClick={() => handleSelect("/creative", "creative", createCardRef.current)}
            disabled={transitioning}
            aria-label="Enter Creative Portfolio"
          >
            <div className="gw-card-border" />
            <div className="gw-card-glow-fill" />
            <div className="gw-card-inner">
              <div className="gw-icon gw-icon-creative">✦</div>
              <div className="gw-card-label">Design · Motion · Media</div>
              <h2 className="gw-card-name">Creative</h2>
              <p className="gw-card-desc">
                Design, motion,
                <br />
                visual storytelling.
              </p>
              <span className="gw-enter">
                Enter
                <span className="gw-arrow">→</span>
              </span>
              <div className="gw-chips">
                <span>Design</span>
                <span>Motion</span>
                <span>Media</span>
              </div>
            </div>
          </button>

        </div>

        {/* Bottom hint */}
        <p className="gw-hint" aria-hidden="true">
          {transitioning ? "" : "Click a card to enter"}
        </p>
      </div>
    </div>
  );
};

export default Gateway;
