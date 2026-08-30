"use client";

import { AssetModel } from "@/app/game/scene/AssetModel";

/** Landmark clan hall — stone base, timber upper floor, unstretched roof tower. */
export function TownHall() {
  return (
    <group>
      {/* Raised stone foundation */}
      {[-1, 0, 1].flatMap((x) =>
        [-1, 0, 1].map((z) => (
          <AssetModel
            key={`base:${x}:${z}`}
            assetKey={x === 0 && z === 1 ? "townHall.wallDoor" : "townHall.wallStone"}
            position={[x, 0, z]}
          />
        )),
      )}
      {/* Timber upper floor */}
      <AssetModel assetKey="townHall.wallWoodDoor" position={[0, 1, 1]} />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[-1, 1, 1]} />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[1, 1, 1]} />
      <AssetModel assetKey="townHall.wallWood" position={[-1, 1, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[1, 1, 0]} />
      <AssetModel assetKey="townHall.wallWoodCorner" position={[-1, 1, -1]} />
      <AssetModel assetKey="townHall.wallWoodCorner" position={[1, 1, -1]} />
      <AssetModel assetKey="townHall.wallWood" position={[0, 1, -1]} rotation={[0, Math.PI, 0]} />
      {/* Main roof mass */}
      <AssetModel assetKey="townHall.roofHighGable" position={[0, 2, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.roofHighPoint" position={[0, 3.1, 0]} />
      <AssetModel assetKey="townHall.chimney" position={[1.2, 2.8, -0.8]} />
      {/* Entrance */}
      <AssetModel assetKey="townHall.stairsWide" position={[0, 0, 2.05]} />
      <AssetModel assetKey="townHall.balconyFence" position={[0, 1.05, 1.55]} />
      {/* Accents */}
      <AssetModel assetKey="village.bannerRed" position={[-1.6, 1.8, 1.5]} />
      <AssetModel assetKey="village.bannerGreen" position={[1.6, 1.8, 1.5]} />
      <AssetModel assetKey="village.lantern" position={[-1.4, 0.2, 1.8]} />
      <AssetModel assetKey="village.lantern" position={[1.4, 0.2, 1.8]} />
    </group>
  );
}
