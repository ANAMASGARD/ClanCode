import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export type SessionMapping = {
  key: string;
  repositoryIdentity: string;
  agentProfile: string;
  model: string;
  trueforgeSessionId: string;
  createdAt: string;
  updatedAt: string;
};

function storePath(): string {
  const base =
    process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state");
  return join(base, "clancode", "sessions.json");
}

export function sessionKey(input: {
  repositoryIdentity: string;
  agentProfile: string;
  model: string;
}): string {
  return `${input.repositoryIdentity}::${input.agentProfile}::${input.model}`;
}

async function loadAll(): Promise<SessionMapping[]> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isMapping);
  } catch {
    return [];
  }
}

function isMapping(value: unknown): value is SessionMapping {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.key === "string" &&
    typeof record.trueforgeSessionId === "string" &&
    typeof record.model === "string" &&
    typeof record.repositoryIdentity === "string" &&
    typeof record.agentProfile === "string"
  );
}

async function saveAll(rows: SessionMapping[]): Promise<void> {
  const file = storePath();
  await mkdir(join(file, ".."), { recursive: true });
  await writeFile(file, JSON.stringify(rows, null, 2));
}

export async function listSessions(): Promise<SessionMapping[]> {
  return await loadAll();
}

export async function saveMapping(mapping: SessionMapping): Promise<void> {
  const rows = await loadAll();
  const next = rows.filter((row) => row.key !== mapping.key);
  next.push(mapping);
  await saveAll(next);
}

export async function resolveMapping(key: string): Promise<SessionMapping | undefined> {
  const rows = await loadAll();
  return rows.find((row) => row.key === key);
}

export async function invalidateMapping(key: string): Promise<void> {
  const rows = await loadAll();
  await saveAll(rows.filter((row) => row.key !== key));
}
