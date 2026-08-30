"use client";

import { AssetModel } from "@/app/game/scene/AssetModel";

export function VillageHouseA() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallStone" position={[-1, 0, 0]} />
      <AssetModel assetKey="townHall.wallStone" position={[1, 0, 0]} />
      <AssetModel assetKey="townHall.wallDoor" position={[0, 0, 1]} />
      <AssetModel assetKey="townHall.wallWindow" position={[-1, 0, 1]} />
      <AssetModel assetKey="townHall.wallWindow" position={[1, 0, 1]} />
      <AssetModel assetKey="townHall.wallStone" position={[0, 0, -1]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[-1, 1, 1]} />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[1, 1, 1]} />
      <AssetModel assetKey="townHall.wallWood" position={[-1, 1, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[1, 1, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[0, 1, -1]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.roofHighGable" position={[0, 2, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.85} />
      <AssetModel assetKey="townHall.chimneyBase" position={[0.65, 2.3, -0.55]} />
      <AssetModel assetKey="townHall.chimneyTop" position={[0.65, 2.9, -0.55]} />
    </group>
  );
}

export function VillageHouseB() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallWoodDoor" position={[0, 0, 1]} />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[-1, 0, 1]} />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[1, 0, 1]} />
      <AssetModel assetKey="townHall.wallWood" position={[-1, 0, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[1, 0, 0]} />
      <AssetModel assetKey="townHall.wallWoodCorner" position={[-1, 0, -1]} />
      <AssetModel assetKey="townHall.wallWoodCorner" position={[1, 0, -1]} />
      <AssetModel assetKey="townHall.wallWood" position={[0, 0, -1]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.roofGable" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.roofGableDetail" position={[0, 1, 0.25]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="village.lantern" position={[0.5, 0.2, 1.2]} scale={0.85} />
    </group>
  );
}

export function VillageHouseC() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallStone" position={[-1, 0, 0]} />
      <AssetModel assetKey="townHall.wallWoodDoor" position={[0, 0, 1]} />
      <AssetModel assetKey="townHall.wallWoodDetail" position={[1, 0, 0]} />
      <AssetModel assetKey="townHall.wallStoneHalf" position={[-1, 0, -1]} />
      <AssetModel assetKey="townHall.wallStoneHalf" position={[1, 0, -1]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[0, 0, -1]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.roofLeft" position={[-0.5, 1, 0]} />
      <AssetModel assetKey="townHall.roofRight" position={[0.5, 1, 0]} />
      <AssetModel assetKey="townHall.stairsWoodHandrail" position={[0, 0, 1.5]} scale={0.9} />
    </group>
  );
}

export function VillageHouseD() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallStone" position={[-1, 0, 0]} />
      <AssetModel assetKey="townHall.wallStone" position={[1, 0, 0]} />
      <AssetModel assetKey="townHall.wallDoor" position={[0, 0, 1]} />
      <AssetModel assetKey="townHall.wallWindow" position={[-1, 0, 1]} />
      <AssetModel assetKey="townHall.wallWindow" position={[1, 0, 1]} />
      <AssetModel assetKey="townHall.wallStone" position={[0, 0, -1]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.roofHighGable" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.roofHighPoint" position={[0, 2.1, 0]} scale={0.85} />
      <AssetModel assetKey="townHall.chimneyBase" position={[0.7, 1.8, -0.5]} />
      <AssetModel assetKey="townHall.chimneyTop" position={[0.7, 2.4, -0.5]} />
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
      <AssetModel assetKey="castle.towerHexagonBase" />
      <AssetModel assetKey="castle.towerHexagonRoof" position={[0, 1.05, 0]} />
      <AssetModel assetKey="castle.flagPennant" position={[0, 1.85, 0]} scale={0.7} />
    </group>
  );
}

export function MarketCluster() {
  return (
    <group>
      <AssetModel assetKey="village.stallRed" position={[-0.6, 0, 0]} />
      <AssetModel assetKey="village.stallGreen" position={[0.6, 0, 0]} />
      <AssetModel assetKey="village.stallBench" position={[0, 0, 0.7]} />
      <AssetModel assetKey="village.stallStool" position={[0.35, 0, 0.55]} />
      <AssetModel assetKey="village.cart" position={[0, 0, -0.75]} scale={0.8} />
      <AssetModel assetKey="village.lantern" position={[-1.1, 0, 0.45]} scale={0.9} />
      <AssetModel assetKey="village.lantern" position={[1.1, 0, 0.45]} scale={0.9} />
    </group>
  );
}

