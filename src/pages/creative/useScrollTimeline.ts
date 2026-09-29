/**
 * useScrollTimeline — initializes Lenis smooth scroll, syncs with
 * GSAP ScrollTrigger, and returns React state for HTML-layer animations.
 * The lenisStore module is also kept up-to-date for R3F components.
 */
import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { lenisStore } from './lenisStore';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollState {
  progress: number;      // 0–1 normalized
  velocity: number;      // 0–1 normalized (capped)
  rawVelocity: number;   // raw px/ms-ish velocity from lenis
}

export function useScrollTimeline(): ScrollState {
  const [state, setState] = useState<ScrollState>({
    progress: 0,
    velocity: 0,
    rawVelocity: 0,
  });

  useEffect(() => {
    // Lenis smooth scroll configuration
    const lenis = new Lenis({
      duration: 1.6,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.8,
    } as ConstructorParameters<typeof Lenis>[0]);

    // Drive Lenis from GSAP's ticker for frame-perfect sync
    const rafCallback = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(rafCallback);
    gsap.ticker.lagSmoothing(0);

    // Keep GSAP ScrollTrigger positions up-to-date with Lenis
    lenis.on('scroll', ScrollTrigger.update);

    lenis.on('scroll', ({ progress, velocity, scroll, limit }: {
      progress: number;
      velocity: number;
      scroll: number;
      limit: number;
    }) => {
      const p = isNaN(progress) ? 0 : Math.max(0, Math.min(1, progress));
      const rawV = Math.abs(velocity || 0);
      const normV = Math.min(rawV / 40, 1);

      // Write to module store (for R3F useFrame — zero GC, no re-render)
      lenisStore.progress = p;
      lenisStore.velocity = rawV;
      lenisStore.scroll = scroll;
      lenisStore.limit = limit || 1;

      // Write to React state (for GSAP / HTML-layer sections)
      setState({ progress: p, velocity: normV, rawVelocity: rawV });
    });

    // Pause Lenis when tab is hidden (saves GPU/CPU)
    const handleVisibility = () => {
      if (document.hidden) lenis.stop();
      else lenis.start();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(rafCallback);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return state;
}
