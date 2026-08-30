import type { GameAssetKey } from "@/app/game/assets/catalog";
import { SEMANTIC_PREFABS } from "@/app/game/prefabs/registry";
import type { SemanticBuildingId } from "./default-layout";
import { DECORATIVE_PLACEMENTS, type DecorativePrefabId } from "./decorative-layout";
import { SEMANTIC_PLACEMENTS } from "./semantic-layout";
import { GROUND_Y, tileToWorld } from "./tile";

export type ClanPlacement =
  | {
      kind: "semantic";
      id: SemanticBuildingId;
      tileX: number;
      tileZ: number;
      rotation?: number;
    }
  | {
      kind: "decorative";
      id: string;
      prefab: DecorativePrefabId;
      tileX: number;
      tileZ: number;
      rotation?: number;
    }
  | {
      kind: "prop";
      id: string;
      assetKey: GameAssetKey;
      tileX: number;
      tileZ: number;
      rotation?: number;
    };

export const FIXED_SEMANTIC_IDS = new Set<SemanticBuildingId>([
  "approval-gate",
]);

/** Run-visualization anchors that must stay on the island. */
export const PROTECTED_SEMANTIC_IDS = new Set<SemanticBuildingId>([
  "town-hall",
  "approval-gate",
  "builder-workshop",
  "validation-forge",
  "test-camp",
]);

export function canRemovePlacement(placement: ClanPlacement): boolean {
  if (placement.kind === "decorative" || placement.kind === "prop") {
    return true;
  }
  if (placement.kind === "semantic") {
    if (PROTECTED_SEMANTIC_IDS.has(placement.id)) {
      return false;
    }
    return SEMANTIC_PREFABS[placement.id]?.movable ?? false;
  }
  return false;
}

export function canRemoveSemanticBuilding(id: SemanticBuildingId): boolean {
  if (PROTECTED_SEMANTIC_IDS.has(id)) {
    return false;
  }
  return SEMANTIC_PREFABS[id]?.movable ?? false;
}

export const MAX_LAYOUT_PLACEMENTS = 48;

export function createDefaultSeedLayout(): ClanPlacement[] {
  const semantic: ClanPlacement[] = SEMANTIC_PLACEMENTS.map((placement) => ({
    kind: "semantic" as const,
    id: placement.id,
    tileX: placement.tileX,
    tileZ: placement.tileZ,
    rotation: placement.rotation,
  }));
  const decorative: ClanPlacement[] = DECORATIVE_PLACEMENTS.map((placement) => ({
    kind: "decorative" as const,
    id: placement.id,
    prefab: placement.prefab,
    tileX: placement.tileX,
    tileZ: placement.tileZ,
    rotation: placement.rotation,
  }));
  return [...semantic, ...decorative];
}

export const DEFAULT_SEED_LAYOUT: ClanPlacement[] = createDefaultSeedLayout();

export function placementKey(tileX: number, tileZ: number): string {
  return `${tileX}:${tileZ}`;
}

export function placementWorldPosition(
  placement: Pick<ClanPlacement, "tileX" | "tileZ">,
): readonly [number, number, number] {
  return tileToWorld(placement.tileX, placement.tileZ, GROUND_Y);
}

export function isEditablePlacement(placement: ClanPlacement): boolean {
  if (placement.kind === "semantic") {
    if (FIXED_SEMANTIC_IDS.has(placement.id)) return false;
    return SEMANTIC_PREFABS[placement.id]?.movable ?? false;
  }
  return true;
}

export function getPlacementId(placement: ClanPlacement): string {
  if (placement.kind === "semantic") return placement.id;
  return placement.id;
}
