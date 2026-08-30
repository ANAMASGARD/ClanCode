import { describe, expect, test } from "bun:test";
import { createRunEvent, parseRunEvent, projectRunEventForNetwork } from "@clancode/protocol";

describe("projectRunEventForNetwork", () => {
  test("strips baseUrl and absolute paths from run.started", () => {
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
    expect((projected.payload as { mode?: string }).mode).toBeUndefined();
  });

  test("preserves toolCallId and strips arguments from tool.requested", () => {
    const event = createRunEvent({
      runId: "run-1",
      sequence: 2,
      type: "tool.requested",
      payload: {
        toolCallId: "call-9",
        name: "read_file",
        arguments: { path: "/home/user/secret/file.ts", content: "SECRET" },
      },
    });
    const projected = projectRunEventForNetwork(event);
    const payload = projected.payload as { toolCallId?: string; toolName?: string };
    expect(payload.toolCallId).toBe("call-9");
    expect(payload.toolName).toBe("read_file");
    expect(JSON.stringify(projected.payload)).not.toContain("SECRET");
    expect(JSON.stringify(projected.payload)).not.toContain("/home/user");
  });

  test("projects bounded toolCallIds from tool.started", () => {
    const event = createRunEvent({
      runId: "run-1",
      sequence: 3,
      type: "tool.started",
      payload: { toolCalls: ["call-1", "call-2"] },
    });
    const projected = projectRunEventForNetwork(event);
    const payload = projected.payload as { toolCallIds?: string[] };
    expect(payload.toolCallIds).toEqual(["call-1", "call-2"]);
  });

  test("omits tool file contents and keeps toolCallId on tool.completed", () => {
    const event = createRunEvent({
      runId: "run-1",
      sequence: 4,
      type: "tool.completed",
      payload: {
        toolCallId: "call-3",
        toolName: "read_file",
        path: "src/a.ts",
        content: "SECRET_FILE_BODY",
        data: { content: "SECRET_FILE_BODY" },
      },
    });
    const projected = projectRunEventForNetwork(event);
    const payload = projected.payload as { toolCallId?: string; toolName?: string };
    expect(payload.toolCallId).toBe("call-3");
    expect(payload.toolName).toBe("read_file");
    expect(JSON.stringify(projected.payload)).not.toContain("SECRET_FILE_BODY");
  });

  test("projects diff.updated paths not files or diff text", () => {
    const event = createRunEvent({
      runId: "run-1",
      sequence: 5,
      type: "diff.updated",
      payload: {
        stat: "1 paths",
        diff: "SECRET_DIFF",
        paths: ["demo-obsolete.txt", "/etc/passwd"],
        files: ["ignored.ts"],
      },
    });
    const projected = projectRunEventForNetwork(event);
    const payload = projected.payload as { stat?: string; paths?: string[]; files?: string[] };
    expect(payload.stat).toBe("1 paths");
    expect(payload.paths).toEqual(["demo-obsolete.txt"]);
    expect(payload.files).toBeUndefined();
    expect(JSON.stringify(projected.payload)).not.toContain("SECRET_DIFF");
    expect(JSON.stringify(projected.payload)).not.toContain("/etc/passwd");
  });

  test("projects run.completed validation flags", () => {
    const event = createRunEvent({
      runId: "run-1",
      sequence: 6,
      type: "run.completed",
      payload: { validated: false, validationFailed: true, sessionId: "sess-secret" },
    });
    const projected = projectRunEventForNetwork(event);
    const payload = projected.payload as {
      validationFailed?: boolean;
      validated?: boolean;
      sessionId?: string;
    };
    expect(payload.validationFailed).toBe(true);
    expect(payload.validated).toBe(false);
    expect(payload.sessionId).toBeUndefined();
  });

  test("projects approval.required approvals array", () => {
    const event = createRunEvent({
      runId: "run-1",
      sequence: 7,
      type: "approval.required",
      payload: {
        approvals: [
          {
            toolCallId: "call-1",
            toolName: "delete_file",
            risk: "DELETE",
            summary: '{"path":"tmp.txt"}',
            cwd: "/home/user/secret/worktree",
            threadId: "thread-1",
          },
        ],
      },
    });
    const projected = projectRunEventForNetwork(event);
    const payload = projected.payload as {
      approvals?: Array<{ toolCallId?: string; toolName?: string; risk?: string; summary?: string }>;
    };
    expect(payload.approvals?.length).toBe(1);
    expect(payload.approvals?.[0]?.toolName).toBe("delete_file");
    expect(payload.approvals?.[0]?.toolCallId).toBe("call-1");
    expect(JSON.stringify(projected.payload)).not.toContain("/home/user");
    expect(JSON.stringify(projected.payload)).not.toContain("threadId");
  });

  test("unknown event types do not pass payload through", () => {
    const event = createRunEvent({
      runId: "run-1",
      sequence: 8,
      type: "task.accepted",
      payload: { secret: "value" },
    });
    const projected = projectRunEventForNetwork(event);
    expect(projected.payload).toEqual({ omitted: true });
  });

  test("parseRunEvent rejects malformed payloads", () => {
    expect(() => parseRunEvent({ version: 1 })).toThrow();
    const event = createRunEvent({
      runId: "run-1",
      sequence: 1,
      type: "run.started",
    });
    expect(parseRunEvent(event).runId).toBe("run-1");
  });
});
