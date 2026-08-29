import { loadStoredCredentials } from "../pairing/store.ts";

export type RealtimeCredentialsProvider = {
  getToken(): Promise<string>;
};

export class EnvCredentialsProvider implements RealtimeCredentialsProvider {
  async getToken(): Promise<string> {
    const token = process.env.CLANCODE_DEVICE_TOKEN;
    if (token === undefined || token.length === 0) {
      throw new Error(
        "No device credential configured. Set CLANCODE_DEVICE_TOKEN before running `clancode connect`.",
      );
    }
    return token;
  }
}

export class CompositeCredentialsProvider implements RealtimeCredentialsProvider {
  async getToken(): Promise<string> {
    const envToken = process.env.CLANCODE_DEVICE_TOKEN;
    if (envToken !== undefined && envToken.length > 0) {
      return envToken;
    }
    const stored = await loadStoredCredentials();
    if (stored !== undefined && stored.deviceToken.length > 0) {
      return stored.deviceToken;
    }
    throw new Error(
      "No device credential configured. Run `clancode login` or set CLANCODE_DEVICE_TOKEN before running `clancode connect`.",
    );
  }
}

export async function resolveConnectUrl(): Promise<string> {
  const envUrl = process.env.CLANCODE_CONTROL_URL;
  if (envUrl !== undefined && envUrl.length > 0) {
    return envUrl.replace(/\/$/, "");
  }
  const stored = await loadStoredCredentials();
  if (stored !== undefined && stored.controlUrl.length > 0) {
    return stored.controlUrl.replace(/\/$/, "");
  }
  throw new Error(
    "CLANCODE_CONTROL_URL is not configured. Run `clancode login` or set CLANCODE_CONTROL_URL.",
  );
}

/** @deprecated Use resolveConnectUrl() — kept for callers that expect sync env-only resolution. */
export function resolveControlUrl(): string {
  const url = process.env.CLANCODE_CONTROL_URL;
  if (url === undefined || url.length === 0) {
    throw new Error("CLANCODE_CONTROL_URL is not configured");
  }
  return url.replace(/\/$/, "");
}
