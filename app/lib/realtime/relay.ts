import type { IncomingMessage, ServerResponse } from "node:http";
import type { Socket } from "socket.io";
import {
  parseCommandEnvelope,
  type CommandAckPayload,
  type CommandEnvelope,
} from "../../../clan-cli/packages/protocol/src/network";
import { hashToken, safeCompareHashes } from "@/app/lib/pairing/constants";
import type { ClanRunMode } from "@/app/lib/clan-run/types";

export const DEFAULT_COMMAND_ACK_TIMEOUT_MS = 45_000;
export const MAX_INTERNAL_COMMAND_BYTES = 32 * 1024;

export type InternalCommandRequest = {
  clerkUserId: string;
  command: CommandEnvelope;
  promptPreview?: string;
  mode?: ClanRunMode;
};

export type InternalCommandResult = {
  status: CommandAckPayload["status"];
  reason?: CommandAckPayload["reason"];
  runId?: string;
};

type PendingAck = {
  commandId: string;
  expectedSocketId: string;
  expectedDeviceId: string;
  clerkUserId: string;
  promptPreview?: string;
  mode?: ClanRunMode;
  resolve: (result: InternalCommandResult) => void;
  timer: ReturnType<typeof setTimeout>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function assertLoopbackInternalUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("internal_url_invalid");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("internal_url_invalid");
  }
  if (parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost") {
    throw new Error("internal_url_not_loopback");
  }
  return parsed;
}

export function authorizeRelaySecret(header: string | undefined, expected: string): boolean {
  if (header === undefined || !header.startsWith("Bearer ")) {
    return false;
  }
  const presented = header.slice("Bearer ".length).trim();
  if (presented.length === 0 || expected.length === 0) {
    return false;
  }
  return safeCompareHashes(hashToken(presented), hashToken(expected));
}

export function createAckRegistry(timeoutMs: number) {
  const pending = new Map<string, PendingAck>();

  function rejectSocket(socketId: string, reason: CommandAckPayload["reason"] = "failed"): void {
    for (const [commandId, entry] of pending) {
      if (entry.expectedSocketId === socketId) {
        clearTimeout(entry.timer);
        pending.delete(commandId);
        entry.resolve({ status: "rejected", reason });
      }
    }
  }

  function rejectAll(reason: CommandAckPayload["reason"] = "failed"): void {
    for (const [commandId, entry] of pending) {
      clearTimeout(entry.timer);
      pending.delete(commandId);
      entry.resolve({ status: "rejected", reason });
    }
  }

  function register(entry: Omit<PendingAck, "timer" | "resolve">): Promise<InternalCommandResult> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        pending.delete(entry.commandId);
        resolve({ status: "rejected", reason: "expired" });
      }, timeoutMs);
      pending.set(entry.commandId, { ...entry, resolve, timer });
    });
  }

  function resolveAck(
    socketId: string,
    deviceId: string,
    payload: unknown,
  ): PendingAck | undefined {
    if (!isRecord(payload) || typeof payload.commandId !== "string") {
      return undefined;
    }
    const entry = pending.get(payload.commandId);
    if (entry === undefined) {
      return undefined;
    }
    if (entry.expectedSocketId !== socketId || entry.expectedDeviceId !== deviceId) {
      return undefined;
    }
    const status = payload.status;
    if (
      status !== "accepted" &&
      status !== "rejected" &&
      status !== "duplicate" &&
      status !== "expired"
    ) {
      return undefined;
    }
    clearTimeout(entry.timer);
    pending.delete(entry.commandId);
    entry.resolve({
      status,
      reason: typeof payload.reason === "string" ? (payload.reason as CommandAckPayload["reason"]) : undefined,
      runId: typeof payload.runId === "string" ? payload.runId : undefined,
    });
    return entry;
  }

  return { register, resolveAck, rejectSocket, rejectAll };
}

export type CommandRelayContext = {
  relaySecret: string;
  ack: ReturnType<typeof createAckRegistry>;
  pickSocket: (deviceId: string) => Socket | undefined;
  onAccepted?: (input: {
    clerkUserId: string;
    deviceId: string;
    runId: string;
    requestedMode: ClanRunMode;
    promptPreview: string;
  }) => Promise<void>;
};

function readBody(req: IncomingMessage, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("payload_too_large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

export async function handleInternalCommand(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: CommandRelayContext,
): Promise<void> {
  const requestId = crypto.randomUUID();
  try {
    if (!authorizeRelaySecret(req.headers.authorization, ctx.relaySecret)) {
      json(res, 401, { error: "unauthorized", requestId });
      return;
    }
    let raw: unknown;
    try {
      raw = JSON.parse(await readBody(req, MAX_INTERNAL_COMMAND_BYTES));
    } catch (error) {
      const tooLarge = error instanceof Error && error.message === "payload_too_large";
      json(res, tooLarge ? 413 : 400, { error: tooLarge ? "payload_too_large" : "invalid_json", requestId });
      return;
    }
    if (!isRecord(raw) || typeof raw.clerkUserId !== "string" || raw.clerkUserId.length === 0) {
      json(res, 400, { error: "invalid_payload", requestId });
      return;
    }
    let command: CommandEnvelope;
    try {
      command = parseCommandEnvelope(raw.command);
    } catch {
      json(res, 400, { error: "invalid_command", requestId });
      return;
    }
    if (Date.parse(command.expiresAt) <= Date.now()) {
      json(res, 400, { error: "expired", requestId });
      return;
    }
    const socket = ctx.pickSocket(command.deviceId);
    if (socket === undefined) {
      json(res, 503, { error: "device_offline", requestId });
      return;
    }
    if (socket.data.clerkUserId !== raw.clerkUserId) {
      json(res, 403, { error: "forbidden", requestId });
      return;
    }
    const mode = raw.mode === "plan" || raw.mode === "build" ? raw.mode : undefined;
    const promptPreview = typeof raw.promptPreview === "string" ? raw.promptPreview : undefined;
    const ackPromise = ctx.ack.register({
      commandId: command.commandId,
      expectedSocketId: socket.id,
      expectedDeviceId: command.deviceId,
      clerkUserId: raw.clerkUserId,
      promptPreview,
      mode,
    });
    socket.emit("command", command);
    const result = await ackPromise;
    if (
      result.status === "accepted" &&
      result.runId !== undefined &&
      ctx.onAccepted !== undefined &&
      command.type === "task.start"
    ) {
      await ctx.onAccepted({
        clerkUserId: raw.clerkUserId,
        deviceId: command.deviceId,
        runId: result.runId,
        requestedMode: mode ?? "build",
        promptPreview: promptPreview ?? "",
      });
    }
    json(res, 200, result);
  } catch (error) {
    console.error(`[realtime:internal-command] requestId=${requestId}`, error);
    json(res, 500, { error: "internal_error", requestId });
  }
}
