/**
 * MorphingBlob — the persistent visual entity of the portfolio.
 *
 * Uses @react-three/drei's MeshDistortMaterial (extends MeshStandardMaterial)
 * with a high-subdivision icosahedron. Scroll progress drives:
 *   – distortion amount & speed (noise amplitude)
 *   – material color + emissive (section-keyed palette)
 *   – roughness / metalness (glossy paint → dull sculpture → back to glossy)
 *   – mesh scale & idle rotation
 *
 * All mutations happen inside useFrame via direct uniform/property writes —
 * zero React re-renders.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { lenisStore } from '../lenisStore';

// ── Morph state keyframes ────────────────────────────────────────────────────
// Each entry maps to a scroll progress window.
interface MorphState {
  distort: number;
  speed: number;
  scale: number;
  roughness: number;
  metalness: number;
  color: string;
  emissive: string;
  emissiveIntensity: number;
  envMapIntensity: number;
}

const KEYFRAMES: Array<{ at: number; state: MorphState }> = [
  {
    at: 0.00,
    state: { distort: 0.38, speed: 1.2, scale: 1.30, roughness: 0.04, metalness: 0.10, color: '#7b2fff', emissive: '#2d0a8a', emissiveIntensity: 0.55, envMapIntensity: 2.5 },
  },
  {
    at: 0.15,
    state: { distort: 1.10, speed: 4.5, scale: 0.95, roughness: 0.12, metalness: 0.15, color: '#00e5ff', emissive: '#004455', emissiveIntensity: 0.45, envMapIntensity: 2.2 },
  },
  {
    at: 0.30,
    state: { distort: 0.20, speed: 0.8, scale: 0.82, roughness: 0.35, metalness: 0.55, color: '#ff7b2f', emissive: '#4a1a00', emissiveIntensity: 0.35, envMapIntensity: 1.8 },
  },
  {
    at: 0.45,
    state: { distort: 1.20, speed: 6.0, scale: 1.80, roughness: 0.02, metalness: 0.05, color: '#ff2d78', emissive: '#5a0020', emissiveIntensity: 0.70, envMapIntensity: 2.8 },
  },
  {
    at: 0.60,
    state: { distort: 0.70, speed: 3.5, scale: 0.90, roughness: 0.75, metalness: 0.00, color: '#c2a4ff', emissive: '#1a0a40', emissiveIntensity: 0.20, envMapIntensity: 0.8 },
  },
  {
    at: 0.75,
    state: { distort: 0.14, speed: 0.35, scale: 1.10, roughness: 0.62, metalness: 0.92, color: '#00e5ff', emissive: '#001520', emissiveIntensity: 0.15, envMapIntensity: 3.0 },
  },
  {
    at: 0.90,
    state: { distort: 0.38, speed: 1.2, scale: 1.25, roughness: 0.04, metalness: 0.10, color: '#7b2fff', emissive: '#2d0a8a', emissiveIntensity: 0.55, envMapIntensity: 2.5 },
  },
  {
    at: 1.00,
    state: { distort: 0.30, speed: 1.0, scale: 1.20, roughness: 0.04, metalness: 0.10, color: '#7b2fff', emissive: '#2d0a8a', emissiveIntensity: 0.60, envMapIntensity: 2.5 },
  },
];

// Interpolate between two MorphStates
const _c1 = new THREE.Color();
const _c2 = new THREE.Color();
const _e1 = new THREE.Color();
const _e2 = new THREE.Color();

function interpolateState(p: number): MorphState {
  // Find surrounding keyframes
  let lower = KEYFRAMES[0];
  let upper = KEYFRAMES[KEYFRAMES.length - 1];

  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (p >= KEYFRAMES[i].at && p <= KEYFRAMES[i + 1].at) {
      lower = KEYFRAMES[i];
      upper = KEYFRAMES[i + 1];
      break;
    }
  }

  const range = upper.at - lower.at;
  const t = range < 0.0001 ? 0 : (p - lower.at) / range;
  const ease = t * t * (3 - 2 * t); // smoothstep

  const a = lower.state;
  const b = upper.state;

  _c1.set(a.color);
  _c2.set(b.color);
  _e1.set(a.emissive);
  _e2.set(b.emissive);

  return {
    distort:          a.distort          + (b.distort          - a.distort)          * ease,
    speed:            a.speed            + (b.speed            - a.speed)            * ease,
    scale:            a.scale            + (b.scale            - a.scale)            * ease,
    roughness:        a.roughness        + (b.roughness        - a.roughness)        * ease,
    metalness:        a.metalness        + (b.metalness        - a.metalness)        * ease,
    emissiveIntensity: a.emissiveIntensity + (b.emissiveIntensity - a.emissiveIntensity) * ease,
    envMapIntensity:  a.envMapIntensity  + (b.envMapIntensity  - a.envMapIntensity)  * ease,
    color:   '#' + _c1.lerp(_c2, ease).getHexString(),
    emissive:'#' + _e1.lerp(_e2, ease).getHexString(),
  };
}

// ── Component ────────────────────────────────────────────────────────────────
const _targetColor   = new THREE.Color();
const _targetEmissive = new THREE.Color();

interface Props {
  isMobile: boolean;
}

export default function MorphingBlob({ isMobile }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  // Use THREE.MeshPhysicalMaterial (base of DistortMaterialImpl) + extra props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matRef  = useRef<any>(null);

  // Smoothed current state (avoids jitter — all lerped in useFrame)
  const cur = useRef({
    distort: 0.38,
    speed: 1.2,
    scale: 1.30,
    roughness: 0.04,
    metalness: 0.10,
    emissiveIntensity: 0.55,
    envMapIntensity: 2.5,
    rotY: 0,
  });

  useFrame(({ clock }) => {
    if (!meshRef.current || !matRef.current) return;

    const p = lenisStore.progress;
    const v = Math.min(Math.abs(lenisStore.velocity) / 40, 1);
    const t = clock.elapsedTime;

    // Get interpolated target
    const target = interpolateState(p);

    // Velocity boosts distortion (faster scroll = more chaos)
    const velocityBoost = v * 0.35;

    // Inertia factors — slower for geometry, faster for color
    const lerpGeom  = isMobile ? 0.06 : 0.045;
    const lerpColor = isMobile ? 0.07 : 0.055;
    const lerpScale = 0.030;

    const c = cur.current;
    c.distort          += (target.distort + velocityBoost - c.distort) * lerpGeom;
    c.speed            += (target.speed - c.speed) * lerpGeom * 0.6;
    c.scale            += (target.scale - c.scale) * lerpScale;
    c.roughness        += (target.roughness - c.roughness) * lerpGeom;
    c.metalness        += (target.metalness - c.metalness) * lerpGeom;
    c.emissiveIntensity += (target.emissiveIntensity - c.emissiveIntensity) * lerpColor;
    c.envMapIntensity  += (target.envMapIntensity - c.envMapIntensity) * lerpColor;

    // ── Mesh transforms ───────────────────────────────────────────────────────
    meshRef.current.scale.setScalar(c.scale);

    // Rotation: slow base + velocity spike + idle oscillation
    c.rotY += 0.0025 + v * 0.015;
    meshRef.current.rotation.y = c.rotY;
    meshRef.current.rotation.x = Math.sin(t * 0.18) * 0.08 + v * 0.04;
    meshRef.current.rotation.z = Math.cos(t * 0.11) * 0.04;

    // Idle floating
    meshRef.current.position.y = Math.sin(t * 0.28) * 0.06;
    meshRef.current.position.x = Math.cos(t * 0.15) * 0.03;

    // ── Material updates ──────────────────────────────────────────────────────
    const mat = matRef.current;

    mat.distort          = c.distort;
    mat.speed            = c.speed;
    mat.time             = t;          // drives distort noise animation
    mat.roughness        = c.roughness;
    mat.metalness        = c.metalness;
    mat.emissiveIntensity = c.emissiveIntensity;
    mat.envMapIntensity  = c.envMapIntensity;

    _targetColor.set(target.color);
    _targetEmissive.set(target.emissive);

    mat.color.lerp(_targetColor, lerpColor);
    mat.emissive.lerp(_targetEmissive, lerpColor);
  });

  // Icosahedron: detail 5 on desktop (≈5k faces), 3 on mobile (≈1k faces)
  const detail = isMobile ? 3 : 5;

  return (
    <mesh ref={meshRef} castShadow={false} receiveShadow={false}>
      <icosahedronGeometry args={[1.5, detail]} />
      <MeshDistortMaterial
        ref={matRef}
        color="#7b2fff"
        emissive="#2d0a8a"
        emissiveIntensity={0.55}
        roughness={0.04}
        metalness={0.10}
        distort={0.38}
        speed={1.2}
        envMapIntensity={2.5}
        // No transparency — solid paint form
        transparent={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}
