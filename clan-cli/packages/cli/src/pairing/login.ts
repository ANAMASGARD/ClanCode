import { spawn } from "node:child_process";

import {
  localDeviceMetadata,
  hasStoredDeviceCredentials,
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

export type PairDeviceResult =
  | "approved"
  | "denied"
  | "expired"
  | "timeout"
  | "error";

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

export async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;
  const command =
    platform === "darwin"
      ? "open"
      : platform === "win32"
        ? "cmd"
        : "xdg-open";
  const args = platform === "win32" ? ["/c", "start", "", url] : [url];
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "ignore", detached: true });
    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  }).catch(() => {
    console.log(`Open this URL in your browser:\n${url}`);
  });
}

export async function hasDeviceCredentials(): Promise<boolean> {
  return await hasStoredDeviceCredentials();
}

export async function pairDeviceInteractive(): Promise<PairDeviceResult> {
  const webUrl = resolveWebUrl();
  const meta = localDeviceMetadata();

  let start: StartResponse;
  try {
    start = await postJson<StartResponse>(`${webUrl}/api/pair/start`, meta);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Could not reach Clan Code at ${webUrl}: ${message}`);
    console.error("Start the web app with `bun run dev` from the repo root.");
    return "error";
  }

  console.log(`Pairing code: ${start.userCode}`);
  console.log(`Open in browser: ${start.verifyUrl}`);
  console.log(
    "Sign in with the Clerk account you use on the website, then approve this laptop.",
  );
  await openBrowser(start.verifyUrl);

  const deadline = Date.now() + start.expiresIn * 1000;
  let pollBackoffMs = start.interval * 1000;
  while (Date.now() < deadline) {
    let poll: PollResponse;
    try {
      poll = await postJson<PollResponse>(`${webUrl}/api/pair/poll`, {
        deviceCode: start.deviceCode,
      });
    } catch {
      return "error";
    }

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
      return "approved";
    }
    if (poll.status === "denied") {
      return "denied";
    }
    if (poll.status === "expired") {
      return "expired";
    }
    if (poll.status === "slow_down") {
      pollBackoffMs = Math.min(pollBackoffMs * 2, start.interval * 1000 * 8);
      await sleep(pollBackoffMs);
      continue;
    }
    pollBackoffMs = start.interval * 1000;
    await sleep(pollBackoffMs);
  }

  return "timeout";
}

function exitCodeForPairResult(result: PairDeviceResult): number {
  switch (result) {
    case "approved":
      console.log("\nDevice paired successfully.");
      console.log(
        "This laptop stays paired after reboot. Running `clancode` comes online automatically.",
      );
      return 0;
    case "denied":
      console.error("\nPairing was denied in the browser.");
      return 1;
    case "expired":
      console.error("\nPairing challenge expired. Run `clancode login` again.");
      return 1;
    case "timeout":
      console.error("\nTimed out waiting for browser approval.");
      return 1;
    default:
      console.error("\nPairing failed.");
      return 1;
  }
}

export async function ensureDevicePaired(): Promise<number> {
  if (await hasDeviceCredentials()) {
    return 0;
  }

  console.log("This laptop is not paired with Clan Code yet.");
  console.log("We'll open your browser so you can sign in and approve this device.\n");

  return exitCodeForPairResult(await pairDeviceInteractive());
}

/**
 * Always starts a fresh browser pairing flow. Replaces stored credentials after approval.
 * Use this when switching Clerk accounts or re-linking the laptop.
 */
export async function runLoginCommand(): Promise<number> {
  if (await hasDeviceCredentials()) {
    console.log("Replacing the stored pairing on this laptop.");
    console.log(
      "Sign in on the website with the Clerk account you want linked to this CLI.\n",
    );
  } else {
    console.log("Starting device pairing…\n");
  }

  return exitCodeForPairResult(await pairDeviceInteractive());
}
