import { describe, expect, test } from "bun:test";
import type { DeviceListItem } from "@/app/lib/pairing/service";
import {
  parseApprovalBody,
  parseCancelRunId,
  parseDeliveryRunId,
  parseTaskStartBody,
  pickNewestOnlineDevice,
} from "./commands";
import { emptyClanRunSnapshot } from "./types";

function device(partial: Partial<DeviceListItem> & Pick<DeviceListItem, "id">): DeviceListItem {
  return {
    label: "laptop",
    platform: "linux",
    status: "active",
    online: true,
    lastSeenAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

describe("clan command parsing", () => {
  test("rejects repositoryPath from the browser", () => {
    const result = parseTaskStartBody({
      prompt: "hello",
      repositoryPath: "/tmp/evil",
    });
    expect(result).toEqual({ error: "repository_path_not_allowed", status: 400 });
  });

  test("requires a nonempty prompt and defaults to build", () => {
    expect(parseTaskStartBody({ prompt: "   " })).toEqual({
      error: "prompt_required",
      status: 400,
    });
    expect(parseTaskStartBody({ prompt: "fix the demo file" })).toEqual({
      prompt: "fix the demo file",
      mode: "build",
    });
    expect(parseTaskStartBody({ prompt: "inspect", mode: "plan" })).toEqual({
      prompt: "inspect",
      mode: "plan",
    });
  });

  test("picks the most recently seen online device", () => {
    const chosen = pickNewestOnlineDevice([
      device({ id: "old", lastSeenAt: "2026-01-01T00:00:00.000Z" }),
      device({ id: "offline", online: false, lastSeenAt: "2026-08-30T00:00:00.000Z" }),
      device({ id: "newest", lastSeenAt: "2026-08-30T12:00:00.000Z" }),
    ]);
    expect(chosen?.id).toBe("newest");
    expect(pickNewestOnlineDevice([device({ id: "x", online: false })])).toBeUndefined();
  });

  test("approval must match the current projection", () => {
    const snapshot = {
      ...emptyClanRunSnapshot(),
      runId: "run-1",
      approvals: [{ toolCallId: "call-1", toolName: "delete_file" }],
    };
    expect(parseApprovalBody({ runId: "run-other", toolCallId: "call-1", allow: false }, snapshot)).toEqual({
      error: "run_mismatch",
      status: 409,
    });
    expect(parseApprovalBody({ runId: "run-1", toolCallId: "call-9", allow: true }, snapshot)).toEqual({
      error: "no_pending_approval",
      status: 409,
    });
    expect(parseApprovalBody({ runId: "run-1", toolCallId: "call-1", allow: true }, snapshot)).toEqual({
      runId: "run-1",
      toolCallId: "call-1",
      allow: true,
    });
  });

  test("cancel and delivery require the current run", () => {
    expect(parseCancelRunId(emptyClanRunSnapshot())).toEqual({
      error: "no_active_run",
      status: 409,
    });
    expect(parseDeliveryRunId({ ...emptyClanRunSnapshot(), runId: "run-1" })).toEqual({
      error: "delivery_not_ready",
      status: 409,
    });
    expect(parseDeliveryRunId({
      ...emptyClanRunSnapshot(),
      runId: "run-1",
      deliveryStage: "ready",
    })).toBe("run-1");
  });
});
