import type { CommandEnvelope, CommandType } from "../../../clan-cli/packages/protocol/src/network";
import type { DeviceListItem } from "@/app/lib/pairing/service";
import type { ClanRunMode, ClanRunSnapshot } from "./types";

export const MAX_PROMPT_CHARS = 4000;
export const COMMAND_TTL_MS = 60_000;

export type ParsedTaskStart = {
  prompt: string;
  mode: ClanRunMode;
};

export type ParsedApproval = {
  runId: string;
  toolCallId: string;
  allow: boolean;
};

export type CommandParseError = {
  error: string;
  status: 400 | 409;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function pickNewestOnlineDevice(
  devices: readonly DeviceListItem[],
): DeviceListItem | undefined {
  const online = devices.filter((device) => device.status === "active" && device.online);
  if (online.length === 0) {
    return undefined;
  }
  return [...online].sort((left, right) => {
    const leftSeen = left.lastSeenAt === null ? 0 : Date.parse(left.lastSeenAt);
    const rightSeen = right.lastSeenAt === null ? 0 : Date.parse(right.lastSeenAt);
    return rightSeen - leftSeen;
  })[0];
}

export function parseTaskStartBody(body: unknown): ParsedTaskStart | CommandParseError {
  if (!isRecord(body)) {
    return { error: "invalid_payload", status: 400 };
  }
  if ("repositoryPath" in body && body.repositoryPath !== undefined) {
    return { error: "repository_path_not_allowed", status: 400 };
  }
  if (typeof body.prompt !== "string") {
    return { error: "prompt_required", status: 400 };
  }
  const prompt = body.prompt.trim();
  if (prompt.length === 0) {
    return { error: "prompt_required", status: 400 };
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return { error: "prompt_too_long", status: 400 };
  }
  const mode = body.mode === "plan" ? "plan" : body.mode === "build" || body.mode === undefined ? "build" : null;
  if (mode === null) {
    return { error: "invalid_mode", status: 400 };
  }
  return { prompt, mode };
}

export function parseApprovalBody(
  body: unknown,
  snapshot: ClanRunSnapshot,
): ParsedApproval | CommandParseError {
  if (!isRecord(body)) {
    return { error: "invalid_payload", status: 400 };
  }
  if (typeof body.runId !== "string" || body.runId.length === 0) {
    return { error: "run_id_required", status: 400 };
  }
  if (typeof body.toolCallId !== "string" || body.toolCallId.length === 0) {
    return { error: "tool_call_id_required", status: 400 };
  }
  if (typeof body.allow !== "boolean") {
    return { error: "allow_required", status: 400 };
  }
  if (snapshot.runId === null || snapshot.runId !== body.runId) {
    return { error: "run_mismatch", status: 409 };
  }
  if (!snapshot.approvals.some((row) => row.toolCallId === body.toolCallId)) {
    return { error: "no_pending_approval", status: 409 };
  }
  return { runId: body.runId, toolCallId: body.toolCallId, allow: body.allow };
}

export function parseCancelRunId(snapshot: ClanRunSnapshot): string | CommandParseError {
  if (snapshot.runId === null) {
    return { error: "no_active_run", status: 409 };
  }
  return snapshot.runId;
}

export function parseDeliveryRunId(snapshot: ClanRunSnapshot): string | CommandParseError {
  if (snapshot.runId === null || snapshot.deliveryStage !== "ready") {
    return { error: "delivery_not_ready", status: 409 };
  }
  return snapshot.runId;
}

export function promptPreview(prompt: string, max = 160): string {
  return prompt.length > max ? `${prompt.slice(0, max)}…` : prompt;
}

export function createCommandEnvelope(input: {
  deviceId: string;
  type: CommandType;
  payload: unknown;
  now?: Date;
}): CommandEnvelope {
  const issued = input.now ?? new Date();
  return {
    version: 1,
    commandId: crypto.randomUUID(),
    deviceId: input.deviceId,
    issuedAt: issued.toISOString(),
    expiresAt: new Date(issued.getTime() + COMMAND_TTL_MS).toISOString(),
    type: input.type,
    payload: input.payload,
  };
}

export function isCommandParseError(
  value: ParsedTaskStart | ParsedApproval | string | CommandParseError,
): value is CommandParseError {
  return typeof value === "object" && "status" in value && "error" in value;
}