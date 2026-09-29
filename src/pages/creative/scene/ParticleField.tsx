/**
 * ParticleField — ~1800 particles (desktop) / ~400 (mobile).
 * Visible during the Experience / Journey section (progress 0.55–0.85).
 * Particles drift and expand based on scroll velocity.
 * Reads directly from lenisStore inside useFrame (no React state).
 */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { lenisStore } from '../lenisStore';

interface Props {
  isMobile: boolean;
}

const VISIBLE_START = 0.55;
const VISIBLE_END   = 0.85;

export default function ParticleField({ isMobile }: Props) {
  const COUNT = isMobile ? 400 : 1800;

  // Pre-allocate geometry arrays
  const { positions, velocities, origins } = useMemo(() => {
    const positions  = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);
    const origins    = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const theta  = Math.random() * Math.PI * 2;
      const phi    = Math.acos(2 * Math.random() - 1);
      const r      = 1.3 + Math.random() * 0.7;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      origins[i * 3]     = x;
      origins[i * 3 + 1] = y;
      origins[i * 3 + 2] = z;
      positions[i * 3]     = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      velocities[i * 3]     = (Math.random() - 0.5) * 0.001;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
    }

    return { positions, velocities, origins };
  }, [COUNT]);

  const posAttrRef = useRef<THREE.BufferAttribute>(null);
  const matRef     = useRef<THREE.PointsMaterial>(null);

  useFrame(({ clock }) => {
    const p  = lenisStore.progress;
    const v  = Math.min(Math.abs(lenisStore.velocity) / 40, 1);
    const t  = clock.elapsedTime;

    if (!posAttrRef.current || !matRef.current) return;

    // Opacity envelope: fade in / out at section boundaries
    let opacity = 0;
    if (p >= VISIBLE_START && p <= VISIBLE_END) {
      const fadeIn  = Math.min(1, (p - VISIBLE_START) / 0.06);
      const fadeOut = Math.min(1, (VISIBLE_END - p) / 0.06);
      opacity = Math.min(fadeIn, fadeOut);
    }

    matRef.current.opacity = opacity;
    if (opacity < 0.01) return;

    // How far particles have spread (increases as we move deeper into section)
    const sectionP = Math.max(0, Math.min(1, (p - VISIBLE_START) / (VISIBLE_END - VISIBLE_START)));
    const spread   = 1.0 + sectionP * 1.8 + v * 0.7;

    const arr = posAttrRef.current.array as Float32Array;

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;

      // Random micro-drift
      velocities[i3]     += (Math.random() - 0.5) * 0.00018;
      velocities[i3 + 1] += (Math.random() - 0.5) * 0.00018;
      velocities[i3 + 2] += (Math.random() - 0.5) * 0.00018;

      // Damping
      velocities[i3]     *= 0.982;
      velocities[i3 + 1] *= 0.982;
      velocities[i3 + 2] *= 0.982;

      const freq  = 0.35 + (i % 9) * 0.05;
      const phase = i * 0.21;

      arr[i3]     = origins[i3]     * spread + velocities[i3]     * 12 + Math.sin(t * freq + phase)       * 0.045;
      arr[i3 + 1] = origins[i3 + 1] * spread + velocities[i3 + 1] * 12 + Math.cos(t * freq + phase * 1.4) * 0.045;
      arr[i3 + 2] = origins[i3 + 2] * spread + velocities[i3 + 2] * 12;
    }

    posAttrRef.current.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          ref={posAttrRef}
          attach="attributes-position"
          count={COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={isMobile ? 0.028 : 0.020}
        color="#c2a4ff"
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
