import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

function generateNodes(count = 28) {
  const nodes = [];
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    nodes.push(
      new THREE.Vector3(
        2.6 * Math.cos(theta) * Math.sin(phi),
        2.6 * Math.sin(theta) * Math.sin(phi),
        2.6 * Math.cos(phi)
      )
    );
  }
  return nodes;
}

function NetworkGroup() {
  const groupRef = useRef();
  const nodes = useMemo(() => generateNodes(28), []);

  const connections = useMemo(() => {
    const lines = [];
    nodes.forEach((a, i) => {
      nodes.forEach((b, j) => {
        if (j <= i) return;
        if (a.distanceTo(b) < 1.6) lines.push([a, b]);
      });
    });
    return lines;
  }, [nodes]);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.06;
  });

  return (
    <group ref={groupRef}>
      {nodes.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color={i % 5 === 0 ? '#0FB87F' : '#4FC3F7'} />
        </mesh>
      ))}
      {connections.map(([a, b], i) => (
        <Line key={i} points={[a, b]} color="#4FC3F7" lineWidth={0.5} transparent opacity={0.18} />
      ))}
    </group>
  );
}

export default function NetworkBackground() {
  return (
    <div className="absolute inset-0 -z-10 opacity-60 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 6], fov: 40 }}>
        <NetworkGroup />
      </Canvas>
    </div>
  );
}
