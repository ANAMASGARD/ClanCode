import type { GameAssetKey } from "@/app/game/assets/catalog";

export type ForestItem = {
  key: GameAssetKey;
  position: readonly [number, number, number];
  rotation: number;
  scale: number;
  castsShadow: boolean;
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = value + Math.imul(value ^ (value >>> 7), 61 | value) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const SMALL: GameAssetKey[] = [
  "nature.pineSmallA",
  "nature.pineSmallB",
  "nature.pineSmallC",
  "nature.bush",
  "nature.bushSmall",
];
const MEDIUM: GameAssetKey[] = [
  "nature.pineDefaultA",
  "nature.pineDefaultB",
  "nature.pineRoundA",
  "nature.pineRoundB",
  "nature.pineRoundC",
  "nature.oak",
];
const TALL: GameAssetKey[] = [
  "nature.pineTallA",
  "nature.pineTallB",
  "nature.pineTallC",
  "nature.pineTallD",
];

function chooseTree(random: () => number, depth: number): GameAssetKey {
  const band = depth < 0.32 ? SMALL : depth < 0.72 ? MEDIUM : TALL;
  return band[Math.floor(random() * band.length)];
}

type BandConfig = {
  count: number;
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
  depthBias: number;
};

function fillBand(
  random: () => number,
  config: BandConfig,
  items: ForestItem[],
  y: number,
) {
  for (let index = 0; index < config.count; index += 1) {
    const depth = config.depthBias + random() * (1 - config.depthBias);
    const x = config.xMin + random() * (config.xMax - config.xMin);
    const z = config.zMin + random() * (config.zMax - config.zMin);
    items.push({
      key: chooseTree(random, depth),
      position: [x, y, z],
      rotation: random() * Math.PI * 2,
      scale: 0.85 + random() * 0.45,
      castsShadow: depth < 0.55,
    });
  }
}

/** Deterministic three-sided forest: north, east, south bands; west beach stays open. */
export function createForest(seed: number, lowQuality: boolean): ForestItem[] {
  const random = mulberry32(seed);
  const items: ForestItem[] = [];
  const y = 0.92;

  fillBand(random, {
    count: lowQuality ? 28 : 48,
    xMin: -24,
    xMax: 24,
    zMin: -24,
    zMax: -16,
    depthBias: 0.45,
  }, items, y);

  fillBand(random, {
    count: lowQuality ? 36 : 58,
    xMin: 18,
    xMax: 30,
    zMin: -22,
    zMax: 22,
    depthBias: 0.35,
  }, items, y);

  fillBand(random, {
    count: lowQuality ? 26 : 42,
    xMin: -22,
    xMax: 22,
    zMin: 16,
    zMax: 24,
    depthBias: 0.4,
  }, items, y);

  // Forest floor dressing
  for (let index = 0; index < (lowQuality ? 18 : 32); index += 1) {
    const side = index % 3;
    const x = side === 1 ? 20 + random() * 8 : -20 + random() * 40;
    const z = side === 0 ? -20 - random() * 4 : side === 2 ? 18 + random() * 4 : -18 + random() * 36;
    const floorKeys: GameAssetKey[] = [
      "nature.mushrooms",
      "nature.log",
      "nature.stump",
      "nature.flowerPurple",
      "nature.flowerRed",
      "nature.rockSmall",
    ];
    items.push({
      key: floorKeys[index % floorKeys.length],
      position: [x, y - 0.02, z],
      rotation: random() * Math.PI * 2,
      scale: 0.75 + random() * 0.35,
      castsShadow: false,
    });
  }

  return items.sort((a, b) => a.position[2] - b.position[2]);
}

export function groupForestByKey(items: ForestItem[]): Map<GameAssetKey, ForestItem[]> {
  const groups = new Map<GameAssetKey, ForestItem[]>();
  for (const item of items) {
    const bucket = groups.get(item.key) ?? [];
    bucket.push(item);
    groups.set(item.key, bucket);
  }
  return groups;
}
