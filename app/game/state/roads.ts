import type { GameAssetKey } from "@/app/game/assets/catalog";
import { GROUND_Y, tileToWorld } from "./tile";

export type RoadTile = {
  id: string;
  assetKey: GameAssetKey;
  tileX: number;
  tileZ: number;
  rotation: number;
};

export const ROAD_TILES: RoadTile[] = [
  { id: "road-plaza-n", assetKey: "village.road", tileX: 0, tileZ: -2, rotation: 0 },
  { id: "road-plaza-s", assetKey: "village.road", tileX: 0, tileZ: 2, rotation: 0 },
  { id: "road-plaza-w", assetKey: "village.road", tileX: -2, tileZ: 0, rotation: Math.PI / 2 },
  { id: "road-plaza-e", assetKey: "village.road", tileX: 2, tileZ: 0, rotation: Math.PI / 2 },
  { id: "road-plaza-ne", assetKey: "village.roadCorner", tileX: 2, tileZ: -2, rotation: 0 },
  { id: "road-plaza-nw", assetKey: "village.roadCorner", tileX: -2, tileZ: -2, rotation: Math.PI / 2 },
  { id: "road-plaza-se", assetKey: "village.roadCorner", tileX: 2, tileZ: 2, rotation: -Math.PI / 2 },
  { id: "road-plaza-sw", assetKey: "village.roadCorner", tileX: -2, tileZ: 2, rotation: Math.PI },
  { id: "road-gate-1", assetKey: "village.road", tileX: 0, tileZ: 3, rotation: 0 },
  { id: "road-gate-2", assetKey: "village.road", tileX: 0, tileZ: 5, rotation: 0 },
  { id: "road-gate-3", assetKey: "village.road", tileX: 0, tileZ: 7, rotation: 0 },
  { id: "road-search", assetKey: "village.road", tileX: 2, tileZ: -2, rotation: Math.PI / 2 },
  { id: "road-search-2", assetKey: "village.roadBend", tileX: 3, tileZ: -3, rotation: 0 },
  { id: "road-session", assetKey: "village.road", tileX: -2, tileZ: -2, rotation: Math.PI / 2 },
  { id: "road-session-2", assetKey: "village.roadBend", tileX: -3, tileZ: -3, rotation: Math.PI / 2 },
  { id: "road-market", assetKey: "village.road", tileX: -2, tileZ: 1, rotation: Math.PI / 2 },
  { id: "road-shrine", assetKey: "village.road", tileX: 2, tileZ: 1, rotation: Math.PI / 2 },
  { id: "road-forge", assetKey: "village.roadBend", tileX: 1, tileZ: 4, rotation: -Math.PI / 2 },
  { id: "road-workshop", assetKey: "village.roadBend", tileX: 3, tileZ: 3, rotation: 0 },
  { id: "road-harbor-1", assetKey: "village.road", tileX: -3, tileZ: 7, rotation: Math.PI / 2 },
  { id: "road-harbor-2", assetKey: "village.roadBend", tileX: -5, tileZ: 6, rotation: Math.PI },
  { id: "road-harbor-3", assetKey: "village.road", tileX: -7, tileZ: 5, rotation: Math.PI / 2 },
  { id: "road-harbor-4", assetKey: "village.road", tileX: -9, tileZ: 3, rotation: Math.PI / 2 },
  { id: "road-harbor-5", assetKey: "village.roadBend", tileX: -11, tileZ: 2, rotation: Math.PI / 2 },
  { id: "road-outer-n", assetKey: "nature.pathStraight", tileX: 0, tileZ: -10, rotation: 0 },
  { id: "road-outer-w", assetKey: "nature.pathWood", tileX: -11, tileZ: 0, rotation: Math.PI / 2 },
  { id: "road-outer-e", assetKey: "nature.pathStone", tileX: 11, tileZ: -1, rotation: Math.PI / 2 },
];

export function layoutWorldPosition(tileX: number, tileZ: number): readonly [number, number, number] {
  return tileToWorld(tileX, tileZ, GROUND_Y - 0.1);
}
