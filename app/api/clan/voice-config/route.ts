import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { isVoiceConfigured } from "@/app/lib/audio/transcription";

export async function GET() {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || userId === undefined) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ voiceConfigured: isVoiceConfigured() });
}
