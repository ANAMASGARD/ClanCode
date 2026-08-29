"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { DoubleSide, Group, MathUtils } from "three";
import { AssetModel } from "./AssetModel";

export function Harbor({ lowQuality, reducedMotion }: { lowQuality: boolean; reducedMotion: boolean }) {
  const ship = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!ship.current || reducedMotion) return;
    ship.current.position.y = -0.45 + Math.sin(state.clock.elapsedTime * 0.72) * 0.12;
    ship.current.rotation.z = MathUtils.damp(
      ship.current.rotation.z,
      Math.sin(state.clock.elapsedTime * 0.5) * 0.018,
      2.5,
      delta,
    );
  });

  return (
    <group>
      <group position={[-25, -0.35, 12]} rotation={[0, Math.PI / 2, 0]}>
        <AssetModel assetKey="harbor.dock" scale={2.2} />
        <AssetModel assetKey="harbor.dockSmall" position={[0, 0, -4.5]} scale={2.2} />
        <AssetModel assetKey="harbor.crate" position={[2, 1.05, 1]} scale={1.3} />
        <AssetModel assetKey="harbor.crate" position={[1.2, 1.05, 1.8]} scale={1} />
        <AssetModel assetKey="harbor.barrel" position={[-1.7, 1.05, 1.4]} scale={1.3} />
        <AssetModel assetKey="harbor.cannon" position={[-1.6, 1.05, -1.4]} scale={1.2} />
      </group>
      <group ref={ship} position={[-32, -0.45, 14]} rotation={[0, -0.22, 0]}>
        <AssetModel assetKey="harbor.shipLarge" scale={0.62} />
      </group>
      <AssetModel assetKey="harbor.rowboat" position={[-25, -0.65, 19]} rotation={[0, -0.5, 0]} scale={1.2} />
      <Lighthouse lowQuality={lowQuality} reducedMotion={reducedMotion} />
      <CoastalDressing />
    </group>
  );
}

function Lighthouse({ lowQuality, reducedMotion }: { lowQuality: boolean; reducedMotion: boolean }) {
  const beacon = useRef<Group>(null);
  useFrame((_, delta) => {
    if (beacon.current && !reducedMotion && !lowQuality) beacon.current.rotation.y += delta * 0.32;
  });
  return (
    <group position={[-27, -0.05, 2]} scale={0.82}>
      <AssetModel assetKey="harbor.towerBaseDoor" />
      <AssetModel assetKey="harbor.towerMiddleWindows" position={[0, 2, 0]} />
      <AssetModel assetKey="harbor.towerMiddleWindows" position={[0, 4, 0]} />
      <AssetModel assetKey="harbor.towerTop" position={[0, 6, 0]} />
      <AssetModel assetKey="harbor.towerRoof" position={[0, 8.55, 0]} />
      <AssetModel assetKey="village.lantern" position={[0, 7.4, 0]} scale={1.6} />
      <AssetModel assetKey="harbor.flag" position={[0, 9.45, 0]} scale={0.9} />
      <pointLight color="#ffcf72" intensity={lowQuality ? 4 : 10} distance={18} position={[0, 8.1, 0]} />
      <group ref={beacon} position={[0, 8.2, 0]}>
        <mesh position={[5.5, 0, 0]} rotation-z={-Math.PI / 2}>
          <coneGeometry args={[1.25, 11, lowQuality ? 8 : 20, 1, true]} />
          <meshBasicMaterial color="#ffe7a0" transparent opacity={0.12} depthWrite={false} side={DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function CoastalDressing() {
  const props = [
    [-26, -0.25, -5, "nature.rockLarge", 2.5],
    [-30, -0.4, 8, "nature.rockLarge", 3],
    [-24, -0.2, 18, "nature.rockSmall", 2.5],
    [-20, 0.85, 18, "nature.rockLarge", 2.2],
    [-28, -0.3, -2, "nature.rockSmall", 2],
  ] as const;
  return (
    <group>
      {props.map(([x, y, z, key, scale]) => (
        <AssetModel key={`${x}:${z}`} assetKey={key} position={[x, y, z]} scale={scale} />
      ))}
    </group>
  );
}
