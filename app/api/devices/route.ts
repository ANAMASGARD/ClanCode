import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { listDevicesForUser } from "@/app/lib/pairing/service";

export async function GET() {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || userId === undefined) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const devices = await listDevicesForUser(userId);
  return NextResponse.json({ devices });
}
