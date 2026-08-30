import { afterEach, describe, expect, test } from "bun:test";

import { relayClanCommand } from "./relay-client";

describe("relayClanCommand", () => {
  const previousSecret = process.env.CLANCODE_REALTIME_RELAY_SECRET;
  const previousUrl = process.env.CLANCODE_REALTIME_INTERNAL_URL;

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.CLANCODE_REALTIME_RELAY_SECRET;
    } else {
      process.env.CLANCODE_REALTIME_RELAY_SECRET = previousSecret;
    }
    if (previousUrl === undefined) {
      delete process.env.CLANCODE_REALTIME_INTERNAL_URL;
    } else {
      process.env.CLANCODE_REALTIME_INTERNAL_URL = previousUrl;
    }
  });

  test("network failure returns relay_unavailable", async () => {
    process.env.CLANCODE_REALTIME_RELAY_SECRET = "relay-secret";
    process.env.CLANCODE_REALTIME_INTERNAL_URL = "http://127.0.0.1:1";
    const result = await relayClanCommand({
      clerkUserId: "user-1",
      command: {
        version: 1,
        commandId: crypto.randomUUID(),
        deviceId: "550e8400-e29b-41d4-a716-446655440000",
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        type: "task.cancel",
        payload: { runId: "run-1" },
      },
    });
    expect(result.httpStatus).toBe(503);
    expect(result.error).toBe("relay_unavailable");
  });
});
