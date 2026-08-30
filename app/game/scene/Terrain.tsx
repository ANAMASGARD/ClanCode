"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  Color,
  ExtrudeGeometry,
  ShaderMaterial,
  Shape,
} from "three";
import { AssetModel } from "./AssetModel";
import { GROUND_Y } from "@/app/game/state/tile";

const waterVertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vWave;
  void main() {
    vUv = uv;
    vec3 p = position;
    float wave = sin((p.x + uTime * 1.2) * 0.18) * 0.1 + cos((p.y - uTime) * 0.28) * 0.07;
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
    float bands = sin((vUv.x + vUv.y) * 65.0 + uTime * 1.1) * 0.03;
    vec3 color = mix(uDeep, uShallow, clamp(vUv.y * 0.42 + 0.38 + vWave + bands, 0.0, 1.0));
    gl_FragColor = vec4(color, 0.92);
  }
`;

function createIslandShape(): Shape {
  const shape = new Shape();
  shape.moveTo(-28, -22);
  shape.quadraticCurveTo(-32, 0, -30, 18);
  shape.quadraticCurveTo(-26, 24, -18, 24);
  shape.lineTo(18, 24);
  shape.quadraticCurveTo(28, 24, 30, 16);
  shape.quadraticCurveTo(32, 4, 28, -14);
  shape.quadraticCurveTo(22, -24, 8, -24);
  shape.lineTo(-8, -24);
  shape.quadraticCurveTo(-22, -24, -28, -22);
  shape.closePath();
  return shape;
}

type TerrainProps = {
  lowQuality: boolean;
  reducedMotion: boolean;
  onReset: () => void;
};

export function Terrain({ lowQuality, reducedMotion, onReset }: TerrainProps) {
  const islandGeometry = useMemo(() => {
    const shape = createIslandShape();
    const geometry = new ExtrudeGeometry(shape, {
      depth: 1.2,
      bevelEnabled: true,
      bevelThickness: 0.35,
      bevelSize: 0.28,
      bevelSegments: lowQuality ? 1 : 2,
      curveSegments: lowQuality ? 8 : 14,
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, -0.15, 0);
    return geometry;
  }, [lowQuality]);

  return (
    <group>
      <Water lowQuality={lowQuality} reducedMotion={reducedMotion} />
      <mesh
        geometry={islandGeometry}
        receiveShadow
        castShadow={false}
        position-y={GROUND_Y - 1.05}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onReset();
        }}
      >
        <meshStandardMaterial color="#4caf57" roughness={0.88} metalness={0.02} />
      </mesh>
      <BeachStrip />
      <CliffEdge lowQuality={lowQuality} />
      <River />
      <GroundDressing lowQuality={lowQuality} />
    </group>
  );
}

function Water({ lowQuality, reducedMotion }: { lowQuality: boolean; reducedMotion: boolean }) {
  const materialRef = useRef<ShaderMaterial>(null);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uDeep: { value: new Color("#1a7a9e") },
          uShallow: { value: new Color("#5ed4e8") },
        },
        vertexShader: waterVertexShader,
        fragmentShader: waterFragmentShader,
        transparent: true,
      }),
    [],
  );

  useFrame((state) => {
    if (!reducedMotion && materialRef.current) {
      materialRef.current.uniforms.uTime.value =
        state.clock.elapsedTime * (lowQuality ? 0.45 : 1);
    }
  });

  return (
    <mesh rotation-x={-Math.PI / 2} position={[-6, GROUND_Y - 1.25, 4]}>
      <planeGeometry args={[110, 90, lowQuality ? 14 : 32, lowQuality ? 14 : 32]} />
      <primitive ref={materialRef} object={material} attach="material" />
    </mesh>
  );
}

function BeachStrip() {
  const patches: Array<[number, number, number, string]> = [
    [-22, GROUND_Y - 0.12, 8, "harbor.patchSand"],
    [-24, GROUND_Y - 0.1, 12, "harbor.patchSandFoliage"],
    [-20, GROUND_Y - 0.11, 14, "nature.platformBeach"],
    [-26, GROUND_Y - 0.1, 6, "nature.platformBeach"],
    [-18, GROUND_Y - 0.09, 10, "harbor.patchSand"],
  ];
  return (
    <group>
      {patches.map(([x, y, z, key]) => (
        <AssetModel
          key={`${x}:${z}`}
          assetKey={key as "harbor.patchSand"}
          position={[x, y, z]}
          scale={0.45}
        />
      ))}
    </group>
  );
}

function CliffEdge({ lowQuality }: { lowQuality: boolean }) {
  const cliffs = useMemo(() => {
    const variants = [
      "nature.cliffBlock",
      "nature.cliffBlockHalf",
      "nature.cliffBlockDiagonal",
      "nature.cliffCorner",
      "nature.cliffHalf",
      "nature.cliffBlockSlope",
      "nature.cliffLarge",
      "nature.cliffSteps",
    ] as const;
    const items: Array<{
      key: (typeof variants)[number];
      position: [number, number, number];
      rotation: number;
      scale: number;
    }> = [];
    let variantIndex = 0;
    const add = (x: number, z: number, rotation: number, scale = 0.42) => {
      items.push({
        key: variants[variantIndex % variants.length],
        position: [x, GROUND_Y - 0.05, z],
        rotation,
        scale,
      });
      variantIndex += 1;
    };
    for (let x = -24; x <= 24; x += 5) add(x, -23, 0, 0.38);
    for (let z = -20; z <= 20; z += 4) add(27, z, -Math.PI / 2, 0.4);
    for (let x = -24; x <= 20; x += 5) add(x, 23, Math.PI, 0.38);
    for (let z = -18; z <= 18; z += 5) add(-29, z, Math.PI / 2, 0.4);
    return items.slice(0, lowQuality ? 28 : 44);
  }, [lowQuality]);

  return (
    <group>
      {cliffs.map((cliff, index) => (
        <AssetModel
          key={`${cliff.key}:${index}`}
          assetKey={cliff.key}
          position={cliff.position}
          rotation={[0, cliff.rotation, 0]}
          scale={cliff.scale}
        />
      ))}
    </group>
  );
}

function River() {
  const tiles = [
    [-12, -18, "nature.riverStraight", 0],
    [-12, -14, "nature.riverBend", 0],
    [-14, -10, "nature.riverStraight", Math.PI / 2],
    [-16, -6, "nature.riverCorner", Math.PI],
    [-16, -2, "nature.riverStraight", 0],
    [-16, 2, "nature.riverRocks", 0],
    [-17, 6, "nature.riverBend", Math.PI],
    [-19, 9, "nature.riverStraight", Math.PI / 2],
    [-21, 11, "nature.riverBendBank", Math.PI / 2],
  ] as const;
  return (
    <group position-y={GROUND_Y - 0.02}>
      {tiles.map(([x, z, key, rotation]) => (
        <AssetModel
          key={`${x}:${z}`}
          assetKey={key}
          position={[x, 0, z]}
          rotation={[0, rotation, 0]}
          scale={1}
        />
      ))}
      <AssetModel
        assetKey="nature.bridgeWood"
        position={[-16, 0.08, -2]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.42}
      />
      <AssetModel assetKey="nature.lily" position={[-15, 0.05, 3]} scale={0.85} />
      <AssetModel assetKey="nature.lilySmall" position={[-18, 0.05, 7]} scale={0.75} />
      <AssetModel assetKey="nature.waterfallTop" position={[-12, 0.35, -18]} scale={0.42} />
      <AssetModel assetKey="nature.waterfall" position={[-12, -0.8, -20]} scale={0.42} />
    </group>
  );
}

function GroundDressing({ lowQuality }: { lowQuality: boolean }) {
  const props = useMemo(() => {
    const items: Array<[number, number, string, number]> = [];
    for (let index = 0; index < (lowQuality ? 24 : 48); index += 1) {
      const angle = (index / 48) * Math.PI * 2;
      const radius = 8 + (index % 7) * 2.2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius * 0.85;
      const key = index % 4 === 0 ? "nature.grass" : index % 4 === 1 ? "nature.flowerYellow" : index % 4 === 2 ? "nature.grassLarge" : "nature.flowerPurple";
      items.push([x, z, key, 0.7 + (index % 3) * 0.15]);
    }
    return items;
  }, [lowQuality]);

  return (
    <group position-y={GROUND_Y - 0.06}>
      {props.map(([x, z, key, scale]) => (
        <AssetModel
          key={`${x}:${z}:${key}`}
          assetKey={key as "nature.grass"}
          position={[x, 0, z]}
          scale={scale}
        />
      ))}
    </group>
  );
}
