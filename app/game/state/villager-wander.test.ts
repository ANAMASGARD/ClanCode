import { describe, expect, test } from "bun:test";
import { GAME_ASSETS } from "@/app/game/assets/catalog";
import { DEFAULT_SEED_LAYOUT } from "@/app/game/state/clan-layout";
import { isInsidePlot } from "@/app/game/state/island";
import { mulberry32 } from "@/app/game/state/seeded-random";
import {
  createVillagers,
  isWalkableOnLayout,
  MAX_HOP,
  MIN_HOP,
  pickWanderTargetOnLayout,
  VILLAGER_COUNT,
  VILLAGER_MODEL_KEYS,
  VILLAGER_SEED,
  WANDER_HALF,
} from "@/app/game/state/villager-wander";

describe("villager models", () => {
  test("every villager model exists in the catalog", () => {
    expect(VILLAGER_MODEL_KEYS.length).toBeGreaterThan(0);
    for (const key of VILLAGER_MODEL_KEYS) {
      const definition = GAME_ASSETS[key];
      expect(definition).toBeDefined();
      expect(definition.kit).toBe("blockyCharacters");
      expect(definition.role).toBe("character");
    }
  });
});

describe("walkable area", () => {
  test("rejects points outside the roaming bounds", () => {
    expect(isWalkableOnLayout(DEFAULT_SEED_LAYOUT, WANDER_HALF + 1, 0)).toBe(false);
    expect(isWalkableOnLayout(DEFAULT_SEED_LAYOUT, 0, -WANDER_HALF - 1)).toBe(false);
  });

  test("roaming bounds stay inside the plot", () => {
    expect(isInsidePlot(WANDER_HALF, WANDER_HALF)).toBe(true);
  });

  test("rejects points inside a building footprint", () => {
    expect(isWalkableOnLayout(DEFAULT_SEED_LAYOUT, 0, 0)).toBe(false);
  });

  test("town hall centre is blocked but open ground exists", () => {
    expect(isWalkableOnLayout(DEFAULT_SEED_LAYOUT, 0, 0)).toBe(false);
    const random = mulberry32(7);
    let open = 0;
    for (let sample = 0; sample < 400; sample += 1) {
      const x = (random() * 2 - 1) * WANDER_HALF;
      const z = (random() * 2 - 1) * WANDER_HALF;
      if (isWalkableOnLayout(DEFAULT_SEED_LAYOUT, x, z)) open += 1;
    }
    expect(open).toBeGreaterThan(200);
  });
});

describe("wander targets", () => {
  test("returns walkable targets within hop range", () => {
    const random = mulberry32(11);
    const villagers = createVillagers(DEFAULT_SEED_LAYOUT, VILLAGER_SEED, VILLAGER_COUNT);
    for (const villager of villagers) {
      for (let step = 0; step < 40; step += 1) {
        const target = pickWanderTargetOnLayout(DEFAULT_SEED_LAYOUT, random, villager.x, villager.z);
        expect(isWalkableOnLayout(DEFAULT_SEED_LAYOUT, target.x, target.z)).toBe(true);
        const distance = Math.hypot(target.x - villager.x, target.z - villager.z);
        // A boxed-in villager keeps its current spot, which is already walkable.
        if (distance > 0) {
          expect(distance).toBeGreaterThanOrEqual(MIN_HOP - 0.001);
          expect(distance).toBeLessThanOrEqual(MAX_HOP + 0.001);
        }
      }
    }
  });
});

describe("villager spawns", () => {
  test("spawns the requested count on walkable ground", () => {
    const villagers = createVillagers(DEFAULT_SEED_LAYOUT, VILLAGER_SEED, VILLAGER_COUNT);
    expect(villagers.length).toBe(VILLAGER_COUNT);
    for (const villager of villagers) {
      expect(isWalkableOnLayout(DEFAULT_SEED_LAYOUT, villager.x, villager.z)).toBe(true);
      expect(isInsidePlot(villager.x, villager.z)).toBe(true);
      expect(villager.speed).toBeGreaterThan(0);
      expect(GAME_ASSETS[villager.assetKey]).toBeDefined();
    }
  });

  test("ids are unique and spawns are deterministic", () => {
    const first = createVillagers(DEFAULT_SEED_LAYOUT, VILLAGER_SEED, VILLAGER_COUNT);
    const second = createVillagers(DEFAULT_SEED_LAYOUT, VILLAGER_SEED, VILLAGER_COUNT);
    expect(first).toEqual(second);
    const ids = first.map((villager) => villager.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
