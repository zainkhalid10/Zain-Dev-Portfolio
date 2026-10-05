import { useEffect, useRef } from "react";
import "./styles/Cursor.css";
import gsap from "gsap";
import { isCoarsePointer, prefersReducedMotion } from "./utils/motion";

const TRAIL_COUNT = 8;

const Cursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || isCoarsePointer()) return;

    let hover = false;
    const cursor = cursorRef.current!;
    const mousePos = { x: 0, y: 0 };
    const cursorPos = { x: 0, y: 0 };
    let rafId = 0;

    // ── Particle trail ─────────────────────────────────
    const trail: { el: HTMLDivElement; x: number; y: number }[] = [];

    for (let i = 0; i < TRAIL_COUNT; i++) {
      const el = document.createElement("div");
      el.className = "cursor-trail";
      const progress = i / TRAIL_COUNT;          // 0 → oldest, 1 → newest
      const size = 4 + progress * 8;             // 4px … 12px
      el.style.cssText = `
        width:${size}px;
        height:${size}px;
        opacity:${0.06 + progress * 0.22};
      `;
      document.body.appendChild(el);
      trail.push({ el, x: 0, y: 0 });
    }

    const onMouseMove = (e: MouseEvent) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
    };

    document.addEventListener("mousemove", onMouseMove);

    const loop = () => {
      if (!hover) {
        cursorPos.x += (mousePos.x - cursorPos.x) / 6;
        cursorPos.y += (mousePos.y - cursorPos.y) / 6;
        gsap.set(cursor, { x: cursorPos.x, y: cursorPos.y });
      }

      // Each trail dot chases the dot in front of it
      let prevX = mousePos.x;
      let prevY = mousePos.y;
      for (let i = trail.length - 1; i >= 0; i--) {
        const dot = trail[i];
        const lag = 0.11 + (i / trail.length) * 0.14;
        dot.x += (prevX - dot.x) * lag;
        dot.y += (prevY - dot.y) * lag;
        gsap.set(dot.el, { x: dot.x - parseFloat(dot.el.style.width) / 2, y: dot.y - parseFloat(dot.el.style.height) / 2 });
        prevX = dot.x;
        prevY = dot.y;
      }

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    // ── data-cursor interactions ────────────────────────
    const dataCursorEls = document.querySelectorAll("[data-cursor]");
    const dataCleanups = Array.from(dataCursorEls).map((item) => {
      const element = item as HTMLElement;

      const onOver = (e: MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        if (element.dataset.cursor === "icons") {
          cursor.classList.add("cursor-icons");
          gsap.set(cursor, { x: rect.left, y: rect.top });
          cursor.style.setProperty("--cursorH", `${rect.height}px`);
          hover = true;
        }
        if (element.dataset.cursor === "disable") {
          cursor.classList.add("cursor-disable");
        }
      };

      const onOut = () => {
        cursor.classList.remove("cursor-disable", "cursor-icons");
        hover = false;
      };

      element.addEventListener("mouseover", onOver);
      element.addEventListener("mouseout", onOut);

      return () => {
        element.removeEventListener("mouseover", onOver);
        element.removeEventListener("mouseout", onOut);
      };
    });

    // ── Content-aware cursor mode ───────────────────────────────────────────
    // Sections tagged with data-cursor-zone="code" show terminal cursor label
    let modeLabel: HTMLSpanElement | null = null;

    const setMode = (mode: "code" | "art" | null) => {
      cursor.classList.remove("cursor-mode-code", "cursor-mode-art");
      modeLabel?.remove();
      modeLabel = null;
      if (!mode) return;
      cursor.classList.add(`cursor-mode-${mode}`);
      modeLabel = document.createElement("span");
      modeLabel.className = "cursor-mode-label";
      modeLabel.textContent = mode === "code" ? "</>" : "✦";
      cursor.appendChild(modeLabel);
    };

    // Tag sections automatically
    const workSection  = document.getElementById("work");
    const aboutSection = document.getElementById("about");

    const zonedEls: { el: HTMLElement; mode: "code" | "art" }[] = [
      ...(workSection  ? [{ el: workSection,  mode: "code" as const }] : []),
      ...(aboutSection ? [{ el: aboutSection, mode: "code" as const }] : []),
    ];

    const zoneCleanups = zonedEls.map(({ el, mode }) => {
      const enter = () => setMode(mode);
      const leave = () => setMode(null);
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
      return () => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      };
    });

    // ── hover expand ────────────────────────────────────
    const interactiveEls = document.querySelectorAll(
      "a, button, .work-box, .see-all-btn, .cta-btn"
    );
    const interactiveCleanups = Array.from(interactiveEls).map((item) => {
      const element = item as HTMLElement;
      if (element.closest("[data-cursor='disable']")) return () => {};

      const onEnter = () => cursor.classList.add("cursor-hover");
      const onLeave = () => cursor.classList.remove("cursor-hover");

      element.addEventListener("mouseenter", onEnter);
      element.addEventListener("mouseleave", onLeave);

      return () => {
        element.removeEventListener("mouseenter", onEnter);
        element.removeEventListener("mouseleave", onLeave);
      };
    });

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", onMouseMove);
      trail.forEach((d) => d.el.remove());
      modeLabel?.remove();
      dataCleanups.forEach((fn) => fn());
      zoneCleanups.forEach((fn) => fn());
      interactiveCleanups.forEach((fn) => fn());
    };
  }, []);

  if (prefersReducedMotion() || isCoarsePointer()) {
    return null;
  }

  return <div className="cursor-main" ref={cursorRef} aria-hidden="true" />;
};

export default Cursor;
