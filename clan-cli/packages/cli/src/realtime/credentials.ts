import { loadStoredCredentials } from "../pairing/store.ts";

export type RealtimeCredentialsProvider = {
  getToken(): Promise<string>;
};

export type ResolvedRealtimeCredentials = {
  token: string;
  deviceId: string;
  controlUrl: string;
};

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function hasEnvValue(value: string | undefined): value is string {
  return value !== undefined && value.length > 0;
}

/**
 * Resolves token, deviceId, and control URL from a single credential source.
 * Environment overrides require CLANCODE_DEVICE_TOKEN, CLANCODE_CONTROL_URL, and
 * CLANCODE_DEVICE_ID together — partial env mixing with stored credentials is rejected.
 */
export async function resolveRealtimeCredentials(): Promise<ResolvedRealtimeCredentials> {
  const envToken = process.env.CLANCODE_DEVICE_TOKEN;
  const envUrl = process.env.CLANCODE_CONTROL_URL;
  const envDeviceId = process.env.CLANCODE_DEVICE_ID;

  const hasEnvToken = hasEnvValue(envToken);
  const hasEnvUrl = hasEnvValue(envUrl);
  const hasEnvDeviceId = hasEnvValue(envDeviceId);
  const anyEnv = hasEnvToken || hasEnvUrl || hasEnvDeviceId;

  if (anyEnv) {
    if (!hasEnvToken || !hasEnvUrl || !hasEnvDeviceId) {
      throw new Error(
        "Environment credential override requires CLANCODE_DEVICE_TOKEN, CLANCODE_CONTROL_URL, and CLANCODE_DEVICE_ID together.",
      );
    }
    return {
      token: envToken,
      deviceId: envDeviceId,
      controlUrl: normalizeUrl(envUrl),
    };
  }

  const stored = await loadStoredCredentials();
  if (
    stored !== undefined &&
    stored.deviceToken.length > 0 &&
    stored.deviceId.length > 0 &&
    stored.controlUrl.length > 0
  ) {
    return {
      token: stored.deviceToken,
      deviceId: stored.deviceId,
      controlUrl: normalizeUrl(stored.controlUrl),
    };
  }

  throw new Error(
    "No device credential configured. Run `clancode login` or set CLANCODE_DEVICE_TOKEN, CLANCODE_CONTROL_URL, and CLANCODE_DEVICE_ID.",
  );
}

export class EnvCredentialsProvider implements RealtimeCredentialsProvider {
  async getToken(): Promise<string> {
    return (await resolveRealtimeCredentials()).token;
  }
}

export class CompositeCredentialsProvider implements RealtimeCredentialsProvider {
  async getToken(): Promise<string> {
    return (await resolveRealtimeCredentials()).token;
  }
}

/** @deprecated Use resolveRealtimeCredentials().controlUrl */
export async function resolveConnectUrl(): Promise<string> {
  return (await resolveRealtimeCredentials()).controlUrl;
}

/** @deprecated Use resolveRealtimeCredentials() — kept for callers that expect sync env-only resolution. */
export function resolveControlUrl(): string {
  const url = process.env.CLANCODE_CONTROL_URL;
  if (url === undefined || url.length === 0) {
    throw new Error("CLANCODE_CONTROL_URL is not configured");
  }
  return normalizeUrl(url);
}
