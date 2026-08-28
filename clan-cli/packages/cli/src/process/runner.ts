import { realpath } from "node:fs/promises";
import { isAbsolute, relative } from "node:path";

export type ProcessRunRequest = {
  command: string;
  args: readonly string[];
  cwd: string;
  signal?: AbortSignal;
  timeoutMs: number;
  maxStdoutBytes: number;
  maxStderrBytes: number;
  env: Record<string, string>;
  authorizedRoot?: string;
};

export type ProcessRunResult = {
  command: string;
  args: readonly string[];
  cwd: string;
  exitCode: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
};

export type CommandRisk =
  | "SHELL_SAFE"
  | "SHELL_UNKNOWN"
  | "SYSTEM_PRIVILEGED"
  | "GIT_PUSH"
  | "GIT_COMMIT"
  | "CREATE_PR";

export type PolicyDecision =
  | { allow: true; risk: CommandRisk }
  | { allow: false; risk: CommandRisk; reason: string };

const PRIVILEGED = new Set([
  "sudo",
  "su",
  "shutdown",
  "reboot",
  "mkfs",
  "dd",
  "chown",
  "chmod",
]);

export function sanitizeEnv(
  explicit: Record<string, string> | undefined,
): Record<string, string> {
  const allow = new Set([
    "PATH",
    "HOME",
    "USER",
    "LANG",
    "LC_ALL",
    "TERM",
    "TMPDIR",
    "CI",
    "NODE_ENV",
    "BUN_INSTALL",
  ]);
  const env: Record<string, string> = {};
  for (const key of allow) {
    const value = process.env[key];
    if (value !== undefined && value.length > 0) {
      env[key] = value;
    }
  }
  if (explicit !== undefined) {
    for (const [key, value] of Object.entries(explicit)) {
      if (/^[A-Z][A-Z0-9_]*$/.test(key) && !/TOKEN|SECRET|KEY|PASSWORD|CREDENTIAL/i.test(key)) {
        env[key] = value;
      }
    }
  }
  return env;
}

export function evaluateCommand(
  command: string,
  args: readonly string[],
): PolicyDecision {
  const base = command.split("/").at(-1) ?? command;
  if (PRIVILEGED.has(base)) {
    return {
      allow: false,
      risk: "SYSTEM_PRIVILEGED",
      reason: `${base} is denied by default`,
    };
  }
  if (base === "git" && args[0] === "push" && args.some((a) => a === "--force" || a === "-f" || a.startsWith("--force"))) {
    return { allow: false, risk: "GIT_PUSH", reason: "force push is denied by default" };
  }
  if (base === "git" && args[0] === "push") {
    return { allow: true, risk: "GIT_PUSH" };
  }
  if (base === "git" && args[0] === "commit") {
    return { allow: true, risk: "GIT_COMMIT" };
  }
  if ((base === "gh" && args[0] === "pr") || (base === "git" && args.includes("request-pull"))) {
    return { allow: true, risk: "CREATE_PR" };
  }
  const joined = [command, ...args].join(" ");
  if (/(curl|wget).*\|\s*(sh|bash)/.test(joined) || args.includes("-c") && /(curl|wget)/.test(joined)) {
    return { allow: false, risk: "SYSTEM_PRIVILEGED", reason: "piped remote shell is denied" };
  }
  if (base === "sh" || base === "bash" || base === "zsh") {
    return { allow: false, risk: "SHELL_UNKNOWN", reason: "raw shell strings are not executed" };
  }
  if (base === "rm" || base === "rmdir") {
    return {
      allow: false,
      risk: "SYSTEM_PRIVILEGED",
      reason: "destructive filesystem commands are denied; use delete_file",
    };
  }
  if (args.some((arg) => /(^|\/)\.ssh\//.test(arg) || /id_rsa|id_ed25519|\.pem$/i.test(arg))) {
    return {
      allow: false,
      risk: "SYSTEM_PRIVILEGED",
      reason: "credential path arguments are denied",
    };
  }
  const safe = new Set([
    "git",
    "bun",
    "npm",
    "npx",
    "node",
    "tsc",
    "eslint",
    "cargo",
    "go",
    "pytest",
    "python",
    "python3",
    "printf",
    "sleep",
    "true",
    "false",
  ]);
  if (safe.has(base)) {
    return { allow: true, risk: "SHELL_SAFE" };
  }
  return { allow: true, risk: "SHELL_UNKNOWN" };
}

function cap(buffer: string, maxBytes: number): string {
  if (Buffer.byteLength(buffer) <= maxBytes) {
    return buffer;
  }
  return Buffer.from(buffer).subarray(0, maxBytes).toString() + "\n…truncated";
}

export async function runCommand(
  request: ProcessRunRequest,
): Promise<ProcessRunResult> {
  const started = Date.now();
  const policy = evaluateCommand(request.command, request.args);
  if (!policy.allow) {
    return {
      command: request.command,
      args: request.args,
      cwd: request.cwd,
      exitCode: 126,
      signal: null,
      stdout: "",
      stderr: policy.reason,
      durationMs: Date.now() - started,
      timedOut: false,
    };
  }

  if (request.authorizedRoot !== undefined) {
    try {
      const root = await realpath(request.authorizedRoot);
      const cwd = await realpath(request.cwd);
      const rel = relative(root, cwd);
      if (rel.startsWith("..") || isAbsolute(rel)) {
        return {
          command: request.command,
          args: request.args,
          cwd: request.cwd,
          exitCode: 126,
          signal: null,
          stdout: "",
          stderr: "cwd escapes authorized repository",
          durationMs: Date.now() - started,
          timedOut: false,
        };
      }
    } catch (error) {
      return {
        command: request.command,
        args: request.args,
        cwd: request.cwd,
        exitCode: 126,
        signal: null,
        stdout: "",
        stderr: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - started,
        timedOut: false,
      };
    }
  }

  const proc = Bun.spawn([request.command, ...request.args], {
    cwd: request.cwd,
    env: request.env,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
    signal: request.signal,
  });

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    proc.kill("SIGKILL");
  }, request.timeoutMs);

  const [stdoutRaw, stderrRaw] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  clearTimeout(timer);

  return {
    command: request.command,
    args: request.args,
    cwd: request.cwd,
    exitCode: timedOut ? null : exitCode,
    signal: timedOut ? "SIGKILL" : null,
    stdout: cap(stdoutRaw, request.maxStdoutBytes),
    stderr: cap(stderrRaw, request.maxStderrBytes),
    durationMs: Date.now() - started,
    timedOut,
  };
}
