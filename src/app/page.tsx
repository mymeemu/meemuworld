'use client';

import React, {
  Suspense,
  useMemo,
  useState,
  useRef,
  useEffect,
} from 'react';

import {
  Canvas,
  useFrame,
  useThree,
} from '@react-three/fiber';

import {
  OrbitControls,
  PointerLockControls,
  useTexture,
  Sparkles,
  useGLTF,
} from '@react-three/drei';

import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
// ============================================
// 1. SOL CINEMATOGRÁFICO
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

              float distortion =
                sin(angle * 5.0 + 0.8) * 0.045 +
                sin(angle * 9.0 - 1.4) * 0.025 +
                sin(angle * 13.0) * 0.012;

              float radius = r + distortion;

              float rays = 0.0;

              rays += ray(angle, 0.18, 0.018, radius, 0.85) * 1.8;
              rays += ray(angle, 0.92, 0.026, radius, 0.62) * 1.4;
              rays += ray(angle, 1.72, 0.020, radius, 0.92) * 2.0;
              rays += ray(angle, 2.48, 0.032, radius, 0.48) * 1.3;
              rays += ray(angle, 3.12, 0.017, radius, 0.75) * 1.7;
              rays += ray(angle, 3.86, 0.025, radius, 0.55) * 1.2;
              rays += ray(angle, 4.62, 0.019, radius, 0.88) * 1.8;
              rays += ray(angle, 5.35, 0.030, radius, 0.52) * 1.3;

              float secondary = 0.0;

              secondary += ray(angle, 0.58, 0.010, radius, 0.38);
              secondary += ray(angle, 1.35, 0.012, radius, 0.32);
              secondary += ray(angle, 2.08, 0.009, radius, 0.42);
              secondary += ray(angle, 2.85, 0.011, radius, 0.35);
              secondary += ray(angle, 3.55, 0.010, radius, 0.40);
              secondary += ray(angle, 4.28, 0.012, radius, 0.34);
              secondary += ray(angle, 5.02, 0.009, radius, 0.42);
              secondary += ray(angle, 5.78, 0.011, radius, 0.36);

              float core = exp(-r * r * 420.0);

              float explosionEdge =
                0.42 + distortion * 1.5;

              float explosion =
                exp(-radius * 5.0) *
                (1.0 - smoothstep(
                  explosionEdge,
                  explosionEdge + 0.30,
                  r
                ));

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
// 3. PLANETA NEXUS
// ============================================

