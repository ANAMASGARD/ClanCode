import { existsSync } from "node:fs";
import { mkdir, open, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export type SessionMapping = {
  id: string;
  key: string;
  /** Stable primary repository identity (never a transient worktree path). */
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
    risk:
      | "READ"
      | "WRITE"
      | "SHELL_SAFE"
      | "SHELL_UNKNOWN"
      | "DELETE"
      | "GIT_COMMIT"
      | "GIT_PUSH"
      | "CREATE_PR"
      | "SYSTEM_PRIVILEGED";
  }>;
  worktreePath?: string;
  branchName?: string;
  baseCommit?: string;
  createdAt: string;
  updatedAt: string;
};

const LOCK_STALE_MS = 30_000;

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

function isLockContention(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const record = error as { code?: string };
  return record.code === "EEXIST";
}

async function removeStaleLock(lockPath: string): Promise<void> {
  if (!existsSync(lockPath)) {
    return;
  }
  try {
    const info = await stat(lockPath);
    if (Date.now() - info.mtimeMs > LOCK_STALE_MS) {
      await unlink(lockPath).catch(() => undefined);
    }
  } catch {
    // Best-effort stale recovery only.
  }
}

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const file = storePath();
  await mkdir(dirname(file), { recursive: true });
  const lockPath = `${file}.lock`;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await removeStaleLock(lockPath);
    let handle: Awaited<ReturnType<typeof open>> | undefined;
    try {
      handle = await open(lockPath, "wx");
    } catch (error) {
      if (isLockContention(error)) {
        await Bun.sleep(25);
        continue;
      }
      throw error;
    }
    try {
      return await fn();
    } finally {
      await handle.close();
      await unlink(lockPath).catch(() => undefined);
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
    return parsed
      .filter(isMapping)
      .map((row) => ({
        ...row,
        id: row.id ?? crypto.randomUUID().slice(0, 8),
      }));
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
    const next = rows.filter((row) => row.id !== mapping.id);
    next.push(mapping);
    await saveAll(next);
  });
}

export async function resolveMappingById(id: string): Promise<SessionMapping | undefined> {
  return await withLock(async () => {
    const rows = await loadAll();
    return rows.find((row) => row.id === id || row.id.startsWith(id));
  });
}

export async function resolveMapping(key: string): Promise<SessionMapping | undefined> {
  return await withLock(async () => {
    const rows = await loadAll();
    return rows.find((row) => row.key === key);
  });
}

export async function findResumeMapping(input: {
  repositoryIdentity: string;
  model?: string;
}): Promise<SessionMapping | undefined> {
  return await withLock(async () => {
    const rows = await loadAll();
    const candidates = rows.filter((row) => {
      if (row.repositoryIdentity !== input.repositoryIdentity) {
        return false;
      }
      if (input.model !== undefined && row.model !== input.model) {
        return false;
      }
      return true;
    });
    if (candidates.length === 0) {
      return undefined;
    }
    candidates.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    const pending = candidates.find(
      (row) => row.pendingApprovals !== undefined && row.pendingApprovals.length > 0,
    );
    return pending ?? candidates[0];
  });
}

export async function invalidateMapping(idOrKey: string): Promise<void> {
  await withLock(async () => {
    const rows = await loadAll();
    await saveAll(
      rows.filter((row) => row.id !== idOrKey && row.key !== idOrKey),
    );
  });
}
