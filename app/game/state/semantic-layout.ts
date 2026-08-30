import type { SemanticBuildingId } from "./default-layout";
import { GROUND_Y, tileToWorld } from "./tile";

export type SemanticPlacement = {
  id: SemanticBuildingId;
  tileX: number;
  tileZ: number;
  rotation?: number;
};

export const SEMANTIC_PLACEMENTS: SemanticPlacement[] = [
  { id: "town-hall", tileX: 0, tileZ: 0 },
  { id: "search-tower", tileX: 4, tileZ: -4 },
  { id: "session-lodge", tileX: -4, tileZ: -4 },
  { id: "model-shrine", tileX: 4, tileZ: 2 },
  { id: "market", tileX: -4, tileZ: 2 },
  { id: "builder-workshop", tileX: 5, tileZ: 5 },
  { id: "validation-forge", tileX: 2, tileZ: 6 },
  { id: "approval-gate", tileX: 0, tileZ: 9 },
  { id: "test-camp", tileX: 7, tileZ: 7 },
  { id: "windmill", tileX: -7, tileZ: -5 },
  { id: "watermill", tileX: -5, tileZ: 4 },
  { id: "farm", tileX: 6, tileZ: -6 },
];

export function semanticWorldPosition(placement: SemanticPlacement): readonly [number, number, number] {
  const [x, , z] = tileToWorld(placement.tileX, placement.tileZ, GROUND_Y);
  return [x, GROUND_Y, z] as const;
}
