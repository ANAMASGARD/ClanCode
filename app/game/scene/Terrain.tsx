"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, Mesh, ShaderMaterial } from "three";
import { AssetModel } from "./AssetModel";

const waterVertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vWave;
  void main() {
    vUv = uv;
    vec3 p = position;
    float wave = sin((p.x + uTime * 1.2) * 0.22) * 0.12 + cos((p.y - uTime) * 0.3) * 0.08;
    p.z += wave;
    vWave = wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const waterFragmentShader = `
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform float uTime;
  varying vec2 vUv;
  varying float vWave;
  void main() {
    float bands = sin((vUv.x + vUv.y) * 75.0 + uTime * 1.2) * 0.025;
    vec3 color = mix(uDeep, uShallow, clamp(vUv.y * 0.45 + 0.35 + vWave + bands, 0.0, 1.0));
    gl_FragColor = vec4(color, 0.94);
  }
`;

export function Terrain({ lowQuality, reducedMotion, onReset }: { lowQuality: boolean; reducedMotion: boolean; onReset: () => void }) {
  return (
    <group>
      <Water lowQuality={lowQuality} reducedMotion={reducedMotion} />
      <RoundedBox args={[59, 1.4, 49]} radius={0.62} smoothness={lowQuality ? 2 : 5} position={[0, -0.45, 0]} receiveShadow>
        <meshStandardMaterial color="#cf9d55" roughness={0.95} />
      </RoundedBox>
      <RoundedBox
        args={[55, 1.5, 45]}
        radius={0.58}
        smoothness={lowQuality ? 2 : 5}
        position={[1.5, 0.15, -1]}
        receiveShadow
        onPointerDown={(event) => {
          event.stopPropagation();
          onReset();
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onReset();
        }}
      >
        <meshStandardMaterial color="#3e8f4b" roughness={0.92} />
      </RoundedBox>
      <River />
      <CliffFrame />
    </group>
  );
}

function Water({ lowQuality, reducedMotion }: { lowQuality: boolean; reducedMotion: boolean }) {
  const mesh = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const material = useMemo(() => new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new Color("#15597a") },
      uShallow: { value: new Color("#43b7c2") },
    },
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    transparent: true,
  }), []);
  useFrame((state) => {
    if (!reducedMotion && materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime * (lowQuality ? 0.45 : 1);
    }
  });
  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} position={[-8, -1.08, 7]}>
      <planeGeometry args={[92, 76, lowQuality ? 12 : 28, lowQuality ? 12 : 28]} />
      <primitive ref={materialRef} object={material} attach="material" />
    </mesh>
  );
}

function River() {
  const tiles = [
    [-14, -20, "nature.riverStraight", 0],
    [-14, -15, "nature.riverBend", 0],
    [-16, -11, "nature.riverStraight", Math.PI / 2],
    [-18, -7, "nature.riverCorner", Math.PI],
    [-18, -2, "nature.riverStraight", 0],
    [-18, 3, "nature.riverRocks", 0],
    [-19, 8, "nature.riverBend", Math.PI],
    [-22, 11, "nature.riverStraight", Math.PI / 2],
  ] as const;
  return (
    <group position-y={0.94}>
      {tiles.map(([x, z, key, rotation]) => (
        <AssetModel key={`${x}:${z}`} assetKey={key} position={[x, 0, z]} rotation={[0, rotation, 0]} scale={5.25} />
      ))}
      <AssetModel assetKey="nature.bridgeWood" position={[-18, 1.1, -2]} rotation={[0, Math.PI / 2, 0]} scale={5.1} />
      <AssetModel assetKey="nature.lily" position={[-17, 0.2, 3]} scale={2} />
      <AssetModel assetKey="nature.lily" position={[-20, 0.2, 7]} scale={1.5} />
      <AssetModel assetKey="nature.waterfallTop" position={[-14, 1.5, -20]} scale={5.1} />
      <AssetModel assetKey="nature.waterfall" position={[-14, -3.2, -22.4]} scale={5.1} />
    </group>
  );
}

function CliffFrame() {
  const cliffs = useMemo(() => {
    const items: Array<[number, number, number]> = [];
    for (let x = -24; x <= 22; x += 4) items.push([x, -23, 0]);
    for (let z = -18; z <= 18; z += 4) items.push([27.5, z, Math.PI / 2]);
    return items;
  }, []);
  return (
    <group position-y={0.9}>
      {cliffs.map(([x, z, rotation]) => (
        <AssetModel key={`${x}:${z}`} assetKey="nature.cliffBlock" position={[x, 0, z]} rotation={[0, rotation, 0]} scale={4.05} />
      ))}
    </group>
  );
}
