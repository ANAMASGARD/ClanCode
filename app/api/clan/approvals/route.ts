import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  createCommandEnvelope,
  isCommandParseError,
  parseApprovalBody,
} from "@/app/lib/clan-run/commands";
import { relayClanCommand } from "@/app/lib/clan-run/relay-client";
import { getClanRunSnapshot } from "@/app/lib/clan-run/service";
import { controlPlaneInternalError } from "@/app/lib/pairing/api-errors";

export async function POST(request: Request) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || userId === undefined) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const snapshot = await getClanRunSnapshot(userId);
    const parsed = parseApprovalBody(body, snapshot);
    if (isCommandParseError(parsed)) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }
    if (snapshot.deviceId === null) {
      return NextResponse.json({ error: "device_offline" }, { status: 503 });
    }
    const result = await relayClanCommand({
      clerkUserId: userId,
      command: createCommandEnvelope({
        deviceId: snapshot.deviceId,
        type: "approval.resolve",
        payload: parsed,
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
      runId: result.runId ?? parsed.runId,
    });
  } catch (error) {
    return controlPlaneInternalError("clan-run", "approval", error);
  }
}