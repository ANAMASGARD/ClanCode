import { describe, expect, test } from "bun:test";

import { emptyClanRunSnapshot, emptyClanRunView } from "@/app/lib/clan-run/types";

import {
  constructionProgressFraction,
  constructionSiteVisible,
  crewActivityFromSnapshot,
  runPhaseLabel,
} from "./construction-site";

describe("constructionSiteVisible", () => {
  test("true during planning", () => {
    expect(
      constructionSiteVisible({
        ...emptyClanRunSnapshot(),
        runId: "run-1",
        phase: "planning",
      }),
    ).toBe(true);
  });

  test("false when idle", () => {
    expect(constructionSiteVisible(emptyClanRunSnapshot())).toBe(false);
  });

  test("false after success", () => {
    expect(
      constructionSiteVisible({
        ...emptyClanRunSnapshot(),
        runId: "run-1",
        phase: "success",
      }),
    ).toBe(false);
  });
});

describe("constructionProgressFraction", () => {
  test("idle run yields zero progress", () => {
    expect(constructionProgressFraction(emptyClanRunSnapshot())).toBe(0);
  });

  test("planning gives partial credit for active step", () => {
    const fraction = constructionProgressFraction({
      ...emptyClanRunSnapshot(),
      runId: "run-1",
      phase: "planning",
    });
    expect(fraction).toBeGreaterThan(0);
    expect(fraction).toBeLessThan(1);
  });
});

describe("crewActivityFromSnapshot", () => {
  test("planning approaches the site", () => {
    expect(
      crewActivityFromSnapshot({
        phase: "planning",
        changed: false,
        lastTool: null,
        approvalDecision: null,
      }),
    ).toBe("approach");
  });

  test("building hammers even before changed", () => {
    expect(
      crewActivityFromSnapshot({
        phase: "building",
        changed: false,
        lastTool: null,
        approvalDecision: null,
      }),
    ).toBe("hammer");
  });

  test("approval freezes crew", () => {
    expect(
      crewActivityFromSnapshot({
        phase: "awaiting_approval",
        changed: true,
        lastTool: "write_file",
        approvalDecision: null,
      }),
    ).toBe("frozen");
  });
});

describe("runPhaseLabel", () => {
  test("build success without changes is explicit", () => {
    expect(
      runPhaseLabel(
        {
          ...emptyClanRunView(),
          runId: "run-1",
          phase: "success",
          requestedMode: "build",
          changed: false,
        },
        true,
      ),
    ).toBe("Completed (no changes)");
  });
});
