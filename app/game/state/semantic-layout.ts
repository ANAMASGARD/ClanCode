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
 * Open Clash-style village on a 3-tile lattice. No interior walls: the plot is
 * packed with buildings and the only rampart faces the beach.
 */
export const SEMANTIC_PLACEMENTS: SemanticPlacement[] = [
  { id: "town-hall", tileX: 0, tileZ: 0 },
  { id: "search-tower", tileX: 0, tileZ: -3 },
  { id: "session-lodge", tileX: -3, tileZ: 0 },
  { id: "model-shrine", tileX: 3, tileZ: 0 },
  { id: "validation-forge", tileX: -3, tileZ: -3 },
  { id: "builder-workshop", tileX: 3, tileZ: -3 },
  { id: "windmill", tileX: -9, tileZ: -3 },
  { id: "farm", tileX: 9, tileZ: -3 },
  { id: "watermill", tileX: -6, tileZ: 3 },
  { id: "market", tileX: -3, tileZ: 6 },
  { id: "test-camp", tileX: 3, tileZ: 3 },
  { id: "approval-gate", tileX: 0, tileZ: GATE_TILE_Z },
];

export function semanticWorldPosition(placement: SemanticPlacement): readonly [number, number, number] {
  const [x, , z] = tileToWorld(placement.tileX, placement.tileZ, GROUND_Y);
  return [x, GROUND_Y, z] as const;
}
