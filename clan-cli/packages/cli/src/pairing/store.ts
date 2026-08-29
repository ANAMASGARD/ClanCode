import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir, hostname, platform } from "node:os";
import { dirname, join } from "node:path";

export type StoredCredentials = {
  deviceToken: string;
  deviceId: string;
  controlUrl: string;
  webUrl?: string;
  pairedAt: string;
};

function credentialsPath(): string {
  const base = process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state");
  return join(base, "clancode", "credentials.json");
}

export async function loadStoredCredentials(): Promise<StoredCredentials | undefined> {
  try {
    const raw = await readFile(credentialsPath(), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return undefined;
    }
    const record = parsed as Record<string, unknown>;
    if (
      typeof record.deviceToken !== "string" ||
      typeof record.deviceId !== "string" ||
      typeof record.controlUrl !== "string"
    ) {
      return undefined;
    }
    return {
      deviceToken: record.deviceToken,
      deviceId: record.deviceId,
      controlUrl: record.controlUrl,
      webUrl: typeof record.webUrl === "string" ? record.webUrl : undefined,
      pairedAt:
        typeof record.pairedAt === "string"
          ? record.pairedAt
          : new Date().toISOString(),
    };
  } catch {
    return undefined;
  }
}

export async function saveStoredCredentials(
  credentials: StoredCredentials,
): Promise<void> {
  const file = credentialsPath();
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  const payload = JSON.stringify(credentials, null, 2);
  await writeFile(tmp, payload);
  await chmod(tmp, 0o600);
  await rename(tmp, file);
}

export function resolveWebUrl(): string {
  return (process.env.CLANCODE_WEB_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function resolveDefaultControlUrl(): string {
  return (process.env.CLANCODE_CONTROL_URL ?? "http://localhost:3001").replace(
    /\/$/,
    "",
  );
}

export function localDeviceMetadata(): { hostname: string; platform: string } {
  return { hostname: hostname(), platform: platform() };
}
