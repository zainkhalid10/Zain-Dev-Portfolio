import { TextSplitter } from "../../utils/textSplitter";
import gsap from "gsap";
import { lenis } from "../Navbar";
import { prefersReducedMotion, shouldAnimate } from "./motion";

export function initialFX() {
  document.body.style.overflowY = "auto";
  if (lenis) {
    lenis.start();
  }
  document.getElementsByTagName("main")[0].classList.add("main-active");

  // ── Mobile: skip all GSAP, make everything visible immediately ───────────
  if (window.innerWidth <= 768) {
    const mobileReveal = [
      ".landing-ambient-orb--1",
      ".landing-ambient-orb--2",
      ".landing-grid",
      ".landing-horizon",
      ".landing-spotlight",
      ".landing-vignette",
      ".landing-badge",
      ".landing-status",
      ".landing-tagline",
      ".landing-info-h2",
      ".landing-actions",
      ".landing-scroll-cue",
      ".mobile-photo",
      ".landing-info h3",
      ".landing-role-primary",
      ".landing-role-secondary",
      ".landing-info-roles",
      ".header",
      ".icons-section",
      ".landing-greeting",
      ".landing-name",
    ];
    gsap.set(mobileReveal, { opacity: 1, clearProps: "transform,filter,y,x,scale" });
    return;
  }

  if (prefersReducedMotion()) {
    gsap.set(
      [
        ".landing-ambient-orb--1",
        ".landing-ambient-orb--2",
        ".landing-grid",
        ".landing-horizon",
        ".landing-spotlight",
        ".landing-vignette",
        ".landing-badge",
        ".landing-status",
        ".landing-tagline",
        ".landing-info-h2",
        ".landing-actions",
        ".landing-scroll-cue",
        ".mobile-photo",
        ".landing-info h3",
        ".header",
        ".icons-section",
      ],
      { opacity: 1, clearProps: "transform,filter" }
    );
    gsap.set(".landing-greeting, .landing-name, .landing-h2-1, .landing-h2-info", {
      opacity: 1,
      clearProps: "transform,filter",
    });
    return;
  }

  gsap.to("body", {
    backgroundColor: "#0b080c",
    duration: 0.6,
    delay: 0.2,
  });

  const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

  heroTl
    .fromTo(
      ".landing-ambient-orb--1",
      { opacity: 0, scale: 0.6 },
      { opacity: 1, scale: 1, duration: 1.6, ease: "power2.out" },
      0
    )
    .fromTo(
      ".landing-ambient-orb--2",
      { opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1, duration: 1.8, ease: "power2.out" },
      0.15
    )
    .fromTo(
      ".landing-grid",
      { opacity: 0, scale: 1.08 },
      { opacity: 1, scale: 1, duration: 1.4, ease: "power2.out" },
      0
    )
    .fromTo(
      ".landing-horizon",
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1.2 },
      0.2
    )
    .fromTo(
      ".landing-spotlight",
      { opacity: 0 },
      { opacity: 1, duration: 1.6 },
      0.3
    )
    .fromTo(
      ".landing-vignette",
      { opacity: 0 },
      { opacity: 1, duration: 1.4 },
      0.1
    )
    .fromTo(
      ".landing-badge",
      { opacity: 0, y: 20, filter: "blur(4px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8 },
      0.35
    )
    .fromTo(
      ".landing-status",
      { opacity: 0, x: -14, filter: "blur(2px)" },
      { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.7 },
      0.52
    )
    .fromTo(
      ".header, .icons-section",
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.85, stagger: 0.06 },
      0.4
    );

  const greeting = new TextSplitter(".landing-greeting", {
    type: "chars,lines",
    linesClass: "split-line",
  });
  const name = new TextSplitter(".landing-name", {
    type: "chars,lines",
    linesClass: "split-line",
  });

  heroTl.fromTo(
    greeting.chars,
    { opacity: 0, y: 36, filter: "blur(6px)", rotateX: 40 },
    {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      rotateX: 0,
      duration: 0.85,
      stagger: 0.028,
      transformOrigin: "50% 100%",
    },
    0.55
  );

  heroTl.fromTo(
    name.chars,
    { opacity: 0, y: 72, filter: "blur(8px)", scale: 0.92 },
    {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      duration: 1.05,
      stagger: 0.016,
      ease: "power4.out",
    },
    0.72
  );

  heroTl
    .fromTo(
      ".landing-tagline",
      { opacity: 0, y: 24, filter: "blur(3px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.85 },
      1.38
    )
    .fromTo(
      ".landing-info-h2",
      { opacity: 0, y: 28, filter: "blur(4px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.95 },
      1.15
    )
    .fromTo(
      ".landing-actions",
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.75 },
      1.68
    )
    .fromTo(
      ".landing-scroll-cue",
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.75 },
      2.15
    )
    .fromTo(
      ".mobile-photo",
      { opacity: 0, y: 36, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 1.05, ease: "power2.out" },
      1.1
    );

  const TextProps = { type: "chars,lines", linesClass: "split-h2" };
  const landingText2 = new TextSplitter(".landing-h2-info", TextProps);
  const landingText3 = new TextSplitter(".landing-h2-info-1", TextProps);
  const landingText4 = new TextSplitter(".landing-h2-1", TextProps);
  const landingText5 = new TextSplitter(".landing-h2-2", TextProps);

  heroTl.fromTo(
    landingText4.chars,
    { opacity: 0, y: 56, filter: "blur(5px)" },
    {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.95,
      stagger: 0.022,
    },
    1.22
  );

  heroTl.fromTo(
    landingText2.chars,
    { opacity: 0, y: 50, filter: "blur(4px)" },
    {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.9,
      stagger: 0.025,
    },
    1.48
  );

  gsap.fromTo(
    ".landing-info h3",
    { opacity: 0, scale: 0.8 },
    { opacity: 1, scale: 1, duration: 0.55, delay: 1.25, ease: "back.out(2)" }
  );

  if (shouldAnimate()) {
    gsap.delayedCall(4.5, () => {
      LoopText(landingText2, landingText3);
      LoopText(landingText4, landingText5);
    });

    gsap.to(".landing-grid", {
      backgroundPosition: "72px 72px",
      duration: 28,
      ease: "none",
      repeat: -1,
    });

    gsap.to(".landing-ambient-orb--1", {
      x: 30,
      y: -20,
      duration: 9,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    gsap.to(".landing-ambient-orb--2", {
      x: -24,
      y: 16,
      duration: 11,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: 1.5,
    });
  }
}

function LoopText(Text1: TextSplitter, Text2: TextSplitter) {
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
  const delay = 4;
  const delay2 = delay * 2 + 1;

  tl.fromTo(
    Text2.chars,
    { opacity: 0, y: 80 },
    {
      opacity: 1,
      duration: 1.2,
      ease: "power3.inOut",
      y: 0,
      stagger: 0.1,
      delay: delay,
    },
    0
  )
    .fromTo(
      Text1.chars,
      { y: 80 },
      {
        duration: 1.2,
        ease: "power3.inOut",
        y: 0,
        stagger: 0.1,
        delay: delay2,
      },
      1
    )
    .fromTo(
      Text1.chars,
      { y: 0 },
      {
        y: -80,
        duration: 1.2,
        ease: "power3.inOut",
        stagger: 0.1,
        delay: delay,
      },
      0
    )
    .to(
      Text2.chars,
      {
        y: -80,
        duration: 1.2,
        ease: "power3.inOut",
        stagger: 0.1,
        delay: delay2,
      },
      1
    );
}
