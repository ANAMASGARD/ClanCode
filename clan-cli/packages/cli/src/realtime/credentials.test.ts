import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";

import {
  CompositeCredentialsProvider,
  resolveConnectUrl,
} from "./credentials.ts";
import { saveStoredCredentials } from "../pairing/store.ts";

describe("realtime credentials", () => {
  const stateHome = join("/tmp", `clancode-creds-${crypto.randomUUID()}`);

  afterEach(async () => {
    delete process.env.CLANCODE_DEVICE_TOKEN;
    delete process.env.CLANCODE_CONTROL_URL;
    delete process.env.XDG_STATE_HOME;
    await rm(stateHome, { recursive: true, force: true });
  });

  test("env override wins", async () => {
    process.env.CLANCODE_DEVICE_TOKEN = "env-token";
    const provider = new CompositeCredentialsProvider();
    await expect(provider.getToken()).resolves.toBe("env-token");
  });

  test("stored credentials are used when env is unset", async () => {
    process.env.XDG_STATE_HOME = stateHome;
    await mkdir(join(stateHome, "clancode"), { recursive: true });
    await saveStoredCredentials({
      deviceToken: "stored-token",
      deviceId: "device-1",
      controlUrl: "http://localhost:3001",
      pairedAt: new Date().toISOString(),
    });
    const provider = new CompositeCredentialsProvider();
    await expect(provider.getToken()).resolves.toBe("stored-token");
    await expect(resolveConnectUrl()).resolves.toBe("http://localhost:3001");
  });

  test("missing credentials fail closed", async () => {
    process.env.XDG_STATE_HOME = stateHome;
    await mkdir(join(stateHome, "clancode"), { recursive: true });
    const provider = new CompositeCredentialsProvider();
    await expect(provider.getToken()).rejects.toThrow(/clancode login/);
  });

  test("credentials file is mode 0600", async () => {
    process.env.XDG_STATE_HOME = stateHome;
    await saveStoredCredentials({
      deviceToken: "stored-token",
      deviceId: "device-1",
      controlUrl: "http://localhost:3001",
      pairedAt: new Date().toISOString(),
    });
    const file = join(stateHome, "clancode", "credentials.json");
    const stat = await Bun.file(file).stat();
    expect(stat.mode & 0o777).toBe(0o600);
    const raw = await readFile(file, "utf8");
    expect(raw.includes("stored-token")).toBe(true);
  });
});
