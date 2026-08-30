"use client";

import { useMemo } from "react";
import { SURFACE_Y } from "@/app/game/state/island";
import { InstancedAsset, WATER_BLUE_TINT } from "../InstancedAsset";
import { createWaterField, waterBackingGeometry } from "./water-layout";

type WaterProps = {
  lowQuality: boolean;
};

export function Water({ lowQuality }: WaterProps) {
  const instances = useMemo(() => createWaterField(lowQuality), [lowQuality]);
  const backing = useMemo(() => waterBackingGeometry(lowQuality), [lowQuality]);

  return (
    <group>
      {/* Deeper blue underlay — fills chamfer gaps between riverOpen tiles */}
      <mesh rotation-x={-Math.PI / 2} position={[0, SURFACE_Y - 0.12, backing.centerZ]}>
        <planeGeometry args={[backing.width, backing.depth]} />
        <meshStandardMaterial color="#358fbf" roughness={0.35} metalness={0.05} />
      </mesh>
      <InstancedAsset
        assetKey="nature.riverOpen"
        instances={instances}
        tint={WATER_BLUE_TINT}
        receiveShadow={false}
      />
    </group>
  );
}
