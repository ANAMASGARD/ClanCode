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
      <AssetModel assetKey="townHall.roofGable" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.chimney" position={[0.65, 1.35, -0.55]} scale={0.9} />
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
      <AssetModel assetKey="townHall.roof" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="village.lantern" position={[0.5, 0.2, 0.6]} scale={0.85} />
    </group>
  );
}

export function VillageHouseC() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallStoneHalf" position={[-0.5, 0, 0.5]} />
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
      <AssetModel assetKey="townHall.roofHighGable" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.9} />
      <AssetModel assetKey="townHall.chimney" position={[0.7, 1.5, -0.5]} scale={0.85} />
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
      <AssetModel assetKey="nature.flowerPurple" position={[-0.6, 0, 0.2]} scale={0.8} />
      <AssetModel assetKey="nature.flowerYellow" position={[0.6, 0, 0.2]} scale={0.8} />
      <AssetModel assetKey="nature.bushSmall" position={[0, 0, -0.4]} scale={0.75} />
    </group>
  );
}

/** Compact sample cottage — red gable hut tucked among rocks. */
export function Cottage() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallWoodDoor" />
      <AssetModel assetKey="townHall.wallWoodWindowRound" position={[-1, 0, 0]} />
      <AssetModel assetKey="townHall.wallWoodCorner" position={[1, 0, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[0, 0, -1]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.roofGable" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="village.rockSmall" position={[-1.1, 0, 0.75]} scale={0.85} />
      <AssetModel assetKey="village.lantern" position={[0.8, 0.2, 0.7]} scale={0.8} />
    </group>
  );
}

/** Bakery/collector stand-in — stone base with a chimney. */
export function Bakery() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallDoor" />
      <AssetModel assetKey="townHall.wallWindow" position={[-1, 0, 0]} />
      <AssetModel assetKey="townHall.wallStone" position={[1, 0, 0]} />
      <AssetModel assetKey="townHall.wallStoneHalf" position={[0, 0, -1]} />
      <AssetModel assetKey="townHall.roofHigh" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.9} />
      <AssetModel assetKey="townHall.chimney" position={[0.7, 1.4, -0.6]} scale={0.95} />
      <AssetModel assetKey="village.stallBench" position={[0, 0, 1.1]} scale={0.9} />
    </group>
  );
}

/** Army barracks stand-in built from survival structure pieces. */
export function Barracks() {
  return (
    <group>
      <AssetModel assetKey="workshop.structure" />
      <AssetModel assetKey="workshop.roof" position={[0, 0.05, 0]} />
      <AssetModel assetKey="camp.tent" position={[1.4, 0, 0.6]} scale={0.7} />
      <AssetModel assetKey="workshop.box" position={[-0.5, 0, 0.6]} scale={0.75} />
      <AssetModel assetKey="harbor.flagPennant" position={[-1.3, 0, -0.6]} scale={0.7} />
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

/** Village well — small plaza landmark. */
export function Well() {
  return (
    <group>
      <AssetModel assetKey="village.fountainSquare" scale={0.6} />
      <AssetModel assetKey="nature.rockSmall" position={[-0.9, 0, 0.6]} scale={0.7} />
      <AssetModel assetKey="nature.grass" position={[0.9, 0, 0.6]} scale={0.8} />
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

/** Tall lookout tower stand-in. */
export function WatchTower() {
  return (
    <group>
      <AssetModel assetKey="harbor.towerBaseDoor" scale={0.85} />
      <AssetModel assetKey="harbor.towerTop" position={[0, 1.7, 0]} scale={0.85} />
      <AssetModel assetKey="harbor.towerRoof" position={[0, 3.4, 0]} scale={0.85} />
      <AssetModel assetKey="harbor.flag" position={[0, 4.9, 0]} scale={0.75} />
    </group>
  );
}

/** Archer/cannon stand-in for outer defense pockets. */
export function DefensePost() {
  return (
    <group>
      <AssetModel assetKey="harbor.towerCompleteSmall" scale={0.7} />
      <AssetModel assetKey="harbor.cannon" position={[0.8, 0, 0.6]} rotation={[0, -Math.PI / 4, 0]} scale={0.85} />
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
