import { kenneyGlbUrl } from "@/app/lib/visualization/kenney";
import { CATALOG_ENTRIES } from "./catalog-entries";
import type { GameAssetDefinition, GameAssetKey } from "./types";

export type {
  GameAssetDefinition,
  GameAssetDistrict,
  GameAssetRole,
  GameAssetKey,
  PivotMode,
} from "./types";

export { CATALOG_ENTRIES };

const entriesByKey = Object.fromEntries(
  CATALOG_ENTRIES.map((entry) => [entry.key, entry]),
) as Record<GameAssetKey, GameAssetDefinition>;

export const GAME_ASSETS = entriesByKey;

export function getGameAsset(key: GameAssetKey): GameAssetDefinition {
  const definition = GAME_ASSETS[key];
  if (!definition) throw new Error(`Unknown game asset: ${key}`);
  return definition;
}

export function gameAssetUrl(key: GameAssetKey): string {
  const definition = getGameAsset(key);
  return kenneyGlbUrl(definition.kit, definition.model);
}

export const CORE_GAME_ASSET_KEYS = [
  "townHall.wallStone",
  "townHall.wallWood",
  "townHall.roofHigh",
  "nature.pineDefaultA",
  "nature.pineTallA",
  "nature.riverStraight",
  "nature.bridgeWood",
  "harbor.shipLarge",
  "harbor.dock",
  "workshop.structure",
  "forge.structure",
  "harbor.castleWall",
  "village.road",
] as const satisfies readonly GameAssetKey[];

export const INSTANCEABLE_FOREST_KEYS = CATALOG_ENTRIES.filter(
  (entry) => entry.instanceable && entry.district === "forest",
).map((entry) => entry.key) as GameAssetKey[];
