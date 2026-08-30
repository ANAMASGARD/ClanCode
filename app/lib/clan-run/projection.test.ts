import { describe, expect, test } from "bun:test";
import { createRunEvent } from "../../../clan-cli/packages/protocol/src/events";
import { applyRunEvent, seedAcceptedTask } from "./projection";
import { emptyClanRunSnapshot } from "./types";

function event(
  type: Parameters<typeof createRunEvent>[0]["type"],
  sequence: number,
  payload: unknown = {},
  runId = "run-1",
) {
  return createRunEvent({ runId, sequence, type, payload });
}

describe("clan run projection", () => {
  test("run.started begins planning without using payload.mode", () => {
    const seeded = seedAcceptedTask(emptyClanRunSnapshot(), {
      runId: "run-1",
      deviceId: "dev-1",
      requestedMode: "build",
      promptPreview: "remove demo file",
    });
    const next = applyRunEvent(seeded, event("run.started", 1, { mode: "spawned" }));
    expect(next.phase).toBe("planning");
    expect(next.requestedMode).toBe("build");
    expect(next.changed).toBe(false);
  });

  test("read tool stays planning; mutation request starts building without changing", () => {
    let state = seedAcceptedTask(emptyClanRunSnapshot(), {
      runId: "run-1",
      deviceId: "dev-1",
      requestedMode: "build",
      promptPreview: "edit",
    });
    state = applyRunEvent(state, event("tool.requested", 2, { toolCallId: "c1", name: "grep" }));
    expect(state.phase).toBe("planning");
    expect(state.lastTool).toBe("grep");
    state = applyRunEvent(state, event("tool.requested", 3, { toolCallId: "c2", name: "delete_file" }));
    expect(state.phase).toBe("building");
    expect(state.changed).toBe(false);
  });

  test("latest diff is the authoritative changed flag", () => {
    let state = seedAcceptedTask(emptyClanRunSnapshot(), {
      runId: "run-1",
      deviceId: "dev-1",
      requestedMode: "build",
      promptPreview: "edit",
    });
    state = applyRunEvent(state, event("diff.updated", 2, { stat: "1 paths", paths: ["a.ts"] }));
    expect(state.changed).toBe(true);
    state = applyRunEvent(state, event("diff.updated", 3, { stat: "", paths: [] }));
    expect(state.changed).toBe(false);
  });

  test("old sequence is a no-op", () => {
    let state = seedAcceptedTask(emptyClanRunSnapshot(), {
      runId: "run-1",
      deviceId: "dev-1",
      requestedMode: "build",
      promptPreview: "edit",
    });
    state = applyRunEvent(state, event("tool.requested", 5, { name: "grep" }));
    const again = applyRunEvent(state, event("tool.requested", 4, { name: "delete_file" }));
    expect(again).toEqual(state);
  });

  test("late event from an older run is ignored", () => {
    let state = seedAcceptedTask(emptyClanRunSnapshot(), {
      runId: "run-2",
      deviceId: "dev-1",
      requestedMode: "build",
      promptPreview: "new",
    });
    state = applyRunEvent(state, event("run.started", 1, {}, "run-2"));
    const next = applyRunEvent(state, event("run.completed", 9, { validated: true }, "run-1"));
    expect(next.runId).toBe("run-2");
    expect(next.storeys).toBe(1);
    expect(next.phase).toBe("planning");
  });

  test("approval denied stays awaiting_approval", () => {
    let state = seedAcceptedTask(emptyClanRunSnapshot(), {
      runId: "run-1",
      deviceId: "dev-1",
      requestedMode: "build",
      promptPreview: "delete",
    });
    state = applyRunEvent(
      state,
      event("approval.required", 2, {
        approvals: [{ toolCallId: "c1", toolName: "delete_file", risk: "DELETE", summary: "demo-obsolete.txt" }],
      }),
    );
    state = applyRunEvent(state, event("approval.denied", 3, { toolCallId: "c1" }));
    expect(state.phase).toBe("awaiting_approval");
    expect(state.approvalDecision).toBe("denied");
    expect(state.approvals[0]?.toolCallId).toBe("c1");
  });

  test("successful changed build with passed validation grows one storey", () => {
    let state = seedAcceptedTask(emptyClanRunSnapshot(), {
      runId: "run-1",
      deviceId: "dev-1",
      requestedMode: "build",
      promptPreview: "delete",
    });
    state = applyRunEvent(state, event("diff.updated", 2, { stat: "1 paths", paths: ["demo-obsolete.txt"] }));
    state = applyRunEvent(state, event("validation.completed", 3, { ok: true }));
    state = applyRunEvent(state, event("run.completed", 4, { validated: true }));
    expect(state.phase).toBe("success");
    expect(state.storeys).toBe(2);
    expect(state.deliveryStage).toBe("ready");
    expect(state.lastCompletedRunId).toBe("run-1");
  });

  test("plan run never grows", () => {
    let state = seedAcceptedTask(emptyClanRunSnapshot(), {
      runId: "run-1",
      deviceId: "dev-1",
      requestedMode: "plan",
      promptPreview: "inspect",
    });
    state = applyRunEvent(state, event("diff.updated", 2, { stat: "1 paths", paths: ["a.ts"] }));
    state = applyRunEvent(state, event("run.completed", 3, {}));
    expect(state.storeys).toBe(1);
    expect(state.deliveryStage).toBe("idle");
  });

  test("no-change build never grows", () => {
    let state = seedAcceptedTask(emptyClanRunSnapshot(), {
      runId: "run-1",
      deviceId: "dev-1",
      requestedMode: "build",
      promptPreview: "noop",
    });
    state = applyRunEvent(state, event("run.completed", 2, { validated: true }));
    expect(state.storeys).toBe(1);
    expect(state.deliveryStage).toBe("idle");
  });

  test("failed validation never grows or enables delivery", () => {
    let state = seedAcceptedTask(emptyClanRunSnapshot(), {
      runId: "run-1",
      deviceId: "dev-1",
      requestedMode: "build",
      promptPreview: "edit",
    });
    state = applyRunEvent(state, event("diff.updated", 2, { stat: "1 paths", paths: ["a.ts"] }));
    state = applyRunEvent(state, event("run.completed", 3, { validated: false, validationFailed: true }));
    expect(state.phase).toBe("success");
    expect(state.validationStatus).toBe("failed");
    expect(state.storeys).toBe(1);
    expect(state.deliveryStage).toBe("idle");
  });

  test("failed and cancelled runs do not grow", () => {
    const seeded = seedAcceptedTask(emptyClanRunSnapshot(), {
      runId: "run-1",
      deviceId: "dev-1",
      requestedMode: "build",
      promptPreview: "edit",
    });
    const failed = applyRunEvent(
      applyRunEvent(seeded, event("diff.updated", 2, { stat: "1 paths", paths: ["a.ts"] })),
      event("run.failed", 3, { message: "boom" }),
    );
    expect(failed.storeys).toBe(1);
    expect(failed.phase).toBe("failed");
    const cancelled = applyRunEvent(seeded, event("run.cancelled", 2, {}));
    expect(cancelled.storeys).toBe(1);
    expect(cancelled.phase).toBe("cancelled");
  });

  test("duplicate completed does not grow twice", () => {
    let state = seedAcceptedTask(emptyClanRunSnapshot(), {
      runId: "run-1",
      deviceId: "dev-1",
      requestedMode: "build",
      promptPreview: "edit",
    });
    state = applyRunEvent(state, event("diff.updated", 2, { stat: "1 paths", paths: ["a.ts"] }));
    state = applyRunEvent(state, event("validation.completed", 3, { ok: true }));
    state = applyRunEvent(state, event("run.completed", 4, { validated: true }));
    const replay = applyRunEvent(state, event("run.completed", 4, { validated: true }));
    expect(replay.storeys).toBe(2);
    const later = applyRunEvent(
      { ...state, lastSequence: 4 },
      event("run.completed", 5, { validated: true }),
    );
    expect(later.storeys).toBe(2);
  });

  test("storeys cap at 4 still succeeds and can deliver", () => {
    let state = seedAcceptedTask(
      { ...emptyClanRunSnapshot(), storeys: 4 },
      {
        runId: "run-9",
        deviceId: "dev-1",
        requestedMode: "build",
        promptPreview: "edit",
      },
    );
    state = applyRunEvent(state, event("diff.updated", 2, { stat: "1 paths", paths: ["a.ts"] }, "run-9"));
    state = applyRunEvent(state, event("validation.completed", 3, { ok: true }, "run-9"));
    state = applyRunEvent(state, event("run.completed", 4, { validated: true }, "run-9"));
    expect(state.storeys).toBe(4);
    expect(state.phase).toBe("success");
    expect(state.deliveryStage).toBe("ready");
  });

  test("pr.created keeps success phase and records url", () => {
    let state = seedAcceptedTask(emptyClanRunSnapshot(), {
      runId: "run-1",
      deviceId: "dev-1",
      requestedMode: "build",
      promptPreview: "edit",
    });
    state = applyRunEvent(state, event("diff.updated", 2, { stat: "1 paths", paths: ["a.ts"] }));
    state = applyRunEvent(state, event("validation.completed", 3, { ok: true }));
    state = applyRunEvent(state, event("run.completed", 4, { validated: true }));
    state = applyRunEvent(state, event("git.commit_created", 5, { message: "demo" }));
    expect(state.phase).toBe("success");
    expect(state.deliveryStage).toBe("committing");
    state = applyRunEvent(
      state,
      event("pr.created", 6, { url: "https://github.com/org/repo/pull/12", number: 12 }),
    );
    expect(state.phase).toBe("success");
    expect(state.deliveryStage).toBe("pr_created");
    expect(state.prUrl).toBe("https://github.com/org/repo/pull/12");
    expect(state.prNumber).toBe(12);
  });

  test("run.completed sets changed from mutated payload when diff was missed", () => {
    let state = seedAcceptedTask(emptyClanRunSnapshot(), {
      runId: "run-1",
      deviceId: "dev-1",
      requestedMode: "build",
      promptPreview: "create csv",
    });
    state = applyRunEvent(state, event("run.started", 1));
    state = applyRunEvent(state, event("tool.requested", 2, { toolName: "create_file" }));
    state = applyRunEvent(state, event("run.completed", 3, { validated: true, mutated: true }));
    expect(state.phase).toBe("success");
    expect(state.changed).toBe(true);
  });

  test("events from another paired device are ignored while a run is active", () => {
    let state = seedAcceptedTask(emptyClanRunSnapshot(), {
      runId: "run-1",
      deviceId: "dev-primary",
      requestedMode: "build",
      promptPreview: "edit",
    });
    state = applyRunEvent(state, event("run.started", 1, {}, "run-1"), "dev-primary");
    const hijacked = applyRunEvent(
      state,
      event("run.started", 1, {}, "run-other"),
      "dev-secondary",
    );
    expect(hijacked).toEqual(state);
    const progressed = applyRunEvent(
      state,
      event("tool.requested", 2, { name: "grep" }, "run-other"),
      "dev-secondary",
    );
    expect(progressed).toEqual(state);
  });

  test("cancelled run clears approvals and returns to idle delivery", () => {
    let state = seedAcceptedTask(emptyClanRunSnapshot(), {
      runId: "run-1",
      deviceId: "dev-1",
      requestedMode: "build",
      promptPreview: "task",
    });
    state = applyRunEvent(state, event("run.started", 1));
    state = applyRunEvent(
      state,
      event("approval.required", 2, {
        approvals: [{ toolCallId: "tc-1", toolName: "delete_file" }],
      }),
    );
    const cancelled = applyRunEvent(state, event("run.cancelled", 3, {}));
    expect(cancelled.phase).toBe("cancelled");
    expect(cancelled.approvals).toEqual([]);
    expect(cancelled.deliveryStage).toBe("idle");
  });
});
