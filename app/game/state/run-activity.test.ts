import { describe, expect, test } from "bun:test";

import { projectionActivityLines } from "./run-activity";
import { emptyClanRunView } from "@/app/lib/clan-run/types";

describe("projectionActivityLines", () => {
  test("success without changes is explicit", () => {
    const lines = projectionActivityLines({
      ...emptyClanRunView(),
      runId: "run-1",
      phase: "success",
      requestedMode: "build",
      changed: false,
      deliveryStage: "idle",
    });
    expect(lines.some((line) => line.text === "Run completed with no file changes")).toBe(true);
  });
});
