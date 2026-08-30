"use client";

import { AssetModel } from "@/app/game/scene/AssetModel";

/** Sample.png gatehouse — wide stone arch, timber upper storey, steep red gable. */
export function TownHall() {
  return (
    <group>
      {/* Stone ground floor with wide arch passage */}
      <AssetModel assetKey="townHall.wallStone" position={[-1, 0, 0]} />
      <AssetModel assetKey="townHall.wallStone" position={[1, 0, 0]} />
      <AssetModel assetKey="townHall.wallStone" position={[-1, 0, -1]} />
      <AssetModel assetKey="townHall.wallStone" position={[1, 0, -1]} />
      <AssetModel assetKey="townHall.wallStone" position={[0, 0, -1]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.wallDoorWide" position={[0, 0, 1]} />
      <AssetModel assetKey="townHall.wallArch" position={[0, 0, 0]} rotation={[0, Math.PI, 0]} />

      {/* Timber-framed upper storey */}
      <AssetModel assetKey="townHall.wallWoodDoor" position={[0, 1, 1]} />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[-1, 1, 1]} />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[1, 1, 1]} />
      <AssetModel assetKey="townHall.wallWood" position={[-1, 1, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[1, 1, 0]} />
      <AssetModel assetKey="townHall.wallWoodCorner" position={[-1, 1, -1]} />
      <AssetModel assetKey="townHall.wallWoodCorner" position={[1, 1, -1]} />
      <AssetModel assetKey="townHall.wallWood" position={[0, 1, -1]} rotation={[0, Math.PI, 0]} />

      {/* Steep red gable roof mass */}
      <AssetModel assetKey="townHall.roofHighGable" position={[0, 2, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.roofHighPoint" position={[0, 3.15, 0]} />
      <AssetModel assetKey="townHall.chimney" position={[1.3, 2.9, -0.7]} />

      {/* Entrance plaza */}
      <AssetModel assetKey="townHall.stairsWide" position={[0, 0, 2.1]} />
      <AssetModel assetKey="townHall.balconyFence" position={[0, 1.05, 1.6]} />
      <AssetModel assetKey="village.bannerRed" position={[0, 2.4, 1.55]} scale={1.1} />
      <AssetModel assetKey="village.lantern" position={[-1.5, 0.2, 1.9]} />
      <AssetModel assetKey="village.lantern" position={[1.5, 0.2, 1.9]} />
    </group>
  );
}
