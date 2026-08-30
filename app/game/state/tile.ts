import { SURFACE_Y } from "./island";

/** World tile size for grid-snapped village layout. */
export const TILE = 2;

export function snap(value: number): number {
  return Math.round(value / TILE) * TILE;
}

export function snapPoint(x: number, z: number): readonly [number, number] {
  return [snap(x), snap(z)] as const;
}

export function tileToWorld(tx: number, tz: number, y = 0): readonly [number, number, number] {
  return [tx * TILE, y, tz * TILE] as const;
}

export function worldToTile(x: number, z: number): { tileX: number; tileZ: number } {
  return { tileX: Math.round(x / TILE), tileZ: Math.round(z / TILE) };
}

/** Ground elevation for placed buildings, props, and villagers — sits on the plot surface. */
export const GROUND_Y = SURFACE_Y + 0.01;

/** Uniform scale for semantic/decorative prefabs at render time (presentation only). */
export const BUILDING_VISUAL_SCALE = 1.3;
