import { describe, expect, test } from "bun:test";
import { assertTaskBranch } from "./service.ts";

describe("git delivery guards", () => {
  test("refuses default and non-task branches", () => {
    expect(() => assertTaskBranch("main", "main")).toThrow();
    expect(() => assertTaskBranch("feature", "main")).toThrow();
    expect(() => assertTaskBranch("clancode/fix-abc123", "main")).not.toThrow();
  });
});
