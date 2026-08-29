import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { withClancodeLock } from "./lock.ts";

export type Preferences = {
  deviceId: string;
  preferredModel?: string;
};

function preferencesPath(): string {
  const base = process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state");
  return join(base, "clancode", "preferences.json");
}

export async function loadPreferences(): Promise<Preferences> {
  const file = preferencesPath();
  try {
    const raw = await readFile(file, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("invalid preferences");
    }
    const record = parsed as Record<string, unknown>;
    const deviceId =
      typeof record.deviceId === "string" && record.deviceId.length > 0
        ? record.deviceId
        : crypto.randomUUID();
    const preferredModel =
      typeof record.preferredModel === "string" ? record.preferredModel : undefined;
    return { deviceId, preferredModel };
  } catch {
    return { deviceId: crypto.randomUUID() };
  }
}

export async function savePreferences(prefs: Preferences): Promise<void> {
  const file = preferencesPath();
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(prefs, null, 2));
  await rename(tmp, file);
}

export async function setPreferredModel(model: string): Promise<Preferences> {
  return await withClancodeLock("preferences", async () => {
    const prefs = await loadPreferences();
    const next = { ...prefs, preferredModel: model };
    await savePreferences(next);
    return next;
  });
}

export function preferencesFileExists(): boolean {
  return existsSync(preferencesPath());
}
