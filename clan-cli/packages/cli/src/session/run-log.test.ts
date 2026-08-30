import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { archiveRunLog, sessionLogsDir } from "./run-log.ts";

describe("archiveRunLog", () => {
  test("writes transcript json under session-logs", async () => {
    const previous = process.env.XDG_STATE_HOME;
    const dir = await mkdtemp(join(tmpdir(), "clancode-session-logs-"));
    process.env.XDG_STATE_HOME = dir;
    try {
      const path = await archiveRunLog({
        runId: "run-test",
        repoRoot: "/tmp/repo",
        branchName: "clancode/task",
        phase: "planning",
        lines: [{ kind: "user", text: "hello", at: "2026-08-30T00:00:00.000Z" }],
      });
      expect(path.startsWith(sessionLogsDir())).toBe(true);
      const raw = await readFile(path, "utf8");
      const parsed = JSON.parse(raw) as {
        runId: string;
        repoRoot?: string;
        lines: Array<{ text: string }>;
      };
      expect(parsed.runId).toBe("run-test");
      expect(parsed.repoRoot).toBe("/tmp/repo");
      expect(parsed.lines[0]?.text).toBe("hello");
      const files = await readdir(sessionLogsDir());
      expect(files.length).toBe(1);
    } finally {
      if (previous === undefined) {
        delete process.env.XDG_STATE_HOME;
      } else {
        process.env.XDG_STATE_HOME = previous;
      }
    }
  });
});
