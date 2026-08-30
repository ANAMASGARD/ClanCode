"use client";

import { useRef } from "react";
import { Group } from "three";
import { AssetModel } from "@/app/game/scene/AssetModel";
import { useContinuousRotation } from "./useContinuousRotation";

export function Windmill({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const blade = useRef<Group>(null);
  useContinuousRotation(blade, reducedMotion, 14);
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <AssetModel assetKey="village.windmill" />
      <group ref={blade} position={[0, 1.7, 0]}>
        <AssetModel assetKey="village.windmillBlade" scale={1.1} />
      </group>
    </group>
  );
}

export function Watermill({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const wheel = useRef<Group>(null);
  useContinuousRotation(wheel, reducedMotion, 11.5);
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <AssetModel assetKey="village.watermill" />
      <group ref={wheel} position={[0, 0.55, 0.9]}>
        <AssetModel assetKey="village.waterWheel" scale={1.05} />
      </group>
    </group>
  );
}

export function Farm() {
  return (
    <group>
      {[-1, 0, 1].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <AssetModel assetKey="nature.cropRows" />
          <AssetModel assetKey="nature.crops" position={[0, 0.02, 0]} scale={0.9} />
        </group>
      ))}
      <AssetModel assetKey="village.fence" position={[0, 0, -0.85]} scale={2.8} />
    </group>
  );
}
