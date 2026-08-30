import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  createCommandEnvelope,
  isCommandParseError,
  parseDeliveryRunId,
} from "@/app/lib/clan-run/commands";
import { relayClanCommand } from "@/app/lib/clan-run/relay-client";
import { getClanRunSnapshot } from "@/app/lib/clan-run/service";
import { controlPlaneInternalError } from "@/app/lib/pairing/api-errors";

export async function POST(request: Request) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || userId === undefined) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let title: string | undefined;
  try {
    const body: unknown = await request.json();
    if (body !== null && typeof body === "object" && "title" in body) {
      const value = (body as { title?: unknown }).title;
      if (typeof value === "string" && value.trim().length > 0) {
        title = value.trim().slice(0, 120);
      }
    }
  } catch {
    title = undefined;
  }

  try {
    const snapshot = await getClanRunSnapshot(userId);
    const runId = parseDeliveryRunId(snapshot);
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
        type: "delivery.create_pr",
        payload: { runId, title },
      }),
    });
    if (result.error !== undefined && result.httpStatus !== 200) {
      return NextResponse.json(
        { error: result.error, requestId: result.requestId },
        { status: result.httpStatus },
      );
    }
    return NextResponse.json({
      status: result.status,
      reason: result.reason,
      runId: result.runId ?? runId,
    });
  } catch (error) {
    return controlPlaneInternalError("clan-run", "delivery-pr", error);
  }
}