/**
 * PostFX — post-processing pipeline for the creative portfolio scene.
 * Desktop: Bloom + DepthOfField + ChromaticAberration + Vignette
 * Mobile:  Bloom + Vignette only (performance budget)
 *
 * Note: ChromaticAberration offset is driven by scroll velocity via a
 * module-level Vector2 that gets mutated each frame.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  Vignette,
  DepthOfField,
  ChromaticAberration,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { lenisStore } from '../lenisStore';

interface Props {
  isMobile: boolean;
}

export default function PostFX({ isMobile }: Props) {
  // Mutable Vector2 for chromatic aberration — mutated in useFrame, not re-created
  const caOffset = useMemo(() => new THREE.Vector2(0, 0), []);

  // DOF bokeh scale target (driven by scroll section)
  const bokehRef = useRef(2);

  useFrame(() => {
    const v = Math.min(Math.abs(lenisStore.velocity) / 40, 1);
    const p = lenisStore.progress;

    // Chromatic aberration spikes with scroll velocity
    const aberration = v * 0.006;
    caOffset.set(aberration, aberration * 0.5);

    // Bokeh scale changes per section
    // Hero: soft focus (large bokeh)
    // Work section: sharp focus (small bokeh)
    // Contact: relaxed again
    const targetBokeh = p < 0.12
      ? 3.5
      : p < 0.30
      ? 2.0
      : p < 0.58
      ? 1.5
      : p < 0.72
      ? 4.0   // experience: dreamy
      : 2.5;

    bokehRef.current += (targetBokeh - bokehRef.current) * 0.03;
  });

  if (isMobile) {
    return (
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.18}
          luminanceSmoothing={0.9}
          intensity={0.7}
          blendFunction={BlendFunction.ADD}
        />
        <Vignette eskil={false} offset={0.12} darkness={0.75} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.15}
        luminanceSmoothing={0.9}
        intensity={0.85}
        blendFunction={BlendFunction.ADD}
      />
      <DepthOfField
        focusDistance={0.005}
        focalLength={0.028}
        bokehScale={2.5}
        height={480}
      />
      <ChromaticAberration
        offset={caOffset}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.12} darkness={0.72} />
    </EffectComposer>
  );
}
