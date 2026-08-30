import { describe, expect, test } from "bun:test";

import {
  ALLOWED_AUDIO_MIME,
  isVoiceConfigured,
  TRANSCRIPTION_FALLBACK_MODEL,
  TRANSCRIPTION_MODELS,
  TRANSCRIPTION_PRIMARY_MODEL,
  transcribeAudioBuffer,
  validateAudioUpload,
} from "@/app/lib/audio/transcription";

describe("validateAudioUpload", () => {
  test("rejects missing file", () => {
    const result = validateAudioUpload(null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("missing_file");
      expect(result.status).toBe(400);
    }
  });

  test("rejects unsupported mime", () => {
    const file = new File(["x"], "x.txt", { type: "text/plain" });
    const result = validateAudioUpload(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("unsupported_mime");
      expect(result.status).toBe(415);
    }
  });

  test("rejects oversized file", () => {
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    const file = new File([big], "big.webm", { type: "audio/webm" });
    const result = validateAudioUpload(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("file_too_large");
      expect(result.status).toBe(413);
    }
  });

  test("accepts allowed mime types", () => {
    const payload = new Uint8Array(1200).fill(1);
    for (const mime of ALLOWED_AUDIO_MIME) {
      const file = new File([payload], "clip.webm", { type: mime });
      const result = validateAudioUpload(file);
      expect(result.ok).toBe(true);
    }
  });

  test("rejects tiny recordings", () => {
    const file = new File(["abc"], "tiny.webm", { type: "audio/webm" });
    const result = validateAudioUpload(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("empty_transcript");
      expect(result.message).toBe("recording_empty");
    }
  });
});

describe("isVoiceConfigured", () => {
  test("reflects OPENAI_API_KEY presence", () => {
    const previous = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "";
    expect(isVoiceConfigured()).toBe(false);
    process.env.OPENAI_API_KEY = "test-key";
    expect(isVoiceConfigured()).toBe(true);
    process.env.OPENAI_API_KEY = previous;
  });
});

describe("transcription models", () => {
  test("prefers gpt-transcribe with gpt-4o-transcribe fallback only", () => {
    expect(TRANSCRIPTION_PRIMARY_MODEL).toBe("gpt-transcribe");
    expect(TRANSCRIPTION_FALLBACK_MODEL).toBe("gpt-4o-transcribe");
    expect(TRANSCRIPTION_MODELS).toEqual(["gpt-transcribe", "gpt-4o-transcribe", "whisper-1"]);
  });
});

describe("transcribeAudioBuffer", () => {
  test("fails closed without api key", async () => {
    const previous = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "";
    const result = await transcribeAudioBuffer(new ArrayBuffer(8), "audio/webm", "a.webm");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("missing_api_key");
      expect(result.status).toBe(503);
    }
    process.env.OPENAI_API_KEY = previous;
  });

  test("falls back to gpt-4o-transcribe when gpt-transcribe is unavailable", async () => {
    const previous = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "test-key";
    const originalFetch = globalThis.fetch;
    const calls: string[] = [];

    globalThis.fetch = (async (_input, init) => {
      const body = init?.body;
      if (body instanceof FormData) {
        calls.push(String(body.get("model")));
      }
      if (calls.length === 1) {
        return new Response(JSON.stringify({ error: { message: "model not found" } }), {
          status: 404,
        });
      }
      return new Response(JSON.stringify({ text: "delete demo file" }), { status: 200 });
    }) as typeof fetch;

    try {
      const result = await transcribeAudioBuffer(new ArrayBuffer(8), "audio/webm", "a.webm");
      expect(calls).toEqual(["gpt-transcribe", "gpt-4o-transcribe"]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.transcript).toBe("delete demo file");
        expect(result.model).toBe("gpt-4o-transcribe");
      }
    } finally {
      globalThis.fetch = originalFetch;
      process.env.OPENAI_API_KEY = previous;
    }
  });

  test("falls back when primary model returns empty transcript", async () => {
    const previous = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "test-key";
    const originalFetch = globalThis.fetch;
    const calls: string[] = [];

    globalThis.fetch = (async (_input, init) => {
      const body = init?.body;
      if (body instanceof FormData) {
        calls.push(String(body.get("model")));
      }
      if (calls.length === 1) {
        return new Response(JSON.stringify({ text: "   " }), { status: 200 });
      }
      return new Response(JSON.stringify({ text: "fix the login bug" }), { status: 200 });
    }) as typeof fetch;

    try {
      const result = await transcribeAudioBuffer(new ArrayBuffer(1200), "audio/webm", "a.webm");
      expect(calls).toEqual(["gpt-transcribe", "gpt-4o-transcribe"]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.transcript).toBe("fix the login bug");
        expect(result.model).toBe("gpt-4o-transcribe");
      }
    } finally {
      globalThis.fetch = originalFetch;
      process.env.OPENAI_API_KEY = previous;
    }
  });
});
