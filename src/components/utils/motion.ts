import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const MOTION = {
  ease: "power3.out",
  easeInOut: "power2.inOut",
  duration: { fast: 0.45, base: 0.7, slow: 1.05 },
  stagger: 0.06,
  scrollStart: "top 82%",
} as const;

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isCoarsePointer(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}

export function shouldAnimate(): boolean {
  return !prefersReducedMotion();
}

export function initScrollReveals() {
  if (!shouldAnimate()) {
    document.querySelectorAll(".reveal, .reveal-stagger, .reveal-item").forEach((el) => {
      el.classList.add("reveal-visible");
    });
    return () => {};
  }

  const ctx = gsap.context(() => {
    gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: MOTION.duration.base,
          ease: MOTION.ease,
          scrollTrigger: {
            trigger: el,
            start: MOTION.scrollStart,
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    gsap.utils.toArray<HTMLElement>(".reveal-stagger").forEach((group) => {
      const items = group.querySelectorAll(".reveal-item");
      if (!items.length) return;
      gsap.fromTo(
        items,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: MOTION.duration.base,
          ease: MOTION.ease,
          stagger: MOTION.stagger,
          scrollTrigger: {
            trigger: group,
            start: MOTION.scrollStart,
            toggleActions: "play none none reverse",
          },
        }
      );
    });
  });

  return () => ctx.revert();
}
