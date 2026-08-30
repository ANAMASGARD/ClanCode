import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

import {
  hasDeviceCredentials,
  ensureDevicePaired,
  runLoginCommand,
} from "./login.ts";
import { saveStoredCredentials } from "./store.ts";

describe("pairing login gate", () => {
  const stateHome = join("/tmp", `clancode-login-${crypto.randomUUID()}`);

  afterEach(async () => {
    delete process.env.CLANCODE_DEVICE_TOKEN;
    delete process.env.CLANCODE_CONTROL_URL;
    delete process.env.CLANCODE_DEVICE_ID;
    delete process.env.XDG_STATE_HOME;
    await rm(stateHome, { recursive: true, force: true });
  });

  test("hasDeviceCredentials requires full env override", async () => {
    process.env.CLANCODE_DEVICE_TOKEN = "env-token";
    await expect(hasDeviceCredentials()).resolves.toBe(false);
    process.env.CLANCODE_CONTROL_URL = "http://localhost:3001";
    process.env.CLANCODE_DEVICE_ID = "550e8400-e29b-41d4-a716-446655440000";
    await expect(hasDeviceCredentials()).resolves.toBe(true);
  });

  test("hasDeviceCredentials reads stored credentials", async () => {
    process.env.XDG_STATE_HOME = stateHome;
    await mkdir(join(stateHome, "clancode"), { recursive: true });
    await saveStoredCredentials({
      deviceToken: "stored",
      deviceId: "550e8400-e29b-41d4-a716-446655440001",
      controlUrl: "http://localhost:3001",
      pairedAt: new Date().toISOString(),
    });
    await expect(hasDeviceCredentials()).resolves.toBe(true);
  });

  test("ensureDevicePaired skips when already paired", async () => {
    process.env.CLANCODE_DEVICE_TOKEN = "env-token";
    process.env.CLANCODE_CONTROL_URL = "http://localhost:3001";
    process.env.CLANCODE_DEVICE_ID = "550e8400-e29b-41d4-a716-446655440002";
    await expect(ensureDevicePaired()).resolves.toBe(0);
  });

  test("runLoginCommand starts pairing even when credentials already exist", async () => {
    process.env.XDG_STATE_HOME = stateHome;
    await mkdir(join(stateHome, "clancode"), { recursive: true });
    await saveStoredCredentials({
      deviceToken: "stored",
      deviceId: "550e8400-e29b-41d4-a716-446655440003",
      controlUrl: "http://localhost:3001",
      pairedAt: new Date().toISOString(),
    });

    let pairStartCalled = false;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input) => {
      const url = String(input);
      if (url.includes("/api/pair/start")) {
        pairStartCalled = true;
        return new Response(
          JSON.stringify({
            userCode: "ABCD-1234",
            deviceCode: "device-code",
            verifyUrl: "http://localhost:3000/pair?code=x",
            expiresIn: 1,
            interval: 1,
          }),
          { status: 200 },
        );
      }
      if (url.includes("/api/pair/poll")) {
        return new Response(JSON.stringify({ status: "expired" }), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    }) as typeof fetch;

    try {
      const code = await runLoginCommand();
      expect(pairStartCalled).toBe(true);
      expect(code).toBe(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
