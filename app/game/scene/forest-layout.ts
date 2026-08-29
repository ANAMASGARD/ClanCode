import type { GameAssetKey } from "@/app/game/assets/catalog";

export type ForestItem = {
  key: GameAssetKey;
  position: readonly [number, number, number];
  rotation: number;
  scale: number;
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

const SMALL: GameAssetKey[] = ["nature.pineSmallA", "nature.pineSmallC", "nature.bush"];
const MEDIUM: GameAssetKey[] = ["nature.pineDefaultA", "nature.pineDefaultB", "nature.pineRoundA", "nature.pineRoundC"];
const TALL: GameAssetKey[] = ["nature.pineTallA", "nature.pineTallC"];

function chooseTree(random: () => number, depth: number): GameAssetKey {
  const band = depth < 0.28 ? SMALL : depth < 0.74 ? MEDIUM : TALL;
  return band[Math.floor(random() * band.length)];
}

export function createForest(seed: number, lowQuality: boolean): ForestItem[] {
  const random = mulberry32(seed);
  const items: ForestItem[] = [];
  const add = (position: readonly [number, number, number], depth: number, baseScale: number) => {
    items.push({
      key: chooseTree(random, depth),
      position,
      rotation: random() * Math.PI * 2,
      scale: baseScale + random() * 1.65,
    });
  };

  // The eastern band is the dominant silhouette and stays fixed across reloads.
  for (let index = 0; index < (lowQuality ? 42 : 68); index += 1) {
    const depth = random();
    add([18 + depth * 11 + (random() - 0.5) * 2.2, 0.92, -19.5 + random() * 39], depth, 2.7);
  }

  // Lighter north and north-west framing rounds the island while keeping the
  // south-west harbor and water approach open.
  for (let index = 0; index < (lowQuality ? 16 : 26); index += 1) {
    const depth = random();
    add([-20 + random() * 38, 0.92, -18.2 - depth * 5.1], depth, 2.35);
  }
  for (let index = 0; index < (lowQuality ? 8 : 14); index += 1) {
    const depth = random();
    add([-21.5 - depth * 4.2, 0.92, -17 + random() * 17], depth, 2.3);
  }

  return items.sort((a, b) => a.position[2] - b.position[2]);
}
