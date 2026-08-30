export type DecorativePrefabId =
  | "VillageHouseA"
  | "VillageHouseB"
  | "VillageHouseC"
  | "VillageHouseD"
  | "StorageYard"
  | "GuardPost"
  | "MarketCluster"
  | "GardenCluster";

export type DecorativePlacement = {
  id: string;
  prefab: DecorativePrefabId;
  tileX: number;
  tileZ: number;
  rotation?: number;
};

export const DECORATIVE_PLACEMENTS: DecorativePlacement[] = [
  { id: "house-a1", prefab: "VillageHouseA", tileX: -9, tileZ: 0 },
  { id: "house-a2", prefab: "VillageHouseA", tileX: 9, tileZ: 0, rotation: Math.PI },
  { id: "house-b1", prefab: "VillageHouseB", tileX: -8, tileZ: 5, rotation: Math.PI / 2 },
  { id: "house-b2", prefab: "VillageHouseB", tileX: 8, tileZ: -3, rotation: -Math.PI / 2 },
  { id: "house-c1", prefab: "VillageHouseC", tileX: -3, tileZ: -9 },
  { id: "house-c2", prefab: "VillageHouseC", tileX: 3, tileZ: -9, rotation: Math.PI },
  { id: "house-d1", prefab: "VillageHouseD", tileX: 10, tileZ: 4 },
  { id: "house-d2", prefab: "VillageHouseD", tileX: -10, tileZ: -2, rotation: Math.PI / 2 },
  { id: "house-d3", prefab: "VillageHouseD", tileX: 9, tileZ: -7 },
  { id: "house-d4", prefab: "VillageHouseD", tileX: -9, tileZ: 7 },
  { id: "storage-1", prefab: "StorageYard", tileX: -7, tileZ: 6 },
  { id: "storage-2", prefab: "StorageYard", tileX: 7, tileZ: -8, rotation: Math.PI / 2 },
  { id: "guard-1", prefab: "GuardPost", tileX: 5, tileZ: 9 },
  { id: "guard-2", prefab: "GuardPost", tileX: -5, tileZ: 9, rotation: Math.PI },
  { id: "market-1", prefab: "MarketCluster", tileX: -6, tileZ: -7 },
  { id: "garden-1", prefab: "GardenCluster", tileX: 0, tileZ: -5 },
];
