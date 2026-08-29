import { describe, expect, test } from "bun:test";
import { ToolCallTracker } from "./tool-call-tracker.ts";

describe("tool call tracker", () => {
  test("accumulates streamed MCP call_tool deltas", () => {
    const tracker = new ToolCallTracker();
    tracker.ingestDelta([
      {
        index: 0,
        id: "call_1",
        function: { name: "call_tool", arguments: "" },
      },
    ]);
    tracker.ingestDelta([
      {
        index: 0,
        function: {
          arguments:
            '{"mcp_server":"clancode-local","tool_name":"delete_file","input":{"path":"disposable.txt"}}',
        },
      },
    ]);
    const known = tracker.get("call_1");
    expect(known?.name).toBe("delete_file");
    expect(known?.arguments).toEqual({ path: "disposable.txt" });
  });
});
