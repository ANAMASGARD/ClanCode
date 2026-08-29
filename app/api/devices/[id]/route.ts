import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { revokeDevice } from "@/app/lib/pairing/service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || userId === undefined) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const revoked = await revokeDevice({ deviceId: id, clerkUserId: userId });
  if (!revoked) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
