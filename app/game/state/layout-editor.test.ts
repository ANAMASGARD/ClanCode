import { describe, expect, test } from "bun:test";
import { DEFAULT_SEED_LAYOUT } from "@/app/game/state/clan-layout";
import type { DecorativePrefabId } from "@/app/game/state/decorative-layout";
import {
  addPlacement,
  canPlaceAt,
  createDecorativePlacement,
  mergeSavedLayout,
  movePlacement,
  removePlacement,
  restorePlacement,
  validateLayout,
} from "@/app/game/state/layout-editor";

describe("layout editor", () => {
  test("validates the default seed", () => {
    expect(validateLayout(DEFAULT_SEED_LAYOUT).valid).toBe(true);
  });

  test("blocks road tiles", () => {
    expect(canPlaceAt(DEFAULT_SEED_LAYOUT, 0, 0).valid).toBe(false);
  });

  test("adds and removes decorative placements", () => {
    const extra = createDecorativePlacement("Barracks", 9, 3, "test-barracks");
    const added = addPlacement(DEFAULT_SEED_LAYOUT, extra);
    expect(added).not.toBeNull();
    const removed = removePlacement(added!, "test-barracks");
    expect(removed?.some((p) => p.id === "test-barracks")).toBe(false);
  });

  test("can remove optional semantic buildings", () => {
    const removed = removePlacement(DEFAULT_SEED_LAYOUT, "session-lodge");
    expect(removed?.some((p) => p.kind === "semantic" && p.id === "session-lodge")).toBe(false);
  });

  test("cannot remove protected semantic buildings", () => {
    expect(removePlacement(DEFAULT_SEED_LAYOUT, "town-hall")).toBeNull();
    expect(removePlacement(DEFAULT_SEED_LAYOUT, "builder-workshop")).toBeNull();
  });

  test("restorePlacement returns a building to its saved tile", () => {
    const removed = removePlacement(DEFAULT_SEED_LAYOUT, "session-lodge");
    expect(removed).not.toBeNull();
    const lodge = DEFAULT_SEED_LAYOUT.find((p) => p.kind === "semantic" && p.id === "session-lodge");
    expect(lodge).toBeDefined();
    const restored = restorePlacement(removed!, lodge!);
    expect(restored?.some((p) => p.kind === "semantic" && p.id === "session-lodge")).toBe(true);
    const back = restored?.find((p) => p.kind === "semantic" && p.id === "session-lodge");
    expect(back?.tileX).toBe(lodge?.tileX);
    expect(back?.tileZ).toBe(lodge?.tileZ);
  });

  test("movePlacement relocates a movable building onto an empty tile", () => {
    const moved = movePlacement(DEFAULT_SEED_LAYOUT, "session-lodge", -9, -8);
    expect(moved).not.toBeNull();
    const lodge = moved?.find((p) => p.kind === "semantic" && p.id === "session-lodge");
    expect(lodge?.tileX).toBe(-9);
    expect(lodge?.tileZ).toBe(-8);
  });

  test("movePlacement rejects an occupied tile", () => {
    expect(movePlacement(DEFAULT_SEED_LAYOUT, "session-lodge", 0, 0)).toBeNull();
  });

  test("movePlacement keeps the approval gate fixed", () => {
    expect(movePlacement(DEFAULT_SEED_LAYOUT, "approval-gate", 3, 3)).toBeNull();
  });

  test("default seed includes clan castle and standing windmills", () => {
    expect(DEFAULT_SEED_LAYOUT.some((p) => p.kind === "semantic" && p.id === "town-hall")).toBe(true);
    expect(DEFAULT_SEED_LAYOUT.some((p) => p.kind === "semantic" && p.id === "windmill")).toBe(true);
    expect(DEFAULT_SEED_LAYOUT.some((p) => p.kind === "decorative" && p.prefab === "SmallWindmill")).toBe(true);
  });

  test("mergeSavedLayout keeps valid saved layouts", () => {
    const moved = movePlacement(DEFAULT_SEED_LAYOUT, "session-lodge", -9, -8);
    expect(moved).not.toBeNull();
    const merged = mergeSavedLayout(moved!);
    expect(merged.some((p) => p.kind === "semantic" && p.id === "session-lodge" && p.tileX === -9)).toBe(true);
  });

  test("rejects unknown decorative prefabs", () => {
    const invalid = DEFAULT_SEED_LAYOUT.map((placement) =>
      placement.kind === "decorative"
        ? { ...placement, prefab: "NotARealPrefab" as DecorativePrefabId }
        : placement,
    );
    expect(validateLayout(invalid).valid).toBe(false);
  });

  test("mergeSavedLayout replaces layouts crowded against the keep", () => {
    const packed = DEFAULT_SEED_LAYOUT.map((placement) =>
      placement.kind === "semantic" && placement.id === "session-lodge"
        ? { ...placement, tileX: 3, tileZ: 0 }
        : placement,
    );
    const merged = mergeSavedLayout(packed);
    const lodge = merged.find((p) => p.kind === "semantic" && p.id === "session-lodge");
    expect(lodge?.tileX).toBe(-8);
    expect(lodge?.tileZ).toBe(0);
  });
});
