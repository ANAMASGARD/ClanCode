import type { InstancePlacement } from "@/app/game/scene/InstancedAsset";
import { SCENE_SPAN, SEA_DEPTH, SURFACE_Y, WATER_EDGE_Z } from "@/app/game/state/island";

/** Kenney ground tiles span five world units at catalog scale. */
export const WATER_TILE_SPAN = 5;

/** Grid of Kenney ground_riverOpen tiles — pure water, no grass banks. */
export function createWaterField(lowQuality: boolean): InstancePlacement[] {
  const seaDepth = lowQuality ? SEA_DEPTH * 0.72 : SEA_DEPTH;
  const halfSpan = SCENE_SPAN / 2;
  const startX = -halfSpan + WATER_TILE_SPAN / 2;
  const endX = halfSpan - WATER_TILE_SPAN / 2;
  const startZ = WATER_EDGE_Z + WATER_TILE_SPAN / 2;
  const endZ = WATER_EDGE_Z + seaDepth;
  const y = SURFACE_Y - 0.1;
  const tiles: InstancePlacement[] = [];

  for (let z = startZ; z <= endZ; z += WATER_TILE_SPAN) {
    for (let x = startX; x <= endX; x += WATER_TILE_SPAN) {
      tiles.push({
        position: [x, y, z],
        rotation: 0,
        scale: 1,
      });
    }
  }

  return tiles;
}

export function waterBackingGeometry(lowQuality: boolean): {
  width: number;
  depth: number;
  centerZ: number;
} {
  const seaDepth = lowQuality ? SEA_DEPTH * 0.72 : SEA_DEPTH;
  return {
    width: SCENE_SPAN,
    depth: seaDepth,
    centerZ: WATER_EDGE_Z + seaDepth / 2,
  };
}
