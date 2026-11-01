'use client';

import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Sol Cinematográfico com Brilho (Estilo Interestellar)
function CinematicSun() {
  const sunRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group position={[120, 60, -180]}>
      {/* Núcleo do Sol */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[12, 32, 32]} />
        <meshBasicMaterial color="#fffaed" />
      </mesh>
      {/* Halo / Atmosfera Solar Brilhante */}
      <mesh>
        <sphereGeometry args={[16, 32, 32]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.35} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[22, 32, 32]} />
        <meshBasicMaterial color="#ea580c" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>
      {/* Luz Direcional Principal do Sol */}
      <directionalLight position={[0, 0, 0]} intensity={3.5} color="#ffedd5" />
    </group>
  );
}

// Planeta Gigante com Atmosfera e Anéis Elegantes
function CinematicPlanet() {
  const planetRef = useRef<THREE.Mesh>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (planetRef.current) planetRef.current.rotation.y += delta * 0.01;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.015;
  });

  return (
    <group position={[-30, 45, -140]} rotation={[0.1, 0, -0.2]}>
      {/* Corpo do Planeta (Tom Azulado Profundo com brilho de superfície) */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[40, 64, 64]} />
        <meshStandardMaterial 
          color="#0284c7" 
          emissive="#0369a1"
          emissiveIntensity={0.15}
          roughness={0.6} 
          metalness={0.2}
        />
      </mesh>

      {/* Camada de Nuvems Atmosféricas */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[40.5, 64, 64]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.3} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Anéis Planetários Estilo Saturno / Interestellar (Translúcidos e Brilhantes) */}
      <mesh rotation={[Math.PI / 2.5, 0, 0]}>
        <ringGeometry args={[52, 85, 64]} />
        <meshStandardMaterial 
          color="#7dd3fc" 
          side={THREE.DoubleSide} 
          transparent 
          opacity={0.7}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

// Avatar do Jogador
function PlayerAvatar({ isCustomizing }: { isCustomizing: boolean }) {
  const avatarRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (isCustomizing && avatarRef.current) {
      avatarRef.current.rotation.y = state.clock.getElapsedTime() * 0.4;
    }
  });

  return (
    <group ref={avatarRef} position={[0, 0, 0]}>
      <mesh position={[0, 1, 0]}>
        <capsuleGeometry args={[0.4, 1.1, 4, 16]} />
        <meshStandardMaterial 
          color={isCustomizing ? '#38bdf8' : '#cbd5e1'} 
          roughness={0.2} 
          metalness={0.8} 
        />
      </mesh>
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
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#010104' }}>
      {/* Interface / HUD */}
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
      <Canvas camera={{ position: isCustomizing ? [0, 1.5, 4] : [0, 1.7, 0], fov: 75 }}>
        {/* Iluminação Ambiente Suave para o lado escuro */}
        <ambientLight intensity={0.3} color="#1e293b" />

        {/* Fundo Espacial Profundo com Estrelas */}
        <color attach="background" args={['#010104']} />
        <Stars radius={180} depth={60} count={9000} factor={4} saturation={0.8} fade speed={0.5} />

        {/* Sol Cinematográfico com Luz Própria */}
        <CinematicSun />

        {/* Planeta Gigante com Anéis e Atmosfera */}
        <CinematicPlanet />
        
        {/* Chão / Terreno Estilizado com Grid Tecnológico */}
        <gridHelper args={[250, 120, '#0284c7', '#0f172a']} position={[0, 0, 0]} />

        {/* Personagem */}
        <PlayerAvatar isCustomizing={isCustomizing} />

        {/* Controles de Câmera */}
        <OrbitControls 
          enableZoom={true} 
          target={[0, 1, 0]} 
          maxPolarAngle={Math.PI / 2 + 0.02} 
        />
      </Canvas>
    </main>
  );
}
