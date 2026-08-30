import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { transcribeAudioBuffer, validateAudioUpload } from "@/app/lib/audio/transcription";
import { controlPlaneInternalError } from "@/app/lib/pairing/api-errors";

export async function POST(request: Request) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || userId === undefined) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const file = formData.get("audio");
  const validated = validateAudioUpload(file instanceof File ? file : null);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.message }, { status: validated.status });
  }

  try {
    const buffer = await (file as File).arrayBuffer();
    const result = await transcribeAudioBuffer(buffer, validated.mime, (file as File).name || "audio.webm");
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }
    return NextResponse.json({ transcript: result.transcript });
  } catch (error) {
    return controlPlaneInternalError("clan-voice", "transcribe", error);
  }
}
