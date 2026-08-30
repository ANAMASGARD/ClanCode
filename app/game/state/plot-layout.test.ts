import { describe, expect, test } from "bun:test";
import { GAME_ASSETS } from "@/app/game/assets/catalog";
import { DEFAULT_SEED_LAYOUT, MAX_LAYOUT_PLACEMENTS } from "@/app/game/state/clan-layout";
import { validateLayout } from "@/app/game/state/layout-editor";
import {
  BEACH_GATE_HALF_X,
  BEACH_WALL_Z,
  isInsidePlot,
  isInsideRim,
  isInSandBand,
  WATER_EDGE_Z,
} from "@/app/game/state/island";
import { ROAD_TILES } from "@/app/game/state/roads";
import { SEMANTIC_PLACEMENTS } from "@/app/game/state/semantic-layout";
import { tileToWorld } from "@/app/game/state/tile";
import { BEACH_WALL, BEACH_WALL_TOWERS } from "@/app/game/state/walls";

function tileWorld(tileX: number, tileZ: number): readonly [number, number] {
  const [x, , z] = tileToWorld(tileX, tileZ);
  return [x, z] as const;
}

function isOffSand(z: number): boolean {
  return !isInSandBand(z) && z <= WATER_EDGE_Z;
}

describe("beach rampart", () => {
  test("is the only wall and runs along the beach line", () => {
    expect(BEACH_WALL.length).toBeGreaterThan(10);
    for (const segment of BEACH_WALL) {
      expect(segment.z).toBe(BEACH_WALL_Z);
      expect(GAME_ASSETS[segment.assetKey]).toBeDefined();
      expect(isInsideRim(segment.x, segment.z)).toBe(true);
      expect(isOffSand(segment.z)).toBe(true);
    }
  });

  test("has unique ids", () => {
    const ids = BEACH_WALL.map((segment) => segment.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("leaves a gate opening at the centre", () => {
    const blocked = BEACH_WALL.some((segment) => Math.abs(segment.x) <= BEACH_GATE_HALF_X);
    expect(blocked).toBe(false);
    for (const tower of BEACH_WALL_TOWERS) {
      expect(GAME_ASSETS[tower.assetKey]).toBeDefined();
      expect(isInsideRim(tower.x, tower.z)).toBe(true);
    }
  });

  test("does not wall the village interior", () => {
    const interior = BEACH_WALL.filter((segment) => isInsidePlot(segment.x, segment.z));
    expect(interior.length).toBe(0);
  });
});

describe("village building layout", () => {
  test("semantic buildings sit on the plot, except the gate in the rampart", () => {
    for (const placement of SEMANTIC_PLACEMENTS) {
      const [x, z] = tileWorld(placement.tileX, placement.tileZ);
      expect(isOffSand(z)).toBe(true);
      if (placement.id === "approval-gate") {
        expect(z).toBe(BEACH_WALL_Z);
        continue;
      }
      expect(isInsidePlot(x, z)).toBe(true);
    }
  });

  test("default seed validates for the editor", () => {
    expect(validateLayout(DEFAULT_SEED_LAYOUT).valid).toBe(true);
    expect(DEFAULT_SEED_LAYOUT.length).toBeLessThanOrEqual(MAX_LAYOUT_PLACEMENTS);
  });

  test("keeps decorative accents light and inside the plot", () => {
    const decorative = DEFAULT_SEED_LAYOUT.filter((p) => p.kind === "decorative");
    expect(decorative.length).toBeLessThanOrEqual(22);
    for (const placement of decorative) {
      const [x, z] = tileWorld(placement.tileX, placement.tileZ);
      expect(isInsidePlot(x, z)).toBe(true);
      expect(isOffSand(z)).toBe(true);
    }
  });

  test("no two buildings share a lattice slot", () => {
    const slots = DEFAULT_SEED_LAYOUT.map((placement) => `${placement.tileX}:${placement.tileZ}`);
    expect(new Set(slots).size).toBe(slots.length);
  });

  test("avenue runs from the plaza to the gate", () => {
    for (const road of ROAD_TILES) {
      expect(GAME_ASSETS[road.assetKey]).toBeDefined();
    }
    const avenueZ = ROAD_TILES.filter((road) => road.tileX === 0).map((road) => road.tileZ);
    expect(Math.max(...avenueZ)).toBe(BEACH_WALL_Z / 2 - 1);
  });
});
