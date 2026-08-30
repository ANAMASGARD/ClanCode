export const TRANSCRIPTION_MAX_BYTES = 5 * 1024 * 1024;
export const TRANSCRIPTION_MIN_BYTES = 800;
export const TRANSCRIPTION_MAX_DURATION_MS = 120_000;

/** Recommended file-transcription model (OpenAI docs). */
export const TRANSCRIPTION_PRIMARY_MODEL = "gpt-transcribe" as const;

/** Used only when `gpt-transcribe` is unavailable on the account or API. */
export const TRANSCRIPTION_FALLBACK_MODEL = "gpt-4o-transcribe" as const;

/** Last-resort model for short WebM/Opus clips from Chrome on Linux. */
export const TRANSCRIPTION_COMPAT_MODEL = "whisper-1" as const;

export const TRANSCRIPTION_MODELS = [
  TRANSCRIPTION_PRIMARY_MODEL,
  TRANSCRIPTION_FALLBACK_MODEL,
  TRANSCRIPTION_COMPAT_MODEL,
] as const;

export type TranscriptionModel = (typeof TRANSCRIPTION_MODELS)[number];

export const ALLOWED_AUDIO_MIME = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
]);

export type TranscriptionErrorCode =
  | "missing_api_key"
  | "missing_file"
  | "unsupported_mime"
  | "file_too_large"
  | "upstream_error"
  | "empty_transcript";

export type TranscriptionResult =
  | { ok: true; transcript: string; model: TranscriptionModel }
  | { ok: false; code: TranscriptionErrorCode; message: string; status: number };

const OPENAI_TRANSCRIPTIONS_URL = "https://api.openai.com/v1/audio/transcriptions";

/** Domain hint for coding tasks — improves file paths and technical terms. */
const CLANCODE_TRANSCRIPTION_PROMPT =
  "ClanCode developer task. May include repository paths, Git branches, function names, and build commands.";

function normalizeMime(mime: string | null | undefined): string {
  return (mime ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
}

export function validateAudioUpload(
  file: File | null,
): { ok: true; mime: string } | { ok: false; code: TranscriptionErrorCode; message: string; status: number } {
  if (file === null) {
    return { ok: false, code: "missing_file", message: "missing_file", status: 400 };
  }
  const mime = normalizeMime(file.type);
  if (!ALLOWED_AUDIO_MIME.has(mime) && !ALLOWED_AUDIO_MIME.has(file.type.toLowerCase())) {
    return { ok: false, code: "unsupported_mime", message: "unsupported_mime", status: 415 };
  }
  if (file.size > TRANSCRIPTION_MAX_BYTES) {
    return { ok: false, code: "file_too_large", message: "file_too_large", status: 413 };
  }
  if (file.size < TRANSCRIPTION_MIN_BYTES) {
    return { ok: false, code: "empty_transcript", message: "recording_empty", status: 422 };
  }
  return { ok: true, mime: mime || file.type };
}

export function isVoiceConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key !== undefined && key.length > 0;
}

type OpenAiTranscriptionResponse = {
  text?: string;
  error?: { message?: string; code?: string };
};

function shouldTryFallbackModel(status: number, message: string): boolean {
  if (status === 404) {
    return true;
  }
  if (status === 400) {
    return /model|does not exist|not found|unsupported|unknown/i.test(message);
  }
  return false;
}

function buildTranscriptionForm(
  buffer: ArrayBuffer,
  mime: string,
  fileName: string,
  model: TranscriptionModel,
): FormData {
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mime }), fileName);
  form.append("model", model);
  if (model === TRANSCRIPTION_PRIMARY_MODEL || model === TRANSCRIPTION_FALLBACK_MODEL) {
    form.append("prompt", CLANCODE_TRANSCRIPTION_PROMPT);
  }
  if (model === TRANSCRIPTION_COMPAT_MODEL) {
    form.append("language", "en");
  }
  return form;
}

export async function transcribeAudioBuffer(
  buffer: ArrayBuffer,
  mime: string,
  fileName: string,
): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (apiKey === undefined || apiKey.length === 0) {
    return {
      ok: false,
      code: "missing_api_key",
      message: "voice_not_configured",
      status: 503,
    };
  }

  let lastError = "upstream_error";

  for (const model of TRANSCRIPTION_MODELS) {
    const form = buildTranscriptionForm(buffer, mime, fileName, model);
    const response = await fetch(OPENAI_TRANSCRIPTIONS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    let payload: OpenAiTranscriptionResponse;
    try {
      payload = (await response.json()) as OpenAiTranscriptionResponse;
    } catch {
      return {
        ok: false,
        code: "upstream_error",
        message: "transcription_failed",
        status: 502,
      };
    }

    if (response.ok) {
      const transcript = payload.text?.trim() ?? "";
      if (transcript.length === 0) {
        lastError = "empty_transcript";
        continue;
      }
      return { ok: true, transcript, model };
    }

    lastError = payload.error?.message ?? "upstream_error";
    if (shouldTryFallbackModel(response.status, lastError)) {
      continue;
    }
    return {
      ok: false,
      code: "upstream_error",
      message: "transcription_failed",
      status: 502,
    };
  }

  return {
    ok: false,
    code: "empty_transcript",
    message: "empty_transcript",
    status: 422,
  };
}
