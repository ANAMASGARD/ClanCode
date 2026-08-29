import { existsSync } from "node:fs";
import { mkdir, open, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const LOCK_STALE_MS = 30_000;

export async function withClancodeLock<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const base = process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state");
  const dir = join(base, "clancode");
  await mkdir(dir, { recursive: true });
  const lockPath = join(dir, `${name}.lock`);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (existsSync(lockPath)) {
      try {
        const info = await stat(lockPath);
        if (Date.now() - info.mtimeMs > LOCK_STALE_MS) {
          await unlink(lockPath).catch(() => undefined);
        }
      } catch {
        // ignore
      }
    }
    let handle: Awaited<ReturnType<typeof open>> | undefined;
    try {
      handle = await open(lockPath, "wx");
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        (error as { code?: string }).code === "EEXIST"
      ) {
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
  throw new Error(`Timed out waiting for ${name} lock`);
}

export function clancodeStatePath(fileName: string): string {
  const base = process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state");
  return join(base, "clancode", fileName);
}

export async function readJsonFile<T>(path: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(value, null, 2));
  await rename(tmp, path);
}
