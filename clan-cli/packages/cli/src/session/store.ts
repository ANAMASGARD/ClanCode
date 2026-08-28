import { mkdir, open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export type SessionMapping = {
  key: string;
  repositoryIdentity: string;
  agentProfile: string;
  model: string;
  trueforgeSessionId: string;
  pendingApprovals?: Array<{
    threadId: string;
    toolCallId: string;
    toolName: string;
    summary: string;
    cwd?: string;
    risk: "READ" | "WRITE" | "SHELL_SAFE" | "SHELL_UNKNOWN" | "DELETE" | "GIT_COMMIT" | "GIT_PUSH" | "CREATE_PR" | "SYSTEM_PRIVILEGED";
  }>;
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

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const file = storePath();
  await mkdir(dirname(file), { recursive: true });
  const lockPath = `${file}.lock`;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const handle = await open(lockPath, "wx");
      try {
        return await fn();
      } finally {
        await handle.close();
        await unlink(lockPath).catch(() => undefined);
      }
    } catch {
      await Bun.sleep(25);
    }
  }
  throw new Error("Timed out waiting for session store lock");
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
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(rows, null, 2));
  await rename(tmp, file);
}

export async function listSessions(): Promise<SessionMapping[]> {
  return await withLock(loadAll);
}

export async function saveMapping(mapping: SessionMapping): Promise<void> {
  await withLock(async () => {
    const rows = await loadAll();
    const next = rows.filter((row) => row.key !== mapping.key);
    next.push(mapping);
    await saveAll(next);
  });
}

export async function resolveMapping(key: string): Promise<SessionMapping | undefined> {
  return await withLock(async () => {
    const rows = await loadAll();
    return rows.find((row) => row.key === key);
  });
}

export async function invalidateMapping(key: string): Promise<void> {
  await withLock(async () => {
    const rows = await loadAll();
    await saveAll(rows.filter((row) => row.key !== key));
  });
}
