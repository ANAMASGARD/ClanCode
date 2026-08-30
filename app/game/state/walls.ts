import type { GameAssetKey } from "@/app/game/assets/catalog";
import {
  BEACH_GATE_HALF_X,
  BEACH_WALL_HALF_X,
  BEACH_WALL_Z,
  isInsideRim,
  isInSandBand,
} from "./island";
import { TILE } from "./tile";

export type WallSegment = {
  id: string;
  assetKey: GameAssetKey;
  x: number;
  z: number;
  rotation: number;
};

const WALL_ASSET = "harbor.castleWall" as const;

/**
 * Single rampart along the beach front. The village interior is deliberately
 * wall-free; only the shore side is fortified.
 */
function buildBeachWall(): WallSegment[] {
  const segments: WallSegment[] = [];
  for (let x = -BEACH_WALL_HALF_X; x <= BEACH_WALL_HALF_X; x += TILE) {
    if (Math.abs(x) <= BEACH_GATE_HALF_X) continue;
    if (!isInsideRim(x, BEACH_WALL_Z)) continue;
    if (isInSandBand(BEACH_WALL_Z)) continue;
    segments.push({
      id: `beach-wall-${x}`,
      assetKey: WALL_ASSET,
      x,
      z: BEACH_WALL_Z,
      rotation: 0,
    });
  }
  return segments;
}

export const BEACH_WALL: WallSegment[] = buildBeachWall();

/** Towers flanking the gate and closing the rampart ends. */
export const BEACH_WALL_TOWERS = [
  { id: "beach-tower-gate-w", assetKey: "harbor.towerCompleteSmall" as const, x: -BEACH_GATE_HALF_X - 1.5, z: BEACH_WALL_Z, rotation: 0 },
  { id: "beach-tower-gate-e", assetKey: "harbor.towerCompleteSmall" as const, x: BEACH_GATE_HALF_X + 1.5, z: BEACH_WALL_Z, rotation: 0 },
  { id: "beach-tower-w", assetKey: "harbor.towerWatch" as const, x: -BEACH_WALL_HALF_X, z: BEACH_WALL_Z, rotation: Math.PI / 2 },
  { id: "beach-tower-e", assetKey: "harbor.towerWatch" as const, x: BEACH_WALL_HALF_X, z: BEACH_WALL_Z, rotation: -Math.PI / 2 },
] as const;

export function wallWorldPosition(segment: { x: number; z: number }): readonly [number, number, number] {
  return [segment.x, 0, segment.z] as const;
}
