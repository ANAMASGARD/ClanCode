import { describe, expect, test } from "bun:test";
import { evaluateCommand, runCommand, sanitizeEnv } from "./runner.ts";

describe("process policy", () => {
  test("denies sudo and force push", () => {
    expect(evaluateCommand("sudo", ["id"]).allow).toBe(false);
    expect(evaluateCommand("git", ["push", "--force", "origin", "main"]).allow).toBe(false);
  });

  test("python -c is not auto-safe", () => {
    const py = evaluateCommand("python", ["-c", "print(1)"]);
    expect(py.allow).toBe(true);
    expect(py.risk).toBe("SHELL_UNKNOWN");
  });

  test("argv keeps special characters as args", async () => {
    const result = await runCommand({
      command: "printf",
      args: ["%s", "a; rm -rf /"],
      cwd: process.cwd(),
      timeoutMs: 5_000,
      maxStdoutBytes: 1_024,
      maxStderrBytes: 1_024,
      env: sanitizeEnv(undefined),
    });
    expect(result.stdout).toBe("a; rm -rf /");
    expect(result.exitCode).toBe(0);
  });

  test("sanitized env omits secrets", () => {
    const env = sanitizeEnv({ GITHUB_TOKEN: "secret", PATH: "/bin" });
    expect(env.GITHUB_TOKEN).toBeUndefined();
  });

  test("timeouts", async () => {
    const result = await runCommand({
      command: "sleep",
      args: ["5"],
      cwd: process.cwd(),
      timeoutMs: 50,
      maxStdoutBytes: 100,
      maxStderrBytes: 100,
      env: sanitizeEnv(undefined),
    });
    expect(result.timedOut).toBe(true);
  });
});
