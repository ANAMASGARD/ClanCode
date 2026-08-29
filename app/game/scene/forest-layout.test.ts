import { describe, expect, test } from "bun:test";
import { createForest } from "./forest-layout";

describe("seeded forest layout", () => {
  test("is deterministic for the same island seed", () => {
    expect(createForest(0xc1a7c0de, false)).toEqual(createForest(0xc1a7c0de, false));
  });

  test("changes when the seed changes and preserves the open harbor", () => {
    const first = createForest(0xc1a7c0de, false);
    const second = createForest(0xc1a7c0df, false);
    expect(first).not.toEqual(second);
    expect(first.some((item) => item.position[0] < -20 && item.position[2] > 4)).toBe(false);
  });
});
