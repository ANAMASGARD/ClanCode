import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export type RunLogLine = {
  kind: "user" | "agent" | "system" | "event";
  text: string;
  at: string;
};

export type RunLogArchive = {
  runId: string;
  repoRoot?: string;
  branchName?: string;
  phase?: string;
  lines: RunLogLine[];
};

export function sessionLogsDir(): string {
  const base = process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state");
  return join(base, "clancode", "session-logs");
}

/** Persist a harness transcript under the local session-logs directory. */
export async function archiveRunLog(entry: RunLogArchive): Promise<string> {
  const dir = sessionLogsDir();
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = join(dir, `${stamp}-${entry.runId}.json`);
  await writeFile(
    file,
    JSON.stringify(
      {
        archivedAt: new Date().toISOString(),
        ...entry,
      },
      null,
      2,
    ),
    "utf8",
  );
  return file;
}
