"use client";

import { AssetModel } from "@/app/game/scene/AssetModel";

/** Compact Castle Kit archer tower — not the oversized pirate keep. */
export function SearchTower() {
  return (
    <group>
      <AssetModel assetKey="castle.towerHexagonBase" />
      <AssetModel assetKey="castle.towerHexagonMid" position={[0, 1.05, 0]} />
      <AssetModel assetKey="castle.towerHexagonRoof" position={[0, 2.1, 0]} />
      <AssetModel assetKey="castle.flagPennant" position={[0, 2.85, 0]} scale={0.8} />
    </group>
  );
}

/** Open timber workshop — Fantasy Town kit, sample-scale (not survival 10×). */
export function BuilderWorkshop() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallWood" position={[-1, 0, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[1, 0, 0]} />
      <AssetModel assetKey="townHall.wallWoodCorner" position={[-1, 0, -1]} />
      <AssetModel assetKey="townHall.wallWoodCorner" position={[1, 0, -1]} />
      <AssetModel assetKey="townHall.wallWood" position={[0, 0, -1]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.roofGable" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.9} />
      <AssetModel assetKey="village.planks" position={[0, 0, 0.55]} />
      <AssetModel assetKey="village.planks" position={[-0.55, 0, 0.2]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="harbor.barrel" position={[0.65, 0, 0.35]} scale={0.9} />
      <AssetModel assetKey="harbor.crate" position={[-0.55, 0, 0.45]} scale={0.85} />
      <AssetModel assetKey="village.lantern" position={[0.9, 0.2, 0.75]} scale={0.85} />
    </group>
  );
}

/** Stone forge cottage — Fantasy Town walls + warm forge light. */
export function ValidationForge() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallStone" position={[-1, 0, 0]} />
      <AssetModel assetKey="townHall.wallStone" position={[1, 0, 0]} />
      <AssetModel assetKey="townHall.wallDoor" position={[0, 0, 1]} />
      <AssetModel assetKey="townHall.wallWindow" position={[-1, 0, 1]} />
      <AssetModel assetKey="townHall.wallWindow" position={[1, 0, 1]} />
      <AssetModel assetKey="townHall.wallStone" position={[0, 0, -1]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.roofHigh" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.9} />
      <AssetModel assetKey="townHall.chimneyBase" position={[0.65, 1.1, -0.55]} />
      <AssetModel assetKey="townHall.chimneyTop" position={[0.65, 1.7, -0.55]} />
      <AssetModel assetKey="harbor.barrel" position={[-0.55, 0, 0.45]} scale={0.85} />
      <pointLight color="#ff7b36" intensity={8} distance={9} position={[0, 2.4, 0]} />
    </group>
  );
}

export function SessionLodge() {
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
      <AssetModel assetKey="townHall.roofGableDetail" position={[0, 1, 0.3]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.roofWindow" position={[0, 1.2, 1.01]} />
      <AssetModel assetKey="village.lantern" position={[-1.2, 0.25, 1.2]} scale={0.85} />
      <AssetModel assetKey="village.lantern" position={[1.2, 0.25, 1.2]} scale={0.85} />
    </group>
  );
}

export function ModelShrine() {
  return (
    <group>
      <AssetModel assetKey="nature.ring" rotation={[Math.PI / 2, 0, 0]} scale={1.4} />
      <AssetModel assetKey="nature.obelisk" position={[0, 0, 0]} scale={0.55} />
      <pointLight color="#52e6ff" intensity={5} distance={8} position={[0, 2, 0]} />
    </group>
  );
}

export function ApprovalGate() {
  return (
    <group>
      <AssetModel assetKey="harbor.castleGate" />
      <AssetModel assetKey="village.bannerRed" position={[0, 3.6, 0.4]} scale={1.2} />
    </group>
  );
}

/** Army camp — castle ballista + Fantasy Town cottage, Clash-style barracks. */
export function TestCamp() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallWoodDoor" position={[0, 0, 0.7]} />
      <AssetModel assetKey="townHall.wallWood" position={[-0.85, 0, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[0.85, 0, 0]} />
      <AssetModel assetKey="townHall.roofGable" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.75} />
      <AssetModel assetKey="castle.ballista" position={[0.95, 0, 0.85]} rotation={[0, -Math.PI / 5, 0]} scale={0.7} />
      <AssetModel assetKey="village.fence" position={[-0.9, 0, 0.85]} scale={1.1} />
    </group>
  );
}

export function Market() {
  return (
    <group>
      <AssetModel assetKey="village.stallRed" position={[-0.75, 0, 0]} />
      <AssetModel assetKey="village.stallGreen" position={[0.75, 0, 0]} />
      <AssetModel assetKey="village.cart" position={[0, 0, 0.9]} scale={0.85} />
      <AssetModel assetKey="village.cartLow" position={[-0.4, 0, -0.7]} scale={0.9} />
      <AssetModel assetKey="village.stallBench" position={[0, 0, -0.6]} />
      <AssetModel assetKey="village.stallStool" position={[0.5, 0, -0.5]} />
      <AssetModel assetKey="village.hedgeCurved" position={[0, 0, -1.15]} scale={1.2} />
      <AssetModel assetKey="village.fenceCurved" position={[-1.35, 0, 0.25]} rotation={[0, Math.PI / 2, 0]} scale={1.1} />
    </group>
  );
}
