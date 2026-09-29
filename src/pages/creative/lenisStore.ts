/**
 * lenisStore — module-level Lenis instance reference.
 * R3F components read scroll state directly from here inside useFrame
 * without going through React state (avoids unnecessary re-renders).
 */

export interface LenisRef {
  progress: number;  // 0–1 scroll progress
  velocity: number;  // raw velocity
  scroll: number;    // raw scroll position in px
  limit: number;     // max scroll in px
}

// Mutable reference updated by the scroll hook every animation frame
export const lenisStore: LenisRef = {
  progress: 0,
  velocity: 0,
  scroll: 0,
  limit: 1,
};
