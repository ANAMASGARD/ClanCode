import { NextResponse } from "next/server";

export function pairingInternalError(
  operation: string,
  error: unknown,
): NextResponse {
  const requestId = crypto.randomUUID();
  console.error(`[pairing:${operation}] requestId=${requestId}`, error);
  return NextResponse.json(
    { error: "internal_error", requestId },
    { status: 500 },
  );
}
