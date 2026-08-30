import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  createCommandEnvelope,
  isCommandParseError,
  parseCancelRunId,
} from "@/app/lib/clan-run/commands";
import { relayClanCommand } from "@/app/lib/clan-run/relay-client";
import {
  applyCancelledRun,
  getClanRunSnapshot,
  resetRunProjection,
} from "@/app/lib/clan-run/service";
import type { ArchivedActivityLine } from "@/app/lib/db/schema/clan-run-session-logs";
import { controlPlaneInternalError } from "@/app/lib/pairing/api-errors";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseActivity(body: unknown): ArchivedActivityLine[] {
  if (!isRecord(body) || !Array.isArray(body.activity)) {
    return [];
  }
  const rows: ArchivedActivityLine[] = [];
  for (const item of body.activity) {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.text !== "string") {
      continue;
    }
    if (item.kind !== "user" && item.kind !== "system") {
      continue;
    }
    rows.push({
      id: item.id,
      kind: item.kind,
      text: item.text,
      href: typeof item.href === "string" ? item.href : undefined,
    });
  }
  return rows;
}

export async function POST(request: Request) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || userId === undefined) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const activity = parseActivity(body);

  try {
    const snapshot = await getClanRunSnapshot(userId);
    const runId = parseCancelRunId(snapshot);
    if (!isCommandParseError(runId) && snapshot.deviceId !== null) {
      const result = await relayClanCommand({
        clerkUserId: userId,
        command: createCommandEnvelope({
          deviceId: snapshot.deviceId,
          type: "task.cancel",
          payload: { runId },
        }),
      });
      if (result.status === "accepted") {
        await applyCancelledRun(userId, runId);
      }
    }

    const next = await resetRunProjection({ clerkUserId: userId, activity });
    return NextResponse.json({ status: "ok", phase: next.phase, runId: next.runId });
  } catch (error) {
    return controlPlaneInternalError("clan-run", "run-reset", error);
  }
}
