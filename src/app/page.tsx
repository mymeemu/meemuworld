'use client';

import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// Sol Texturizado Realista
function TexturedSun() {
  const sunRef = useRef<THREE.Mesh>(null!);
  const [sunTexture] = useTexture(['/8k_sun.jpg']);

  useFrame((_, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group position={[100, 50, -150]}>
      {/* Luz Direcional principal vinda do Sol */}
      <directionalLight 
        castShadow 
        intensity={4.5} 
        color="#fffbeb" 
        position={[0, 0, 0]}
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
      />
      {/* Esfera do Sol */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[12, 32, 32]} />
        <meshBasicMaterial map={sunTexture} />
      </mesh>
      {/* Halo de Brilho Solar */}
      <mesh>
        <sphereGeometry args={[16, 32, 32]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.35} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

// Planeta Estilo Interestellar com Texturas Reais
function TexturedPlanet() {
  const planetRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  const [earthTexture, ringTexture] = useTexture([
    '/8k_earth_daymap.jpg',
    '/2k_saturn_ring_alpha.png'
  ]);

  useFrame((_, delta) => {
    if (planetRef.current) planetRef.current.rotation.y += delta * 0.015;
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.005;
  });

  return (
    <group position={[-45, 30, -110]} rotation={[0.3, 0.2, -0.15]}>
      {/* Corpo do Planeta */}
      <mesh ref={planetRef} castShadow receiveShadow>
        <sphereGeometry args={[32, 64, 64]} />
        <meshStandardMaterial 
          map={earthTexture} 
          roughness={0.7} 
          metalness={0.1}
        />
      </mesh>

      {/* Anéis do Planeta */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.2, 0, 0]}>
        <ringGeometry args={[42, 75, 64]} />
        <meshStandardMaterial 
          map={ringTexture} 
          side={THREE.DoubleSide} 
          transparent={true}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

// Fundo Espacial com a Via Láctea
function MilkyWayBackground() {
  const [bgTexture] = useTexture(['/8k_stars_milky_way.jpg']);
  bgTexture.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[500, 64, 64]} />
      <meshBasicMaterial map={bgTexture} side={THREE.BackSide} />
    </mesh>
  );
}

// Avatar do Jogador (Visível na Armaria)
function PlayerAvatar({ isCustomizing }: { isCustomizing: boolean }) {
  const avatarRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (isCustomizing && avatarRef.current) {
      avatarRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <group ref={avatarRef} position={[0, 0, 0]}>
      {/* Traje Espacial */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.4, 1.1, 4, 16]} />
        <meshStandardMaterial 
          color={isCustomizing ? '#0284c7' : '#94a3b8'} 
          roughness={0.25} 
          metalness={0.8} 
        />
      </mesh>
      {/* Capacete Visor */}
      <mesh position={[0, 1.65, 0.1]} castShadow>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color="#090d16" roughness={0.1} metalness={0.95} />
      </mesh>
    </group>
  );
}

export default function GamePage() {
  const [isCustomizing, setIsCustomizing] = useState(true);

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#010104' }}>
      {/* UI / HUD */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', gap: '15px', alignItems: 'center' }}>
        <button
          onClick={() => setIsCustomizing(!isCustomizing)}
          style={{
            padding: '12px 24px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            color: '#38bdf8',
            border: '1px solid #0284c7',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
          }}
        >
          {isCustomizing ? '🛡️ Modo Exploração FPS' : '⚙️ Personalizar Traje'}
        </button>
        <span style={{ color: '#94a3b8', fontSize: '13px', fontFamily: 'monospace', letterSpacing: '1px' }}>
          SISTEMA ESTELAR: {isCustomizing ? 'ARMARIA' : 'SUPERFÍCIE'}
        </span>
      </div>

      {/* Canvas 3D */}
      <Canvas shadows camera={{ position: isCustomizing ? [0, 1.5, 4] : [0, 1.7, 0], fov: 70 }}>
        {/* Luz Ambiente Suave */}
        <ambientLight intensity={0.4} color="#1e293b" />

        {/* Fundo Realista da Via Láctea e Poeira Estelar */}
        <MilkyWayBackground />
        <Sparkles count={120} scale={[30, 15, 30]} size={2.5} speed={0.3} color="#38bdf8" />

        {/* Elementos Celestiais com Texturas */}
        <TexturedSun />
        <TexturedPlanet />

        {/* Chão do Planeta */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial color="#05070c" roughness={0.9} metalness={0.1} />
        </mesh>
        
        {/* Grid Tecnológico */}
        <gridHelper args={[300, 150, '#0284c7', '#0f172a']} position={[0, 0.01, 0]} />

        {/* Avatar */}
        <PlayerAvatar isCustomizing={isCustomizing} />

        {/* Controles */}
        <OrbitControls 
          enableZoom={true} 
          target={[0, 1, 0]} 
          maxPolarAngle={Math.PI / 2} 
        />
      </Canvas>
    </main>
  );
}
