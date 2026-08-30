import type { GameAssetKey } from "@/app/game/assets/catalog";
import { GAME_ASSETS } from "@/app/game/assets/catalog";
import { DECORATIVE_PREFABS, SEMANTIC_PREFABS } from "@/app/game/prefabs/registry";
import type { DecorativePrefabId } from "./decorative-layout";
import {
  DEFAULT_SEED_LAYOUT,
  FIXED_SEMANTIC_IDS,
  MAX_LAYOUT_PLACEMENTS,
  canRemovePlacement,
  type ClanPlacement,
  placementKey,
} from "./clan-layout";
import type { SemanticBuildingId } from "./default-layout";
import { isInsidePlot, WATER_EDGE_Z } from "./island";
import { ROAD_TILES } from "./roads";
import { SEMANTIC_PLACEMENTS } from "./semantic-layout";
import { tileToWorld } from "./tile";

export type PlacementValidation = {
  valid: boolean;
  reason?: string;
};

const PROTECTED_ROAD_SLOTS = new Set(
  ROAD_TILES.map((road) => placementKey(road.tileX, road.tileZ)),
);

const DEFAULT_SEMANTIC_SLOTS = new Map(
  SEMANTIC_PLACEMENTS.map((placement) => [
    placement.id,
    placementKey(placement.tileX, placement.tileZ),
  ]),
);

function isOffSand(tileZ: number): boolean {
  const [, , z] = tileToWorld(0, tileZ);
  return z <= WATER_EDGE_Z;
}

function slotInsidePlot(tileX: number, tileZ: number): boolean {
  const [x, , z] = tileToWorld(tileX, tileZ);
  return isInsidePlot(x, z) && isOffSand(tileZ);
}

export function validateLayout(layout: ClanPlacement[]): PlacementValidation {
  if (layout.length > MAX_LAYOUT_PLACEMENTS) {
    return { valid: false, reason: `Layout exceeds ${MAX_LAYOUT_PLACEMENTS} items` };
  }

  const slots = new Set<string>();
  const semanticIds = new Set<SemanticBuildingId>();

  for (const placement of layout) {
    const slot = placementKey(placement.tileX, placement.tileZ);
    if (slots.has(slot)) {
      return { valid: false, reason: `Duplicate slot ${slot}` };
    }
    slots.add(slot);

    if (placement.kind === "semantic") {
      if (semanticIds.has(placement.id)) {
        return { valid: false, reason: `Duplicate semantic ${placement.id}` };
      }
      semanticIds.add(placement.id);

      if (FIXED_SEMANTIC_IDS.has(placement.id)) {
        const expected = DEFAULT_SEMANTIC_SLOTS.get(placement.id);
        if (expected !== slot) {
          return { valid: false, reason: `${placement.id} must stay fixed` };
        }
      } else if (!SEMANTIC_PREFABS[placement.id]?.movable) {
        const expected = DEFAULT_SEMANTIC_SLOTS.get(placement.id);
        if (expected !== slot) {
          return { valid: false, reason: `${placement.id} must stay at default slot` };
        }
      } else if (!slotInsidePlot(placement.tileX, placement.tileZ)) {
        return { valid: false, reason: "Placement outside clan plot" };
      }
    } else if (!slotInsidePlot(placement.tileX, placement.tileZ)) {
      return { valid: false, reason: "Placement outside clan plot" };
    }

    if (placement.kind === "prop" && !GAME_ASSETS[placement.assetKey]) {
      return { valid: false, reason: `Unknown asset ${placement.assetKey}` };
    }

    if (placement.kind === "decorative" && !DECORATIVE_PREFABS[placement.prefab]) {
      return { valid: false, reason: `Unknown prefab ${placement.prefab}` };
    }

    if (PROTECTED_ROAD_SLOTS.has(slot)) {
      return { valid: false, reason: "Road tile protected" };
    }
  }

  for (const fixedId of FIXED_SEMANTIC_IDS) {
    if (!semanticIds.has(fixedId)) {
      return { valid: false, reason: `Missing fixed building ${fixedId}` };
    }
  }

  return { valid: true };
}

function getPlacementId(placement: ClanPlacement): string {
  return placement.kind === "semantic" ? placement.id : placement.id;
}

