/** Maps server/client voice error codes to readable UI copy. */
export function voiceErrorMessage(code: string | null | undefined): string | null {
  if (code === null || code === undefined || code.length === 0) {
    return null;
  }
  switch (code) {
    case "empty_transcript":
      return "No speech detected. Record at least 2 seconds, speak clearly, then stop.";
    case "recording_too_short":
      return "Recording too short. Hold the record button while you speak.";
    case "recording_empty":
      return "No audio captured. Check Chrome mic permissions for localhost.";
    case "microphone_denied":
      return "Microphone blocked. Allow mic access for this site in Chrome.";
    case "microphone_unavailable":
      return "No microphone found. Plug in or enable your stereo mic in Chrome.";
    case "voice_not_configured":
      return "Voice is not configured on the server.";
    case "unsupported_mime":
      return "This browser recording format is not supported.";
    case "file_too_large":
      return "Recording is too long. Send a shorter clip.";
    case "network_error":
      return "Could not reach the transcription service.";
    case "transcription_failed":
      return "Transcription failed. Try again.";
    default:
      return code.replaceAll("_", " ");
  }
}
