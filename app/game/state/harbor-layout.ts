import type { GameAssetKey } from "@/app/game/assets/catalog";
import { GROUND_Y, tileToWorld } from "./tile";

export type HarborProp = {
  id: string;
  assetKey: GameAssetKey;
  position: readonly [number, number, number];
  rotation?: number;
  scale?: number;
};

/** West beach harbor district. */
export const HARBOR_PROPS: HarborProp[] = [
  { id: "dock-main", assetKey: "harbor.dock", position: [-24, GROUND_Y - 0.35, 10], rotation: Math.PI / 2 },
  { id: "dock-arm", assetKey: "harbor.dockSmall", position: [-24, GROUND_Y - 0.35, 14], rotation: Math.PI / 2 },
  { id: "platform", assetKey: "harbor.platform", position: [-22, GROUND_Y - 0.2, 8] },
  { id: "ship-large", assetKey: "harbor.shipLarge", position: [-30, GROUND_Y - 0.5, 12], rotation: -0.25 },
  { id: "ship-medium", assetKey: "harbor.shipMedium", position: [-28, GROUND_Y - 0.45, 18], rotation: 0.15 },
  { id: "rowboat", assetKey: "harbor.rowboat", position: [-20, GROUND_Y - 0.55, 16], rotation: -0.5, scale: 1.1 },
  { id: "lighthouse-base", assetKey: "harbor.towerBaseDoor", position: [-26, GROUND_Y, 2], scale: 0.85 },
  { id: "lighthouse-mid", assetKey: "harbor.towerMiddleWindows", position: [-26, GROUND_Y + 1.7, 2], scale: 0.85 },
  { id: "lighthouse-top", assetKey: "harbor.towerTop", position: [-26, GROUND_Y + 3.4, 2], scale: 0.85 },
  { id: "lighthouse-roof", assetKey: "harbor.towerRoof", position: [-26, GROUND_Y + 5.1, 2], scale: 0.85 },
  { id: "watchtower", assetKey: "harbor.towerWatch", position: [-18, GROUND_Y, 6], rotation: Math.PI / 4, scale: 0.9 },
  { id: "crate-1", assetKey: "harbor.crate", position: [-22, GROUND_Y + 0.8, 9], scale: 1.2 },
  { id: "crate-2", assetKey: "harbor.crateBottles", position: [-21, GROUND_Y + 0.8, 10], scale: 1.1 },
  { id: "barrel-1", assetKey: "harbor.barrel", position: [-23, GROUND_Y + 0.75, 11], scale: 1.2 },
  { id: "chest-1", assetKey: "harbor.chest", position: [-21.5, GROUND_Y + 0.7, 8.5], scale: 1.1 },
  { id: "cannon-1", assetKey: "harbor.cannon", position: [-19, GROUND_Y + 0.5, 4], rotation: Math.PI / 3, scale: 1.1 },
  { id: "flag-1", assetKey: "harbor.flagHigh", position: [-24, GROUND_Y + 6.5, 2], scale: 0.85 },
  { id: "palm-1", assetKey: "harbor.palmBend", position: [-16, GROUND_Y, 14], scale: 2.2 },
  { id: "palm-2", assetKey: "harbor.palmStraight", position: [-14, GROUND_Y, 10], scale: 2.4 },
  { id: "palm-3", assetKey: "harbor.palmDetailed", position: [-32, GROUND_Y, 8], scale: 2.1 },
  { id: "sand-1", assetKey: "harbor.patchSand", position: [-20, GROUND_Y - 0.15, 12], scale: 2.5 },
  { id: "sand-2", assetKey: "harbor.patchSandFoliage", position: [-18, GROUND_Y - 0.12, 8], scale: 2.2 },
  { id: "rock-1", assetKey: "harbor.rocksSandA", position: [-15, GROUND_Y - 0.1, 6], scale: 2.2 },
  { id: "rock-2", assetKey: "harbor.rocksSandB", position: [-33, GROUND_Y - 0.15, 15], scale: 2.5 },
  { id: "rock-3", assetKey: "harbor.rocksSandC", position: [-17, GROUND_Y - 0.08, 18], scale: 2 },
  { id: "mast", assetKey: "harbor.mast", position: [-25, GROUND_Y + 1, 13], scale: 1.3 },
];

export const HARBOR_BEACH_TILES = [
  { tileX: -12, tileZ: 8 },
  { tileX: -13, tileZ: 6 },
  { tileX: -14, tileZ: 10 },
  { tileX: -15, tileZ: 4 },
  { tileX: -16, tileZ: 12 },
] as const;

export function harborBeachPosition(tileX: number, tileZ: number) {
  return tileToWorld(tileX, tileZ, GROUND_Y - 0.08);
}
