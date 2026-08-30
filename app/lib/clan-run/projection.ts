import type { RunEvent } from "../../../clan-cli/packages/protocol/src/events";
import {
  emptyClanRunSnapshot,
  type ClanRunMode,
  type ClanRunSnapshot,
  type SanitizedApproval,
} from "./types";

const PLAN_TOOLS = new Set([
  "repo_info",
  "list_directory",
  "read_file",
  "glob",
  "grep",
  "git_status",
  "git_diff",
]);

const MUTATION_TOOLS = new Set([
  "create_file",
  "write_file",
  "apply_patch",
  "replace_range",
  "delete_file",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clampStoreys(value: number): 1 | 2 | 3 | 4 {
  if (value <= 1) return 1;
  if (value === 2) return 2;
  if (value === 3) return 3;
  return 4;
}

function toolNameOf(payload: Record<string, unknown>): string | null {
  if (typeof payload.toolName === "string" && payload.toolName.length > 0) {
    return payload.toolName;
  }
  if (typeof payload.name === "string" && payload.name.length > 0) {
    return payload.name;
  }
  return null;
}

function sanitizeApprovals(value: unknown): SanitizedApproval[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const rows: SanitizedApproval[] = [];
  for (const item of value) {
    const row = isRecord(item) ? item : {};
    if (typeof row.toolCallId !== "string" || row.toolCallId.length === 0) {
      continue;
    }
    rows.push({
      toolCallId: row.toolCallId,
      toolName: typeof row.toolName === "string" ? row.toolName : "tool",
      risk: typeof row.risk === "string" ? row.risk : undefined,
      summary: typeof row.summary === "string" ? row.summary : undefined,
    });
  }
  return rows;
}

function diffChanged(payload: Record<string, unknown>): boolean {
  const stat = typeof payload.stat === "string" ? payload.stat.trim() : "";
  const paths = Array.isArray(payload.paths)
    ? payload.paths.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];
  return stat.length > 0 || paths.length > 0;
}

function canGrowWorkshop(snapshot: ClanRunSnapshot): boolean {
  return (
    snapshot.requestedMode === "build" &&
    snapshot.changed &&
    (snapshot.validationStatus === "passed" || snapshot.validationStatus === "skipped") &&
    snapshot.runId !== null &&
    snapshot.runId !== snapshot.lastCompletedRunId &&
    snapshot.storeys < 4
  );
}

export function seedAcceptedTask(
  current: ClanRunSnapshot,
  input: {
    runId: string;
    deviceId: string;
    requestedMode: ClanRunMode;
    promptPreview: string;
    repositoryDisplay?: string | null;
  },
): ClanRunSnapshot {
  return {
    ...current,
    deviceId: input.deviceId,
    runId: input.runId,
    requestedMode: input.requestedMode,
    phase: "planning",
    promptPreview: input.promptPreview,
    lastTool: null,
    lastEventType: "task.start",
    approvals: [],
    approvalDecision: null,
    validationStatus: "idle",
    deliveryStage: "idle",
    prUrl: null,
    prNumber: null,
    changed: false,
    repositoryDisplay: input.repositoryDisplay ?? current.repositoryDisplay,
  };
}

export function applyRunEvent(
  current: ClanRunSnapshot,
  event: RunEvent,
  emittingDeviceId?: string,
): ClanRunSnapshot {
  if (
    emittingDeviceId !== undefined &&
    current.deviceId !== null &&
    current.deviceId !== emittingDeviceId &&
    current.runId !== null
  ) {
    return current;
  }
  if (current.runId !== null && event.runId !== current.runId && event.type !== "run.started") {
    return current;
  }
  if (current.runId === event.runId && event.sequence <= current.lastSequence) {
    return current;
  }

  const payload = isRecord(event.payload) ? event.payload : {};
  const base: ClanRunSnapshot = {
    ...current,
    runId: event.runId,
    lastSequence: event.sequence,
    lastEventType: event.type,
  };

  switch (event.type) {
    case "run.started":
      return {
        ...base,
        phase: "planning",
        changed: false,
        approvals: [],
        approvalDecision: null,
        validationStatus: "idle",
        deliveryStage: "idle",
        prUrl: null,
        prNumber: null,
        lastTool: null,
        repositoryDisplay:
          typeof payload.repositoryDisplay === "string"
            ? payload.repositoryDisplay
            : current.repositoryDisplay,
      };
    case "tool.requested": {
      const tool = toolNameOf(payload);
      if (tool !== null && PLAN_TOOLS.has(tool)) {
        return { ...base, lastTool: tool, phase: "planning" };
      }
      if (tool !== null && MUTATION_TOOLS.has(tool)) {
        return { ...base, lastTool: tool, phase: "building" };
      }
      return tool !== null ? { ...base, lastTool: tool } : base;
    }
    case "tool.started":
    case "tool.completed":
    case "tool.failed": {
      const tool = toolNameOf(payload);
      return tool !== null ? { ...base, lastTool: tool } : base;
    }
    case "diff.updated":
      return { ...base, changed: diffChanged(payload) };
    case "approval.required":
      return {
        ...base,
        phase: "awaiting_approval",
        approvals: sanitizeApprovals(payload.approvals),
        approvalDecision: null,
      };
    case "approval.granted":
      return {
        ...base,
        approvalDecision: "granted",
        phase: current.phase === "awaiting_approval" ? "building" : current.phase,
      };
    case "approval.denied":
      return {
        ...base,
        approvalDecision: "denied",
        phase: "awaiting_approval",
      };
    case "validation.started":
      return { ...base, phase: "validating", validationStatus: "running" };
    case "validation.completed": {
      let validationStatus: ClanRunSnapshot["validationStatus"] = "failed";
      if (payload.skipped === true) {
        validationStatus = "skipped";
      } else if (payload.ok === true) {
        validationStatus = "passed";
      }
      return { ...base, phase: "validating", validationStatus };
    }
    case "run.completed": {
      let validationStatus = base.validationStatus;
      if (payload.validationFailed === true) {
        validationStatus = "failed";
      } else if (payload.validationSkipped === true) {
        validationStatus = "skipped";
      } else if (payload.validated === true) {
        validationStatus = "passed";
      }
      const mutated = payload.mutated === true;
      const next: ClanRunSnapshot = {
        ...base,
        phase: "success",
        validationStatus,
        changed: base.changed || mutated,
      };
      if (canGrowWorkshop(next)) {
        return {
          ...next,
          storeys: clampStoreys(next.storeys + 1),
          lastCompletedRunId: event.runId,
          deliveryStage: "ready",
        };
      }
      const deliveryReady =
        next.requestedMode === "build" &&
        next.changed &&
        (next.validationStatus === "passed" || next.validationStatus === "skipped") &&
        next.storeys === 4;
      return {
        ...next,
        lastCompletedRunId: event.runId,
        deliveryStage: deliveryReady ? "ready" : "idle",
      };
    }
    case "run.failed":
      return { ...base, phase: "failed", deliveryStage: "idle" };
    case "run.cancelled":
      return {
        ...base,
        phase: "cancelled",
        deliveryStage: "idle",
        approvals: [],
        approvalDecision: null,
        validationStatus: "idle",
        lastTool: null,
      };
    case "git.commit_created":
      return { ...base, deliveryStage: "committing" };
    case "pr.created":
      return {
        ...base,
        deliveryStage: "pr_created",
        prUrl: typeof payload.url === "string" ? payload.url : current.prUrl,
        prNumber: typeof payload.number === "number" ? payload.number : current.prNumber,
      };
    default:
      return base;
  }
}

export function applyRunEvents(current: ClanRunSnapshot, events: readonly RunEvent[]): ClanRunSnapshot {
  return events.reduce((state, event) => applyRunEvent(state, event), current);
}

export { emptyClanRunSnapshot };
