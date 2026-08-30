import { describe, expect, test } from "bun:test";

import { harnessPresenceLabel } from "./harness-presence-label";

describe("harnessPresenceLabel", () => {
  test("uses AI Harness wording", () => {
    expect(harnessPresenceLabel(true, false)).toBe("AI Harness Online");
    expect(harnessPresenceLabel(false, false)).toBe("AI Harness Offline");
    expect(harnessPresenceLabel(null, true)).toBe("Checking harness");
  });
});
