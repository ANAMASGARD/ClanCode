"use client";

import { AssetModel } from "@/app/game/scene/AssetModel";

/** Sample red-roof cottage — compact stone base, timber trim, gable roof. */
export function VillageHouseA() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallStone" position={[-0.5, 0, 0]} />
      <AssetModel assetKey="townHall.wallStone" position={[0.5, 0, 0]} />
      <AssetModel assetKey="townHall.wallDoor" position={[0, 0, 0.5]} scale={0.9} />
      <AssetModel assetKey="townHall.wallWindow" position={[-0.5, 0, 0.5]} />
      <AssetModel assetKey="townHall.wallWindow" position={[0.5, 0, 0.5]} />
      <AssetModel assetKey="townHall.wallStone" position={[0, 0, -0.5]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.roofGable" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.roofGableDetail" position={[0, 1, 0.18]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.chimneyBase" position={[0.42, 1.05, -0.35]} scale={0.85} />
      <AssetModel assetKey="townHall.chimneyTop" position={[0.42, 1.45, -0.35]} scale={0.85} />
      <AssetModel assetKey="village.bannerRed" position={[0, 1.15, 0.62]} scale={0.75} />
      <AssetModel assetKey="village.lantern" position={[0.65, 0.15, 0.75]} scale={0.75} />
      <AssetModel assetKey="village.rockSmall" position={[-0.75, 0, 0.55]} scale={0.7} />
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

/** Sample teal-roof house — two-storey stone/timber like the Fantasy Town mill-house. */
export function VillageHouseD() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallStone" position={[-0.5, 0, 0]} />
      <AssetModel assetKey="townHall.wallStone" position={[0.5, 0, 0]} />
      <AssetModel assetKey="townHall.wallDoor" position={[0, 0, 0.5]} scale={0.9} />
      <AssetModel assetKey="townHall.wallWindow" position={[-0.5, 0, 0.5]} />
      <AssetModel assetKey="townHall.wallWindow" position={[0.5, 0, 0.5]} />
      <AssetModel assetKey="townHall.wallStone" position={[0, 0, -0.5]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[-0.5, 1, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[0.5, 1, 0]} />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[-0.5, 1, 0.5]} />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[0.5, 1, 0.5]} />
      <AssetModel assetKey="townHall.wallWood" position={[0, 1, -0.5]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.roofHigh" position={[0, 2, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="village.bannerGreen" position={[0, 2.15, 0.55]} scale={0.8} />
      <AssetModel assetKey="village.stallGreen" position={[0.85, 0, 0.35]} scale={0.55} />
      <AssetModel assetKey="village.lantern" position={[-0.7, 0.15, 0.75]} scale={0.75} />
      <AssetModel assetKey="village.rockSmall" position={[0.75, 0, -0.45]} scale={0.65} />
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
      <AssetModel assetKey="village.stallRed" position={[-0.55, 0, -0.1]} />
      <AssetModel assetKey="village.stallGreen" position={[0.55, 0, -0.1]} />
      <AssetModel assetKey="village.stallBench" position={[-0.15, 0, 0.55]} />
      <AssetModel assetKey="village.stallBench" position={[0.35, 0, 0.55]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="village.stallStool" position={[-0.45, 0, 0.45]} />
      <AssetModel assetKey="village.stallStool" position={[0.15, 0, 0.45]} />
      <AssetModel assetKey="village.cart" position={[0, 0, -0.85]} scale={0.75} />
      <AssetModel assetKey="village.fence" position={[0, 0, 0.95]} scale={1.4} />
      <AssetModel assetKey="village.lantern" position={[-0.95, 0, 0.35]} scale={0.85} />
      <AssetModel assetKey="village.lantern" position={[0.95, 0, 0.35]} scale={0.85} />
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

/** Small timber cottage with red gable roof — sample pocket house. */
export function Cottage() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallWoodDoor" position={[0, 0, 0.5]} />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[-0.5, 0, 0.5]} />
      <AssetModel assetKey="townHall.wallWood" position={[0.5, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.wallWoodCorner" position={[-0.5, 0, -0.5]} />
      <AssetModel assetKey="townHall.wallWoodCorner" position={[0.5, 0, -0.5]} />
      <AssetModel assetKey="townHall.wallWood" position={[0, 0, -0.5]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.roofGable" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.roofGableDetail" position={[0, 1, 0.15]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="village.rockSmall" position={[-0.75, 0, 0.55]} scale={0.75} />
      <AssetModel assetKey="village.lantern" position={[0.65, 0.15, 0.7]} scale={0.75} />
    </group>
  );
}

/** Teal-roof stone shop — chimney, bench, and green stall accent. */
export function Bakery() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallDoor" position={[0, 0, 0.5]} />
      <AssetModel assetKey="townHall.wallWindow" position={[-0.5, 0, 0.5]} />
      <AssetModel assetKey="townHall.wallWindow" position={[0.5, 0, 0.5]} />
      <AssetModel assetKey="townHall.wallStone" position={[-0.5, 0, 0]} />
      <AssetModel assetKey="townHall.wallStone" position={[0.5, 0, 0]} />
      <AssetModel assetKey="townHall.wallStone" position={[0, 0, -0.5]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.roofHigh" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.chimneyBase" position={[0.45, 1.05, -0.35]} scale={0.85} />
      <AssetModel assetKey="townHall.chimneyTop" position={[0.45, 1.45, -0.35]} scale={0.85} />
      <AssetModel assetKey="village.stallBench" position={[0, 0, 0.95]} scale={0.85} />
      <AssetModel assetKey="village.stallStool" position={[0.35, 0, 0.8]} scale={0.9} />
      <AssetModel assetKey="village.bannerGreen" position={[0, 1.2, 0.62]} scale={0.7} />
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

/** Fountain plaza — sample square centerpiece with picnic seating nearby. */
export function Well() {
  return (
    <group>
      <AssetModel assetKey="village.fountainRound" />
      <AssetModel assetKey="village.fountain" position={[0, 0, 0]} scale={0.55} />
      <AssetModel assetKey="village.stallBench" position={[-0.85, 0, 0.55]} scale={0.85} />
      <AssetModel assetKey="village.stallStool" position={[-0.55, 0, 0.45]} />
      <AssetModel assetKey="village.stallStool" position={[-1.05, 0, 0.45]} />
      <AssetModel assetKey="village.lantern" position={[0.85, 0, 0.55]} scale={0.85} />
      <AssetModel assetKey="nature.rockSmall" position={[-0.75, 0, -0.55]} scale={0.7} />
      <AssetModel assetKey="nature.rockSmall" position={[0.75, 0, -0.55]} scale={0.7} />
    </group>
  );
}

/** Bullock cart lane — loaded cart on open grass beside the market ring. */
export function CartHay() {
  return (
    <group>
      <AssetModel assetKey="village.cart" scale={0.9} />
      <AssetModel assetKey="village.cartLow" position={[0.75, 0, 0.25]} rotation={[0, -Math.PI / 4, 0]} scale={0.85} />
      <AssetModel assetKey="workshop.barrel" position={[0.35, 0, 0.5]} scale={0.75} />
      <AssetModel assetKey="workshop.planks" position={[-0.5, 0, 0.35]} scale={0.65} />
      <AssetModel assetKey="village.fence" position={[-0.55, 0, -0.45]} rotation={[0, Math.PI / 2, 0]} scale={0.9} />
    </group>
  );
}

/** Single covered stall with picnic seating — north market pocket. */
export function StallCorner() {
  return (
    <group>
      <AssetModel assetKey="village.stall" />
      <AssetModel assetKey="village.stallRed" position={[0.75, 0, 0.15]} scale={0.55} />
      <AssetModel assetKey="village.stallBench" position={[0, 0, 0.75]} />
      <AssetModel assetKey="village.stallBench" position={[-0.55, 0, 0.35]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="village.stallStool" position={[0.35, 0, 0.55]} />
      <AssetModel assetKey="village.stallStool" position={[-0.15, 0, 0.55]} />
      <AssetModel assetKey="village.lantern" position={[0.55, 0, -0.35]} scale={0.8} />
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
