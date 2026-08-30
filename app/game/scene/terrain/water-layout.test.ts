import { describe, expect, test } from "bun:test";
import { SCENE_SPAN, SEA_DEPTH, WATER_EDGE_Z, landFloorGeometry } from "@/app/game/state/island";
import { WATER_TILE_SPAN, createWaterField, waterBackingGeometry } from "./water-layout";

describe("water layout", () => {
  test("uses only Kenney riverOpen tiles beyond the shore line", () => {
    const field = createWaterField(false);
    expect(field.length).toBeGreaterThan(300);
    expect(field.every((tile) => tile.position[2] > WATER_EDGE_Z)).toBe(true);
  });

  test("spans the full scene width and reaches past the frame in z", () => {
    const field = createWaterField(false);
    const xs = field.map((tile) => tile.position[0]);
    const zs = field.map((tile) => tile.position[2]);
    expect(Math.min(...xs)).toBeLessThanOrEqual(-SCENE_SPAN / 2 + 3);
    expect(Math.max(...xs)).toBeGreaterThanOrEqual(SCENE_SPAN / 2 - 3);
    expect(Math.max(...zs)).toBeGreaterThanOrEqual(WATER_EDGE_Z + SEA_DEPTH - WATER_TILE_SPAN);
  });

  test("reduces sea depth on low quality", () => {
    const hq = waterBackingGeometry(false);
    const lq = waterBackingGeometry(true);
    expect(lq.depth).toBeLessThan(hq.depth);
  });
});