export function GardenCluster() {
  return (
    <group>
      <AssetModel assetKey="village.hedgeCurved" position={[0, 0, 0.5]} />
      <AssetModel assetKey="nature.flowerPurple" position={[-0.6, 0, 0.2]} scale={0.8} />
      <AssetModel assetKey="nature.flowerYellow" position={[0.6, 0, 0.2]} scale={0.8} />
      <AssetModel assetKey="nature.bushSmall" position={[0, 0, -0.4]} scale={0.75} />
    </group>
  );
}

/** Compact sample cottage — teal gable hut tucked among rocks. */
export function Cottage() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallWoodDoor" position={[0, 0, 1]} />
      <AssetModel assetKey="townHall.wallWoodWindowRound" position={[-1, 0, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[1, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.wallWoodCorner" position={[-1, 0, -1]} />
      <AssetModel assetKey="townHall.wallWoodCorner" position={[1, 0, -1]} />
      <AssetModel assetKey="townHall.wallWood" position={[0, 0, -1]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.roofGable" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="village.rockSmall" position={[-1.1, 0, 0.75]} scale={0.85} />
      <AssetModel assetKey="village.lantern" position={[0.8, 0.2, 0.7]} scale={0.8} />
    </group>
  );
}

/** Bakery — closed stone shop with chimney and bench out front. */
export function Bakery() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallDoor" position={[0, 0, 1]} />
      <AssetModel assetKey="townHall.wallWindow" position={[-1, 0, 1]} />
      <AssetModel assetKey="townHall.wallWindow" position={[1, 0, 1]} />
      <AssetModel assetKey="townHall.wallStone" position={[-1, 0, 0]} />
      <AssetModel assetKey="townHall.wallStone" position={[1, 0, 0]} />
      <AssetModel assetKey="townHall.wallStone" position={[0, 0, -1]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.roofHigh" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.9} />
      <AssetModel assetKey="townHall.chimneyBase" position={[0.7, 1.2, -0.6]} />
      <AssetModel assetKey="townHall.chimneyTop" position={[0.7, 1.8, -0.6]} />
      <AssetModel assetKey="village.stallBench" position={[0, 0, 1.4]} scale={0.9} />
    </group>
  );
}

/** Clash-style barracks — Fantasy Town hut + castle ballista. */
export function Barracks() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallWoodDoor" position={[0, 0, 0.65]} />
      <AssetModel assetKey="townHall.wallWood" position={[-0.85, 0, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[0.85, 0, 0]} />
      <AssetModel assetKey="townHall.roofGable" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.72} />
      <AssetModel assetKey="castle.ballista" position={[1.05, 0, 0.75]} rotation={[0, -Math.PI / 6, 0]} scale={0.65} />
      <AssetModel assetKey="castle.flagPennant" position={[0, 1.7, 0]} scale={0.7} />
    </group>
  );
}

/** Compact Castle Kit archer tower for the north approach. */
export function ArcherTower() {
  return (
    <group>
      <AssetModel assetKey="castle.towerHexagonBase" />
      <AssetModel assetKey="castle.towerHexagonMid" position={[0, 1.05, 0]} />
      <AssetModel assetKey="castle.towerHexagonRoof" position={[0, 2.1, 0]} />
      <AssetModel assetKey="castle.flagPennant" position={[0, 2.85, 0]} scale={0.75} />
    </group>
  );
}

/** Gold / loot store — crates and barrels, Clash storage stand-in. */
export function GoldStore() {
  return (
    <group>
      <AssetModel assetKey="harbor.crate" position={[-0.35, 0, 0.15]} scale={1.1} />
      <AssetModel assetKey="harbor.crate" position={[0.4, 0, 0.2]} scale={1} />
      <AssetModel assetKey="harbor.barrel" position={[0, 0, -0.35]} scale={1} />
      <AssetModel assetKey="village.fence" position={[0, 0, 0.7]} scale={1.4} />
    </group>
  );
}

/** Sawmill/lumber collector stand-in. */
export function LumberYard() {
  return (
    <group>
      <AssetModel assetKey="workshop.wood" position={[-0.5, 0, 0.3]} scale={0.8} />
      <AssetModel assetKey="nature.logStack" position={[0.5, 0, 0.35]} scale={0.7} />
      <AssetModel assetKey="workshop.planks" position={[0, 0, -0.4]} scale={0.8} />
      <AssetModel assetKey="workshop.workbench" position={[-0.9, 0, -0.4]} scale={0.8} />
      <AssetModel assetKey="village.fence" position={[0, 0, 0.9]} scale={2.4} />
    </group>
  );
}

