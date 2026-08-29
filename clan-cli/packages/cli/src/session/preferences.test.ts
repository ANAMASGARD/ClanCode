import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { loadPreferences, setPreferredModel } from "./preferences.ts";

describe("session preferences", () => {
  test("persists preferred model", async () => {
    const previous = process.env.XDG_STATE_HOME;
    process.env.XDG_STATE_HOME = join("/tmp", `clancode-prefs-${crypto.randomUUID()}`);
    try {
      const updated = await setPreferredModel("openai/gpt-test");
      expect(updated.preferredModel).toBe("openai/gpt-test");
      const reloaded = await loadPreferences();
      expect(reloaded.preferredModel).toBe("openai/gpt-test");
      expect(reloaded.deviceId).toBe(updated.deviceId);
    } finally {
      if (previous === undefined) {
        delete process.env.XDG_STATE_HOME;
      } else {
        process.env.XDG_STATE_HOME = previous;
      }
    }
  });
});
