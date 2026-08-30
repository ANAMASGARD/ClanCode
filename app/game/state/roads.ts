import type { GameAssetKey } from "@/app/game/assets/catalog";
import { BEACH_WALL_Z } from "./island";
import { GROUND_Y, TILE, tileToWorld } from "./tile";

export type RoadTile = {
  id: string;
  assetKey: GameAssetKey;
  tileX: number;
  tileZ: number;
  rotation: number;
};

/** Road GLBs are unit-sized; scale to one layout tile so the avenue is seamless. */
export const ROAD_TILE_SCALE = TILE;

const GATE_TILE_Z = BEACH_WALL_Z / TILE;

function avenue(): RoadTile[] {
  const tiles: RoadTile[] = [];
  for (let tileZ = 2; tileZ <= GATE_TILE_Z - 1; tileZ += 1) {
    tiles.push({
      id: `road-avenue-${tileZ}`,
      assetKey: "village.road",
      tileX: 0,
      tileZ,
      rotation: 0,
    });
  }
  return tiles;
}

/** Main avenue from the Town Hall plaza to the beach gate, plus the plaza ring. */
export const ROAD_TILES: RoadTile[] = [
  { id: "road-plaza-n", assetKey: "village.road", tileX: 0, tileZ: -2, rotation: 0 },
  { id: "road-plaza-w", assetKey: "village.road", tileX: -2, tileZ: 0, rotation: Math.PI / 2 },
  { id: "road-plaza-e", assetKey: "village.road", tileX: 2, tileZ: 0, rotation: Math.PI / 2 },
  { id: "road-plaza-ne", assetKey: "village.roadCorner", tileX: 2, tileZ: -2, rotation: 0 },
  { id: "road-plaza-nw", assetKey: "village.roadCorner", tileX: -2, tileZ: -2, rotation: Math.PI / 2 },
  { id: "road-plaza-se", assetKey: "village.roadCorner", tileX: 2, tileZ: 2, rotation: -Math.PI / 2 },
  { id: "road-plaza-sw", assetKey: "village.roadCorner", tileX: -2, tileZ: 2, rotation: Math.PI },
  ...avenue(),
];

export function layoutWorldPosition(tileX: number, tileZ: number): readonly [number, number, number] {
  return tileToWorld(tileX, tileZ, GROUND_Y - 0.1);
}
