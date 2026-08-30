export type CssRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Map a viewport pointer onto the canvas NDC used by the scene raycaster. */
export function clientToNdc(
  clientX: number,
  clientY: number,
  rect: CssRect,
): { x: number; y: number } | null {
  if (rect.width <= 0 || rect.height <= 0) return null;
  return {
    x: ((clientX - rect.left) / rect.width) * 2 - 1,
    y: -((clientY - rect.top) / rect.height) * 2 + 1,
  };
}
