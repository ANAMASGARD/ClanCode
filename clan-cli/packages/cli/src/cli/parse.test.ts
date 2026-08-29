import { describe, expect, test } from "bun:test";
import { runCli } from "./parse.ts";

describe("cli parse", () => {
  test("version and help", async () => {
    const version = await runCli(["bun", "clancode", "--version"]);
    expect(version).toBe(0);
    const help = await runCli(["bun", "clancode", "--help"]);
    expect(help).toBe(0);
  });

  test("run without task fails", async () => {
    const code = await runCli(["bun", "clancode", "run"]);
    expect(code).toBe(2);
  });
});
