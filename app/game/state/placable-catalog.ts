import type { GameAssetKey } from "@/app/game/assets/catalog";
import type { DecorativePrefabId } from "./decorative-layout";

export type PlacableCategory = "buildings" | "decorations" | "props";

export type PlacableShopItem =
  | {
      shopId: string;
      kind: "prefab";
      prefab: DecorativePrefabId;
      label: string;
      category: PlacableCategory;
      footprintTiles: 1;
    }
  | {
      shopId: string;
      kind: "asset";
      assetKey: GameAssetKey;
      label: string;
      category: PlacableCategory;
      footprintTiles: 1;
    };

/** Curated shop directory — plot-safe Kenney props and decorative prefabs. */
export const PLACABLE_SHOP_ITEMS: readonly PlacableShopItem[] = [
  // Buildings / decorative prefabs
  { shopId: "prefab-VillageHouseA", kind: "prefab", prefab: "VillageHouseA", label: "Timber House", category: "buildings", footprintTiles: 1 },
  { shopId: "prefab-VillageHouseB", kind: "prefab", prefab: "VillageHouseB", label: "Corner House", category: "buildings", footprintTiles: 1 },
  { shopId: "prefab-VillageHouseC", kind: "prefab", prefab: "VillageHouseC", label: "Stone Steps House", category: "buildings", footprintTiles: 1 },
  { shopId: "prefab-VillageHouseD", kind: "prefab", prefab: "VillageHouseD", label: "Stone Cottage", category: "buildings", footprintTiles: 1 },
  { shopId: "prefab-Cottage", kind: "prefab", prefab: "Cottage", label: "Cottage", category: "buildings", footprintTiles: 1 },
  { shopId: "prefab-Bakery", kind: "prefab", prefab: "Bakery", label: "Bakery", category: "buildings", footprintTiles: 1 },
  { shopId: "prefab-Barracks", kind: "prefab", prefab: "Barracks", label: "Barracks", category: "buildings", footprintTiles: 1 },
  { shopId: "prefab-LumberYard", kind: "prefab", prefab: "LumberYard", label: "Lumber Yard", category: "buildings", footprintTiles: 1 },
  { shopId: "prefab-StorageYard", kind: "prefab", prefab: "StorageYard", label: "Storage Yard", category: "buildings", footprintTiles: 1 },
  { shopId: "prefab-WatchTower", kind: "prefab", prefab: "WatchTower", label: "Watch Tower", category: "buildings", footprintTiles: 1 },
  { shopId: "prefab-DefensePost", kind: "prefab", prefab: "DefensePost", label: "Defense Post", category: "buildings", footprintTiles: 1 },
  { shopId: "prefab-GuardPost", kind: "prefab", prefab: "GuardPost", label: "Guard Post", category: "buildings", footprintTiles: 1 },
  { shopId: "prefab-ArmyCamp", kind: "prefab", prefab: "ArmyCamp", label: "Army Camp", category: "buildings", footprintTiles: 1 },

  // Decorations
  { shopId: "prefab-MarketCluster", kind: "prefab", prefab: "MarketCluster", label: "Market Stalls", category: "decorations", footprintTiles: 1 },
  { shopId: "prefab-GardenCluster", kind: "prefab", prefab: "GardenCluster", label: "Garden", category: "decorations", footprintTiles: 1 },
  { shopId: "prefab-CropField", kind: "prefab", prefab: "CropField", label: "Crop Field", category: "decorations", footprintTiles: 1 },
  { shopId: "prefab-Well", kind: "prefab", prefab: "Well", label: "Fountain Plaza", category: "decorations", footprintTiles: 1 },
  { shopId: "prefab-CartHay", kind: "prefab", prefab: "CartHay", label: "Supply Cart", category: "decorations", footprintTiles: 1 },
  { shopId: "prefab-StallCorner", kind: "prefab", prefab: "StallCorner", label: "Market Stall", category: "decorations", footprintTiles: 1 },
  { shopId: "prefab-RockGarden", kind: "prefab", prefab: "RockGarden", label: "Rock Garden", category: "decorations", footprintTiles: 1 },

  // Single props
  { shopId: "asset-village.fountainRound", kind: "asset", assetKey: "village.fountainRound", label: "Round Fountain", category: "props", footprintTiles: 1 },
  { shopId: "asset-village.hedgeLarge", kind: "asset", assetKey: "village.hedgeLarge", label: "Large Hedge", category: "props", footprintTiles: 1 },
  { shopId: "asset-village.hedgeLargeGate", kind: "asset", assetKey: "village.hedgeLargeGate", label: "Hedge Gate", category: "props", footprintTiles: 1 },
  { shopId: "asset-village.stall", kind: "asset", assetKey: "village.stall", label: "Market Stall", category: "props", footprintTiles: 1 },
  { shopId: "asset-village.lantern", kind: "asset", assetKey: "village.lantern", label: "Lantern", category: "props", footprintTiles: 1 },
  { shopId: "asset-village.cartLow", kind: "asset", assetKey: "village.cartLow", label: "Cart", category: "props", footprintTiles: 1 },
  { shopId: "asset-village.fenceGate", kind: "asset", assetKey: "village.fenceGate", label: "Fence Gate", category: "props", footprintTiles: 1 },
  { shopId: "asset-village.planks", kind: "asset", assetKey: "village.planks", label: "Plank Stack", category: "props", footprintTiles: 1 },
  { shopId: "asset-workshop.barrel", kind: "asset", assetKey: "workshop.barrel", label: "Barrel", category: "props", footprintTiles: 1 },
  { shopId: "asset-workshop.boxLarge", kind: "asset", assetKey: "workshop.boxLarge", label: "Large Crate", category: "props", footprintTiles: 1 },
  { shopId: "asset-workshop.bucket", kind: "asset", assetKey: "workshop.bucket", label: "Bucket", category: "props", footprintTiles: 1 },
  { shopId: "asset-workshop.signpost", kind: "asset", assetKey: "workshop.signpost", label: "Signpost", category: "props", footprintTiles: 1 },
  { shopId: "asset-workshop.fenceFortified", kind: "asset", assetKey: "workshop.fenceFortified", label: "Fortified Fence", category: "props", footprintTiles: 1 },
  { shopId: "asset-nature.rockLarge", kind: "asset", assetKey: "nature.rockLarge", label: "Large Rock", category: "props", footprintTiles: 1 },
  { shopId: "asset-nature.stoneLargeA", kind: "asset", assetKey: "nature.stoneLargeA", label: "Stone Outcrop", category: "props", footprintTiles: 1 },
  { shopId: "asset-harbor.barrel", kind: "asset", assetKey: "harbor.barrel", label: "Pirate Barrel", category: "props", footprintTiles: 1 },
  { shopId: "asset-village.bannerRed", kind: "asset", assetKey: "village.bannerRed", label: "Red Banner", category: "props", footprintTiles: 1 },
] as const;

export function shopItemsByCategory(category: PlacableCategory): PlacableShopItem[] {
  return PLACABLE_SHOP_ITEMS.filter((item) => item.category === category);
}

export function findShopItem(shopId: string): PlacableShopItem | undefined {
  return PLACABLE_SHOP_ITEMS.find((item) => item.shopId === shopId);
}
