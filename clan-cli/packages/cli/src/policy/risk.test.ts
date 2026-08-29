import { describe, expect, test } from "bun:test";
import { classifyTool, requiresHumanApproval } from "./risk.ts";

describe("tool risk policy", () => {
  test("reads are automatic; delete/git/pr require approval", () => {
    expect(requiresHumanApproval(classifyTool("read_file"))).toBe(false);
    expect(requiresHumanApproval(classifyTool("write_file"))).toBe(false);
    expect(requiresHumanApproval(classifyTool("delete_file"))).toBe(true);
    expect(requiresHumanApproval(classifyTool("git_push"))).toBe(true);
    expect(requiresHumanApproval(classifyTool("create_pr"))).toBe(true);
  });
});
