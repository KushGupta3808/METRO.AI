import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { motion } from 'framer-motion';

function Globe() {
  const outerRef = useRef();
  const innerRef = useRef();

  useFrame((_, delta) => {
    if (outerRef.current) outerRef.current.rotation.y += delta * 0.25;
    if (innerRef.current) innerRef.current.rotation.y -= delta * 0.4;
  });

  return (
    <group>
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[1.6, 2]} />
        <meshBasicMaterial color="#4FC3F7" wireframe transparent opacity={0.45} />
      </mesh>
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshBasicMaterial color="#0FB87F" wireframe transparent opacity={0.35} />
      </mesh>
      <pointLight position={[3, 3, 3]} intensity={40} color="#4FC3F7" />
      <pointLight position={[-3, -2, -2]} intensity={25} color="#0FB87F" />
    </group>
  );
}

const STAGES = [
  'Establishing secure channel',
  'Syncing global rate feeds',
  'Calibrating AI routing model',
  'Finalizing session',
];

export default function Loader3D({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const stage = useMemo(() => {
    const idx = Math.min(STAGES.length - 1, Math.floor((progress / 100) * STAGES.length));
    return STAGES[idx];
  }, [progress]);

  useEffect(() => {
    const start = performance.now();
    const duration = 2600;
    let frame;

    const tick = (now) => {
      const pct = Math.min(100, ((now - start) / duration) * 100);
      setProgress(pct);
      if (pct < 100) {
        frame = requestAnimationFrame(tick);
      } else {
        setTimeout(onComplete, 350);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-void flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-80">
        <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
          <Stars radius={40} depth={30} count={1200} factor={2} fade speed={0.6} />
          <Globe />
        </Canvas>
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center gap-7 px-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="brand-card px-6 py-4">
          <img src="/logo-full.png" alt="METRO AI" className="h-14 md:h-16 w-auto" />
        </div>

        <div className="w-72 md:w-96">
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-sapphireNeon via-emeraldNeon to-sapphireNeon rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between font-mono text-xs text-slate-400">
            <span>{stage}...</span>
            <span>{Math.floor(progress)}%</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
