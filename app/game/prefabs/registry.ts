import type { ComponentType } from "react";
import type { SemanticBuildingId } from "@/app/game/state/default-layout";
import type { DecorativePrefabId } from "@/app/game/state/decorative-layout";
import {
  GardenCluster,
  GuardPost,
  MarketCluster,
  StorageYard,
  VillageHouseA,
  VillageHouseB,
  VillageHouseC,
  VillageHouseD,
} from "./DecorativeBuildings";
import { Farm, Watermill, Windmill } from "./Mills";
import {
  ApprovalGate,
  BuilderWorkshop,
  Market,
  ModelShrine,
  SearchTower,
  SessionLodge,
  TestCamp,
  ValidationForge,
} from "./SemanticBuildings";
import { TownHall } from "./TownHall";

export type PrefabDefinition = {
  id: string;
  label: string;
  footprint: readonly [number, number];
  selectionRadius: number;
  visualHeight: number;
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
    label: "Town Hall",
    footprint: [6, 6],
    selectionRadius: 5.5,
    visualHeight: 8,
    movable: true,
    district: "core",
    component: TownHall,
  },
  "search-tower": {
    id: "search-tower",
    label: "Search Tower",
    footprint: [3, 3],
    selectionRadius: 3.2,
    visualHeight: 9,
    movable: true,
    district: "core",
    component: SearchTower,
  },
  "builder-workshop": {
    id: "builder-workshop",
    label: "Builder Workshop",
    footprint: [5, 5],
    selectionRadius: 3.8,
    visualHeight: 5,
    movable: true,
    district: "workshop",
    component: BuilderWorkshop,
  },
  "validation-forge": {
    id: "validation-forge",
    label: "Validation Forge",
    footprint: [5, 5],
    selectionRadius: 3.8,
    visualHeight: 5,
    movable: true,
    district: "workshop",
    component: ValidationForge,
  },
  "session-lodge": {
    id: "session-lodge",
    label: "Session Lodge",
    footprint: [4, 4],
    selectionRadius: 3.4,
    visualHeight: 4,
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
    movable: true,
    district: "core",
    component: ApprovalGate,
  },
  "test-camp": {
    id: "test-camp",
    label: "Test Camp",
    footprint: [5, 4],
    selectionRadius: 3.6,
    visualHeight: 4,
    movable: true,
    district: "village",
    component: TestCamp,
  },
  market: {
    id: "market",
    label: "Tool Market",
    footprint: [5, 4],
    selectionRadius: 3.5,
    visualHeight: 4,
    movable: true,
    district: "village",
    component: Market,
  },
  windmill: {
    id: "windmill",
    label: "Windmill",
    footprint: [4, 4],
    selectionRadius: 3.4,
    visualHeight: 7,
    movable: true,
    district: "village",
    component: Windmill,
  },
  watermill: {
    id: "watermill",
    label: "Event Watermill",
    footprint: [5, 5],
    selectionRadius: 3.8,
    visualHeight: 5,
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
  ComponentType
> = {
  VillageHouseA,
  VillageHouseB,
  VillageHouseC,
  VillageHouseD,
  StorageYard,
  GuardPost,
  MarketCluster,
  GardenCluster,
};

export function getSemanticPrefab(id: SemanticBuildingId): PrefabDefinition {
  const prefab = SEMANTIC_PREFABS[id];
  if (!prefab) throw new Error(`Unknown semantic prefab: ${id}`);
  return prefab;
}
