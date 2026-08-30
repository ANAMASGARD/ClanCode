import { describe, expect, test } from "bun:test";
import { CATALOG_ENTRIES, GAME_ASSETS } from "@/app/game/assets/catalog";
import { DECORATIVE_PLACEMENTS } from "@/app/game/state/decorative-layout";
import { ROAD_TILES } from "@/app/game/state/roads";
import { SEMANTIC_PLACEMENTS } from "@/app/game/state/semantic-layout";
import { BEACH_WALL } from "@/app/game/state/walls";

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
    expect(CATALOG_ENTRIES.length).toBeLessThanOrEqual(360);
  });

  test("includes round canopy trees and shoreline rocks", () => {
    expect(GAME_ASSETS["village.tree"]).toBeDefined();
    expect(GAME_ASSETS["village.treeHigh"]).toBeDefined();
    expect(GAME_ASSETS["village.treeFat"]).toBeUndefined();
    expect(GAME_ASSETS["nature.treeFat"]).toBeDefined();
    expect(GAME_ASSETS["nature.treeDetailed"]).toBeDefined();
    expect(GAME_ASSETS["nature.treeSimple"]).toBeDefined();
    expect(GAME_ASSETS["village.rockLarge"]).toBeDefined();
    expect(GAME_ASSETS["nature.rockTallA"]).toBeDefined();
    expect(GAME_ASSETS["nature.stoneLargeA"]).toBeDefined();
    expect(GAME_ASSETS["townHall.wallArch"]).toBeDefined();
    expect(GAME_ASSETS["townHall.roofPoint"]).toBeDefined();
    expect(GAME_ASSETS["townHall.wallRounded"]).toBeDefined();
    expect(GAME_ASSETS["castle.wall"]).toBeDefined();
    expect(GAME_ASSETS["castle.wallCornerHalfTower"]).toBeDefined();
    expect(GAME_ASSETS["castle.towerSlantRoof"]).toBeDefined();
    expect(GAME_ASSETS["castle.bridgeDraw"]).toBeDefined();
    expect(GAME_ASSETS["castle.siegeTower"]).toBeDefined();
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

  test("beach rampart references catalog assets", () => {
    expect(BEACH_WALL.length).toBeGreaterThan(0);
    for (const segment of BEACH_WALL) {
      expect(GAME_ASSETS[segment.assetKey]).toBeDefined();
    }
  });

  test("town hall remains central", () => {
    const townHall = SEMANTIC_PLACEMENTS.find((p) => p.id === "town-hall");
    expect(townHall?.tileX).toBe(0);
    expect(townHall?.tileZ).toBe(0);
  });

  test("village buildings sit outside the keep curtains", () => {
    for (const placement of SEMANTIC_PLACEMENTS) {
      if (placement.id === "town-hall" || placement.id === "approval-gate") continue;
      expect(Math.max(Math.abs(placement.tileX), Math.abs(placement.tileZ))).toBeGreaterThanOrEqual(8);
    }
    for (const placement of DECORATIVE_PLACEMENTS) {
      expect(Math.max(Math.abs(placement.tileX), Math.abs(placement.tileZ))).toBeGreaterThanOrEqual(8);
    }
  });
});
