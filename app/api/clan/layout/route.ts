import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getLayoutForUser, saveLayoutForUser } from "@/app/lib/clan-layout/service";

export async function GET() {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || userId === undefined) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const placements = await getLayoutForUser(userId);
    return NextResponse.json({ placements });
  } catch (error) {
    console.error("clan layout GET failed", error);
    return NextResponse.json({ placements: null });
  }
}

export async function PUT(request: Request) {
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

  if (!body || typeof body !== "object" || !("placements" in body)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    const result = await saveLayoutForUser(userId, (body as { placements: unknown }).placements);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ placements: result.placements });
  } catch (error) {
    console.error("clan layout PUT failed", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
