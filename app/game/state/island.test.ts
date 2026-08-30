import { describe, expect, test } from "bun:test";
import {
  DIRT_EDGE_SIDE,
  LAND_EXTENT,
  PLOT_SIDE,
  RIM_SIDE,
  SAND_INNER_Z,
  SCENE_SPAN,
  WATER_EDGE_Z,
  landFloorGeometry,
} from "@/app/game/state/island";

describe("island constants", () => {
  test("plot sits inside rim and dirt edge sits between them", () => {
    expect(PLOT_SIDE).toBeLessThan(DIRT_EDGE_SIDE);
    expect(DIRT_EDGE_SIDE).toBeLessThan(RIM_SIDE);
    expect(RIM_SIDE).toBeLessThan(LAND_EXTENT);
  });

  test("sand band sits between grass and water", () => {
    expect(SAND_INNER_Z).toBeLessThan(WATER_EDGE_Z);
    expect(SAND_INNER_Z).toBeGreaterThan(RIM_SIDE / 2 - 2);
  });

  test("water edge is beyond the land rim on the shore axis", () => {
    expect(WATER_EDGE_Z).toBeGreaterThan(RIM_SIDE / 2);
  });

  test("land floor terminates exactly at the shoreline", () => {
    const floor = landFloorGeometry();
    expect(floor.width).toBe(SCENE_SPAN);
    expect(floor.centerZ + floor.depth / 2).toBeCloseTo(WATER_EDGE_Z, 5);
    expect(floor.centerZ - floor.depth / 2).toBeCloseTo(-SCENE_SPAN / 2, 5);
  });
});
