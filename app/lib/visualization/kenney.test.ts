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
  });

  test("rejects traversal and filenames", () => {
    expect(() => kenneyGlbUrl("pirate", "../ship-large")).toThrow();
    expect(() => kenneyGlbUrl("survival", "tool-hammer.glb")).toThrow();
  });
});
