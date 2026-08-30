import type { SemanticBuildingId } from "./default-layout";
import { BEACH_WALL_Z } from "./island";
import { GROUND_Y, TILE, tileToWorld } from "./tile";

export type SemanticPlacement = {
  id: SemanticBuildingId;
  tileX: number;
  tileZ: number;
  rotation?: number;
};

/** Beach rampart gate tile — Approval Gate stands in the wall opening. */
const GATE_TILE_Z = BEACH_WALL_Z / TILE;

/**
 * Village ring around the Castle Kit keep. Chebyshev distance from the
 * origin is at least 8 tiles so cottages sit on the grass, not the curtains.
 */
export const SEMANTIC_PLACEMENTS: SemanticPlacement[] = [
  { id: "town-hall", tileX: 0, tileZ: 0 },
  { id: "search-tower", tileX: 0, tileZ: -8 },
  { id: "session-lodge", tileX: -8, tileZ: 0 },
  { id: "model-shrine", tileX: 8, tileZ: 0 },
  { id: "validation-forge", tileX: -8, tileZ: -8 },
  { id: "builder-workshop", tileX: 8, tileZ: -8 },
  { id: "windmill", tileX: -10, tileZ: -4 },
  { id: "farm", tileX: 10, tileZ: -4 },
  { id: "watermill", tileX: -8, tileZ: 6 },
  { id: "market", tileX: -4, tileZ: 8 },
  { id: "test-camp", tileX: 8, tileZ: 6 },
  { id: "approval-gate", tileX: 0, tileZ: GATE_TILE_Z },
];

export function semanticWorldPosition(placement: SemanticPlacement): readonly [number, number, number] {
  const [x, , z] = tileToWorld(placement.tileX, placement.tileZ, GROUND_Y);
  return [x, GROUND_Y, z] as const;
}
