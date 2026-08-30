"use client";

import { AssetModel } from "@/app/game/scene/AssetModel";
import { useClanRunViz } from "@/app/game/scene/ClanRunVizContext";
import { constructionProgressFraction, constructionSiteVisible } from "@/app/game/state/construction-site";

const CORNER_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1.35, -1.35],
  [1.35, -1.35],
  [-1.35, 1.35],
  [1.35, 1.35],
];

/** Scaffolding at the Builder Workshop while a run is busy — 3D only, no DOM overlay. */
export function ConstructionSite() {
  const { snapshot, workshopWorld } = useClanRunViz();
  const visible = constructionSiteVisible(snapshot);
  const fillWidth = Math.max(0.08, constructionProgressFraction(snapshot) * 1.8);

  if (!visible) {
    return null;
  }

  const [wx, wy, wz] = workshopWorld;

  return (
    <group position={[wx, wy, wz]}>
      {CORNER_OFFSETS.map(([x, z], index) => (
        <AssetModel
          key={`post-${String(index)}`}
          assetKey="townHall.pillarWood"
          position={[x, 0, z]}
          scale={0.85}
        />
      ))}
      <AssetModel assetKey="village.fence" position={[0, 0, -1.35]} scale={1.35} />
      <AssetModel assetKey="village.fence" position={[0, 0, 1.35]} rotation={[0, Math.PI, 0]} scale={1.35} />
      <AssetModel
        assetKey="village.fence"
        position={[-1.35, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        scale={1.35}
      />
      <AssetModel
        assetKey="village.fence"
        position={[1.35, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={1.35}
      />
      <AssetModel assetKey="workshop.planks" position={[-0.35, 0, 0.25]} scale={0.9} />
      <AssetModel assetKey="workshop.wood" position={[0.45, 0, -0.2]} scale={0.85} />
      <AssetModel assetKey="workshop.barrel" position={[0.15, 0, 0.55]} scale={0.75} />
      <group position={[0, 2.15, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.9, 0.14, 0.1]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[-0.95 + fillWidth / 2, 0, 0.06]}>
          <boxGeometry args={[fillWidth, 0.1, 0.08]} />
          <meshStandardMaterial color="#6bcb4a" emissive="#3d9e2a" emissiveIntensity={0.25} />
        </mesh>
      </group>
    </group>
  );
}
