import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getClanRunSnapshot } from "@/app/lib/clan-run/service";
import { type ClanRunView } from "@/app/lib/clan-run/types";
import { controlPlaneInternalError } from "@/app/lib/pairing/api-errors";
import { listDevicesForUser } from "@/app/lib/pairing/service";

export async function GET() {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || userId === undefined) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [snapshot, devices] = await Promise.all([
      getClanRunSnapshot(userId),
      listDevicesForUser(userId),
    ]);
    const deviceOnline =
      snapshot.deviceId === null
        ? devices.some((device) => device.online)
        : devices.some((device) => device.id === snapshot.deviceId && device.online);
    const view: ClanRunView = {
      ...snapshot,
      deviceOnline,
    };
    return NextResponse.json(view);
  } catch (error) {
    return controlPlaneInternalError("clan-run", "get", error);
  }
}