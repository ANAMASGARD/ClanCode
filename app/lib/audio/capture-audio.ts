export const MIN_RECORDING_MS = 900;
export const MIN_RECORDING_BYTES = 1200;

const RECORDER_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
] as const;

export type MicrophoneCaptureOptions = {
  preferStereo?: boolean;
};

function stereoAudioConstraints(deviceId?: string): MediaTrackConstraints {
  return {
    ...(deviceId !== undefined ? { deviceId: { exact: deviceId } } : {}),
    channelCount: { ideal: 2, min: 1 },
    sampleRate: { ideal: 48000 },
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: true,
  };
}

/** Prefer a stereo-capable Linux/Chrome input when labels are available. */
async function ensureMicrophonePermissionForLabels(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return;
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  const hasLabels = devices.some(
    (device) => device.kind === "audioinput" && device.label.trim().length > 0,
  );
  if (hasLabels) {
    return;
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
}

function scoreMicrophoneInput(label: string): number {
  const normalized = label.toLowerCase();
  if (/stereo/.test(normalized)) return 100;
  if (/duo|array|2.?ch/.test(normalized)) return 80;
  if (/mic|input|capture|usb|headset|webcam/.test(normalized)) return 40;
  if (/default|built-?in|internal/.test(normalized)) return 20;
  return 10;
}

/** Prefer a stereo-capable Linux/Chrome input when labels are available. */
export async function pickPreferredMicrophoneDeviceId(): Promise<string | undefined> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return undefined;
  }

  try {
    await ensureMicrophonePermissionForLabels();
  } catch {
    return undefined;
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  const inputs = devices.filter(
    (device) => device.kind === "audioinput" && device.deviceId.length > 0,
  );
  if (inputs.length === 0) {
    return undefined;
  }

  const ranked = [...inputs].sort((a, b) => scoreMicrophoneInput(b.label) - scoreMicrophoneInput(a.label));
  const stereo = ranked.find((device) => /stereo/i.test(device.label));
  if (stereo !== undefined) {
    return stereo.deviceId;
  }

  return ranked[0]?.deviceId;
}

export async function openPreferredMicrophoneStream(
  options: MicrophoneCaptureOptions = {},
): Promise<MediaStream> {
  const preferStereo = options.preferStereo ?? true;
  let deviceId: string | undefined;

  if (preferStereo) {
    try {
      deviceId = await pickPreferredMicrophoneDeviceId();
    } catch {
      deviceId = undefined;
    }
  }

  const attempts: MediaStreamConstraints[] = [];
  if (deviceId !== undefined) {
    attempts.push({ audio: stereoAudioConstraints(deviceId) });
    attempts.push({
      audio: {
        ...stereoAudioConstraints(undefined),
        deviceId: { ideal: deviceId },
      },
    });
  }
  attempts.push({ audio: stereoAudioConstraints(undefined) });
  attempts.push({ audio: true });

  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("microphone_unavailable");
}

export function pickMediaRecorderMimeType(): string {
  if (typeof MediaRecorder !== "undefined") {
    for (const mime of RECORDER_MIME_CANDIDATES) {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    }
  }
  return "audio/webm";
}

export function extensionForMime(mime: string): string {
  const base = mime.split(";")[0]?.trim().toLowerCase() ?? "audio/webm";
  if (base.includes("ogg")) return "ogg";
  if (base.includes("mp4")) return "m4a";
  if (base.includes("mpeg")) return "mp3";
  if (base.includes("wav")) return "wav";
  return "webm";
}

export function createMediaRecorder(stream: MediaStream): MediaRecorder {
  const mimeType = pickMediaRecorderMimeType();
  try {
    return new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128_000 });
  } catch {
    return new MediaRecorder(stream);
  }
}

export async function finalizeRecorderBlob(recorder: MediaRecorder, chunks: Blob[]): Promise<Blob> {
  if (recorder.state !== "inactive") {
    if (typeof recorder.requestData === "function") {
      recorder.requestData();
    }
    await new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
    });
  }
  const mime = recorder.mimeType || pickMediaRecorderMimeType();
  return new Blob(chunks, { type: mime });
}
