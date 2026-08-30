"use client";

import { AssetModel } from "@/app/game/scene/AssetModel";

export function SearchTower() {
  return (
    <group>
      <AssetModel assetKey="harbor.towerBaseDoor" />
      <AssetModel assetKey="harbor.towerMiddleWindows" position={[0, 2, 0]} />
      <AssetModel assetKey="harbor.towerTop" position={[0, 4, 0]} />
      <AssetModel assetKey="harbor.towerRoof" position={[0, 6, 0]} />
      <AssetModel assetKey="harbor.flag" position={[0, 7.8, 0]} scale={0.85} />
    </group>
  );
}

export function BuilderWorkshop() {
  return (
    <group>
      <AssetModel assetKey="workshop.structure" />
      <AssetModel assetKey="workshop.roof" position={[0, 0.05, 0]} />
      <AssetModel assetKey="workshop.workbench" position={[-0.35, 0, 0.35]} scale={0.85} />
      <AssetModel assetKey="workshop.planks" position={[0.35, 0, 0.35]} scale={0.75} />
      <AssetModel assetKey="workshop.wood" position={[0.35, 0, -0.3]} scale={0.7} />
    </group>
  );
}

export function ValidationForge() {
  return (
    <group>
      <AssetModel assetKey="forge.structure" />
      <AssetModel assetKey="forge.roof" position={[0, 0.05, 0]} />
      <AssetModel assetKey="workshop.anvil" position={[-0.35, 0, 0.35]} scale={0.8} />
      <AssetModel assetKey="workshop.grinder" position={[0.35, 0, 0.35]} scale={0.8} />
      <pointLight color="#ff7b36" intensity={8} distance={9} position={[0, 2.4, 0]} />
    </group>
  );
}

export function SessionLodge() {
  return (
    <group>
      <AssetModel assetKey="townHall.wallWoodDoor" />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[-1, 0, 0]} />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[1, 0, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[-1, 0, -1]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[1, 0, -1]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[0, 0, -1]} rotation={[0, Math.PI, 0]} />
      <AssetModel assetKey="townHall.roofGable" position={[0, 1, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="village.lantern" position={[0.75, 0.25, 0.75]} scale={0.85} />
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

export function TestCamp() {
  return (
    <group>
      <AssetModel assetKey="camp.tent" position={[-0.25, 0, 0]} />
      <AssetModel assetKey="camp.fire" position={[0.4, 0, 0.35]} scale={0.75} />
      <pointLight color="#ff9b45" intensity={4} distance={5} position={[1.5, 1.2, 1.2]} />
    </group>
  );
}

export function Market() {
  return (
    <group>
      <AssetModel assetKey="village.stallRed" position={[-0.75, 0, 0]} />
      <AssetModel assetKey="village.stallGreen" position={[0.75, 0, 0]} />
      <AssetModel assetKey="village.cart" position={[0, 0, 0.9]} scale={0.85} />
      <AssetModel assetKey="village.stallBench" position={[0, 0, -0.6]} />
    </group>
  );
}
