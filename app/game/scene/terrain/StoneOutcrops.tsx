"use client";

import type { GameAssetKey } from "@/app/game/assets/catalog";
import { SURFACE_Y } from "@/app/game/state/island";
import { AssetModel } from "../AssetModel";

/** Light-gray stone outcrops at top-right (+x, -z), echoing the reference. */
const OUTCROPS: Array<{
  key: GameAssetKey;
  position: readonly [number, number, number];
  rotation: number;
  scale: number;
}> = [
  { key: "nature.stoneLargeA", position: [42, SURFACE_Y - 0.04, -40], rotation: 0.4, scale: 2.2 },
  { key: "nature.stoneLargeC", position: [38, SURFACE_Y - 0.05, -44], rotation: 1.1, scale: 1.9 },
  { key: "nature.stoneLargeE", position: [44, SURFACE_Y - 0.04, -36], rotation: 2.0, scale: 2.0 },
  { key: "nature.stoneLargeB", position: [36, SURFACE_Y - 0.06, -38], rotation: 0.8, scale: 1.7 },
];

export function StoneOutcrops() {
  return (
    <group>
      {OUTCROPS.map((outcrop, index) => (
        <AssetModel
          key={`stone:${index}`}
          assetKey={outcrop.key}
          position={outcrop.position}
          rotation={[0, outcrop.rotation, 0]}
          scale={outcrop.scale}
          castShadow={false}
          receiveShadow
        />
      ))}
    </group>
  );
}
