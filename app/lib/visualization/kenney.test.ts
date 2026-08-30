import { describe, expect, test } from "bun:test";
import { kenneyGlbUrl } from "./kenney";

describe("kenneyGlbUrl", () => {
  test("uses each kit's verified GLB directory and encodes spaces", () => {
    expect(kenneyGlbUrl("fantasyTown", "wall-block")).toBe(
      "/assets/kenney_fantasy-town-kit_2.0/Models/GLB%20format/wall-block.glb",
    );
    expect(kenneyGlbUrl("nature", "tree_pineTallA")).toBe(
      "/assets/kenney_nature-kit/Models/GLTF%20format/tree_pineTallA.glb",
    );
    expect(kenneyGlbUrl("blockyCharacters", "character-a")).toBe(
      "/assets/kenney_blocky-characters_20/Models/GLB%20format/character-a.glb",
    );
    expect(kenneyGlbUrl("castle", "tower-square")).toBe(
      "/assets/kenney_castle-kit/Models/GLB%20format/tower-square.glb",
    );
    expect(kenneyGlbUrl("retroFantasy", "tower-paint")).toBe(
      "/assets/kenney_retro-fantasy-kit%20(1)/Models/GLB%20format/tower-paint.glb",
    );
    expect(kenneyGlbUrl("modularBuildings", "building-block")).toBe(
      "/assets/kenney_modular-buildings/Models/GLB%20format/building-block.glb",
    );
  });

  test("rejects traversal and filenames", () => {
    expect(() => kenneyGlbUrl("pirate", "../ship-large")).toThrow();
    expect(() => kenneyGlbUrl("survival", "tool-hammer.glb")).toThrow();
  });
});
