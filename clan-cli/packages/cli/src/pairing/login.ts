import { spawn } from "node:child_process";

import {
  localDeviceMetadata,
  resolveWebUrl,
  saveStoredCredentials,
} from "./store.ts";
import { loadPreferences, savePreferences } from "../session/preferences.ts";

type StartResponse = {
  userCode: string;
  deviceCode: string;
  verifyUrl: string;
  expiresIn: number;
  interval: number;
};

type PollResponse =
  | { status: "pending" | "denied" | "expired" | "slow_down" }
  | {
      status: "approved";
      token: string;
      deviceId: string;
      controlUrl: string;
    };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(payload.error ?? `Request failed (${String(response.status)})`);
  }
  return (await response.json()) as T;
}

async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;
  const command =
    platform === "darwin"
      ? "open"
      : platform === "win32"
        ? "cmd"
        : "xdg-open";
  const args =
    platform === "win32" ? ["/c", "start", "", url] : [url];
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "ignore", detached: true });
    child.on("error", reject);
    child.unref();
    resolve();
  }).catch(() => {
    console.log(`Open this URL in your browser:\n${url}`);
  });
}

export async function runLoginCommand(): Promise<number> {
  const webUrl = resolveWebUrl();
  const meta = localDeviceMetadata();
  console.log("Starting device pairing…");

  const start = await postJson<StartResponse>(`${webUrl}/api/pair/start`, meta);
  console.log(`Pairing code: ${start.userCode}`);
  console.log(`Opening ${start.verifyUrl}`);
  await openBrowser(start.verifyUrl);

  const deadline = Date.now() + start.expiresIn * 1000;
  while (Date.now() < deadline) {
    const poll = await postJson<PollResponse>(`${webUrl}/api/pair/poll`, {
      deviceCode: start.deviceCode,
    });
    if (poll.status === "approved") {
      await saveStoredCredentials({
        deviceToken: poll.token,
        deviceId: poll.deviceId,
        controlUrl: poll.controlUrl,
        webUrl,
        pairedAt: new Date().toISOString(),
      });
      const prefs = await loadPreferences();
      await savePreferences({ ...prefs, deviceId: poll.deviceId });
      console.log("Device paired successfully.");
      console.log("Run `clancode connect` to go online on the dashboard.");
      return 0;
    }
    if (poll.status === "denied") {
      console.error("Pairing was denied in the browser.");
      return 1;
    }
    if (poll.status === "expired") {
      console.error("Pairing challenge expired. Run `clancode login` again.");
      return 1;
    }
    const waitMs =
      poll.status === "slow_down" ? start.interval * 1000 : start.interval * 1000;
    await sleep(waitMs);
  }

  console.error("Timed out waiting for browser approval.");
  return 1;
}
