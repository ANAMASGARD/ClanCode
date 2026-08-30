import type { GameAssetKey } from "@/app/game/assets/catalog";
import { SAND_INNER_Z, SURFACE_Y, WATER_EDGE_Z } from "./island";

export type ShorePlacement = {
  id: string;
  assetKey: GameAssetKey;
  position: readonly [number, number, number];
  rotation: number;
  scale: number;
};

export type FloatingPlacement = ShorePlacement & {
  /** Bob phase offset so vessels do not rise and fall in lockstep. */
  bobPhase: number;
};

const SAND_Y = SURFACE_Y - 0.05;
const WATER_Y = SURFACE_Y - 0.1;

/** Wooden pier running from the sand out past the shoreline. */
export const DOCK_PLACEMENTS: ShorePlacement[] = [
  { id: "dock-1", assetKey: "harbor.dock", position: [-8, SAND_Y, 31], rotation: 0, scale: 1 },
  { id: "dock-2", assetKey: "harbor.dock", position: [-8, SAND_Y, 35], rotation: 0, scale: 1 },
  { id: "dock-3", assetKey: "harbor.dockSmall", position: [-8, SAND_Y, 38.5], rotation: 0, scale: 1 },
  { id: "dock-platform", assetKey: "harbor.platform", position: [-8, SAND_Y, 41.5], rotation: 0, scale: 1 },
];

/** Vessels floating beyond the shoreline. */
export const VESSEL_PLACEMENTS: FloatingPlacement[] = [
  {
    id: "ship-large",
    assetKey: "harbor.shipLarge",
    position: [-20, WATER_Y, 46],
    rotation: Math.PI * 0.08,
    scale: 1,
    bobPhase: 0,
  },
  {
    id: "ship-small",
    assetKey: "harbor.shipSmall",
    position: [24, WATER_Y, 50],
    rotation: Math.PI * 0.55,
    scale: 1,
    bobPhase: 3.4,
  },
  {
    id: "rowboat-dock",
    assetKey: "harbor.rowboat",
    position: [-4, WATER_Y, 40],
    rotation: -Math.PI / 2,
    scale: 1,
    bobPhase: 2.6,
  },
];

/** Cargo and palms dressing the sand band. */
export const SHORE_PROPS: ShorePlacement[] = [
  { id: "shore-crate-1", assetKey: "harbor.crate", position: [-11, SAND_Y, 31], rotation: 0.3, scale: 1 },
  { id: "shore-crate-2", assetKey: "harbor.crate", position: [-12.4, SAND_Y, 32.2], rotation: -0.5, scale: 0.9 },
  { id: "shore-barrel-1", assetKey: "harbor.barrel", position: [-5.5, SAND_Y, 31.4], rotation: 0, scale: 1 },
  { id: "shore-barrel-2", assetKey: "harbor.barrel", position: [-4.4, SAND_Y, 32.4], rotation: 0.8, scale: 0.9 },
  { id: "shore-chest", assetKey: "harbor.chest", position: [-13.6, SAND_Y, 30.8], rotation: 0.2, scale: 1 },
  { id: "shore-palm-1", assetKey: "harbor.palmBend", position: [14, SAND_Y, 31.2], rotation: 0.4, scale: 1 },
  { id: "shore-palm-2", assetKey: "harbor.palmStraight", position: [18, SAND_Y, 32], rotation: -0.6, scale: 1 },
  { id: "shore-palm-3", assetKey: "harbor.palmDetailed", position: [-24, SAND_Y, 31.6], rotation: 1.1, scale: 1 },
  { id: "shore-rocks-1", assetKey: "harbor.rocksSandA", position: [28, SAND_Y, 31], rotation: 0.5, scale: 1 },
  { id: "shore-rocks-2", assetKey: "harbor.rocksSandB", position: [-30, SAND_Y, 32], rotation: -0.3, scale: 1 },
];

/** Shore lookout that watches the harbor approach, just inside the rampart. */
export const REVIEW_POST_POSITION = [-18, 0, 22.5] as const;

/** Medium ship reserved for human-triggered PR delivery. Not an ambient Harbor vessel. */
export const PR_COURIER_PLACEMENT: FloatingPlacement = {
  id: "pr-courier",
  assetKey: "harbor.shipMedium",
  position: [8, WATER_Y, 44],
  rotation: -Math.PI * 0.12,
  scale: 1,
  bobPhase: 1.9,
};

export const SHORE_SAND_Y = SAND_Y;
export const SHORE_WATER_Y = WATER_Y;

export function isBeyondShoreline(z: number): boolean {
  return z > WATER_EDGE_Z;
}

export function isOnSand(z: number): boolean {
  return z > SAND_INNER_Z && z <= WATER_EDGE_Z;
}
