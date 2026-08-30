import type { GameAssetKey } from "@/app/game/assets/catalog";
import type { ClanPlacement } from "./clan-layout";
import { PLOT_HALF } from "./island";
import { mulberry32 } from "./seeded-random";
import { TILE } from "./tile";

/** Villagers roam the whole plot, kept a little inside the dirt edge. */
export const WANDER_HALF = PLOT_HALF - 2;

/** Longest single hop, so paths rarely cut across a building. */
export const MAX_HOP = 10;
export const MIN_HOP = 3;

const TOWN_HALL_CLEARANCE = 8.8;
const BUILDING_CLEARANCE = 3.0;

export type Blocker = {
  x: number;
  z: number;
  radius: number;
};

export function buildBlockers(layout: readonly ClanPlacement[]): Blocker[] {
  const blockers: Blocker[] = [];
  for (const placement of layout) {
    if (placement.kind === "semantic" && placement.id === "approval-gate") continue;
    blockers.push({
      x: placement.tileX * TILE,
      z: placement.tileZ * TILE,
      radius:
        placement.kind === "semantic" && placement.id === "town-hall"
          ? TOWN_HALL_CLEARANCE
          : BUILDING_CLEARANCE,
    });
  }
  return blockers;
}

export function isWalkableOnLayout(
  layout: readonly ClanPlacement[],
  x: number,
  z: number,
): boolean {
  if (Math.abs(x) > WANDER_HALF || Math.abs(z) > WANDER_HALF) return false;
  for (const blocker of buildBlockers(layout)) {
    if (Math.hypot(x - blocker.x, z - blocker.z) < blocker.radius) return false;
  }
  return true;
}

export type WanderTarget = {
  x: number;
  z: number;
};

export function pickWanderTargetOnLayout(
  layout: readonly ClanPlacement[],
  random: () => number,
  fromX: number,
  fromZ: number,
  attempts = 24,
): WanderTarget {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const angle = random() * Math.PI * 2;
    const distance = MIN_HOP + random() * (MAX_HOP - MIN_HOP);
    const x = fromX + Math.cos(angle) * distance;
    const z = fromZ + Math.sin(angle) * distance;
    if (isWalkableOnLayout(layout, x, z)) return { x, z };
  }
  return { x: fromX, z: fromZ };
}

/** Character models used for villagers, spread across the Kenney set. */
export const VILLAGER_MODEL_KEYS = [
  "villager.a",
  "villager.c",
  "villager.d",
  "villager.f",
  "villager.h",
  "villager.i",
  "villager.k",
  "villager.m",
  "villager.n",
  "villager.p",
] as const satisfies readonly GameAssetKey[];

export const VILLAGER_SEED = 0x5eed1e;
export const VILLAGER_COUNT = 10;

export type VillagerSeed = {
  id: string;
  assetKey: GameAssetKey;
  x: number;
  z: number;
  speed: number;
  seed: number;
};

/** Deterministic spawn points and speeds; wandering itself is random per frame. */
export function createVillagers(
  layout: readonly ClanPlacement[],
  seed: number,
  count: number,
): VillagerSeed[] {
  const random = mulberry32(seed);
  const villagers: VillagerSeed[] = [];

  for (let index = 0; index < count; index += 1) {
    let x = 0;
    let z = 0;
    let placed = false;
    for (let attempt = 0; attempt < 200 && !placed; attempt += 1) {
      x = (random() * 2 - 1) * WANDER_HALF;
      z = (random() * 2 - 1) * WANDER_HALF;
      placed = isWalkableOnLayout(layout, x, z);
    }
    if (!placed) continue;

    villagers.push({
      id: `villager-${index}`,
      assetKey: VILLAGER_MODEL_KEYS[index % VILLAGER_MODEL_KEYS.length],
      x,
      z,
      speed: 1.1 + random() * 1.1,
      seed: Math.floor(random() * 0xffffff) + index * 7919,
    });
  }

  return villagers;
}

/** @deprecated use buildBlockers(layout) */
export const BUILDING_BLOCKERS = buildBlockers([]);

/** @deprecated use isWalkableOnLayout */
export function isWalkable(x: number, z: number): boolean {
  return isWalkableOnLayout([], x, z);
}

/** @deprecated use pickWanderTargetOnLayout */
export function pickWanderTarget(
  random: () => number,
  fromX: number,
  fromZ: number,
  attempts = 24,
): WanderTarget {
  return pickWanderTargetOnLayout([], random, fromX, fromZ, attempts);
}
