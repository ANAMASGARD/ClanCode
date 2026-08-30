import { describe, expect, test } from "bun:test";

import { appendTranscript } from "@/app/game/hooks/useVoiceTranscription";
import { buildingStatusFromProjection } from "@/app/game/state/building-projection";
import { emptyClanRunView } from "@/app/lib/clan-run/types";

describe("appendTranscript", () => {
  test("appends with whitespace and trims empty additions", () => {
    expect(appendTranscript("hello", "world")).toBe("hello world");
    expect(appendTranscript("", "  new task  ")).toBe("new task");
    expect(appendTranscript("keep", "   ")).toBe("keep");
  });
});

describe("buildingStatusFromProjection", () => {
  test("town hall stays offline without device", () => {
    const status = buildingStatusFromProjection("town-hall", emptyClanRunView());
    expect(status.status).toBe("Offline");
  });

  test("builder workshop reflects validated growth", () => {
    const status = buildingStatusFromProjection("builder-workshop", {
      ...emptyClanRunView(),
      deviceOnline: true,
      changed: true,
      storeys: 2,
      validationStatus: "passed",
      phase: "success",
    });
    expect(status.status).toBe("Expanded");
    expect(status.detail).toContain("2 floors");
  });

  test("approval gate shows awaiting state", () => {
    const status = buildingStatusFromProjection("approval-gate", {
      ...emptyClanRunView(),
      deviceOnline: true,
      phase: "awaiting_approval",
      approvals: [{ toolCallId: "t1", toolName: "delete_file", summary: "Delete demo file" }],
      approvalDecision: null,
    });
    expect(status.status).toBe("Awaiting you");
    expect(status.detail).toContain("Delete demo file");
  });
});
