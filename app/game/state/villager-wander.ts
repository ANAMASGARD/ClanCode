import type { GameAssetKey } from "@/app/game/assets/catalog";
import { DECORATIVE_PLACEMENTS } from "./decorative-layout";
import { PLOT_HALF } from "./island";
import { mulberry32 } from "./seeded-random";
import { SEMANTIC_PLACEMENTS } from "./semantic-layout";
import { TILE } from "./tile";

/** Villagers roam the whole plot, kept a little inside the dirt edge. */
export const WANDER_HALF = PLOT_HALF - 2;

/** Longest single hop, so paths rarely cut across a building. */
export const MAX_HOP = 10;
export const MIN_HOP = 3;

const TOWN_HALL_CLEARANCE = 4.2;
const BUILDING_CLEARANCE = 2.4;

export type Blocker = {
  x: number;
  z: number;
  radius: number;
};

function buildingBlockers(): Blocker[] {
  const blockers: Blocker[] = [];
  for (const placement of SEMANTIC_PLACEMENTS) {
    // The gate sits in the beach rampart, outside the roaming area.
    if (placement.id === "approval-gate") continue;
    blockers.push({
      x: placement.tileX * TILE,
      z: placement.tileZ * TILE,
      radius: placement.id === "town-hall" ? TOWN_HALL_CLEARANCE : BUILDING_CLEARANCE,
    });
  }
  for (const placement of DECORATIVE_PLACEMENTS) {
    blockers.push({
      x: placement.tileX * TILE,
      z: placement.tileZ * TILE,
      radius: BUILDING_CLEARANCE,
    });
  }
  return blockers;
}

export const BUILDING_BLOCKERS: readonly Blocker[] = buildingBlockers();

export function isWalkable(x: number, z: number): boolean {
  if (Math.abs(x) > WANDER_HALF || Math.abs(z) > WANDER_HALF) return false;
  for (const blocker of BUILDING_BLOCKERS) {
    if (Math.hypot(x - blocker.x, z - blocker.z) < blocker.radius) return false;
  }
  return true;
}

export type WanderTarget = {
  x: number;
  z: number;
};

/**
 * Random nearby destination anywhere on the plot. Falls back to the current
 * spot when boxed in, so callers never receive a blocked target.
 */
export function pickWanderTarget(
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
    if (isWalkable(x, z)) return { x, z };
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
export function createVillagers(seed: number, count: number): VillagerSeed[] {
  const random = mulberry32(seed);
  const villagers: VillagerSeed[] = [];

  for (let index = 0; index < count; index += 1) {
    let x = 0;
    let z = 0;
    let placed = false;
    for (let attempt = 0; attempt < 200 && !placed; attempt += 1) {
      x = (random() * 2 - 1) * WANDER_HALF;
      z = (random() * 2 - 1) * WANDER_HALF;
      placed = isWalkable(x, z);
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
