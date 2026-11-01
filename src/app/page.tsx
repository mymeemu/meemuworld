
'use client';

import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  useTexture,
  Sparkles,
  } from '@react-three/drei';

import * as THREE from 'three';

// ============================================
// 1. SOL CINEMATOGRÁFICO (SHADER ORIGINAL SEM BILLBOARD)
// ============================================


function CinematicSun() {
  const flareRef = useRef<THREE.ShaderMaterial>(null!);

  const flareQuaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(-120, -40, 160).normalize()
  );

  useFrame((state) => {
    if (flareRef.current) {
      flareRef.current.uniforms.uTime.value =
        state.clock.elapsedTime;
    }
  });

  return (
    <group
      position={[120, 40, -160]}
      quaternion={flareQuaternion}
    >
      <mesh>
        <planeGeometry args={[180, 180]} />

        <shaderMaterial
          ref={flareRef}
          transparent
          depthWrite={false}
          depthTest={true}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          uniforms={{
            uTime: { value: 0 },
          }}
          vertexShader={`
            varying vec2 vUv;

            void main() {
              vUv = uv;
              gl_Position =
                projectionMatrix *
                modelViewMatrix *
                vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float uTime;
            varying vec2 vUv;

            float ray(
              float angle,
              float target,
              float width,
              float radius,
              float length
            ) {
              float difference = abs(
                atan(
                  sin(angle - target),
                  cos(angle - target)
                )
              );

              float angular = exp(
                -(difference * difference) /
                (width * width)
              );

              float radial = exp(
                -radius / length
              );

              return angular * radial;
            }

            void main() {
              vec2 p = (vUv - 0.5) * 2.0;

              float r = length(p);
              float angle = atan(p.y, p.x);

              float pulse =
                0.97 + sin(uTime * 0.65) * 0.03;

              // Irregularidade orgânica da explosão
              float distortion =
                sin(angle * 5.0 + 0.8) * 0.045 +
                sin(angle * 9.0 - 1.4) * 0.025 +
                sin(angle * 13.0) * 0.012;

              float radius = r + distortion;

              // Raios principais: diferentes direções e comprimentos
              float rays = 0.0;

              rays += ray(angle, 0.18, 0.018, radius, 0.85) * 1.8;
              rays += ray(angle, 0.92, 0.026, radius, 0.62) * 1.4;
              rays += ray(angle, 1.72, 0.020, radius, 0.92) * 2.0;
              rays += ray(angle, 2.48, 0.032, radius, 0.48) * 1.3;
              rays += ray(angle, 3.12, 0.017, radius, 0.75) * 1.7;
              rays += ray(angle, 3.86, 0.025, radius, 0.55) * 1.2;
              rays += ray(angle, 4.62, 0.019, radius, 0.88) * 1.8;
              rays += ray(angle, 5.35, 0.030, radius, 0.52) * 1.3;

              // Raios secundários mais delicados
              float secondary = 0.0;

              secondary += ray(angle, 0.58, 0.010, radius, 0.38);
              secondary += ray(angle, 1.35, 0.012, radius, 0.32);
              secondary += ray(angle, 2.08, 0.009, radius, 0.42);
              secondary += ray(angle, 2.85, 0.011, radius, 0.35);
              secondary += ray(angle, 3.55, 0.010, radius, 0.40);
              secondary += ray(angle, 4.28, 0.012, radius, 0.34);
              secondary += ray(angle, 5.02, 0.009, radius, 0.42);
              secondary += ray(angle, 5.78, 0.011, radius, 0.36);

              // Núcleo compacto e extremamente luminoso
              float core = exp(-r * r * 420.0);

              // Energia difusa da explosão, com contorno irregular
              float explosionEdge =
                0.42 + distortion * 1.5;

              float explosion =
                exp(-radius * 5.0) *
                (1.0 - smoothstep(
                  explosionEdge,
                  explosionEdge + 0.30,
                  r
                ));

              // Filamentos luminosos próximos ao centro
              float filaments =
                exp(-r * 7.0) *
                (
                  0.5 +
                  0.5 * sin(angle * 17.0 + r * 24.0)
                );

              float intensity =
                core * 5.5 +
                rays * 1.15 +
                secondary * 0.75 +
                explosion * 1.1 +
                filaments * 0.35;

              intensity *= pulse;

              // Gradiente branco, prata e azul-gelo
              vec3 blue = vec3(0.22, 0.42, 0.85);
              vec3 silver = vec3(0.72, 0.84, 1.0);
              vec3 white = vec3(1.0, 1.0, 1.0);

              vec3 color = mix(
                blue,
                silver,
                clamp(1.0 - r * 0.65, 0.0, 1.0)
              );

              color = mix(
                color,
                white,
                clamp(core * 1.8 + explosion * 0.45, 0.0, 1.0)
              );

              color *= intensity;

              float fade = 1.0 - smoothstep(0.88, 1.0, r);

              float alpha = clamp(
                intensity * 0.48 * fade,
                0.0,
                0.95
              );

              gl_FragColor = vec4(color, alpha);
            }
          `}
        />
      </mesh>
    </group>
  );
}

