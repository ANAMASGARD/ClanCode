"use client";

import { AssetModel } from "@/app/game/scene/AssetModel";

export function VillageHouseA() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallWoodDoor" />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[-1, 0, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[1, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[-1, 0, -1]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[0, 0, -1]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.roof" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.chimney" position={[0.6, 1.2, -0.5]} scale={0.9} />
    </group>
  );
}

export function VillageHouseB() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallWoodDoor" rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[0, 0, 1]} />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[0, 0, -1]} />
      <AssetModel assetKey="townHall.wallWoodCorner" position={[-1, 0, 1]} />
      <AssetModel assetKey="townHall.wallWoodCorner" position={[-1, 0, -1]} />
      <AssetModel assetKey="townHall.roofGable" position={[0, 1, 0]} />
      <AssetModel assetKey="village.lantern" position={[0.5, 0.2, 0.6]} scale={0.85} />
    </group>
  );
}

export function VillageHouseC() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallWoodHalf" position={[-0.5, 0, 0.5]} />
      <AssetModel assetKey="townHall.wallWoodDoor" position={[0, 0, 0.5]} />
      <AssetModel assetKey="townHall.wallWoodDetail" position={[0.5, 0.5, 0.5]} />
      <AssetModel assetKey="townHall.roofLeft" position={[-0.5, 1, 0]} />
      <AssetModel assetKey="townHall.roofRight" position={[0.5, 1, 0]} />
      <AssetModel assetKey="townHall.stairsWood" position={[0, 0, 1.2]} scale={0.9} />
    </group>
  );
}

export function VillageHouseD() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallStone" />
      <AssetModel assetKey="townHall.wallWindow" position={[-1, 0, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[1, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.wallStoneHalf" position={[0, 0, -1]} />
      <AssetModel assetKey="townHall.roofHigh" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.85} />
    </group>
  );
}

export function StorageYard() {
  return (
    <group>
      <AssetModel assetKey="workshop.barrel" position={[-0.4, 0, 0.3]} scale={0.85} />
      <AssetModel assetKey="workshop.barrelOpen" position={[0.2, 0, 0.35]} scale={0.85} />
      <AssetModel assetKey="workshop.box" position={[0.45, 0, -0.2]} scale={0.8} />
      <AssetModel assetKey="workshop.planks" position={[-0.35, 0, -0.25]} scale={0.75} />
      <AssetModel assetKey="workshop.stone" position={[0, 0, -0.35]} scale={0.7} />
      <AssetModel assetKey="village.fence" position={[0, 0, 0.55]} scale={2.2} />
    </group>
  );
}

export function GuardPost() {
  return (
    <group>
      <AssetModel assetKey="harbor.towerCompleteSmall" scale={0.75} />
      <AssetModel assetKey="harbor.flagPennant" position={[0, 3.2, 0]} scale={0.8} />
    </group>
  );
}

export function MarketCluster() {
  return (
    <group>
      <AssetModel assetKey="village.stallRed" position={[-0.6, 0, 0]} />
      <AssetModel assetKey="village.stallGreen" position={[0.6, 0, 0]} />
      <AssetModel assetKey="village.stallBench" position={[0, 0, 0.7]} />
      <AssetModel assetKey="village.cart" position={[0, 0, -0.5]} scale={0.75} />
    </group>
  );
}

export function GardenCluster() {
  return (
    <group>
      <AssetModel assetKey="village.hedgeCurved" position={[0, 0, 0.5]} />
      <AssetModel assetKey="village.fountain" position={[0, 0, 0]} scale={0.55} />
      <AssetModel assetKey="nature.flowerPurple" position={[-0.6, 0, 0.2]} scale={0.8} />
      <AssetModel assetKey="nature.flowerYellow" position={[0.6, 0, 0.2]} scale={0.8} />
      <AssetModel assetKey="nature.bushSmall" position={[0, 0, -0.4]} scale={0.75} />
    </group>
  );
}
