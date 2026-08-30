import { describe, expect, test } from "bun:test";
import { createRunEvent } from "@clancode/protocol";

import { formatRunEventLine } from "./event-line.ts";

describe("formatRunEventLine", () => {
  test("pr.created includes url, branch, and repo", () => {
    const event = createRunEvent({
      runId: "run-1",
      sequence: 10,
      type: "pr.created",
      payload: {
        url: "https://github.com/org/repo/pull/42",
        number: 42,
        head: "clancode/task-1",
        base: "main",
      },
    });
    const line = formatRunEventLine(event, "/home/dev/my-repo");
    expect(line).toContain("https://github.com/org/repo/pull/42");
    expect(line).toContain("#42");
    expect(line).toContain("clancode/task-1");
    expect(line).toContain("repo=/home/dev/my-repo");
  });

  test("git.commit_created includes branch", () => {
    const event = createRunEvent({
      runId: "run-1",
      sequence: 8,
      type: "git.commit_created",
      payload: { message: "feat: add widget", branch: "clancode/task-1" },
    });
    expect(formatRunEventLine(event)).toBe("git.commit_created feat: add widget (clancode/task-1)");
  });
});
