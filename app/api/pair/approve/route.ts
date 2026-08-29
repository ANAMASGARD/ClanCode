import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { approvePairingChallenge } from "@/app/lib/pairing/service";

export async function POST(request: Request) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || userId === undefined) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const userCode =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { userCode?: unknown }).userCode === "string"
      ? (body as { userCode: string }).userCode
      : undefined;
  const label =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { label?: unknown }).label === "string"
      ? (body as { label: string }).label.slice(0, 120)
      : undefined;

  if (userCode === undefined || userCode.length === 0) {
    return NextResponse.json({ error: "userCode required" }, { status: 400 });
  }

  const result = await approvePairingChallenge({
    userCode,
    clerkUserId: userId,
    label,
  });
  if (!result.ok) {
    const status =
      result.reason === "not_found"
        ? 404
        : result.reason === "expired"
          ? 410
          : 409;
    return NextResponse.json({ error: result.reason }, { status });
  }
  return NextResponse.json({ ok: true, deviceId: result.deviceId });
}
