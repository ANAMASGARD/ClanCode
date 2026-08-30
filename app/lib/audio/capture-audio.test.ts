import { describe, expect, test } from "bun:test";

import { extensionForMime, pickMediaRecorderMimeType } from "./capture-audio";
import { voiceErrorMessage } from "./voice-errors";

describe("capture-audio helpers", () => {
  test("maps mime types to file extensions", () => {
    expect(extensionForMime("audio/webm;codecs=opus")).toBe("webm");
    expect(extensionForMime("audio/ogg;codecs=opus")).toBe("ogg");
    expect(extensionForMime("audio/mp4")).toBe("m4a");
  });

  test("prefers opus webm when supported", () => {
    expect(pickMediaRecorderMimeType()).toMatch(/webm|ogg|mp4/);
  });
});

describe("voiceErrorMessage", () => {
  test("humanizes empty transcript", () => {
    expect(voiceErrorMessage("empty_transcript")).toContain("No speech detected");
  });
});
