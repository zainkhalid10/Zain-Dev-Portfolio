/**
 * PaintScene — the persistent full-viewport WebGL canvas.
 * Fixed behind all HTML sections; pointer-events disabled so HTML
 * links/buttons remain clickable.
 *
 * Performance:
 *  - AdaptiveDpr: auto-reduces pixel ratio under load
 *  - AdaptiveEvents: disables expensive events when needed
 *  - isMobile flag reduces particle count + shader complexity
 */
import { Canvas } from '@react-three/fiber';
import { Environment, AdaptiveDpr } from '@react-three/drei';
import MorphingBlob from './MorphingBlob';
import ParticleField from './ParticleField';
import CameraController from './CameraController';
import PostFX from './PostFX';

interface Props {
  isMobile: boolean;
}

export default function PaintScene({ isMobile }: Props) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 100 }}
        gl={{
          antialias: !isMobile,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        style={{ width: '100%', height: '100%' }}
        frameloop="always"
      >
        {/* Scene background — deep void */}
        <color attach="background" args={['#080610']} />

        {/* Adaptive DPR: clamps pixel ratio 1x–2x, auto-reduces on slow frames */}
        <AdaptiveDpr pixelated />

        {/* HDR environment map — gives MeshDistortMaterial reflections */}
        <Environment preset="studio" />

        {/* Colored fill lights for the electric violet / cyan / magenta palette */}
        <ambientLight intensity={0.15} color="#180830" />
        <pointLight position={[4, 3, 3]}   intensity={3.5}  color="#7b2fff" />
        <pointLight position={[-4, -2, 2]} intensity={2.5}  color="#00e5ff" />
        <pointLight position={[0,  5, -4]} intensity={1.8}  color="#ff2d78" />
        <pointLight position={[2, -4, 1]}  intensity={1.2}  color="#ff7b2f" />

        {/* Core components */}
        <CameraController />
        <MorphingBlob isMobile={isMobile} />
        <ParticleField isMobile={isMobile} />

        {/* Post-processing */}
        <PostFX isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
