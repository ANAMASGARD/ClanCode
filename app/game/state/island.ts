/** Shared geometry for the Clash-style plot island. */

export const PLOT_SIDE = 44;
export const RIM_SIDE = 56;
export const DIRT_EDGE_SIDE = 45.4;
export const WATER_EDGE_Z = 34;
export const SAND_INNER_Z = 29.5;
export const LAND_EXTENT = 62;
export const CANOPY_EXTENT = 100;
export const SCENE_SPAN = 140;
export const SEA_DEPTH = 72;
export const SURFACE_Y = 0.95;

/** Half-extents for square layers centered at origin. */
export const PLOT_HALF = PLOT_SIDE / 2;
export const RIM_HALF = RIM_SIDE / 2;
export const DIRT_HALF = DIRT_EDGE_SIDE / 2;
export const LAND_HALF = LAND_EXTENT / 2;
export const CANOPY_HALF = CANOPY_EXTENT / 2;

/** Canopy generation: stay off the gridded plot and its dirt outline. */
export const PLOT_EXCLUSION_HALF = PLOT_HALF + 2.2;
/** Legacy rim gap — still used by beach-front / wall tests. */
export const RIM_EXCLUSION_HALF = RIM_HALF + 1.5;

/** Camera framing — Clash-style overview: full plot + rim + forest margin visible. */
export const CAMERA_PAN_HALF_X = RIM_HALF + 6;
export const CAMERA_PAN_HALF_Z_NEG = RIM_HALF + 10;
export const CAMERA_PAN_HALF_Z_POS = RIM_HALF + 4;
export const CAMERA_DEFAULT_ZOOM = 20;
/** Locked framing — default view is the widest allowed (no zoom-out). */
export const CAMERA_MIN_ZOOM = CAMERA_DEFAULT_ZOOM;
export const CAMERA_MAX_ZOOM = 24;

export const CANOPY_SEED = 0xc1a7c0de;

export function isInsidePlot(x: number, z: number): boolean {
  return Math.abs(x) <= PLOT_HALF && Math.abs(z) <= PLOT_HALF;
}

export function isInsideRim(x: number, z: number): boolean {
  return Math.abs(x) <= RIM_HALF && Math.abs(z) <= RIM_HALF;
}

export function isOnLand(x: number, z: number): boolean {
  return Math.abs(x) <= LAND_HALF && z <= WATER_EDGE_Z;
}

export function isInSandBand(z: number): boolean {
  return z > SAND_INNER_Z && z <= WATER_EDGE_Z;
}

export function isOnPlotInterior(x: number, z: number): boolean {
  return Math.abs(x) <= PLOT_EXCLUSION_HALF && Math.abs(z) <= PLOT_EXCLUSION_HALF;
}

export function isCanopyZone(x: number, z: number): boolean {
  if (isOnPlotInterior(x, z)) return false;
  if (isInSandBand(z)) return false;
  if (z > WATER_EDGE_Z) return false;
  if (Math.abs(x) > CANOPY_HALF) return false;
  if (z < -CANOPY_HALF) return false;
  return true;
}

/** Forest floor clipped at the shoreline — no green overhang into the sea. */
export function landFloorGeometry(): { width: number; depth: number; centerZ: number } {
  const depth = WATER_EDGE_Z + SCENE_SPAN / 2;
  const centerZ = (WATER_EDGE_Z - SCENE_SPAN / 2) / 2;
  return { width: SCENE_SPAN, depth, centerZ };
}

/** South beach approach — no trees between the plot rim and the sand. */
export function isBeachFront(x: number, z: number): boolean {
  if (z <= 26) return false;
  if (z > SAND_INNER_Z) return false;
  if (x > 32) return false;
  return true;
}

/**
 * Beach rampart line — the only wall in the scene. It sits on the green rim
 * between the village plot and the sand, so the village itself stays open.
 */
export const BEACH_WALL_Z = 26;
export const BEACH_WALL_HALF_X = 26;
/** Gate opening width (world units) centered on x = 0. */
export const BEACH_GATE_HALF_X = 2;

export function isOnBeachWall(x: number, z: number): boolean {
  if (z !== BEACH_WALL_Z) return false;
  return Math.abs(x) <= BEACH_WALL_HALF_X;
}