function Earth() {
  return (
    <group
      position={[-320, 45, -230]}
      rotation={[0.2, 0.5, -0.1]}
    >
      <mesh>
        <sphereGeometry args={[25.2, 64, 64]} />
        <meshBasicMaterial
          color="#a83225"
          transparent
          opacity={0.13}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[24, 96, 96]} />

        <shaderMaterial
          uniforms={{}}
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
              vNormal = normalize(normalMatrix * normal);
              vPosition = position;

              gl_Position =
                projectionMatrix *
                modelViewMatrix *
                vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            varying vec3 vPosition;

            float hash(vec3 p) {
              p = fract(p * 0.3183099 + 0.1);
              p *= 17.0;
              return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
            }

            float noise(vec3 p) {
              vec3 i = floor(p);
              vec3 f = fract(p);

              f = f * f * (3.0 - 2.0 * f);

              return mix(
                mix(
                  mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                  mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x),
                  f.y
                ),
                mix(
                  mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                  mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x),
                  f.y
                ),
                f.z
              );
            }

            float fbm(vec3 p) {
              float value = 0.0;
              float amplitude = 0.5;

              for (int i = 0; i < 5; i++) {
                value += noise(p) * amplitude;
                p *= 2.0;
                amplitude *= 0.5;
              }

              return value;
            }

            void main() {
              vec3 p = normalize(vPosition);

              float terrain = fbm(p * 13.0);
              float detail = fbm(p * 42.0);

              float rock = terrain * 0.75 + detail * 0.25;

              vec3 darkRock = vec3(0.12, 0.025, 0.018);
              vec3 redRock = vec3(0.42, 0.075, 0.035);
              vec3 brightRock = vec3(0.72, 0.22, 0.10);

              vec3 surface = mix(
                darkRock,
                redRock,
                smoothstep(0.25, 0.65, rock)
              );

              surface = mix(
                surface,
                brightRock,
                smoothstep(0.68, 0.86, rock)
              );

              float clouds = fbm(p * 8.0 + vec3(2.0, 4.0, 1.0));
              clouds += fbm(p * 17.0) * 0.25;

              float cloudMask = smoothstep(
                0.53,
                0.69,
                clouds
              );

              vec3 cloudColor = vec3(0.82, 0.38, 0.27);

              surface = mix(
                surface,
                cloudColor,
                cloudMask * 0.78
              );

              vec3 normal = normalize(vNormal);
              vec3 lightDir = normalize(vec3(-0.4, 0.5, 1.0));

              float light = max(dot(normal, lightDir), 0.0);

              float ambient = 0.10;
              float lighting = ambient + light * 0.95;

              float rim = 1.0 - max(
                dot(normal, vec3(0.0, 0.0, 1.0)),
                0.0
              );

              vec3 atmosphere = vec3(0.65, 0.12, 0.07);

              vec3 finalColor =
                surface * lighting +
                atmosphere * pow(rim, 3.0) * 0.32;

              gl_FragColor = vec4(finalColor, 1.0);
            }
          `}
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

      <mesh ref={planetRef}>
        <sphereGeometry args={[19, 40, 40]} />

        <meshStandardMaterial
          color="#c99565"
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

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
// 5. LUAS LUMINESCENTES
// ============================================

function CelestialLuminousMoon({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <planeGeometry args={[26, 26]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
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
            varying vec2 vUv;

            void main() {
              float d = length(vUv - vec2(0.5));
              float glow = exp(-d * 6.5);

              vec3 c = mix(
                vec3(0.1, 0.85, 1.0),
                vec3(0.8, 0.98, 1.0),
                glow
              );

              gl_FragColor = vec4(c * glow * 1.2, glow * 0.85);
            }
          `}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[3.2, 48, 48]} />
        <meshBasicMaterial
          color="#e0f7fc"
          toneMapped={false}
        />
      </mesh>

      <Atmosphere radius={1.12} color="#00e5ff" />
    </group>
  );
}

function ThreeMoons() {
  return (
    <group position={[0, 82, -270]}>
      <CelestialLuminousMoon
        position={[0, 15, 0]}
        scale={1.2}
      />

      <CelestialLuminousMoon
        position={[-24, 0, 0]}
        scale={0.9}
      />

      <CelestialLuminousMoon
        position={[24, 0, 0]}
        scale={0.9}
      />
    </group>
  );
}

// ============================================
// 6. FUNDO ESPACIAL
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

function FirstPersonArms() {
  const { camera } = useThree();

  const { scene } = useGLTF(
    '/models/avatar/first_person_arms.glb'
  );

  const arms = useMemo(() => clone(scene), [scene]);

  useEffect(() => {
    const bounds = new THREE.Box3().setFromObject(arms);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());

    const largestDimension = Math.max(
      size.x,
      size.y,
      size.z,
      0.001
    );

    const scale = 0.95 / largestDimension;

    arms.scale.setScalar(scale);

    arms.position.set(
      -center.x * scale,
      -0.38 - center.y * scale,
      -0.78 - center.z * scale
    );

    arms.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.frustumCulled = false;
        child.renderOrder = 1000;

        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach((material) => {
          material.depthTest = false;
          material.depthWrite = false;
          material.needsUpdate = true;
        });
      }
    });

    camera.add(arms);
    camera.updateMatrixWorld(true);

    return () => {
      camera.remove(arms);
    };
  }, [camera, arms]);

  return null;
}

