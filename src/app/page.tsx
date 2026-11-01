'use client';

import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// Sol Iluminado com Luz Própria e Glow
function Sun() {
  return (
    <group position={[80, 50, -100]}>
      {/* Luz Principal que banha o Planeta e o Jogador */}
      <directionalLight 
        castShadow 
        intensity={4.0} 
        color="#fff7ed" 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
      />
      
      {/* Esfera do Sol com Emissão de Luz */}
      <mesh>
        <sphereGeometry args={[10, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Camada Exterior de Glow / Atmosfera Solar */}
      <mesh>
        <sphereGeometry args={[14, 32, 32]} />
        <meshBasicMaterial color="#fb923c" transparent opacity={0.3} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[20, 32, 32]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

// Planeta Sci-Fi Iluminado
function Planet() {
  const planetRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (planetRef.current) planetRef.current.rotation.y += delta * 0.03;
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.01;
  });

  return (
    <group position={[-50, 25, -90]} rotation={[0.4, 0.2, -0.2]}>
      {/* Corpo Principal do Planeta */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[28, 64, 64]} />
        <meshStandardMaterial 
          color="#1e40af" 
          roughness={0.4} 
          metalness={0.3}
          emissive="#1e3a8a"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Anéis Translúcidos e Refletivos */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.2, 0, 0]}>
        <ringGeometry args={[35, 58, 64]} />
        <meshStandardMaterial 
          color="#60a5fa" 
          side={THREE.DoubleSide} 
          transparent 
          opacity={0.65}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>
    </group>
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
      {/* Corpo / Traje Espacial */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.4, 1.1, 4, 16]} />
        <meshStandardMaterial 
          color={isCustomizing ? '#0284c7' : '#94a3b8'} 
          roughness={0.25} 
          metalness={0.8} 
        />
      </mesh>
      
      {/* Capacete Visor Sci-Fi */}
      <mesh position={[0, 1.65, 0.1]} castShadow>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial 
          color="#090d16" 
          roughness={0.1} 
          metalness={0.95} 
        />
      </mesh>
    </group>
  );
}

export default function GamePage() {
  const [isCustomizing, setIsCustomizing] = useState(true);

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#020208' }}>
      {/* HUD da Interface */}
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
        {/* Luz de Preenchimento para tirar as sombras 100% pretas */}
        <ambientLight intensity={0.6} color="#38bdf8" />
        <pointLight position={[0, 5, 5]} intensity={1.5} color="#38bdf8" />

        {/* Fundo de Estrelas e Poeira Espacial Flutuante */}
        <color attach="background" args={['#020208']} />
        <Stars radius={150} depth={50} count={8000} factor={4} saturation={0.8} fade speed={0.5} />
        <Sparkles count={150} scale={[20, 10, 20]} size={3} speed={0.4} color="#38bdf8" />

        {/* Elementos Espaciais */}
        <Sun />
        <Planet />

        {/* Terreno / Chão do Planeta */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial color="#070a12" roughness={0.8} metalness={0.2} />
        </mesh>
        
        {/* Grid Tecnológico no Chão */}
        <gridHelper args={[300, 150, '#38bdf8', '#1e293b']} position={[0, 0.01, 0]} />

        {/* Personagem */}
        <PlayerAvatar isCustomizing={isCustomizing} />

        {/* Controles da Câmera */}
        <OrbitControls 
          enableZoom={true} 
          target={[0, 1, 0]} 
          maxPolarAngle={Math.PI / 2} 
        />
      </Canvas>
    </main>
  );
}
