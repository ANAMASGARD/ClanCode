import type { RunEvent, RunEventType } from "./events.ts";

export const NETWORK_PROTOCOL_VERSION = 1 as const;

export type CommandType = "task.start" | "task.cancel" | "approval.resolve";

export type ClientEventType =
  | "device.hello"
  | "device.heartbeat"
  | "run.event"
  | "command.ack";

export type CommandEnvelope = {
  version: typeof NETWORK_PROTOCOL_VERSION;
  commandId: string;
  deviceId: string;
  issuedAt: string;
  expiresAt: string;
  type: CommandType;
  payload: unknown;
};

export type ClientEventEnvelope = {
  version: typeof NETWORK_PROTOCOL_VERSION;
  eventId: string;
  deviceId: string;
  issuedAt: string;
  type: ClientEventType;
  payload: unknown;
};

export type TaskStartPayload = {
  repositoryPath: string;
  prompt: string;
  mode?: "plan" | "build";
  taskId?: string;
};

export type TaskCancelPayload = {
  runId: string;
};

export type ApprovalResolvePayload = {
  runId: string;
  toolCallId: string;
  allow: boolean;
};

export type CommandAckStatus = "accepted" | "rejected" | "duplicate" | "expired";

export type CommandAckPayload = {
  commandId: string;
  status: CommandAckStatus;
  reason?:
    | "busy"
    | "expired"
    | "unauthorized"
    | "invalid"
    | "run_mismatch"
    | "no_pending_approval"
    | "no_active_run"
    | "failed";
  runId?: string;
};

export type DeviceHelloPayload = {
  protocolVersion: number;
  deviceId: string;
  status: "idle" | "busy" | "awaiting_approval";
  activeRunId?: string;
  lastSequence?: number;
  capabilities: string[];
};

export type DeviceHeartbeatPayload = {
  deviceId: string;
  status: "idle" | "busy" | "awaiting_approval";
  activeRunId?: string;
};

export type RunEventNetworkPayload = {
  event: RunEvent;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseIso(value: unknown, field: string): string {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

export function parseCommandEnvelope(input: unknown): CommandEnvelope {
  if (!isRecord(input)) {
    throw new Error("Command envelope must be an object");
  }
  if (input.version !== NETWORK_PROTOCOL_VERSION) {
    throw new Error("Unsupported command version");
  }
  const type = input.type;
  if (type !== "task.start" && type !== "task.cancel" && type !== "approval.resolve") {
    throw new Error("Unknown command type");
  }
  if (typeof input.commandId !== "string" || input.commandId.length === 0) {
    throw new Error("commandId required");
  }
  if (typeof input.deviceId !== "string" || input.deviceId.length === 0) {
    throw new Error("deviceId required");
  }
  return {
    version: NETWORK_PROTOCOL_VERSION,
    commandId: input.commandId,
    deviceId: input.deviceId,
    issuedAt: parseIso(input.issuedAt, "issuedAt"),
    expiresAt: parseIso(input.expiresAt, "expiresAt"),
    type,
    payload: input.payload ?? {},
  };
}

export function parseClientEventEnvelope(input: unknown): ClientEventEnvelope {
  if (!isRecord(input)) {
    throw new Error("Client event envelope must be an object");
  }
  if (input.version !== NETWORK_PROTOCOL_VERSION) {
    throw new Error("Unsupported client event version");
  }
  const type = input.type;
  if (
    type !== "device.hello" &&
    type !== "device.heartbeat" &&
    type !== "run.event" &&
    type !== "command.ack"
  ) {
    throw new Error("Unknown client event type");
  }
  if (typeof input.eventId !== "string" || input.eventId.length === 0) {
    throw new Error("eventId required");
  }
  if (typeof input.deviceId !== "string" || input.deviceId.length === 0) {
    throw new Error("deviceId required");
  }
  return {
    version: NETWORK_PROTOCOL_VERSION,
    eventId: input.eventId,
    deviceId: input.deviceId,
    issuedAt: parseIso(input.issuedAt, "issuedAt"),
    type,
    payload: input.payload ?? {},
  };
}

function relativePath(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }
  if (value.startsWith("/") || /^[A-Za-z]:\\/.test(value)) {
    return undefined;
  }
  return value;
}

function safeString(value: unknown, max = 200): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function repoDisplayName(payload: Record<string, unknown>): string | undefined {
  const identity = payload.identity;
  if (typeof identity === "string" && identity.length > 0) {
    const parts = identity.split("/");
    return parts.at(-1) ?? identity;
  }
  const repository = payload.repository;
  if (typeof repository === "string" && repository.length > 0) {
    const parts = repository.split("/");
    return parts.at(-1) ?? repository;
  }
  return undefined;
}

export function projectRunEventForNetwork(event: RunEvent): RunEvent {
  const payload = isRecord(event.payload) ? event.payload : {};
  switch (event.type as RunEventType) {
    case "run.started":
      return {
        ...event,
        payload: {
          runId: event.runId,
          mode: payload.mode,
          repositoryDisplay: repoDisplayName(payload),
        },
      };
    case "run.completed":
    case "run.failed":
    case "run.cancelled":
      return {
        ...event,
        payload: {
          message: safeString(payload.message),
          sessionId: undefined,
        },
      };
    case "tool.requested":
    case "tool.started":
      return {
        ...event,
        payload: {
          toolName: payload.toolName ?? payload.name,
          path: relativePath(payload.path),
        },
      };
    case "tool.completed":
      return {
        ...event,
        payload: {
          toolName: payload.toolName ?? payload.name,
          path: relativePath(payload.path),
          ok: payload.ok,
        },
      };
    case "tool.failed":
      return {
        ...event,
        payload: {
          toolName: payload.toolName ?? payload.name,
          code: safeString(payload.code ?? payload.error),
        },
      };
    case "validation.completed":
      return {
        ...event,
        payload: {
          ok: payload.ok,
          exitCode: payload.exitCode,
          durationMs: payload.durationMs,
          skipped: payload.skipped,
        },
      };
    case "approval.required": {
      const rawApprovals = Array.isArray(payload.approvals) ? payload.approvals : [];
      return {
        ...event,
        payload: {
          approvals: rawApprovals.map((item) => {
            const row = isRecord(item) ? item : {};
            return {
              toolCallId: safeString(row.toolCallId),
              toolName: safeString(row.toolName),
              risk: row.risk,
              summary: safeString(row.summary, 300),
            };
          }),
        },
      };
    }
    case "approval.granted":
    case "approval.denied":
      return {
        ...event,
        payload: {
          toolCallId: payload.toolCallId,
          toolName: payload.toolName,
        },
      };
    case "diff.updated":
      return {
        ...event,
        payload: {
          stat: safeString(payload.stat, 500),
          files: Array.isArray(payload.files)
            ? payload.files.filter((f): f is string => typeof f === "string")
            : undefined,
        },
      };
    case "pr.created":
      return {
        ...event,
        payload: {
          url: safeString(payload.url),
          number: payload.number,
          branch: safeString(payload.branch),
        },
      };
    case "git.branch_created":
      return {
        ...event,
        payload: {
          branch: safeString(payload.branch),
        },
      };
    case "git.commit_created":
      return {
        ...event,
        payload: {
          message: safeString(payload.message, 120),
        },
      };
    case "agent.message":
    case "model.delta":
    case "model.completed":
      return {
        ...event,
        payload: { omitted: true },
      };
    default:
      return {
        ...event,
        payload: { omitted: true },
      };
  }
}