export function canPlaceAt(
  layout: ClanPlacement[],
  tileX: number,
  tileZ: number,
  excludeId?: string,
): PlacementValidation {
  if (!slotInsidePlot(tileX, tileZ)) {
    return { valid: false, reason: "Outside clan plot" };
  }

  const slot = placementKey(tileX, tileZ);
  if (PROTECTED_ROAD_SLOTS.has(slot)) {
    return { valid: false, reason: "Road tile protected" };
  }

  for (const placement of layout) {
    if (excludeId && getPlacementId(placement) === excludeId) continue;
    if (placementKey(placement.tileX, placement.tileZ) === slot) {
      return { valid: false, reason: "Tile occupied" };
    }
  }

  return { valid: true };
}

export function movePlacement(
  layout: ClanPlacement[],
  placementId: string,
  tileX: number,
  tileZ: number,
): ClanPlacement[] | null {
  const index = layout.findIndex((p) => getPlacementId(p) === placementId);
  if (index < 0) return null;

  const current = layout[index];
  if (current.kind === "semantic" && FIXED_SEMANTIC_IDS.has(current.id)) {
    return null;
  }

  const check = canPlaceAt(layout, tileX, tileZ, placementId);
  if (!check.valid) return null;

  const next = [...layout];
  next[index] = { ...current, tileX, tileZ };
  return next;
}

export function removePlacement(layout: ClanPlacement[], placementId: string): ClanPlacement[] | null {
  const target = layout.find((p) => getPlacementId(p) === placementId);
  if (!target || !canRemovePlacement(target)) return null;
  return layout.filter((p) => getPlacementId(p) !== placementId);
}

export function addPlacement(layout: ClanPlacement[], placement: ClanPlacement): ClanPlacement[] | null {
  if (layout.length >= MAX_LAYOUT_PLACEMENTS) return null;

  const check = canPlaceAt(layout, placement.tileX, placement.tileZ);
  if (!check.valid) return null;

  if (placement.kind === "semantic") {
    if (layout.some((p) => p.kind === "semantic" && p.id === placement.id)) {
      return null;
    }
  }

  return [...layout, placement];
}

/** Put a previously removed placement back at its saved tile. */
export function restorePlacement(layout: ClanPlacement[], placement: ClanPlacement): ClanPlacement[] | null {
  return addPlacement(layout, placement);
}

export function rotatePlacement(layout: ClanPlacement[], placementId: string): ClanPlacement[] | null {
  const index = layout.findIndex((p) => getPlacementId(p) === placementId);
  if (index < 0) return null;
  const current = layout[index];
  if (current.kind === "semantic" && FIXED_SEMANTIC_IDS.has(current.id)) return null;

  const next = [...layout];
  const rotation = (current.rotation ?? 0) + Math.PI / 2;
  next[index] = { ...current, rotation };
  return next;
}

/** Chebyshev tiles from the origin that must stay empty around the keep. */
const KEEP_CLEARANCE_TILES = 6;

function crowdedAgainstKeep(layout: ClanPlacement[]): boolean {
  return layout.some((placement) => {
    if (placement.kind === "semantic" && (placement.id === "town-hall" || placement.id === "approval-gate")) {
      return false;
    }
    return Math.max(Math.abs(placement.tileX), Math.abs(placement.tileZ)) < KEEP_CLEARANCE_TILES;
  });
}

export function mergeSavedLayout(saved: ClanPlacement[] | null | undefined): ClanPlacement[] {
  if (!saved || saved.length === 0) return DEFAULT_SEED_LAYOUT;

  const validation = validateLayout(saved);
  if (!validation.valid) return DEFAULT_SEED_LAYOUT;
  if (crowdedAgainstKeep(saved)) return DEFAULT_SEED_LAYOUT;

  return saved;
}

export function createDecorativePlacement(
  prefab: DecorativePrefabId,
  tileX: number,
  tileZ: number,
  id?: string,
): ClanPlacement {
  return {
    kind: "decorative",
    id: id ?? `dec-${prefab}-${tileX}-${tileZ}-${Date.now()}`,
    prefab,
    tileX,
    tileZ,
    rotation: 0,
  };
}

export function createPropPlacement(
  assetKey: GameAssetKey,
  tileX: number,
  tileZ: number,
  id?: string,
): ClanPlacement {
  return {
    kind: "prop",
    id: id ?? `prop-${tileX}-${tileZ}-${Date.now()}`,
    assetKey,
    tileX,
    tileZ,
    rotation: 0,
  };
}