useGLTF.preload('/models/avatar/first_person_arms.glb');


function PlayerAvatar({
  isCustomizing,
}: {
  isCustomizing: boolean;
}) {
  const avatarRef = useRef<THREE.Group>(null!);
  const keys = useRef<Set<string>>(new Set());

  const { camera } = useThree();

  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const movement = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useEffect(() => {
    keys.current.clear();

    if (isCustomizing) return;

    camera.position.set(0, 1.55, 0);
    camera.rotation.set(0, 0, 0);

    const validKeys = [
      'w',
      'a',
      's',
      'd',
      'arrowup',
      'arrowdown',
      'arrowleft',
      'arrowright',
    ];

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (validKeys.includes(key)) {
        event.preventDefault();
        keys.current.add(key);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keys.current.delete(event.key.toLowerCase());
    };

    const handleBlur = () => {
      keys.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      keys.current.clear();
    };
  }, [camera, isCustomizing]);

  useFrame((state, delta) => {
    if (!avatarRef.current) return;

    if (!isCustomizing) {
      const keySet = keys.current;

      const forwardInput =
        (keySet.has('w') || keySet.has('arrowup') ? 1 : 0) -
        (keySet.has('s') || keySet.has('arrowdown') ? 1 : 0);

      const sideInput =
        (keySet.has('d') || keySet.has('arrowright') ? 1 : 0) -
        (keySet.has('a') || keySet.has('arrowleft') ? 1 : 0);

      if (forwardInput !== 0 || sideInput !== 0) {
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        right.crossVectors(forward, up).normalize();

        movement.set(0, 0, 0);
        movement.addScaledVector(forward, forwardInput);
        movement.addScaledVector(right, sideInput);

        if (movement.lengthSq() > 0) {
          movement.normalize();

          const speed = 8;

          movement.multiplyScalar(
            speed * Math.min(delta, 0.05)
          );

          avatarRef.current.position.x += movement.x;
          avatarRef.current.position.z += movement.z;
        }
      }
    }

    avatarRef.current.position.y =
      Math.sin(state.clock.elapsedTime * 1.5) * 0.035;

    if (!isCustomizing) {
      camera.position.set(
        avatarRef.current.position.x,
        avatarRef.current.position.y + 1.55,
        avatarRef.current.position.z
      );
    }
  });

  return (
    <group ref={avatarRef} position={[0, 0, 0]}>
      {isCustomizing && (
        <>
          <mesh position={[0, 0.85, 0]}>
            <capsuleGeometry args={[0.4, 1.1, 4, 16]} />

            <meshStandardMaterial
              color="#0284c7"
              roughness={0.3}
              metalness={0.65}
            />
          </mesh>

          <mesh position={[0, 1.65, 0.08]}>
            <sphereGeometry args={[0.28, 24, 24]} />

            <meshStandardMaterial
              color="#111827"
              roughness={0.15}
              metalness={0.9}
            />
          </mesh>

          <mesh position={[0, 1.67, 0.29]}>
            <sphereGeometry
              args={[
                0.17,
                24,
                24,
                0,
                Math.PI * 2,
                0,
                Math.PI / 2,
              ]}
            />

            <meshBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.85}
              toneMapped={false}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

// ============================================
// 9. CHÃO PBR — MEEMU WORLD
// ============================================

function TexturedGround() {
  const [
    colorMap,
    aoMap,
    normalMap,
    roughnessMap,
  ] = useTexture([
    '/textures/brown_mud_leaves_01_diff_1k.jpg',
    '/textures/brown_mud_leaves_01_ao_1k.jpg',
    '/textures/brown_mud_leaves_01_nor_gl_1k.jpg',
    '/textures/brown_mud_leaves_01_rough_1k.jpg',
  ]);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(300, 300, 1, 1);
    geo.setAttribute('uv2', geo.attributes.uv);
    return geo;
  }, []);

  [colorMap, aoMap, normalMap, roughnessMap].forEach((texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(24, 24);
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  });

  colorMap.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.05, 0]}
      receiveShadow
    >
      <meshStandardMaterial
        map={colorMap}
        aoMap={aoMap}
        aoMapIntensity={1.2}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(1.5, 1.5)}
        roughnessMap={roughnessMap}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

