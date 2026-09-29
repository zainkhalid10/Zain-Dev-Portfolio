/**
 * CameraController — scroll-driven camera push/pull with inertia.
 * Reads directly from lenisStore inside useFrame (no React state).
 */
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { lenisStore } from '../lenisStore';

const _lookAt = new THREE.Vector3();
const lerpFactor = 0.035;

export default function CameraController() {
  const { camera } = useThree();
  const current = useRef({
    x: 0,
    y: 0,
    z: 5,
    lookY: 0,
  });

  useFrame(({ clock }) => {
    const p = lenisStore.progress;
    const v = Math.min(Math.abs(lenisStore.velocity) / 40, 1);
    const t = clock.elapsedTime;

    // Map scroll progress to camera positions
    // Subtle push forward as user scrolls, with a sine oscillation per section
    const targetZ = 5.0 - p * 1.2 + Math.sin(p * Math.PI * 4) * 0.2;
    const targetY = -p * 0.6 + Math.sin(t * 0.12) * 0.06;
    const targetX = Math.sin(t * 0.08) * 0.08 + Math.sin(p * Math.PI * 2) * 0.1;

    // Apply velocity-driven sway (faster scroll = more sway)
    const swayX = Math.sin(t * 2.0) * v * 0.04;

    // Inertia lerp
    const c = current.current;
    c.x += (targetX + swayX - c.x) * lerpFactor;
    c.y += (targetY - c.y) * lerpFactor;
    c.z += (targetZ - c.z) * lerpFactor;

    camera.position.set(c.x, c.y, c.z);

    // Look slightly ahead of center to create parallax depth feel
    const lookTargetY = c.y * 0.25;
    _lookAt.set(
      Math.sin(p * Math.PI) * 0.15,
      lookTargetY,
      0,
    );
    camera.lookAt(_lookAt);
  });

  return null;
}
