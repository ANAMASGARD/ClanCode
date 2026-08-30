import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  createCommandEnvelope,
  isCommandParseError,
  parseTaskStartBody,
  pickNewestOnlineDevice,
  promptPreview,
} from "@/app/lib/clan-run/commands";
import { relayClanCommand } from "@/app/lib/clan-run/relay-client";
import { controlPlaneInternalError } from "@/app/lib/pairing/api-errors";
import { listDevicesForUser } from "@/app/lib/pairing/service";

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

  const parsed = parseTaskStartBody(body);
  if (isCommandParseError(parsed)) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  try {
    const devices = await listDevicesForUser(userId);
    const device = pickNewestOnlineDevice(devices);
    if (device === undefined) {
      return NextResponse.json({ error: "device_offline" }, { status: 503 });
    }
    const command = createCommandEnvelope({
      deviceId: device.id,
      type: "task.start",
      payload: { prompt: parsed.prompt, mode: parsed.mode },
    });
    const result = await relayClanCommand({
      clerkUserId: userId,
      command,
      promptPreview: promptPreview(parsed.prompt),
      mode: parsed.mode,
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
      runId: result.runId,
    });
  } catch (error) {
    return controlPlaneInternalError("clan-run", "task-start", error);
  }
}