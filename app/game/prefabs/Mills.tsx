"use client";

import { useRef, type RefObject } from "react";
import { Group } from "three";
import { AssetModel } from "@/app/game/scene/AssetModel";
import { useContinuousRotation } from "./useContinuousRotation";

const CURVED_SEGMENTS = 8;
const TOWER_RADIUS = 0.92;

/** Hub height on the composed cylindrical tower (curved walls + cap). */
const WINDMILL_BLADE_Y = 4.05;

function WindmillTower({ bladeRef, bladeScale }: { bladeRef: RefObject<Group | null>; bladeScale: number }) {
  return (
    <>
      {[0, 1, 2].flatMap((level) =>
        Array.from({ length: CURVED_SEGMENTS }, (_, segment) => {
          const angle = (segment / CURVED_SEGMENTS) * Math.PI * 2;
          return (
            <AssetModel
              key={`tower:${level}:${segment}`}
              assetKey="townHall.wallCurved"
              position={[
                Math.sin(angle) * TOWER_RADIUS,
                level,
                Math.cos(angle) * TOWER_RADIUS,
              ]}
              rotation={[0, angle + Math.PI, 0]}
            />
          );
        }),
      )}
      <AssetModel assetKey="townHall.balconyFence" position={[0, 2.55, TOWER_RADIUS * 0.35]} />
      <AssetModel assetKey="townHall.overhang" position={[0, 2.5, 0]} rotation={[0, Math.PI / 4, 0]} scale={0.85} />
      <AssetModel assetKey="townHall.roofPoint" position={[0, 3.15, 0]} />
      <group ref={bladeRef} position={[0, WINDMILL_BLADE_Y, TOWER_RADIUS + 0.05]}>
        <AssetModel assetKey="village.windmillBlade" scale={bladeScale} />
      </group>
    </>
  );
}

export function Windmill({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const blade = useRef<Group>(null);
  useContinuousRotation(blade, reducedMotion, 14);
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <WindmillTower bladeRef={blade} bladeScale={1.1} />
    </group>
  );
}

/** Decorative wind farm mill — same kit tower at a smaller scale. */
export function SmallWindmill({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const blade = useRef<Group>(null);
  useContinuousRotation(blade, reducedMotion, 9.5);
  return (
    <group rotation={[0, Math.PI / 2, 0]} scale={0.72}>
      <WindmillTower bladeRef={blade} bladeScale={1.05} />
    </group>
  );
}

/** Sample.png timber watermill — green-roof house with side wheel. */
export function Watermill({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const wheel = useRef<Group>(null);
  useContinuousRotation(wheel, reducedMotion, 11.5);
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      {/* Ground floor */}
      <AssetModel assetKey="townHall.wallWoodDoor" position={[0, 0, 1]} />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[-1, 0, 1]} />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[1, 0, 1]} />
      <AssetModel assetKey="townHall.wallWood" position={[-1, 0, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[1, 0, 0]} />
      <AssetModel assetKey="townHall.wallWoodCorner" position={[-1, 0, -1]} />
      <AssetModel assetKey="townHall.wallWoodCorner" position={[1, 0, -1]} />
      <AssetModel assetKey="townHall.wallWood" position={[0, 0, -1]} rotation={[0, Math.PI, 0]} />
      {/* Upper floor */}
      <AssetModel assetKey="townHall.wallWoodWindow" position={[-1, 1, 1]} />
      <AssetModel assetKey="townHall.wallWoodWindow" position={[1, 1, 1]} />
      <AssetModel assetKey="townHall.wallWood" position={[-1, 1, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[1, 1, 0]} />
      <AssetModel assetKey="townHall.wallWood" position={[0, 1, -1]} rotation={[0, Math.PI, 0]} />
      {/* Teal/green gable roof from the sample */}
      <AssetModel assetKey="townHall.roofGable" position={[0, 2, 0]} rotation={[0, Math.PI / 2, 0]} />
      <AssetModel assetKey="townHall.roofLeft" position={[-0.5, 2, 0]} />
      <AssetModel assetKey="townHall.roofRight" position={[0.5, 2, 0]} />
      <AssetModel assetKey="townHall.chimney" position={[0.8, 2.5, -0.6]} scale={0.9} />
      <group ref={wheel} position={[1.15, 0.6, 0]}>
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
