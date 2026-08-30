import type { KenneyKitId } from "@/app/lib/visualization/kenney";

export type GameAssetRole =
  | "terrain"
  | "building"
  | "prop"
  | "forest"
  | "water"
  | "tool"
  | "character";

export type PivotMode = "preserve-origin" | "ground-origin" | "ground-center" | "custom";

export type GameAssetDistrict =
  | "core"
  | "village"
  | "forest"
  | "harbor"
  | "river"
  | "workshop";

export type GameAssetDefinition = {
  key: string;
  kit: KenneyKitId;
  model: string;
  role: GameAssetRole;
  uniformScale: number;
  pivotMode: PivotMode;
  pivotOffset: readonly [number, number, number];
  baseRotation?: readonly [number, number, number];
  footprint?: readonly [number, number];
  approximateHeight?: number;
  castsShadow: boolean;
  receivesShadow: boolean;
  instanceable: boolean;
  district: GameAssetDistrict;
};

export type GameAssetKey = string;
