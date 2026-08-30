import type {
  GameAssetDefinition,
  GameAssetDistrict,
  GameAssetRole,
  PivotMode,
} from "./types";
import type { KenneyKitId } from "@/app/lib/visualization/kenney";

type AssetInput = Omit<GameAssetDefinition, "key">;

export function defineAsset<const Key extends string>(
  key: Key,
  definition: AssetInput,
): GameAssetDefinition & { key: Key } {
  return { key, ...definition };
}

const MODULAR: Pick<
  AssetInput,
  "uniformScale" | "pivotMode" | "pivotOffset" | "castsShadow" | "receivesShadow" | "instanceable"
> = {
  uniformScale: 1,
  pivotMode: "ground-origin",
  pivotOffset: [0, 0, 0],
  castsShadow: true,
  receivesShadow: true,
  instanceable: false,
};

const GROUND: Pick<
  AssetInput,
  "uniformScale" | "pivotMode" | "pivotOffset" | "castsShadow" | "receivesShadow" | "instanceable"
> = {
  uniformScale: 1,
  pivotMode: "ground-center",
  pivotOffset: [0, 0, 0],
  castsShadow: true,
  receivesShadow: true,
  instanceable: false,
};

const TILE: Pick<
  AssetInput,
  "uniformScale" | "pivotMode" | "pivotOffset" | "castsShadow" | "receivesShadow" | "instanceable"
> = {
  uniformScale: 5,
  pivotMode: "ground-center",
  pivotOffset: [0, 0, 0],
  castsShadow: false,
  receivesShadow: true,
  instanceable: false,
};

const TREE: Pick<
  AssetInput,
  "uniformScale" | "pivotMode" | "pivotOffset" | "castsShadow" | "receivesShadow" | "instanceable"
> = {
  uniformScale: 3.4,
  pivotMode: "ground-center",
  pivotOffset: [0, 0, 0],
  castsShadow: true,
  receivesShadow: true,
  instanceable: true,
};

const PROP: Pick<
  AssetInput,
  "uniformScale" | "pivotMode" | "pivotOffset" | "castsShadow" | "receivesShadow" | "instanceable"
> = {
  uniformScale: 1,
  pivotMode: "ground-center",
  pivotOffset: [0, 0, 0],
  castsShadow: true,
  receivesShadow: true,
  instanceable: false,
};

const SURVIVAL_BUILDING: Pick<
  AssetInput,
  "uniformScale" | "pivotMode" | "pivotOffset" | "castsShadow" | "receivesShadow" | "instanceable"
> = {
  uniformScale: 10,
  pivotMode: "ground-center",
  pivotOffset: [0, 0, 0],
  castsShadow: true,
  receivesShadow: true,
  instanceable: false,
};

export function modularFantasy(
  key: string,
  model: string,
  district: GameAssetDistrict = "core",
  role: GameAssetRole = "building",
) {
  return defineAsset(key, {
    kit: "fantasyTown",
    model,
    role,
    district,
    ...MODULAR,
  });
}

export function roadFantasy(key: string, model: string) {
  return defineAsset(key, {
    kit: "fantasyTown",
    model,
    role: "terrain",
    district: "village",
    ...MODULAR,
    uniformScale: 1,
    footprint: [1, 1] as const,
  });
}

export function propFantasy(key: string, model: string, district: GameAssetDistrict = "village") {
  return defineAsset(key, {
    kit: "fantasyTown",
    model,
    role: "prop",
    district,
    ...PROP,
    uniformScale: 1,
  });
}

export function natureTile(key: string, model: string, role: GameAssetRole = "terrain", district: GameAssetDistrict = "village") {
  return defineAsset(key, {
    kit: "nature",
    model,
    role,
    district,
    ...TILE,
    castsShadow: role !== "water",
    receivesShadow: role !== "water",
  });
}

export function natureTree(key: string, model: string, castsShadow = true) {
  return defineAsset(key, {
    kit: "nature",
    model,
    role: "forest",
    district: "forest",
    ...TREE,
    castsShadow,
  });
}

export function natureProp(key: string, model: string, district: GameAssetDistrict = "forest", scale = 2.2) {
  return defineAsset(key, {
    kit: "nature",
    model,
    role: "prop",
    district,
    ...PROP,
    uniformScale: scale,
    instanceable: true,
  });
}

export function castleModular(
  key: string,
  model: string,
  district: GameAssetDistrict = "core",
  role: GameAssetRole = "building",
) {
  return defineAsset(key, {
    kit: "castle",
    model,
    role,
    district,
    ...MODULAR,
  });
}

export function castleProp(key: string, model: string, district: GameAssetDistrict = "village", scale = 1) {
  return defineAsset(key, {
    kit: "castle",
    model,
    role: "prop",
    district,
    ...PROP,
    uniformScale: scale,
  });
}

export function retroFantasyModular(
  key: string,
  model: string,
  district: GameAssetDistrict = "core",
  role: GameAssetRole = "building",
) {
  return defineAsset(key, {
    kit: "retroFantasy",
    model,
    role,
    district,
    ...MODULAR,
  });
}

export function retroFantasyProp(key: string, model: string, district: GameAssetDistrict = "village", scale = 1) {
  return defineAsset(key, {
    kit: "retroFantasy",
    model,
    role: "prop",
    district,
    ...PROP,
    uniformScale: scale,
  });
}

export function pirateModular(key: string, model: string, district: GameAssetDistrict = "core", role: GameAssetRole = "building") {
  return defineAsset(key, {
    kit: "pirate",
    model,
    role,
    district,
    ...MODULAR,
  });
}

export function pirateProp(key: string, model: string, district: GameAssetDistrict = "harbor", scale = 1) {
  return defineAsset(key, {
    kit: "pirate",
    model,
    role: "prop",
    district,
    ...PROP,
    uniformScale: scale,
  });
}

export function survivalBuilding(key: string, model: string, district: GameAssetDistrict = "workshop") {
  return defineAsset(key, {
    kit: "survival",
    model,
    role: "building",
    district,
    ...SURVIVAL_BUILDING,
  });
}

export function survivalProp(key: string, model: string, district: GameAssetDistrict = "workshop", scale = 10) {
  return defineAsset(key, {
    kit: "survival",
    model,
    role: "prop",
    district,
    ...PROP,
    uniformScale: scale,
  });
}

/**
 * Blocky villager characters. Source models are 2.7 units tall with their
 * origin at the feet; 0.5 puts them at readable village scale.
 */
export function modularBuilding(
  key: string,
  model: string,
  district: GameAssetDistrict = "workshop",
  role: GameAssetRole = "building",
) {
  return defineAsset(key, {
    kit: "modularBuildings",
    model,
    role,
    district,
    ...MODULAR,
    uniformScale: 0.55,
  });
}

export function blockyCharacter(key: string, model: string) {
  return defineAsset(key, {
    kit: "blockyCharacters",
    model,
    role: "character",
    district: "village",
    uniformScale: 0.5,
    pivotMode: "ground-center",
    pivotOffset: [0, 0, 0],
    castsShadow: true,
    receivesShadow: true,
    instanceable: false,
  });
}

export function withOverrides(
  base: GameAssetDefinition,
  overrides: Partial<AssetInput>,
): GameAssetDefinition {
  return { ...base, ...overrides, key: base.key };
}
