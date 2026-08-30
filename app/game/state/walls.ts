import type { GameAssetKey } from "@/app/game/assets/catalog";
import { tileToWorld } from "./tile";

export type WallSegment = {
  id: string;
  assetKey: GameAssetKey;
  tileX: number;
  tileZ: number;
  rotation: number;
};

/** Square castle wall ring; reads as a diamond on the isometric camera. */
export const WALL_RING: WallSegment[] = [
  // South face (gate center)
  ...([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5] as const).map((x) => ({
    id: `wall-s-${x}`,
    assetKey: "harbor.castleWall" as const,
    tileX: x,
    tileZ: 8,
    rotation: 0,
  })),
  // North face
  ...([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5] as const).map((x) => ({
    id: `wall-n-${x}`,
    assetKey: "harbor.castleWall" as const,
    tileX: x,
    tileZ: -8,
    rotation: Math.PI,
  })),
  // East face
  ...([-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7] as const).map((z) => ({
    id: `wall-e-${z}`,
    assetKey: "harbor.castleWall" as const,
    tileX: 6,
    tileZ: z,
    rotation: -Math.PI / 2,
  })),
  // West face (harbor approach gap near -6..-4)
  ...([-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7] as const)
    .filter((z) => z < -2 || z > 1)
    .map((z) => ({
      id: `wall-w-${z}`,
      assetKey: "harbor.castleWall" as const,
      tileX: -6,
      tileZ: z,
      rotation: Math.PI / 2,
    })),
];

export const WALL_GATE = {
  id: "wall-gate",
  assetKey: "harbor.castleGate" as const,
  tileX: 0,
  tileZ: 8,
  rotation: 0,
};

export const WALL_TOWERS = [
  { id: "tower-ne", assetKey: "harbor.towerWatch" as const, tileX: 6, tileZ: -8, rotation: 0 },
  { id: "tower-nw", assetKey: "harbor.towerWatch" as const, tileX: -6, tileZ: -8, rotation: Math.PI / 2 },
  { id: "tower-se", assetKey: "harbor.towerCompleteSmall" as const, tileX: 6, tileZ: 8, rotation: -Math.PI / 2 },
  { id: "tower-sw", assetKey: "harbor.towerCompleteSmall" as const, tileX: -6, tileZ: 8, rotation: Math.PI },
] as const;

export function wallWorldPosition(segment: { tileX: number; tileZ: number }) {
  return tileToWorld(segment.tileX, segment.tileZ);
}
