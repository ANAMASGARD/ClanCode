import { describe, expect, test } from "bun:test";
import { CATALOG_ENTRIES, GAME_ASSETS } from "@/app/game/assets/catalog";
import { DECORATIVE_PLACEMENTS } from "@/app/game/state/decorative-layout";
import { ROAD_TILES } from "@/app/game/state/roads";
import { SEMANTIC_PLACEMENTS } from "@/app/game/state/semantic-layout";
import { WALL_GATE, WALL_RING } from "@/app/game/state/walls";

describe("game asset catalog", () => {
  test("has unique keys and finite metrics", () => {
    const keys = CATALOG_ENTRIES.map((entry) => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const entry of CATALOG_ENTRIES) {
      expect(Number.isFinite(entry.uniformScale)).toBe(true);
      expect(entry.uniformScale).toBeGreaterThan(0);
      expect(entry.pivotOffset.every(Number.isFinite)).toBe(true);
      if (entry.footprint) {
        expect(entry.footprint[0]).toBeGreaterThan(0);
        expect(entry.footprint[1]).toBeGreaterThan(0);
      }
    }
  });

  test("curates a broad but bounded asset set", () => {
    expect(CATALOG_ENTRIES.length).toBeGreaterThanOrEqual(170);
    expect(CATALOG_ENTRIES.length).toBeLessThanOrEqual(250);
  });
});

describe("layout data", () => {
  test("semantic and decorative ids are unique", () => {
    const semanticIds = SEMANTIC_PLACEMENTS.map((p) => p.id);
    const decorativeIds = DECORATIVE_PLACEMENTS.map((p) => p.id);
    expect(new Set(semanticIds).size).toBe(semanticIds.length);
    expect(new Set(decorativeIds).size).toBe(decorativeIds.length);
  });

  test("roads reference catalog assets", () => {
    for (const road of ROAD_TILES) {
      expect(GAME_ASSETS[road.assetKey]).toBeDefined();
    }
  });

  test("wall ring references catalog assets and includes a gate", () => {
    for (const segment of WALL_RING) {
      expect(GAME_ASSETS[segment.assetKey]).toBeDefined();
    }
    expect(GAME_ASSETS[WALL_GATE.assetKey]).toBeDefined();
  });

  test("town hall remains central", () => {
    const townHall = SEMANTIC_PLACEMENTS.find((p) => p.id === "town-hall");
    expect(townHall?.tileX).toBe(0);
    expect(townHall?.tileZ).toBe(0);
  });
});