function AlienRocks() {
  const { scene } = useGLTF('/models/rock_moss_set_01_1k.gltf');

  const rocks = useMemo(() => {
    const meshes: THREE.Mesh[] = [];

    scene.updateMatrixWorld(true);

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const rock = child.clone();

        rock.geometry = child.geometry;
        rock.material = Array.isArray(child.material)
          ? child.material.map((material) => material.clone())
          : child.material.clone();

        rock.castShadow = true;
        rock.receiveShadow = true;

        meshes.push(rock);
      }
    });

    return meshes;
  }, [scene]);

  const placements = useMemo(() => {
    const positions = [
      [-12, -8], [-7, -11], [0, -13], [8, -10], [13, -6],
      [-15, 0], [-9, 2], [10, 1], [16, 4],
      [-13, 10], [-6, 13], [3, 12], [12, 11],
      [-20, -15], [20, -13], [-19, 14], [19, 17],
    ];

    return positions.map(([x, z], index) => ({
      x,
      z,
      scale: 0.65 + (index % 4) * 0.18,
      rotation: (index * 1.37) % (Math.PI * 2),
    }));
  }, []);

  const preparedRocks = useMemo(() => {
    return rocks.map((rock) => {
      const clone = rock.clone();

      clone.updateMatrixWorld(true);

      const bounds = new THREE.Box3().setFromObject(clone);

      return {
        object: clone,
        groundOffset: -0.05 - bounds.min.y,
      };
    });
  }, [rocks]);

  return (
    <group>
      {placements.map((placement, index) => {
        const rock = preparedRocks[index % preparedRocks.length];

        return (
          <group
            key={index}
            position={[
              placement.x,
              rock.groundOffset * placement.scale,
              placement.z,
            ]}
            rotation={[0, placement.rotation, 0]}
            scale={placement.scale}
          >
            <primitive object={rock.object.clone()} />
          </group>
        );
      })}
    </group>
  );
}

useGLTF.preload('/models/rock_moss_set_01_1k.gltf');


function SpaceScene({
  isCustomizing,
}: {
  isCustomizing: boolean;
}) {
  const controlsRef = useRef<any>(null);

  return (
    <>
      <ambientLight intensity={1.2} />

      <directionalLight
        position={[30, 80, 20]}
        intensity={2}
        color="#dceaff"
      />

      <directionalLight
        position={[120, 40, -160]}
        intensity={1.8}
        color="#fff1d6"
      />

      <ambientLight
        intensity={0.2}
        color="#426aab"
      />

      <hemisphereLight
        args={['#8acbff', '#080b19', 0.65]}
      />

      <Suspense fallback={null}>
        <MilkyWayBackground />

        {/* Planetas e modelos ainda não implementados */}
        {/* <MeemuPlanetModel /> */}
        {/* <MeemuGalaxyModel /> */}

        <TexturedGround />

        <AlienRocks />

        {/* <Saturn /> */}

        <Sparkles
          count={180}
          scale={[450, 280, 550]}
          position={[0, 45, -180]}
          size={2}
          speed={0.12}
          color="#b9ddff"
        />

        <CinematicSun />

        <Earth />

        <ThreeMoons />

        <PlayerAvatar
          isCustomizing={isCustomizing}
        />

        {!isCustomizing && <FirstPersonArms />}

        {isCustomizing ? (
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.06}
            enableZoom
            enablePan={false}
            minDistance={3}
            maxDistance={100}
            maxPolarAngle={Math.PI / 2}
            target={[0, 1, 0]}
          />
        ) : (
          <PointerLockControls />
        )}
      </Suspense>
    </>
  );
}

// ============================================
// 12. PÁGINA PRINCIPAL
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
