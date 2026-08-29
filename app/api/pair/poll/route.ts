import { NextResponse } from "next/server";

import { pollPairingChallenge } from "@/app/lib/pairing/service";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const deviceCode =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { deviceCode?: unknown }).deviceCode === "string"
      ? (body as { deviceCode: string }).deviceCode
      : undefined;

  if (deviceCode === undefined || deviceCode.length === 0) {
    return NextResponse.json({ error: "deviceCode required" }, { status: 400 });
  }

  try {
    const result = await pollPairingChallenge({ deviceCode });
    if (result.status === "approved") {
      return NextResponse.json({
        status: "approved",
        token: result.token,
        deviceId: result.deviceId,
        controlUrl: result.controlUrl,
      });
    }
    return NextResponse.json({ status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Poll failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
