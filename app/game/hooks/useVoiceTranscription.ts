"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createMediaRecorder,
  extensionForMime,
  MIN_RECORDING_BYTES,
  MIN_RECORDING_MS,
  openPreferredMicrophoneStream,
} from "@/app/lib/audio/capture-audio";
import { voiceErrorMessage } from "@/app/lib/audio/voice-errors";
import { TRANSCRIPTION_MAX_DURATION_MS } from "@/app/lib/audio/transcription";

type VoiceState = "idle" | "recording" | "transcribing";

export type UseVoiceTranscriptionResult = {
  voiceConfigured: boolean;
  state: VoiceState;
  seconds: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
};

function appendTranscript(current: string, transcript: string): string {
  const trimmed = transcript.trim();
  if (trimmed.length === 0) {
    return current;
  }
  if (current.trim().length === 0) {
    return trimmed;
  }
  return `${current.replace(/\s+$/, "")} ${trimmed}`;
}

export function useVoiceTranscription(
  onTranscript: (next: string) => void,
  enabled: boolean,
): UseVoiceTranscriptionResult {
  const [voiceConfigured, setVoiceConfigured] = useState(false);
  const [state, setState] = useState<VoiceState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const startedAtRef = useRef<number>(0);
  const stoppingRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let active = true;
    void fetch("/api/clan/voice-config", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok || !active) {
          return;
        }
        const payload = (await response.json()) as { voiceConfigured?: boolean };
        if (active) {
          setVoiceConfigured(Boolean(payload.voiceConfigured));
        }
      })
      .catch(() => {
        if (active) {
          setVoiceConfigured(false);
        }
      });
    return () => {
      active = false;
    };
  }, [enabled]);

  const cleanupStream = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    stoppingRef.current = false;
    setSeconds(0);
  }, []);

  useEffect(() => cleanupStream, [cleanupStream]);

  const setVoiceError = useCallback((code: string) => {
    setError(voiceErrorMessage(code));
  }, []);

  const upload = useCallback(
    async (blob: Blob, fileName: string) => {
      setState("transcribing");
      setError(null);
      try {
        const form = new FormData();
        form.append("audio", blob, fileName);
        const response = await fetch("/api/clan/transcribe", { method: "POST", body: form });
        const payload = (await response.json()) as { transcript?: string; error?: string };
        if (!response.ok) {
          setVoiceError(payload.error ?? "transcription_failed");
          return;
        }
        if (payload.transcript !== undefined) {
          onTranscript(payload.transcript);
        }
      } catch {
        setVoiceError("network_error");
      } finally {
        setState("idle");
      }
    },
    [onTranscript, setVoiceError],
  );

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder === null || recorder.state === "inactive" || stoppingRef.current) {
      return;
    }

    const elapsed = Date.now() - startedAtRef.current;
    if (elapsed < MIN_RECORDING_MS) {
      stoppingRef.current = true;
      if (typeof recorder.requestData === "function") {
        recorder.requestData();
      }
      recorder.stop();
      return;
    }

    stoppingRef.current = true;
    if (typeof recorder.requestData === "function") {
      recorder.requestData();
    }
    recorder.stop();
  }, [setVoiceError]);

  const startRecording = useCallback(async () => {
    if (!voiceConfigured || state !== "idle") {
      return;
    }
    setError(null);
    try {
      const stream = await openPreferredMicrophoneStream({ preferStereo: true });
      streamRef.current = stream;
      const recorder = createMediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mime = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        const elapsed = Date.now() - startedAtRef.current;
        cleanupStream();

        if (elapsed < MIN_RECORDING_MS) {
          setVoiceError("recording_too_short");
          setState("idle");
          return;
        }
        if (blob.size < MIN_RECORDING_BYTES) {
          setVoiceError("recording_empty");
          setState("idle");
          return;
        }

        const fileName = `recording.${extensionForMime(mime)}`;
        void upload(blob, fileName);
      };

      recorder.start(200);
      startedAtRef.current = Date.now();
      setState("recording");
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAtRef.current;
        setSeconds(Math.floor(elapsed / 1000));
        if (elapsed >= TRANSCRIPTION_MAX_DURATION_MS) {
          stopRecording();
        }
      }, 200);
    } catch (error) {
      cleanupStream();
      setState("idle");
      const name = error instanceof Error ? error.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setVoiceError("microphone_denied");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setVoiceError("microphone_unavailable");
      } else {
        setVoiceError("microphone_unavailable");
      }
    }
  }, [cleanupStream, setVoiceError, state, stopRecording, upload, voiceConfigured]);

  return {
    voiceConfigured,
    state,
    seconds,
    error,
    startRecording,
    stopRecording,
  };
}

export { appendTranscript };
