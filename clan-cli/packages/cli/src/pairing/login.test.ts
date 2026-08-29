import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

import { hasDeviceCredentials, ensureDevicePaired } from "./login.ts";
import { saveStoredCredentials } from "./store.ts";

describe("pairing login gate", () => {
  const stateHome = join("/tmp", `clancode-login-${crypto.randomUUID()}`);

  afterEach(async () => {
    delete process.env.CLANCODE_DEVICE_TOKEN;
    delete process.env.XDG_STATE_HOME;
    await rm(stateHome, { recursive: true, force: true });
  });

  test("hasDeviceCredentials respects env override", async () => {
    process.env.CLANCODE_DEVICE_TOKEN = "env-token";
    await expect(hasDeviceCredentials()).resolves.toBe(true);
  });

  test("hasDeviceCredentials reads stored credentials", async () => {
    process.env.XDG_STATE_HOME = stateHome;
    await mkdir(join(stateHome, "clancode"), { recursive: true });
    await saveStoredCredentials({
      deviceToken: "stored",
      deviceId: "device-1",
      controlUrl: "http://localhost:3001",
      pairedAt: new Date().toISOString(),
    });
    await expect(hasDeviceCredentials()).resolves.toBe(true);
  });

  test("ensureDevicePaired skips when already paired", async () => {
    process.env.CLANCODE_DEVICE_TOKEN = "env-token";
    await expect(ensureDevicePaired()).resolves.toBe(0);
  });
});
