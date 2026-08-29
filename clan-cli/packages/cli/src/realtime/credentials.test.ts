import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";

import {
  CompositeCredentialsProvider,
  resolveRealtimeCredentials,
} from "./credentials.ts";
import { saveStoredCredentials } from "../pairing/store.ts";

describe("realtime credentials", () => {
  const stateHome = join("/tmp", `clancode-creds-${crypto.randomUUID()}`);

  afterEach(async () => {
    delete process.env.CLANCODE_DEVICE_TOKEN;
    delete process.env.CLANCODE_CONTROL_URL;
    delete process.env.CLANCODE_DEVICE_ID;
    delete process.env.XDG_STATE_HOME;
    await rm(stateHome, { recursive: true, force: true });
  });

  test("env override requires token, url, and device id together", async () => {
    process.env.CLANCODE_DEVICE_TOKEN = "env-token";
    await expect(resolveRealtimeCredentials()).rejects.toThrow(/together/);
  });

  test("full env override resolves atomically", async () => {
    process.env.CLANCODE_DEVICE_TOKEN = "env-token";
    process.env.CLANCODE_CONTROL_URL = "http://localhost:4001/";
    process.env.CLANCODE_DEVICE_ID = "550e8400-e29b-41d4-a716-446655440000";
    await expect(resolveRealtimeCredentials()).resolves.toEqual({
      token: "env-token",
      deviceId: "550e8400-e29b-41d4-a716-446655440000",
      controlUrl: "http://localhost:4001",
    });
  });

  test("stored credentials are used when env is unset", async () => {
    process.env.XDG_STATE_HOME = stateHome;
    await mkdir(join(stateHome, "clancode"), { recursive: true });
    await saveStoredCredentials({
      deviceToken: "stored-token",
      deviceId: "550e8400-e29b-41d4-a716-446655440001",
      controlUrl: "http://localhost:3001",
      pairedAt: new Date().toISOString(),
    });
    const provider = new CompositeCredentialsProvider();
    await expect(provider.getToken()).resolves.toBe("stored-token");
    await expect(resolveRealtimeCredentials()).resolves.toMatchObject({
      token: "stored-token",
      deviceId: "550e8400-e29b-41d4-a716-446655440001",
      controlUrl: "http://localhost:3001",
    });
  });

  test("env token cannot mix with stored url or device id", async () => {
    process.env.XDG_STATE_HOME = stateHome;
    await mkdir(join(stateHome, "clancode"), { recursive: true });
    await saveStoredCredentials({
      deviceToken: "stored-token",
      deviceId: "550e8400-e29b-41d4-a716-446655440002",
      controlUrl: "http://localhost:3001",
      pairedAt: new Date().toISOString(),
    });
    process.env.CLANCODE_DEVICE_TOKEN = "env-token";
    await expect(resolveRealtimeCredentials()).rejects.toThrow(/together/);
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
      deviceId: "550e8400-e29b-41d4-a716-446655440003",
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
