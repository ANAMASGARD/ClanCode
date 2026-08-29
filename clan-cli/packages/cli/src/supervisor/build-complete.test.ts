import { describe, expect, test } from "bun:test";
import type { RunEventType } from "@clanofagents/protocol";
import { completeSuccessfulTurn } from "./build-complete.ts";

describe("build turn finalization", () => {
  test("validation.completed precedes run.completed when build mutated", async () => {
    const events: RunEventType[] = [];
    await completeSuccessfulTurn({
      mode: "build",
      mutatedThisTurn: true,
      turnId: "turn_1",
      emitDiff: async () => {
        events.push("diff.updated");
      },
      runValidation: async () => {
        events.push("validation.started");
        events.push("validation.completed");
        return { ok: true, output: "ok", skipped: false };
      },
      emit: (type) => {
        events.push(type);
      },
      setReady: () => undefined,
    });
    const validationIdx = events.indexOf("validation.completed");
    const completedIdx = events.indexOf("run.completed");
    expect(validationIdx).toBeGreaterThan(-1);
    expect(completedIdx).toBeGreaterThan(validationIdx);
    expect(events.indexOf("diff.updated")).toBeLessThan(validationIdx);
  });

  test("plan turn completes without validation", async () => {
    const events: RunEventType[] = [];
    await completeSuccessfulTurn({
      mode: "plan",
      mutatedThisTurn: false,
      turnId: "turn_2",
      emitDiff: async () => {
        events.push("diff.updated");
      },
      runValidation: async () => {
        events.push("validation.started");
        return { ok: true, output: "", skipped: false };
      },
      emit: (type) => {
        events.push(type);
      },
      setReady: () => undefined,
    });
    expect(events).toEqual(["run.completed"]);
  });

  test("failed validation still emits run.completed with validationFailed", async () => {
    const payloads: unknown[] = [];
    await completeSuccessfulTurn({
      mode: "build",
      mutatedThisTurn: true,
      turnId: "turn_3",
      emitDiff: async () => undefined,
      runValidation: async () => ({ ok: false, output: "fail", skipped: false }),
      emit: (_type, payload) => {
        payloads.push(payload);
      },
      setReady: () => undefined,
    });
    const last = payloads.at(-1) as { validationFailed?: boolean; validated?: boolean };
    expect(last.validationFailed).toBe(true);
    expect(last.validated).toBe(false);
  });
});
