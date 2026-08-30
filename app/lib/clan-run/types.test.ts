import { describe, expect, test } from "bun:test";

import { emptyClanRunSnapshot, isStaleClanRun } from "./types";

describe("isStaleClanRun", () => {
  test("detects planning runs stuck at task.start", () => {
    expect(
      isStaleClanRun({
        ...emptyClanRunSnapshot(),
        runId: "run-1",
        phase: "planning",
        lastEventType: "task.start",
        lastSequence: 0,
      }),
    ).toBe(true);
  });

  test("ignores runs that progressed", () => {
    expect(
      isStaleClanRun({
        ...emptyClanRunSnapshot(),
        runId: "run-1",
        phase: "planning",
        lastEventType: "run.started",
        lastSequence: 1,
      }),
    ).toBe(false);
  });
});
