import { PropsWithChildren, useEffect, useRef } from "react";
import "./styles/Landing.css";
import { config } from "../config";
import { lenis } from "./Navbar";
import { shouldAnimate } from "./utils/motion";

const Landing = ({ children }: PropsWithChildren) => {
  const introRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const depthRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const primaryCtaRef = useRef<HTMLButtonElement>(null);
  const secondaryCtaRef = useRef<HTMLButtonElement>(null);
  const nameParts = config.developer.fullName.split(" ");
  const firstName = nameParts[0] || config.developer.name;
  const lastName = nameParts.slice(1).join(" ") || "";
  const locationLabel = config.social.location.split(",")[0];

  useEffect(() => {
    if (!shouldAnimate() || window.innerWidth <= 1024) return;

    const intro = introRef.current;
    const info = infoRef.current;
    const depth = depthRef.current;
    const spotlight = spotlightRef.current;
    if (!intro) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = 0;

    const onMove = (e: MouseEvent) => {
      if (window.innerWidth <= 1024) return;
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.055;
      currentY += (targetY - currentY) * 0.055;

      intro.style.setProperty("--parallax-x", `${currentX * -12}px`);
      intro.style.setProperty("--parallax-y", `${currentY * -7}px`);

      if (info) {
        info.style.setProperty("--parallax-x", `${currentX * 16}px`);
        info.style.setProperty("--parallax-y", `${currentY * 9}px`);
      }
      if (depth) {
        depth.style.setProperty("--depth-x", `${currentX * 5}px`);
        depth.style.setProperty("--depth-y", `${currentY * 4}px`);
      }
      if (spotlight) {
        spotlight.style.setProperty("--spot-x", `${50 + currentX * 14}%`);
        spotlight.style.setProperty("--spot-y", `${42 + currentY * 12}%`);
      }

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (!shouldAnimate()) return;

    const buttons = [primaryCtaRef.current, secondaryCtaRef.current].filter(
      Boolean
    ) as HTMLButtonElement[];
    if (buttons.length === 0 || window.innerWidth <= 768) return;

    const cleanups = buttons.map((btn) => {
      const onMove = (e: MouseEvent) => {
        const rect = btn.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const dist = Math.hypot(dx, dy);
        const maxDist = 110;

        if (dist < maxDist) {
          const pull = (1 - dist / maxDist) * 0.32;
          btn.style.setProperty("--mag-x", `${dx * pull}px`);
          btn.style.setProperty("--mag-y", `${dy * pull}px`);
        } else {
          btn.style.removeProperty("--mag-x");
          btn.style.removeProperty("--mag-y");
        }
      };

      const onLeave = () => {
        btn.style.removeProperty("--mag-x");
        btn.style.removeProperty("--mag-y");
      };

      btn.addEventListener("mousemove", onMove);
      btn.addEventListener("mouseleave", onLeave);

      return () => {
        btn.removeEventListener("mousemove", onMove);
        btn.removeEventListener("mouseleave", onLeave);
      };
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  const scrollToSection = (selector: string) => {
    const target = document.querySelector(selector) as HTMLElement;
    if (target && lenis) {
      lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    } else if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <div className="landing-section" id="landingDiv">
        <div className="landing-depth" ref={depthRef} aria-hidden="true">
          <div className="landing-ambient-orb landing-ambient-orb--1" />
          <div className="landing-ambient-orb landing-ambient-orb--2" />
          <div className="landing-grid" />
          <div className="landing-horizon" />
          <div className="landing-spotlight" ref={spotlightRef} />
          <div className="landing-vignette" />
        </div>

        <div className="landing-container">
          <div className="landing-intro" ref={introRef}>
            <div className="landing-eyebrow">
              <span className="landing-badge">
                <span className="landing-badge-dot" />
                AI Engineer
              </span>
              <span className="landing-status">{locationLabel}</span>
            </div>
            <h2 className="landing-greeting">Hello! I'm</h2>
            <h1 className="landing-name">
              {config.developer.fullName.toUpperCase()}
            </h1>
            <p className="landing-tagline">{config.developer.description}</p>
            <div className="landing-actions">
              <button
                type="button"
                ref={primaryCtaRef}
                className="landing-cta-primary"
                onClick={() => scrollToSection("#work")}
                data-cursor="disable"
              >
                <span className="landing-cta-label">View Work</span>
                <span className="landing-cta-arrow">→</span>
                <span className="landing-cta-shine" aria-hidden="true" />
              </button>
              <button
                type="button"
                ref={secondaryCtaRef}
                className="landing-cta-secondary"
                onClick={() => scrollToSection("#contact")}
                data-cursor="disable"
              >
                <span className="landing-cta-label">Get in Touch</span>
              </button>
            </div>
          </div>

          <div className="landing-info" ref={infoRef}>
            <h3>A</h3>
            <div className="landing-info-roles">
              <div className="landing-role-primary">{config.developer.title}</div>
              <div className="landing-role-secondary">AI Developer &amp; Systems Builder</div>
            </div>
          </div>

          <button
            type="button"
            className="landing-scroll-cue"
            onClick={() => scrollToSection("#about")}
            aria-label="Scroll to about section"
            data-cursor="disable"
          >
            <span>Scroll</span>
            <div className="landing-scroll-line">
              <div className="landing-scroll-dot" />
            </div>
          </button>

          <div className="mobile-photo">
            <img src="/images/mypicnbg.png" alt={config.developer.fullName} />
          </div>
        </div>
        {children}
      </div>
    </>
  );
};

export default Landing;
