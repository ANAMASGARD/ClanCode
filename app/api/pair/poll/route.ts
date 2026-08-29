import { NextResponse } from "next/server";

import { pollPairingChallenge } from "@/app/lib/pairing/service";
import { pairingInternalError } from "@/app/lib/pairing/api-errors";
import { isValidDeviceCode } from "@/app/lib/pairing/validation";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const deviceCode =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { deviceCode?: unknown }).deviceCode === "string"
      ? (body as { deviceCode: string }).deviceCode
      : undefined;

  if (deviceCode === undefined || !isValidDeviceCode(deviceCode)) {
    return NextResponse.json({ error: "invalid_device_code" }, { status: 400 });
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
    return pairingInternalError("poll", error);
  }
}
