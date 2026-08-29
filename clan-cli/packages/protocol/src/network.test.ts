import { describe, expect, test } from "bun:test";
import { createRunEvent, projectRunEventForNetwork } from "@clancode/protocol";

describe("projectRunEventForNetwork", () => {
  test("strips baseUrl from run.started", () => {
    const event = createRunEvent({
      runId: "run-1",
      sequence: 1,
      type: "run.started",
      payload: {
        baseUrl: "http://127.0.0.1:8080",
        repository: "/home/user/secret/repo",
        identity: "github.com/org/repo",
        mode: "spawned",
      },
    });
    const projected = projectRunEventForNetwork(event);
    expect(JSON.stringify(projected.payload)).not.toContain("baseUrl");
    expect(JSON.stringify(projected.payload)).not.toContain("/home/user");
    expect(JSON.stringify(projected.payload)).toContain("repo");
  });

  test("omits tool file contents", () => {
    const event = createRunEvent({
      runId: "run-1",
      sequence: 2,
      type: "tool.completed",
      payload: {
        toolName: "read_file",
        path: "src/a.ts",
        data: { content: "SECRET_FILE_BODY" },
      },
    });
    const projected = projectRunEventForNetwork(event);
    expect(JSON.stringify(projected.payload)).not.toContain("SECRET_FILE_BODY");
  });

  test("unknown event types do not pass payload through", () => {
    const event = createRunEvent({
      runId: "run-1",
      sequence: 3,
      type: "task.accepted",
      payload: { secret: "value" },
    });
    const projected = projectRunEventForNetwork(event);
    expect(projected.payload).toEqual({ omitted: true });
  });
});
