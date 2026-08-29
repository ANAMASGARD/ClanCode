import { NextResponse } from "next/server";

import { startPairingChallenge } from "@/app/lib/pairing/service";
import { pairingInternalError } from "@/app/lib/pairing/api-errors";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const record = typeof body === "object" && body !== null ? body : {};
  const hostname =
    typeof (record as { hostname?: unknown }).hostname === "string"
      ? (record as { hostname: string }).hostname.slice(0, 120)
      : undefined;
  const platform =
    typeof (record as { platform?: unknown }).platform === "string"
      ? (record as { platform: string }).platform.slice(0, 80)
      : undefined;

  try {
    const result = await startPairingChallenge({ hostname, platform });
    return NextResponse.json(result);
  } catch (error) {
    return pairingInternalError("start", error);
  }
}
