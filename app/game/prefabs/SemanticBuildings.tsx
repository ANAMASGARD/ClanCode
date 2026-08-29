"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { Group } from "three";
import { AssetModel } from "@/app/game/scene/AssetModel";

export function TownHall() {
  return (
    <group scale={1.85}>
      {[-1, 0, 1].flatMap((x) => [-1, 0, 1].map((z) => (
        <AssetModel key={`${x}:${z}`} assetKey={x === 0 && z === 1 ? "townHall.wallDoor" : "townHall.wallStone"} position={[x, 0, z]} />
      )))}
      {[-1, 0, 1].flatMap((x) => [-1, 0, 1].map((z) => (
        <AssetModel key={`upper:${x}:${z}`} assetKey={z === 1 ? "townHall.wallWoodWindow" : "townHall.wallWood"} position={[x, 1, z]} />
      )))}
      <AssetModel assetKey="townHall.roofHigh" position={[0, 2, 0]} scale={[3.25, 1.65, 3.25]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.roofPoint" position={[0, 3.72, 0]} scale={1.2} />
      <AssetModel assetKey="townHall.stairs" position={[0, 0, 2.1]} scale={[1.8, 1, 1]} />
      <AssetModel assetKey="village.bannerRed" position={[-1.7, 1.6, 1.6]} scale={1.4} />
      <AssetModel assetKey="village.bannerGreen" position={[1.7, 1.6, 1.6]} scale={1.4} />
    </group>
  );
}

export function SearchTower() {
  return (
    <group scale={0.9}>
      <AssetModel assetKey="harbor.towerBaseDoor" position={[0, 0, 0]} />
      <AssetModel assetKey="harbor.towerMiddleWindows" position={[0, 2, 0]} />
      <AssetModel assetKey="harbor.towerTop" position={[0, 4, 0]} />
      <AssetModel assetKey="harbor.flag" position={[0, 6.7, 0]} scale={0.8} />
    </group>
  );
}

export function BuilderWorkshop() {
  return (
    <group scale={5.2}>
      <AssetModel assetKey="workshop.structure" />
      <AssetModel assetKey="workshop.roof" position={[0, 0.48, 0]} />
      <AssetModel assetKey="workshop.workbench" position={[-0.42, 0, 0.42]} scale={0.8} />
      <AssetModel assetKey="workshop.planks" position={[0.42, 0, 0.4]} scale={0.7} />
    </group>
  );
}

export function ValidationForge() {
  return (
    <group scale={5.1}>
      <AssetModel assetKey="forge.structure" />
      <AssetModel assetKey="forge.roof" position={[0, 0.5, 0]} />
      <AssetModel assetKey="workshop.anvil" position={[-0.42, 0, 0.42]} scale={0.75} />
      <AssetModel assetKey="workshop.grinder" position={[0.42, 0, 0.42]} scale={0.75} />
      <pointLight color="#ff7b36" intensity={7} distance={8} position={[0, 2.2, 0]} />
    </group>
  );
}

export function SessionLodge() {
  return (
    <group scale={2.25}>
      <AssetModel assetKey="townHall.wallWoodDoor" />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[-1, 0, 0]} />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[1, 0, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[-1, 0, -1]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[1, 0, -1]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.roof" position={[0, 1, 0]} scale={[3.2, 1.2, 2.4]} />
      <AssetModel assetKey="village.lantern" position={[0.7, 0.3, 0.7]} scale={0.8} />
    </group>
  );
}

export function ModelShrine() {
  return (
    <group scale={3.4}>
      <AssetModel assetKey="nature.ring" rotation={[Math.PI / 2, 0, 0]} scale={1.6} />
      <AssetModel assetKey="nature.obelisk" position={[0, 0.1, 0]} />
      <pointLight color="#52e6ff" intensity={5} distance={8} position={[0, 1.8, 0]} />
    </group>
  );
}

export function ApprovalGate() {
  return (
    <group scale={0.95}>
      <AssetModel assetKey="harbor.castleGate" />
      <AssetModel assetKey="harbor.castleWall" position={[-3.6, 0, 0]} />
      <AssetModel assetKey="harbor.castleWall" position={[3.6, 0, 0]} />
      <AssetModel assetKey="village.bannerRed" position={[0, 3.8, 0.5]} scale={1.5} />
    </group>
  );
}

export function TestCamp() {
  return (
    <group scale={4.4}>
      <AssetModel assetKey="camp.tent" position={[-0.3, 0, 0]} />
      <AssetModel assetKey="camp.fire" position={[0.45, 0, 0.4]} scale={0.7} />
      <pointLight color="#ff9b45" intensity={4} distance={5} position={[2, 1.2, 1.5]} />
    </group>
  );
}

export function Market() {
  return (
    <group scale={2.7}>
      <AssetModel assetKey="village.stallRed" position={[-0.8, 0, 0]} />
      <AssetModel assetKey="village.stallGreen" position={[0.8, 0, 0]} />
      <AssetModel assetKey="village.cart" position={[0, 0, 1]} scale={0.8} />
    </group>
  );
}

export function Windmill({ reducedMotion }: { reducedMotion: boolean }) {
  const blade = useRef<Group>(null);
  useContinuousRotation(blade, reducedMotion, 14);
  return (
    <group scale={2.4} rotation={[0, Math.PI / 2, 0]}>
      <AssetModel assetKey="village.windmill" />
      <group ref={blade} position={[0, 1.7, 0]}>
        <AssetModel assetKey="village.windmillBlade" scale={1.2} />
      </group>
    </group>
  );
}

export function Watermill({ reducedMotion }: { reducedMotion: boolean }) {
  const wheel = useRef<Group>(null);
  useContinuousRotation(wheel, reducedMotion, 11.5);
  return (
    <group scale={2.55} rotation={[0, Math.PI / 2, 0]}>
      <AssetModel assetKey="village.watermill" />
      <group ref={wheel} position={[0, 0.6, 0.95]}>
        <AssetModel assetKey="village.waterWheel" scale={1.1} />
      </group>
    </group>
  );
}

export function Farm() {
  return (
    <group scale={3.6}>
      {[-1, 0, 1].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <AssetModel assetKey="nature.cropRows" />
          <AssetModel assetKey="nature.crops" position={[0, 0.04, 0]} />
        </group>
      ))}
      <AssetModel assetKey="village.fence" position={[0, 0, -0.9]} scale={[3.5, 1, 1]} />
    </group>
  );
}

function useContinuousRotation(
  target: React.RefObject<Group | null>,
  reducedMotion: boolean,
  duration: number,
) {
  useEffect(() => {
    const group = target.current;
    if (!group || reducedMotion) return;
    const tween = gsap.to(group.rotation, {
      x: `+=${Math.PI * 2}`,
      duration,
      ease: "none",
      repeat: -1,
    });
    return () => {
      tween.kill();
    };
  }, [duration, reducedMotion, target]);
}
