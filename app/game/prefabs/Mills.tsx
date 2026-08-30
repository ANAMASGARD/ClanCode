"use client";

import { useRef, type RefObject } from "react";
import { Group } from "three";
import { AssetModel } from "@/app/game/scene/AssetModel";
import { useContinuousRotation } from "./useContinuousRotation";

/** Hub sits on the timber storey, sails in the XY plane, spinning around Z. */
const SAIL_HUB_Y = 2.35;
const SAIL_HUB_Z = 0.56;
const SAIL_SCALE = 0.68;

function WindmillSails({
  bladeRef,
}: {
  bladeRef: RefObject<Group | null>;
}) {
  return (
    <group ref={bladeRef} position={[0, SAIL_HUB_Y, SAIL_HUB_Z]}>
      {[0, 1, 2, 3].map((index) => (
        <AssetModel
          key={index}
          assetKey="village.windmillBlade"
          rotation={[0, 0, (Math.PI / 2) * index]}
          scale={SAIL_SCALE}
        />
      ))}
    </group>
  );
}

/** Fantasy Town sample mill: round stone tower, timber deck, conical roof, hub sails. */
function WindmillTower({
  bladeRef,
  bodyScale = 1,
}: {
  bladeRef: RefObject<Group | null>;
  bodyScale?: number;
}) {
  return (
    <group scale={bodyScale}>
      <AssetModel assetKey="townHall.wallRounded" />
      <AssetModel assetKey="townHall.wallRounded" position={[0, 1, 0]} />
      <AssetModel assetKey="townHall.wallWoodRounded" position={[0, 2, 0]} />
      <AssetModel assetKey="townHall.roofHighPoint" position={[0, 3, 0]} />

      <AssetModel assetKey="townHall.balconyFence" position={[0.52, 1.02, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.9} />
      <AssetModel assetKey="townHall.balconyFence" position={[-0.52, 1.02, 0]} rotation={[0, -Math.PI / 2, 0]} scale={0.9} />
      <AssetModel assetKey="townHall.balconyFence" position={[0, 1.02, 0.52]} scale={0.9} />
      <AssetModel assetKey="townHall.balconyFence" position={[0, 1.02, -0.52]} rotation={[0, Math.PI, 0]} scale={0.9} />

      <AssetModel assetKey="townHall.stairsWood" position={[0.72, 0, 0.15]} rotation={[0, Math.PI / 2, 0]} scale={0.85} />
      <AssetModel assetKey="village.lantern" position={[0.55, 1.15, 0.45]} scale={0.7} />

      <WindmillSails bladeRef={bladeRef} />
    </group>
  );
}

function WindmillYard({
  bladeRef,
  bodyScale,
  reducedMotion,
  spinDuration,
}: {
  bladeRef: RefObject<Group | null>;
  bodyScale: number;
  reducedMotion: boolean;
  spinDuration: number;
}) {
  useContinuousRotation(bladeRef, reducedMotion, spinDuration, "z");
  return (
    <group>
      <WindmillTower bladeRef={bladeRef} bodyScale={bodyScale} />
      <AssetModel assetKey="village.fence" position={[-1.35, 0, 0.85]} rotation={[0, Math.PI / 2, 0]} scale={1.15} />
      <AssetModel assetKey="village.fence" position={[1.35, 0, 0.85]} rotation={[0, -Math.PI / 2, 0]} scale={1.15} />
      <AssetModel assetKey="village.fenceCurved" position={[0, 0, 1.45]} scale={1.05} />
      <AssetModel assetKey="village.rockSmall" position={[-0.85, 0, 0.55]} scale={0.8} />
    </group>
  );
}

export function Windmill({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const blade = useRef<Group>(null);
  return (
    <WindmillYard
      bladeRef={blade}
      bodyScale={1.15}
      reducedMotion={reducedMotion}
      spinDuration={14}
    />
  );
}

export function SmallWindmill({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const blade = useRef<Group>(null);
  return (
    <WindmillYard
      bladeRef={blade}
      bodyScale={0.95}
      reducedMotion={reducedMotion}
      spinDuration={9.5}
    />
  );
}

/** Sample.png timber watermill — complete house mesh with side wheel. */
export function Watermill({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const wheel = useRef<Group>(null);
  useContinuousRotation(wheel, reducedMotion, 11.5, "x");
  return (
    <group rotation={[0, Math.PI / 2, 0]} scale={1.35}>
      <AssetModel assetKey="village.watermill" />
      <group ref={wheel} position={[1.0, 0.55, 0]}>
        <AssetModel assetKey="village.waterWheel" scale={1.05} />
      </group>
      <AssetModel assetKey="village.cart" position={[-1.2, 0, 0.6]} rotation={[0, Math.PI / 4, 0]} scale={0.85} />
      <AssetModel assetKey="village.fence" position={[-1.3, 0, -0.5]} rotation={[0, Math.PI / 2, 0]} scale={1.15} />
      <AssetModel assetKey="village.fence" position={[0.5, 0, -1.1]} scale={1.15} />
    </group>
  );
}

export function Farm() {
  return (
    <group>
      {[-1, 0, 1].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <AssetModel assetKey="nature.cropRows" scale={1.15} />
          <AssetModel assetKey="nature.crops" position={[0, 0.02, 0]} scale={1.05} />
        </group>
      ))}
      <AssetModel assetKey="village.fenceGate" position={[0, 0, -1.05]} scale={1.55} />
      <AssetModel assetKey="village.fence" position={[-1.35, 0, -0.55]} rotation={[0, Math.PI / 2, 0]} scale={1.25} />
      <AssetModel assetKey="village.fence" position={[1.35, 0, -0.55]} rotation={[0, -Math.PI / 2, 0]} scale={1.25} />
      <AssetModel assetKey="village.cart" position={[1.5, 0, 0.35]} rotation={[0, -Math.PI / 6, 0]} scale={0.8} />
    </group>
  );
}
