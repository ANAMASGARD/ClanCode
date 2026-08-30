import { describe, expect, test } from "bun:test";

import { emptyClanRunView } from "@/app/lib/clan-run/types";

import { snapshotActivityDelta } from "./run-activity-history";

describe("snapshotActivityDelta", () => {
  test("records phase transitions", () => {
    const base = {
      ...emptyClanRunView(),
      runId: "run-1",
      phase: "planning" as const,
      lastSequence: 1,
      promptPreview: "create csv",
      requestedMode: "build" as const,
    };
    const next = { ...base, phase: "building" as const, lastSequence: 2, lastTool: "create_file" };
    const lines = snapshotActivityDelta(base, next);
    expect(lines.some((line) => line.text === "Phase: building")).toBe(true);
    expect(lines.some((line) => line.text === "Tool: create_file")).toBe(true);
  });

  test("records successful completion with file changes", () => {
    const prev = {
      ...emptyClanRunView(),
      runId: "run-1",
      phase: "validating" as const,
      changed: true,
      lastSequence: 5,
    };
    const next = {
      ...prev,
      phase: "success" as const,
      validationStatus: "passed" as const,
      lastSequence: 6,
    };
    const lines = snapshotActivityDelta(prev, next);
    expect(lines.some((line) => line.text === "Run completed — files updated")).toBe(true);
  });
});
