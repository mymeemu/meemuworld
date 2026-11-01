'use client';

import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Planeta Gigante no Horizontes (Estética Interestellar)
function GiantPlanet() {
  const planetRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group position={[0, 40, -120]}>
      {/* Corpo do Planeta */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[35, 64, 64]} />
        <meshStandardMaterial 
          color="#1e3a8a" 
          roughness={0.8} 
          metalness={0.2}
          bumpScale={0.05}
        />
      </mesh>
      {/* Anéis do Planeta (Estilo Saturno / Interestellar) */}
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[45, 70, 64]} />
        <meshStandardMaterial color="#94a3b8" side={THREE.DoubleSide} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// Avatar do Jogador com Estilo Sci-Fi
function PlayerAvatar({ isCustomizing }: { isCustomizing: boolean }) {
  const avatarRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (isCustomizing && avatarRef.current) {
      avatarRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <group ref={avatarRef} position={[0, 0, 0]}>
      {/* Corpo / Traje Espacial */}
      <mesh position={[0, 1, 0]}>
        <capsuleGeometry args={[0.4, 1.1, 4, 16]} />
        <meshStandardMaterial 
          color={isCustomizing ? '#00f0ff' : '#cbd5e1'} 
          roughness={0.2} 
          metalness={0.8} 
        />
      </mesh>
      {/* Capacete com visor reflexivo */}
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
      </mesh>
    </group>
  );
}

export default function GamePage() {
  const [isCustomizing, setIsCustomizing] = useState(true);

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#020208' }}>
      {/* HUD / Interface Estilo Sci-Fi */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', gap: '15px', alignItems: 'center' }}>
        <button
          onClick={() => setIsCustomizing(!isCustomizing)}
          style={{
            padding: '12px 24px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            color: '#38bdf8',
            border: '1px solid #0284c7',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)',
            transition: 'all 0.3s ease',
          }}
        >
          {isCustomizing ? '🛡️ Modo Exploração FPS' : '⚙️ Personalizar Traje'}
        </button>
        <span style={{ color: '#94a3b8', fontSize: '14px', fontFamily: 'monospace' }}>
          STATUS: {isCustomizing ? 'ESTÚDIO DE ARMARIA' : 'SUPERFÍCIE DO PLANETA'}
        </span>
      </div>

      {/* Canvas 3D */}
      <Canvas camera={{ position: isCustomizing ? [0, 1.5, 4] : [0, 1.7, 0], fov: 75 }}>
        {/* Iluminação Dramática Estilo Interestellar */}
        <ambientLight intensity={0.15} />
        <directionalLight position={[30, 40, 20]} intensity={2.0} color="#ffedd5" />
        <pointLight position={[-20, 10, -20]} intensity={1.0} color="#38bdf8" />
        
        {/* Fundo do Espaço com Estrelas */}
        <color attach="background" args={['#010104']} />
        <Stars radius={150} depth={50} count={7000} factor={4} saturation={0.5} fade speed={1} />

        {/* Planeta Gigante ao Fundo */}
        <GiantPlanet />
        
        {/* Chão / Terreno Sci-Fi */}
        <gridHelper args={[200, 100, '#0369a1', '#1e293b']} position={[0, 0, 0]} />

        {/* Personagem */}
        <PlayerAvatar isCustomizing={isCustomizing} />

        {/* Controles de Câmera */}
        <OrbitControls 
          enableZoom={true} 
          target={[0, 1, 0]} 
          maxPolarAngle={Math.PI / 2 + 0.05} // Evita ir abaixo do chão
        />
      </Canvas>
    </main>
  );
}
