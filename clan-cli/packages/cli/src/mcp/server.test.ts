import { describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveRepository } from "../repository/repository.ts";
import { startLoopbackMcp } from "./server.ts";

async function makeRepo(): Promise<string> {
  const root = join(tmpdir(), `clan-mcp-${crypto.randomUUID()}`);
  await mkdir(root, { recursive: true });
  Bun.spawnSync(["git", "init"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.email", "t@example.com"], { cwd: root });
  Bun.spawnSync(["git", "config", "user.name", "T"], { cwd: root });
  await writeFile(join(root, "README.md"), "hello\n");
  Bun.spawnSync(["git", "add", "."], { cwd: root });
  Bun.spawnSync(["git", "commit", "-m", "init"], { cwd: root });
  return root;
}

describe("loopback MCP", () => {
  test("lists plan tools and refuses secret reads", async () => {
    const root = await makeRepo();
    const repo = await resolveRepository(root);
    const mcp = startLoopbackMcp(() => ({
      repo,
      mode: "plan",
      deleteApproved: false,
      commandApproved: false,
    }));
    try {
      const listed = await fetch(mcp.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      });
      const body = (await listed.json()) as {
        result: { tools: Array<{ name: string }> };
      };
      const names = body.result.tools.map((tool) => tool.name);
      expect(names).toContain("read_file");
      expect(names).not.toContain("write_file");

      const call = await fetch(mcp.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: { name: "read_file", arguments: { path: "/etc/passwd" } },
        }),
      });
      const result = (await call.json()) as { result: { isError: boolean; content: Array<{ text: string }> } };
      expect(result.result.isError).toBe(true);
      expect(result.result.content[0]?.text).not.toContain("root:");
    } finally {
      mcp.close();
      Bun.spawnSync(["rm", "-rf", "--", root]);
    }
  });
});
