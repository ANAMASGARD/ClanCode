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
 * Village accents on the grass ring around the keep. Corner mills sit on
 * the grass like the Fantasy Town sample — tower base at ground, sails on the hub.
 */
export const DECORATIVE_PLACEMENTS: DecorativePlacement[] = [
  { id: "windmill-nw", prefab: "SmallWindmill", tileX: -10, tileZ: -10 },
  { id: "windmill-ne", prefab: "SmallWindmill", tileX: 10, tileZ: -10 },
  { id: "windmill-sw", prefab: "SmallWindmill", tileX: -10, tileZ: 8 },
  { id: "windmill-se", prefab: "SmallWindmill", tileX: 10, tileZ: 8 },

  { id: "crops-nw", prefab: "CropField", tileX: -4, tileZ: -10 },
  { id: "crops-ne", prefab: "CropField", tileX: 4, tileZ: -10 },

  { id: "house-nw", prefab: "VillageHouseA", tileX: -8, tileZ: -10 },
  { id: "house-ne", prefab: "VillageHouseD", tileX: 8, tileZ: -10, rotation: Math.PI },
  { id: "cottage-sw", prefab: "Cottage", tileX: -8, tileZ: 10 },
  { id: "bakery-se", prefab: "Bakery", tileX: 8, tileZ: 10 },
  { id: "well-w", prefab: "Well", tileX: -10, tileZ: 2 },
  { id: "market-sw", prefab: "MarketCluster", tileX: -6, tileZ: 8 },
  { id: "garden-west", prefab: "GardenCluster", tileX: -10, tileZ: 0 },
  { id: "stall-north", prefab: "StallCorner", tileX: 0, tileZ: -10 },
  { id: "rock-east", prefab: "RockGarden", tileX: 10, tileZ: 2 },
  { id: "cart-lane", prefab: "CartHay", tileX: 10, tileZ: -2 },

  { id: "guard-w", prefab: "GuardPost", tileX: -4, tileZ: 10 },
  { id: "guard-e", prefab: "GuardPost", tileX: 4, tileZ: 10 },
];
