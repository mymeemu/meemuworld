'use client';

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PointerLockControls, OrbitControls } from '@react-three/drei';

function PlayerAvatar({ isCustomizing }: { isCustomizing: boolean }) {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 1, 0]}>
        <capsuleGeometry args={[0.5, 1, 4, 8]} />
        <meshStandardMaterial color={isCustomizing ? '#00f0ff' : '#ffaa00'} roughness={0.3} />
      </mesh>
    </group>
  );
}

export default function GamePage() {
  const [isCustomizing, setIsCustomizing] = useState(false);

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#020208' }}>
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setIsCustomizing(!isCustomizing)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#111827',
            color: '#fff',
            border: '1px solid #374151',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {isCustomizing ? 'Voltar para Exploração (FPS)' : 'Personalizar Traje'}
        </button>
      </div>

      <Canvas camera={{ position: isCustomizing ? [0, 1.5, 4] : [0, 1.7, 0], fov: 75 }}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 20, 15]} intensity={1.5} />
        <color attach="background" args={['#03030c']} />
        <gridHelper args={[100, 100, '#444466', '#222233']} />
        <PlayerAvatar isCustomizing={isCustomizing} />
        {isCustomizing ? (
          <OrbitControls enableZoom={true} target={[0, 1, 0]} />
        ) : (
          <PointerLockControls />
        )}
      </Canvas>
    </main>
  );
}