// ============================================
// 2. ATMOSFERA PLANETÁRIA
// ============================================

function Atmosphere({
  radius,
  color,
}: {
  radius: number;
  color: string;
}) {
  return (
    <mesh scale={radius}>

      <sphereGeometry args={[1, 40, 40]} />

      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        toneMapped={false}

        uniforms={{
          uColor: {
            value: new THREE.Color(color),
          },
        }}

        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vViewPosition;

          void main() {
            vec4 mvPosition =
              modelViewMatrix * vec4(position, 1.0);

            vNormal = normalize(normalMatrix * normal);
            vViewPosition = -mvPosition.xyz;

            gl_Position =
              projectionMatrix * mvPosition;
          }
        `}

        fragmentShader={`
          uniform vec3 uColor;

          varying vec3 vNormal;
          varying vec3 vViewPosition;

          void main() {
            vec3 viewDir = normalize(vViewPosition);

            float fresnel = pow(
              1.0 - max(
                dot(normalize(vNormal), viewDir),
                0.0
              ),
              3.0
            );

            float alpha = fresnel * 0.65;

            gl_FragColor = vec4(uColor, alpha);
          }
        `}
      />

    </mesh>
  );
}

// ============================================
// 3. TERRA ESTÁTICA
// ============================================

function Earth() {
  const [earthTexture] = useTexture([
    '/8k_earth_daymap.jpg',
  ]);

  earthTexture.colorSpace = THREE.SRGBColorSpace;

  return (
    <group
      position={[-50, 30, -120]}
      rotation={[0.2, 0.4, -0.1]}
    >

      {/* Atmosfera azul */}

      <Atmosphere
        radius={1.09}
        color="#3b9dff"
      />

      {/* Superfície estática */}

      <mesh>
        <sphereGeometry args={[35, 48, 48]} />

        <meshStandardMaterial
          map={earthTexture}
          roughness={0.8}
          metalness={0}
        />
      </mesh>

    </group>
  );
}

// ============================================
// 4. SATURNO
// ============================================

function Saturn() {
  const planetRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  const [ringTexture] = useTexture([
    '/2k_saturn_ring_alpha.png',
  ]);

  useFrame((_, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.008;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.002;
    }
  });

  return (
    <group
      position={[65, -8, -190]}
      rotation={[0.3, 0.2, -0.15]}
    >

      <Atmosphere
        radius={1.12}
        color="#ffb86b"
      />

      {/* Corpo */}

      <mesh ref={planetRef}>
        <sphereGeometry args={[19, 40, 40]} />

        <meshStandardMaterial
          color="#c99565"
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* Anéis */}

      <mesh
        ref={ringRef}
        rotation={[Math.PI / 2.3, 0, 0]}
      >
        <ringGeometry args={[25, 43, 64]} />

        <meshStandardMaterial
          map={ringTexture}
          color="#d9bd99"
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
          roughness={0.9}
          metalness={0.1}
          depthWrite={false}
        />
      </mesh>

    </group>
  );
}

// ============================================
// 5. FUNDO ESPACIAL
// ============================================

function MilkyWayBackground() {
  const [bgTexture] = useTexture([
    '/8k_stars_milky_way.jpg',
  ]);

  bgTexture.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh>

      <sphereGeometry args={[500, 32, 32]} />

      <meshBasicMaterial
        map={bgTexture}
        side={THREE.BackSide}
        toneMapped={false}
      />

    </mesh>
  );
}

// ============================================
// 6. AVATAR
// ============================================

function PlayerAvatar({
  isCustomizing,
}: {
  isCustomizing: boolean;
}) {
  const avatarRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (avatarRef.current) {

      if (isCustomizing) {
        avatarRef.current.rotation.y += delta * 0.3;
      } else {
        avatarRef.current.rotation.y =
          THREE.MathUtils.damp(
            avatarRef.current.rotation.y,
            0,
            4,
            delta
          );
      }

      avatarRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 1.5) * 0.035;
    }
  });

  return (
    <group ref={avatarRef} position={[0, 0, 0]}>

      {/* Corpo */}

      <mesh position={[0, 0.85, 0]}>

        <capsuleGeometry args={[0.4, 1.1, 4, 16]} />

        <meshStandardMaterial
          color={isCustomizing ? '#0284c7' : '#94a3b8'}
          roughness={0.3}
          metalness={0.65}
        />

      </mesh>

      {/* Capacete */}

      <mesh position={[0, 1.65, 0.08]}>

        <sphereGeometry args={[0.28, 24, 24]} />

        <meshStandardMaterial
          color="#111827"
          roughness={0.15}
          metalness={0.9}
        />

      </mesh>

      {/* Visor */}

      <mesh position={[0, 1.67, 0.29]}>

        <sphereGeometry
          args={[0.17, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]}
        />

        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.85}
          toneMapped={false}
        />

      </mesh>

    </group>
  );
}

// ============================================
// 7. CENÁRIO COMPLETO
// ============================================

function SpaceScene({
  isCustomizing,
}: {
  isCustomizing: boolean;
}) {
  return (
    <>

      {/* Iluminação solar */}

      <directionalLight
        position={[120, 40, -160]}
        intensity={2.8}
        color="#fff1d6"
      />

      <ambientLight
        intensity={0.35}
        color="#426aab"
      />

      <hemisphereLight
        args={['#8acbff', '#080b19', 0.65]}
      />

      {/* Universo */}

      <MilkyWayBackground />

      <Sparkles
        count={55}
        scale={250}
        size={2}
        speed={0.15}
        color="#b9ddff"
      />

      {/* Corpos celestes */}

      <CinematicSun />

      <Earth />

      <Saturn />

      {/* Piso */}

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
      >

        <planeGeometry args={[300, 300]} />

        <meshStandardMaterial
          color="#05070c"
          roughness={0.95}
          metalness={0.1}
        />

      </mesh>

      <gridHelper
        args={[300, 100, '#075985', '#101c30']}
        position={[0, 0, 0]}
      />

      {/* Avatar */}

      <PlayerAvatar
        isCustomizing={isCustomizing}
      />

      {/* Câmera */}

      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        enableZoom
        enablePan={false}
        minDistance={3}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2}
        target={[0, 1, 0]}
      />

    </>
  );
}

// ============================================
// 8. PÁGINA PRINCIPAL
// ============================================

export default function GamePage() {
  const [isCustomizing, setIsCustomizing] = useState(true);

  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: '#010104',
      }}
    >

      {/* HUD */}

      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          display: 'flex',
          gap: 15,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >

        <button
          onClick={() => setIsCustomizing(!isCustomizing)}
          style={{
            padding: '12px 24px',
            background: 'rgba(15,23,42,0.88)',
            color: '#38bdf8',
            border: '1px solid #0284c7',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 20px rgba(56,189,248,0.25)',
          }}
        >
          {isCustomizing
            ? '🚀 Explorar Universo'
            : '⚙️ Personalizar Traje'}
        </button>

        <span
          style={{
            color: '#94a3b8',
            fontSize: 12,
            fontFamily: 'monospace',
            letterSpacing: 1.5,
          }}
        >
          MEEMULAND // {isCustomizing ? 'ARMARIA' : 'EXPLORAÇÃO'}
        </span>

      </div>

      {/* RENDERIZAÇÃO 3D */}

      <Canvas
        shadows={false}
        dpr={[1, 1.25]}
        camera={{
          position: [0, 2.2, 9],
          fov: 60,
          near: 0.1,
          far: 1200,
        }}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        style={{
          background: '#010104',
        }}
      >

        <SpaceScene
          isCustomizing={isCustomizing}
        />

      </Canvas>

    </main>
  );
}
