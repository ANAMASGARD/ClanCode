"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group } from "three";
import {
  DOCK_PLACEMENTS,
  REVIEW_POST_POSITION,
  SHORE_PROPS,
  VESSEL_PLACEMENTS,
  type FloatingPlacement,
} from "@/app/game/state/shore-layout";
import { AssetModel } from "./AssetModel";

type HarborProps = {
  reducedMotion: boolean;
};

export function Harbor({ reducedMotion }: HarborProps) {
  return (
    <group>
      {DOCK_PLACEMENTS.map((dock) => (
        <AssetModel
          key={dock.id}
          assetKey={dock.assetKey}
          position={dock.position}
          rotation={[0, dock.rotation, 0]}
          scale={dock.scale}
        />
      ))}
      {VESSEL_PLACEMENTS.map((vessel) => (
        <FloatingVessel key={vessel.id} vessel={vessel} reducedMotion={reducedMotion} />
      ))}
      {SHORE_PROPS.map((prop) => (
        <AssetModel
          key={prop.id}
          assetKey={prop.assetKey}
          position={prop.position}
          rotation={[0, prop.rotation, 0]}
          scale={prop.scale}
        />
      ))}
      <ReviewPost />
    </group>
  );
}

/** Gentle bob and roll so moored vessels read as floating, not parked. */
function FloatingVessel({
  vessel,
  reducedMotion,
}: {
  vessel: FloatingPlacement;
  reducedMotion: boolean;
}) {
  const group = useRef<Group>(null);
  const baseY = vessel.position[1];

  useFrame(({ clock }) => {
    const node = group.current;
    if (!node || reducedMotion) return;
    const t = clock.elapsedTime + vessel.bobPhase;
    node.position.y = baseY + Math.sin(t * 0.7) * 0.18;
    node.rotation.z = Math.sin(t * 0.55) * 0.03;
    node.rotation.x = Math.cos(t * 0.45) * 0.02;
  });

  return (
    <group ref={group} position={vessel.position} rotation={[0, vessel.rotation, 0]}>
      <AssetModel assetKey={vessel.assetKey} scale={vessel.scale} />
    </group>
  );
}

/**
 * Shore lookout watching the harbor approach. Presentation only — it does not
 * gate approvals or represent review results.
 */
function ReviewPost() {
  return (
    <group position={REVIEW_POST_POSITION}>
      <AssetModel assetKey="harbor.towerBaseDoor" />
      <AssetModel assetKey="harbor.towerMiddleWindows" position={[0, 2, 0]} />
      <AssetModel assetKey="harbor.towerTop" position={[0, 4, 0]} />
      <AssetModel assetKey="harbor.towerRoof" position={[0, 6, 0]} />
      <AssetModel assetKey="harbor.flagHigh" position={[0, 7.9, 0]} scale={0.9} />
      <AssetModel assetKey="harbor.cannon" position={[2.2, 0, 1.6]} rotation={[0, Math.PI * 0.85, 0]} scale={1} />
      <AssetModel assetKey="harbor.crate" position={[-2, 0, 1.5]} rotation={[0, 0.4, 0]} scale={1} />
      <pointLight color="#ffd9a0" intensity={6} distance={14} position={[0, 7, 0]} />
    </group>
  );
}
