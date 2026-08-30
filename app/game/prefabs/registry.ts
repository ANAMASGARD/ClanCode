import type { ComponentType } from "react";
import type { SemanticBuildingId } from "@/app/game/state/default-layout";
import type { DecorativePrefabId } from "@/app/game/state/decorative-layout";
import {
  ArcherTower,
  ArmyCamp,
  Bakery,
  Barracks,
  CartHay,
  GoldStore,
  Cottage,
  CropField,
  DefensePost,
  GardenCluster,
  GuardPost,
  LumberYard,
  MarketCluster,
  RockGarden,
  StallCorner,
  StorageYard,
  VillageHouseA,
  VillageHouseB,
  VillageHouseC,
  VillageHouseD,
  WatchTower,
  Well,
} from "./DecorativeBuildings";
import { Farm, SmallWindmill, Watermill, Windmill } from "./Mills";
import { BuilderWorkshop } from "./BuilderWorkshop";
import {
  Market,
  ModelShrine,
  SearchTower,
  SessionLodge,
  TestCamp,
  ValidationForge,
} from "./SemanticBuildings";
import { ApprovalGate } from "@/app/game/scene/ApprovalGate";
import { TownHall } from "./TownHall";

export type PrefabDefinition = {
  id: string;
  label: string;
  footprint: readonly [number, number];
  selectionRadius: number;
  visualHeight: number;
  /** Multiplier on BUILDING_VISUAL_SCALE for this prefab (presentation only). */
  visualScale?: number;
  movable: boolean;
  district: "core" | "village" | "harbor" | "river" | "workshop" | "forest";
  component: ComponentType<{ reducedMotion?: boolean }>;
};

export const SEMANTIC_PREFABS: Record<
  SemanticBuildingId,
  PrefabDefinition
> = {
  "town-hall": {
    id: "town-hall",
    label: "Clan Castle",
    footprint: [12, 12],
    selectionRadius: 8,
    visualHeight: 10,
    visualScale: 1,
    movable: true,
    district: "core",
    component: TownHall,
  },
  "search-tower": {
    id: "search-tower",
    label: "Search Tower",
    footprint: [3, 3],
    selectionRadius: 3.2,
    visualHeight: 6,
    visualScale: 1.05,
    movable: true,
    district: "core",
    component: SearchTower,
  },
  "builder-workshop": {
    id: "builder-workshop",
    label: "Builder Workshop",
    footprint: [4, 4],
    selectionRadius: 3.4,
    visualHeight: 4,
    visualScale: 1.05,
    movable: true,
    district: "workshop",
    component: BuilderWorkshop,
  },
  "validation-forge": {
    id: "validation-forge",
    label: "Validation Forge",
    footprint: [4, 4],
    selectionRadius: 3.4,
    visualHeight: 4,
    visualScale: 1.05,
    movable: true,
    district: "workshop",
    component: ValidationForge,
  },
  "session-lodge": {
    id: "session-lodge",
    label: "Session Lodge",
    footprint: [4, 4],
    selectionRadius: 3.2,
    visualHeight: 4,
    visualScale: 1.05,
    movable: true,
    district: "core",
    component: SessionLodge,
  },
  "model-shrine": {
    id: "model-shrine",
    label: "Model Shrine",
    footprint: [4, 4],
    selectionRadius: 3.2,
    visualHeight: 4,
    visualScale: 1.05,
    movable: true,
    district: "core",
    component: ModelShrine,
  },
  "approval-gate": {
    id: "approval-gate",
    label: "Approval Gate",
    footprint: [5, 3],
    selectionRadius: 4.2,
    visualHeight: 5,
    movable: false,
    district: "core",
    component: ApprovalGate,
  },
  "test-camp": {
    id: "test-camp",
    label: "Test Camp",
    footprint: [4, 4],
    selectionRadius: 3.4,
    visualHeight: 4,
    visualScale: 1.05,
    movable: true,
    district: "village",
    component: TestCamp,
  },
  market: {
    id: "market",
    label: "Tool Market",
    footprint: [4, 4],
    selectionRadius: 3.4,
    visualHeight: 4,
    visualScale: 1.05,
    movable: true,
    district: "village",
    component: Market,
  },
  windmill: {
    id: "windmill",
    label: "Windmill",
    footprint: [4, 4],
    selectionRadius: 3.4,
    visualHeight: 5,
    visualScale: 1.1,
    movable: true,
    district: "village",
    component: Windmill,
  },
  watermill: {
    id: "watermill",
    label: "Event Watermill",
    footprint: [4, 4],
    selectionRadius: 3.6,
    visualHeight: 4,
    visualScale: 1.1,
    movable: false,
    district: "river",
    component: Watermill,
  },
  farm: {
    id: "farm",
    label: "Backlog Farm",
    footprint: [6, 4],
    selectionRadius: 3.8,
    visualHeight: 3,
    movable: false,
    district: "village",
    component: Farm,
  },
};

export const DECORATIVE_PREFABS: Record<
  DecorativePrefabId,
  ComponentType<{ reducedMotion?: boolean }>
> = {
  VillageHouseA,
  VillageHouseB,
  VillageHouseC,
  VillageHouseD,
  Cottage,
  Bakery,
  Barracks,
  LumberYard,
  StorageYard,
  GuardPost,
  WatchTower,
  DefensePost,
  ArmyCamp,
  MarketCluster,
  GardenCluster,
  CropField,
  SmallWindmill,
  Well,
  CartHay,
  StallCorner,
  RockGarden,
  ArcherTower,
  GoldStore,
};

export function getSemanticPrefab(id: SemanticBuildingId): PrefabDefinition {
  const prefab = SEMANTIC_PREFABS[id];
  if (!prefab) throw new Error(`Unknown semantic prefab: ${id}`);
  return prefab;
}
