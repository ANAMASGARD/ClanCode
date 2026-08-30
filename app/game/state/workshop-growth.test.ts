import { describe, expect, test } from "bun:test";
import { modulesForStoreys, workshopFootprint } from "./workshop-growth";

describe("workshop growth", () => {
  test("keeps a 4x4 footprint and grows modules with storeys", () => {
    expect(workshopFootprint()).toEqual([4, 4]);
    const one = modulesForStoreys(1);
    const four = modulesForStoreys(4);
    expect(four.length).toBeGreaterThan(one.length);
    for (const entry of four) {
      expect(Math.abs(entry.position[0])).toBeLessThanOrEqual(2);
      expect(Math.abs(entry.position[2])).toBeLessThanOrEqual(2);
    }
  });

  test("uses modular building assets", () => {
    const modules = modulesForStoreys(1);
    expect(modules.every((entry) => entry.assetKey.startsWith("modular."))).toBe(true);
  });

  test("each extra storey raises the roof", () => {
    const roofY = (storeys: 1 | 2 | 3 | 4) =>
      modulesForStoreys(storeys)
        .filter((entry) => entry.assetKey.startsWith("modular.roof") || entry.assetKey === "modular.sampleTower")
        .map((entry) => entry.position[1])
        .sort((a, b) => a - b)
        .at(-1);
    expect(roofY(1)).toBe(1);
    expect(roofY(2)).toBe(2);
    expect(roofY(3)).toBeGreaterThanOrEqual(3);
    expect(roofY(3)).toBeLessThan(3.2);
    expect(roofY(4)).toBeGreaterThanOrEqual(4);
  });
});
