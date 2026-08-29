import { describe, expect, test } from "bun:test";

import {
  ISLAND_WIDTH,
  islandRowsAreAligned,
  islandUsesColor,
  maxIslandWidth,
} from "./clan-art.ts";
import {
  controlPlaneColor,
  controlPlaneLabel,
  pickTitleFont,
  shouldShowIsland,
  theme,
  truncateMiddle,
} from "./theme.ts";

describe("theme helpers", () => {
  test("pickTitleFont prefers block on wide terminals", () => {
    expect(pickTitleFont(100)).toBe("block");
    expect(pickTitleFont(72)).toBe("block");
    expect(pickTitleFont(71)).toBe("tiny");
  });

  test("shouldShowIsland respects terminal height", () => {
    expect(shouldShowIsland(40)).toBe(true);
    expect(shouldShowIsland(30)).toBe(true);
    expect(shouldShowIsland(29)).toBe(false);
  });

  test("controlPlaneColor maps connection states", () => {
    expect(controlPlaneColor("connected")).toBe(theme.success);
    expect(controlPlaneColor("connecting")).toBe(theme.warning);
    expect(controlPlaneColor("offline")).toBe(theme.muted);
    expect(controlPlaneLabel("connected")).toBe("connected");
    expect(controlPlaneLabel("error")).toBe("offline");
  });

  test("truncateMiddle shortens long paths", () => {
    expect(truncateMiddle("/home/linux/LFX/clan-code", 12)).toBe("/home/…-code");
  });
});

describe("clan island art", () => {
  test("every row is padded to the same width", () => {
    expect(islandRowsAreAligned()).toBe(true);
    expect(maxIslandWidth()).toBe(ISLAND_WIDTH);
  });

  test("island fits inside a standard terminal", () => {
    expect(ISLAND_WIDTH).toBeLessThanOrEqual(72);
  });

  test("island paints water, grass, sand, and sun", () => {
    expect(islandUsesColor(theme.water)).toBe(true);
    expect(islandUsesColor(theme.grass)).toBe(true);
    expect(islandUsesColor(theme.sand)).toBe(true);
    expect(islandUsesColor(theme.gold)).toBe(true);
  });
});
