import { describe, expect, test } from "bun:test";
import {
  CANOPY_SEED,
  isCanopyZone,
  isInsidePlot,
  isOnPlotInterior,
  PLOT_EXCLUSION_HALF,
  WATER_EDGE_Z,
} from "@/app/game/state/island";
import { createCanopy } from "./forest-layout";

function treesOf(items: ReturnType<typeof createCanopy>) {
  return items.filter((item) => item.kind === "tree");
}

function rocksOf(items: ReturnType<typeof createCanopy>) {
  return items.filter((item) => item.kind === "rock");
}

describe("seeded canopy layout", () => {
  test("is deterministic for the same seed", () => {
    expect(createCanopy(CANOPY_SEED, false)).toEqual(createCanopy(CANOPY_SEED, false));
  });

  test("changes when the seed changes", () => {
    expect(createCanopy(CANOPY_SEED, false)).not.toEqual(createCanopy(CANOPY_SEED + 1, false));
  });

  test("keeps forest trees off the clan plot and off sand/water", () => {
    const canopy = createCanopy(CANOPY_SEED, false);
    const trees = treesOf(canopy);
    expect(trees.length).toBeGreaterThan(1200);
    expect(trees.length).toBeLessThan(4500);
    expect(trees.filter((item) => isInsidePlot(item.position[0], item.position[2])).length).toBe(0);
    for (const tree of trees) {
      expect(isCanopyZone(tree.position[0], tree.position[2])).toBe(true);
      expect(isOnPlotInterior(tree.position[0], tree.position[2])).toBe(false);
      expect(tree.position[2]).toBeLessThanOrEqual(WATER_EDGE_Z);
    }
  });

  test("uses Fantasy Town Kit pines in the canopy", () => {
    const canopy = createCanopy(CANOPY_SEED, false);
    const fantasyPines = treesOf(canopy).filter((item) => item.key.startsWith("village.tree"));
    expect(fantasyPines.length).toBeGreaterThan(200);
  });

  test("scatters Fantasy kit rocks through the forest, not on the plot", () => {
    const canopy = createCanopy(CANOPY_SEED, false);
    const rocks = rocksOf(canopy);
    expect(rocks.length).toBeGreaterThan(80);
    expect(rocks.length).toBeLessThan(500);
    expect(rocks.every((rock) => rock.key.startsWith("village.rock"))).toBe(true);
    for (const rock of rocks) {
      expect(isOnPlotInterior(rock.position[0], rock.position[2])).toBe(false);
      expect(isCanopyZone(rock.position[0], rock.position[2])).toBe(true);
    }
  });

  test("fills the green grass around the plot", () => {
    const canopy = createCanopy(CANOPY_SEED, false);
    const plainTrees = treesOf(canopy).filter((item) => {
      const distance = Math.max(Math.abs(item.position[0]), Math.abs(item.position[2]));
      return distance >= PLOT_EXCLUSION_HALF && distance <= PLOT_EXCLUSION_HALF + 16;
    });
    expect(plainTrees.length).toBeGreaterThan(350);
  });

  test("fills north, east, and south bands", () => {
    const canopy = createCanopy(CANOPY_SEED, false);
    const trees = treesOf(canopy);
    expect(trees.some((item) => item.position[2] < -30)).toBe(true);
    expect(trees.some((item) => item.position[0] > 30)).toBe(true);
    expect(trees.some((item) => item.position[2] > 15)).toBe(true);
  });

  test("leaves the lower-left shore wedge open", () => {
    const canopy = createCanopy(CANOPY_SEED, false);
    expect(canopy.some((item) => item.position[0] < -10 && item.position[2] > 18)).toBe(false);
  });

  test("leaves the south beach front clear of trees", () => {
    const canopy = createCanopy(CANOPY_SEED, false);
    expect(treesOf(canopy).some((item) => item.position[0] < 20 && item.position[2] > 26 && item.position[2] < 30)).toBe(
      false,
    );
  });

  test("low quality keeps a dense but reduced canopy", () => {
    const canopy = createCanopy(CANOPY_SEED, true);
    const trees = treesOf(canopy);
    expect(trees.length).toBeGreaterThan(900);
    expect(trees.length).toBeLessThan(3200);
    expect(rocksOf(canopy).length).toBeGreaterThan(60);
  });
});
