export type DecorativePrefabId =
  | "VillageHouseA"
  | "VillageHouseB"
  | "VillageHouseC"
  | "VillageHouseD"
  | "Cottage"
  | "Bakery"
  | "Barracks"
  | "LumberYard"
  | "StorageYard"
  | "GuardPost"
  | "WatchTower"
  | "DefensePost"
  | "ArmyCamp"
  | "MarketCluster"
  | "GardenCluster"
  | "CropField"
  | "SmallWindmill"
  | "Well";

export type DecorativePlacement = {
  id: string;
  prefab: DecorativePrefabId;
  tileX: number;
  tileZ: number;
  rotation?: number;
};

/**
 * Light decorative accents only. The plot is deliberately uncrowded so the
 * named buildings read clearly and villagers have open ground to roam.
 */
export const DECORATIVE_PLACEMENTS: DecorativePlacement[] = [
  // Wind farm at the four outer corners
  { id: "windmill-nw", prefab: "SmallWindmill", tileX: -9, tileZ: -9 },
  { id: "windmill-ne", prefab: "SmallWindmill", tileX: 9, tileZ: -9 },
  { id: "windmill-sw", prefab: "SmallWindmill", tileX: -9, tileZ: 6 },
  { id: "windmill-se", prefab: "SmallWindmill", tileX: 9, tileZ: 6 },

  // Crop rows flanking the north approach
  { id: "crops-nw", prefab: "CropField", tileX: -3, tileZ: -6 },
  { id: "crops-ne", prefab: "CropField", tileX: 3, tileZ: -6 },

  // A couple of homes and a well near the core
  { id: "house-nw", prefab: "VillageHouseA", tileX: -6, tileZ: -6 },
  { id: "house-ne", prefab: "VillageHouseD", tileX: 6, tileZ: -6, rotation: Math.PI },
  { id: "well-w", prefab: "Well", tileX: -6, tileZ: 0 },
  { id: "market-sw", prefab: "MarketCluster", tileX: -3, tileZ: 3 },

  // Gate guards
  { id: "guard-w", prefab: "GuardPost", tileX: -3, tileZ: 9 },
  { id: "guard-e", prefab: "GuardPost", tileX: 3, tileZ: 9 },
];
