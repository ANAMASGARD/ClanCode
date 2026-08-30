import type { GameAssetKey } from "@/app/game/assets/catalog";
import {
  CANOPY_HALF,
  CANOPY_SEED,
  isBeachFront,
  isCanopyZone,
  PLOT_EXCLUSION_HALF,
  SURFACE_Y,
} from "@/app/game/state/island";
import { mulberry32 } from "@/app/game/state/seeded-random";

export type ForestItemKind = "tree" | "rock";

export type CanopyItem = {
  key: GameAssetKey;
  position: readonly [number, number, number];
  rotation: number;
  scale: number;
  castsShadow: boolean;
  kind: ForestItemKind;
};

/** Fantasy Town Kit pines — primary canopy look from Sample.png. */
const FANTASY_PINES: GameAssetKey[] = [
  "village.tree",
  "village.treeHigh",
  "village.treeCrooked",
];

/** Nature pines mixed in so the stamp does not repeat three models only. */
const NATURE_PINES: GameAssetKey[] = [
  "nature.pineTallA",
  "nature.pineTallB",
  "nature.pineRoundA",
  "nature.pineRoundB",
  "nature.pineDefaultA",
  "nature.pineDefaultB",
];

const CANOPY_TREES: GameAssetKey[] = [...FANTASY_PINES, ...NATURE_PINES];

const FOREST_ROCKS: GameAssetKey[] = [
  "village.rockLarge",
  "village.rockSmall",
  "village.rockWide",
];

const SHADOW_RING_OUTER = PLOT_EXCLUSION_HALF + 12;
/** Green grass around the plot — plains between dirt edge and outer forest. */
const PLAIN_OUTER = PLOT_EXCLUSION_HALF + 16;

function ringDistance(x: number, z: number): number {
  return Math.max(Math.abs(x), Math.abs(z));
}

/** Lower-left shore wedge stays open like the reference (screen -x, +z). */
function isShoreOpening(x: number, z: number): boolean {
  return x < -6 && z > 16;
}

/** Keep trees off the beach rampart sitting on the south rim. */
function isNearBeachWall(z: number): boolean {
  return z >= 24 && z <= 28.5;
}

function castsCanopyShadow(x: number, z: number): boolean {
  const distance = ringDistance(x, z);
  return distance >= PLOT_EXCLUSION_HALF && distance <= SHADOW_RING_OUTER;
}

function isGreenPlain(x: number, z: number): boolean {
  const distance = ringDistance(x, z);
  return distance >= PLOT_EXCLUSION_HALF && distance <= PLAIN_OUTER;
}

function isOuterForestRing(x: number, z: number): boolean {
  return ringDistance(x, z) > PLAIN_OUTER;
}

function canPlaceForestItem(x: number, z: number): boolean {
  return isCanopyZone(x, z) && !isShoreOpening(x, z) && !isBeachFront(x, z) && !isNearBeachWall(z);
}

function pickKey(keys: readonly GameAssetKey[], random: () => number): GameAssetKey {
  return keys[Math.floor(random() * keys.length)] ?? keys[0];
}

function pushItem(
  items: CanopyItem[],
  random: () => number,
  keys: readonly GameAssetKey[],
  x: number,
  z: number,
  y: number,
  scaleMin: number,
  scaleRange: number,
  kind: ForestItemKind,
  castsShadow: boolean,
) {
  items.push({
    key: pickKey(keys, random),
    position: [x, y, z],
    rotation: random() * Math.PI * 2,
    scale: scaleMin + random() * scaleRange,
    castsShadow,
    kind,
  });
}

function fillZone(
  items: CanopyItem[],
  random: () => number,
  spacing: number,
  jitter: number,
  y: number,
  xOffset: number,
  zOffset: number,
  scaleMin: number,
  scaleRange: number,
  zone: (x: number, z: number) => boolean,
  kind: ForestItemKind,
  keys: readonly GameAssetKey[],
) {
  for (let x = -CANOPY_HALF + xOffset; x <= CANOPY_HALF; x += spacing) {
    for (let z = -CANOPY_HALF + zOffset; z <= CANOPY_HALF; z += spacing) {
      const jx = x + (random() - 0.5) * jitter;
      const jz = z + (random() - 0.5) * jitter;
      if (!zone(jx, jz) || !canPlaceForestItem(jx, jz)) continue;
      const shadow = kind === "tree" && castsCanopyShadow(jx, jz);
      pushItem(items, random, keys, jx, jz, y, scaleMin, scaleRange, kind, shadow);
    }
  }
}

/** Seeded jittered-grid canopy: dense green plains + outer forest, Fantasy pines and rocks. */
export function createCanopy(seed: number, lowQuality: boolean): CanopyItem[] {
  const random = mulberry32(seed);
  const items: CanopyItem[] = [];
  const y = SURFACE_Y - 0.03;

  const outerSpacing = lowQuality ? 2.9 : 2.4;
  const outerJitter = outerSpacing * 0.38;
  fillZone(items, random, outerSpacing, outerJitter, y, 0, 0, 0.82, 0.28, isOuterForestRing, "tree", CANOPY_TREES);
  fillZone(
    items,
    random,
    outerSpacing,
    outerJitter * 0.9,
    y,
    outerSpacing / 2,
    outerSpacing / 2,
    0.8,
    0.26,
    isOuterForestRing,
    "tree",
    CANOPY_TREES,
  );

  const plainSpacing = lowQuality ? 2.35 : 2.05;
  const plainJitter = plainSpacing * 0.4;
  fillZone(items, random, plainSpacing, plainJitter, y, 0, 0, 0.78, 0.26, isGreenPlain, "tree", CANOPY_TREES);
  fillZone(
    items,
    random,
    plainSpacing,
    plainJitter * 0.9,
    y,
    plainSpacing / 2,
    plainSpacing / 2,
    0.76,
    0.24,
    isGreenPlain,
    "tree",
    CANOPY_TREES,
  );

  const rockSpacing = lowQuality ? 6.5 : 5.5;
  const rockJitter = rockSpacing * 0.48;
  fillZone(items, random, rockSpacing, rockJitter, y, 0, 0, 0.85, 0.35, isOuterForestRing, "rock", FOREST_ROCKS);
  fillZone(items, random, rockSpacing * 1.1, rockJitter, y, 0, 0, 0.8, 0.32, isGreenPlain, "rock", FOREST_ROCKS);

  return items;
}

export function groupCanopyByKey(items: CanopyItem[]): Map<GameAssetKey, CanopyItem[]> {
  const groups = new Map<GameAssetKey, CanopyItem[]>();
  for (const item of items) {
    const bucket = groups.get(item.key) ?? [];
    bucket.push(item);
    groups.set(item.key, bucket);
  }
  return groups;
}

export { CANOPY_SEED };
