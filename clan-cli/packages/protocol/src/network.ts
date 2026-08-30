import {
  RUN_EVENT_VERSION,
  isRunEventType,
  type RunEvent,
} from "./events.ts";

export const NETWORK_PROTOCOL_VERSION = 1 as const;

export type CommandType =
  | "task.start"
  | "task.cancel"
  | "approval.resolve"
  | "delivery.create_pr";

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
  repositoryPath?: string;
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

export type DeliveryCreatePrPayload = {
  runId: string;
  title?: string;
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
  repositoryDisplay?: string;
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

function isCommandType(value: unknown): value is CommandType {
  return (
    value === "task.start" ||
    value === "task.cancel" ||
    value === "approval.resolve" ||
    value === "delivery.create_pr"
  );
}

export function parseCommandEnvelope(input: unknown): CommandEnvelope {
  if (!isRecord(input)) {
    throw new Error("Command envelope must be an object");
  }
  if (input.version !== NETWORK_PROTOCOL_VERSION) {
    throw new Error("Unsupported command version");
  }
  const type = input.type;
  if (!isCommandType(type)) {
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

export function parseRunEvent(input: unknown): RunEvent {
  if (!isRecord(input)) {
    throw new Error("RunEvent must be an object");
  }
  if (input.version !== RUN_EVENT_VERSION) {
    throw new Error("Unsupported run event version");
  }
  if (typeof input.eventId !== "string" || input.eventId.length === 0) {
    throw new Error("eventId required");
  }
  if (typeof input.sequence !== "number" || !Number.isInteger(input.sequence) || input.sequence < 0) {
    throw new Error("sequence required");
  }
  if (typeof input.runId !== "string" || input.runId.length === 0) {
    throw new Error("runId required");
  }
  if (!isRunEventType(input.type)) {
    throw new Error("Unknown run event type");
  }
  return {
    version: RUN_EVENT_VERSION,
    eventId: input.eventId,
    sequence: input.sequence,
    runId: input.runId,
    taskId: typeof input.taskId === "string" ? input.taskId : undefined,
    timestamp: parseIso(input.timestamp, "timestamp"),
    type: input.type,
    payload: input.payload ?? {},
  };
}

export function parseRunEventNetworkPayload(input: unknown): RunEvent {
  if (!isRecord(input)) {
    throw new Error("Run event payload must be an object");
  }
  return parseRunEvent(input.event);
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

function boundedStringIds(value: unknown, max = 16): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const ids = value.filter((item): item is string => typeof item === "string" && item.length > 0);
  return ids.slice(0, max);
}

function relativePaths(value: unknown, max = 50): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const paths: string[] = [];
  for (const item of value) {
    const path = relativePath(item);
    if (path !== undefined) {
      paths.push(path);
    }
    if (paths.length >= max) {
      break;
    }
  }
  return paths;
}

function omitted(event: RunEvent): RunEvent {
  return { ...event, payload: { omitted: true } };
}

export function projectRunEventForNetwork(event: RunEvent): RunEvent {
  const payload = isRecord(event.payload) ? event.payload : {};
  switch (event.type) {
    case "run.started":
      return {
        ...event,
        payload: {
          runId: event.runId,
          repositoryDisplay: repoDisplayName(payload),
        },
      };
    case "run.completed":
      return {
        ...event,
        payload: {
          message: safeString(payload.message),
          sessionId: undefined,
          validated: payload.validated === true,
          validationFailed: payload.validationFailed === true,
          validationSkipped: payload.validationSkipped === true,
        },
      };
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
      return {
        ...event,
        payload: {
          toolCallId: safeString(payload.toolCallId),
          toolName: safeString(payload.toolName ?? payload.name),
        },
      };
    case "tool.started": {
      const single = safeString(payload.toolCallId);
      const fromList = boundedStringIds(payload.toolCalls);
      return {
        ...event,
        payload: {
          toolCallId: single,
          toolName: safeString(payload.toolName ?? payload.name),
          toolCallIds: fromList ?? (single !== undefined ? [single] : undefined),
        },
      };
    }
    case "tool.completed":
      return {
        ...event,
        payload: {
          toolCallId: safeString(payload.toolCallId),
          toolName: safeString(payload.toolName ?? payload.name),
        },
      };
    case "tool.failed":
      return {
        ...event,
        payload: {
          toolCallId: safeString(payload.toolCallId),
          toolName: safeString(payload.toolName ?? payload.name),
          code: safeString(payload.code ?? payload.error),
        },
      };
    case "validation.started":
      return { ...event, payload: {} };
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
          paths: relativePaths(payload.paths ?? payload.files),
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
    case "task.accepted":
    case "agent.started":
    case "agent.message":
    case "session.created":
    case "turn.started":
    case "model.delta":
    case "model.completed":
      return omitted(event);
    default: {
      const _never: never = event.type;
      void _never;
      return omitted(event);
    }
  }
}
