import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  createCommandEnvelope,
  isCommandParseError,
  parseCancelRunId,
} from "@/app/lib/clan-run/commands";
import { relayClanCommand } from "@/app/lib/clan-run/relay-client";
import { getClanRunSnapshot, applyCancelledRun } from "@/app/lib/clan-run/service";
import { controlPlaneInternalError } from "@/app/lib/pairing/api-errors";

export async function POST() {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || userId === undefined) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await getClanRunSnapshot(userId);
    const runId = parseCancelRunId(snapshot);
    if (isCommandParseError(runId)) {
      return NextResponse.json({ error: runId.error }, { status: runId.status });
    }
    if (snapshot.deviceId === null) {
      return NextResponse.json({ error: "device_offline" }, { status: 503 });
    }
    const result = await relayClanCommand({
      clerkUserId: userId,
      command: createCommandEnvelope({
        deviceId: snapshot.deviceId,
        type: "task.cancel",
        payload: { runId },
      }),
    });
    if (result.error !== undefined && result.httpStatus !== 200) {
      return NextResponse.json(
        { error: result.error, requestId: result.requestId },
        { status: result.httpStatus },
      );
    }
    if (result.status === "accepted") {
      await applyCancelledRun(userId, runId);
    }
    return NextResponse.json({
      status: result.status,
      reason: result.reason,
      runId: result.runId ?? runId,
    });
  } catch (error) {
    return controlPlaneInternalError("clan-run", "task-cancel", error);
  }
}