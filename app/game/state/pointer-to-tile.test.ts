import { describe, expect, test } from "bun:test";

import { clientToNdc } from "./pointer-to-tile";

describe("clientToNdc", () => {
  const fullscreen = { left: 0, top: 0, width: 1000, height: 800 };

  test("maps the canvas centre to the origin", () => {
    expect(clientToNdc(500, 400, fullscreen)).toEqual({ x: 0, y: 0 });
  });

  test("accounts for a canvas that is not at the viewport origin", () => {
    const inset = { left: 80, top: 40, width: 400, height: 200 };
    expect(clientToNdc(80, 40, inset)).toEqual({ x: -1, y: 1 });
    expect(clientToNdc(480, 240, inset)).toEqual({ x: 1, y: -1 });
    expect(clientToNdc(280, 140, inset)).toEqual({ x: 0, y: 0 });
  });

  test("rejects a zero-sized canvas", () => {
    expect(clientToNdc(10, 10, { left: 0, top: 0, width: 0, height: 100 })).toBeNull();
  });
});
