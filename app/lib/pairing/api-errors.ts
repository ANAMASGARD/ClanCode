import { NextResponse } from "next/server";

export function controlPlaneInternalError(
  scope: string,
  operation: string,
  error: unknown,
): NextResponse {
  const requestId = crypto.randomUUID();
  console.error(`[${scope}:${operation}] requestId=${requestId}`, error);
  return NextResponse.json(
    { error: "internal_error", requestId },
    { status: 500 },
  );
}

export function pairingInternalError(
  operation: string,
  error: unknown,
): NextResponse {
  return controlPlaneInternalError("pairing", operation, error);
}
