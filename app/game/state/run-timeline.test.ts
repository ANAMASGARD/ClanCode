import { describe, expect, test } from "bun:test";
import { emptyClanRunSnapshot } from "@/app/lib/clan-run/types";
import { clanRunTimeline } from "./run-timeline";

describe("clan run timeline", () => {
  test("idle is all pending", () => {
    const steps = clanRunTimeline(emptyClanRunSnapshot());
    expect(steps.every((step) => step.state === "pending")).toBe(true);
  });

  test("awaiting approval marks APPROVE active", () => {
    const steps = clanRunTimeline({
      ...emptyClanRunSnapshot(),
      runId: "run-1",
      phase: "awaiting_approval",
    });
    expect(steps.find((step) => step.id === "approve")?.state).toBe("active");
    expect(steps.find((step) => step.id === "deliver")?.state).toBe("pending");
  });

  test("delivery ready marks DELIVER active without a delivering phase", () => {
    const steps = clanRunTimeline({
      ...emptyClanRunSnapshot(),
      runId: "run-1",
      phase: "success",
      deliveryStage: "ready",
      validationStatus: "passed",
      requestedMode: "build",
      changed: true,
    });
    expect(steps.find((step) => step.id === "deliver")?.state).toBe("active");
    expect(steps.find((step) => step.id === "done")?.state).toBe("pending");
  });
});
