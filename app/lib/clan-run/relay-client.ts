import {
  assertLoopbackInternalUrl,
  type InternalCommandResult,
} from "@/app/lib/realtime/relay";
import type { CommandEnvelope } from "../../../clan-cli/packages/protocol/src/network";
import type { ClanRunMode } from "./types";

export type RelayedCommand = InternalCommandResult & {
  httpStatus: number;
  requestId?: string;
  error?: string;
};

export async function relayClanCommand(input: {
  clerkUserId: string;
  command: CommandEnvelope;
  promptPreview?: string;
  mode?: ClanRunMode;
}): Promise<RelayedCommand> {
  const rawUrl = process.env.CLANCODE_REALTIME_INTERNAL_URL ?? "http://127.0.0.1:3001";
  const secret = process.env.CLANCODE_REALTIME_RELAY_SECRET ?? "";
  if (secret.length === 0) {
    return { status: "rejected", reason: "failed", httpStatus: 503, error: "relay_unconfigured" };
  }
  let origin: URL;
  try {
    origin = assertLoopbackInternalUrl(rawUrl);
  } catch {
    return { status: "rejected", reason: "failed", httpStatus: 503, error: "relay_unconfigured" };
  }
  let response: Response;
  try {
    response = await fetch(new URL("/internal/command", origin), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        clerkUserId: input.clerkUserId,
        command: input.command,
        promptPreview: input.promptPreview,
        mode: input.mode,
      }),
    });
  } catch {
    return {
      status: "rejected",
      reason: "failed",
      httpStatus: 503,
      error: "relay_unavailable",
    };
  }
  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    payload = {};
  }
  if (response.status === 401) {
    return { status: "rejected", reason: "failed", httpStatus: 500, error: "internal_error" };
  }
  if (!response.ok) {
    return {
      status: "rejected",
      reason: "failed",
      httpStatus: response.status,
      error: typeof payload.error === "string" ? payload.error : "relay_failed",
      requestId: typeof payload.requestId === "string" ? payload.requestId : undefined,
    };
  }
  const status =
    payload.status === "accepted" ||
    payload.status === "rejected" ||
    payload.status === "duplicate" ||
    payload.status === "expired"
      ? payload.status
      : "rejected";
  return {
    status,
    reason:
      payload.reason === "busy" ||
      payload.reason === "expired" ||
      payload.reason === "unauthorized" ||
      payload.reason === "invalid" ||
      payload.reason === "run_mismatch" ||
      payload.reason === "no_pending_approval" ||
      payload.reason === "no_active_run" ||
      payload.reason === "failed"
        ? payload.reason
        : undefined,
    runId: typeof payload.runId === "string" ? payload.runId : undefined,
    httpStatus: 200,
  };
}