/** Village well — round fountain plaza like the Kenney sample sheet. */
export function Well() {
  return (
    <group>
      <AssetModel assetKey="village.fountainRound" />
      <AssetModel assetKey="townHall.pillarStone" position={[-1.15, 0, 1.15]} />
      <AssetModel assetKey="townHall.pillarStone" position={[1.15, 0, 1.15]} />
      <AssetModel assetKey="townHall.pillarStone" position={[-1.15, 0, -1.15]} />
      <AssetModel assetKey="townHall.pillarStone" position={[1.15, 0, -1.15]} />
      <AssetModel assetKey="village.lantern" position={[0, 0, 1.35]} />
      <AssetModel assetKey="nature.rockSmall" position={[-0.85, 0, 0.35]} scale={0.75} />
      <AssetModel assetKey="nature.rockSmall" position={[0.85, 0, -0.35]} scale={0.75} />
    </group>
  );
}

/** Loaded cart with supplies — sample.png market lane accent. */
export function CartHay() {
  return (
    <group>
      <AssetModel assetKey="village.cart" scale={0.85} />
      <AssetModel assetKey="workshop.barrel" position={[0.35, 0, 0.45]} scale={0.75} />
      <AssetModel assetKey="workshop.planks" position={[-0.45, 0, 0.35]} scale={0.7} />
      <AssetModel assetKey="workshop.wood" position={[0.15, 0, -0.55]} scale={0.65} />
    </group>
  );
}

/** Single covered stall with seating — compact market pocket. */
export function StallCorner() {
  return (
    <group>
      <AssetModel assetKey="village.stall" />
      <AssetModel assetKey="village.stallBench" position={[0, 0, 0.75]} />
      <AssetModel assetKey="village.stallStool" position={[0.4, 0, 0.55]} />
      <AssetModel assetKey="village.planks" position={[-0.55, 0, -0.35]} scale={0.85} />
    </group>
  );
}

/** Rock framing with hedges — sample village filler between buildings. */
export function RockGarden() {
  return (
    <group>
      <AssetModel assetKey="nature.rockLarge" position={[-0.55, 0, 0.35]} scale={0.55} />
      <AssetModel assetKey="nature.rockLargeB" position={[0.55, 0, -0.25]} scale={0.5} />
      <AssetModel assetKey="village.hedgeCurved" position={[0, 0, 0.65]} />
      <AssetModel assetKey="nature.grass" position={[0, 0, -0.45]} scale={0.75} />
      <AssetModel assetKey="nature.flowerYellow" position={[0.35, 0, 0.2]} scale={0.7} />
    </group>
  );
}

/** Wheat/corn collector rows. */
export function CropField() {
  return (
    <group>
      {[-0.9, 0, 0.9].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <AssetModel assetKey="nature.cropRows" scale={0.5} />
          <AssetModel assetKey="nature.cropsCorn" position={[0, 0.02, 0]} scale={0.7} />
        </group>
      ))}
      <AssetModel assetKey="village.fence" position={[0, 0, 1]} scale={2.6} />
    </group>
  );
}

/** Tall lookout — Castle Kit hexagon, not the oversized pirate keep. */
export function WatchTower() {
  return (
    <group>
      <AssetModel assetKey="castle.towerHexagonBase" />
      <AssetModel assetKey="castle.towerHexagonMid" position={[0, 1.05, 0]} />
      <AssetModel assetKey="castle.towerHexagonRoof" position={[0, 2.1, 0]} />
      <AssetModel assetKey="castle.flagPennant" position={[0, 2.85, 0]} scale={0.75} />
    </group>
  );
}

/** Archer/cannon stand-in for outer defense pockets. */
export function DefensePost() {
  return (
    <group>
      <AssetModel assetKey="castle.towerHexagonBase" />
      <AssetModel assetKey="castle.towerHexagonRoof" position={[0, 1.05, 0]} />
      <AssetModel assetKey="castle.ballista" position={[1.05, 0, 0.7]} rotation={[0, -Math.PI / 4, 0]} scale={0.6} />
    </group>
  );
}

/** Army camp cluster — tent stand-ins at plot corners. */
export function ArmyCamp() {
  return (
    <group>
      <AssetModel assetKey="camp.tent" position={[-0.5, 0, 0]} scale={0.9} />
      <AssetModel assetKey="camp.tent" position={[0.5, 0, 0.3]} rotation={[0, Math.PI / 3, 0]} scale={0.85} />
      <AssetModel assetKey="camp.fire" position={[0, 0, -0.5]} scale={0.65} />
    </group>
  );
}
