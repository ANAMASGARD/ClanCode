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

export function worldY(): number {
  return 0.94;
}

/** Ground elevation for placed buildings and props. */
export const GROUND_Y = worldY();
