import { homedir } from "node:os";
import { loadTrueforgeConfig, assertNodeRuntime } from "../trueforge/config.ts";
import { waitForHealth } from "../trueforge/runtime.ts";
import { resolveRepository } from "../repository/repository.ts";

export type DoctorCheck = {
  id: string;
  ok: boolean;
  required: boolean;
  detail: string;
};

export type DoctorReport = {
  ok: boolean;
  checks: DoctorCheck[];
};

function check(id: string, ok: boolean, detail: string, required = true): DoctorCheck {
  return { id, ok, required, detail };
}

export async function runDoctor(repoPath?: string): Promise<DoctorReport> {
  const checks: DoctorCheck[] = [];
  checks.push(
    check("os", true, `${process.platform} ${process.arch}`),
    check("bun", typeof Bun !== "undefined", `Bun ${Bun.version}`),
    check("home", true, homedir()),
  );

  const node = Bun.spawnSync(["node", "--version"], { stdout: "pipe", stderr: "pipe" });
  checks.push(
    check(
      "node",
      node.exitCode === 0,
      node.exitCode === 0 ? node.stdout.toString().trim() : "node not found",
    ),
  );

  const git = Bun.spawnSync(["git", "--version"], { stdout: "pipe", stderr: "pipe" });
  checks.push(
    check(
      "git",
      git.exitCode === 0,
      git.exitCode === 0 ? git.stdout.toString().trim() : "git not found",
    ),
  );

  try {
    const repo = await resolveRepository(repoPath ?? process.cwd());
    checks.push(check("repository", true, repo.root));
  } catch (error) {
    checks.push(
      check(
        "repository",
        false,
        error instanceof Error ? error.message : String(error),
        false,
      ),
    );
  }

  try {
    const config = loadTrueforgeConfig();
    assertNodeRuntime(config.nodeBin);
    checks.push(check("trueforge_package", true, config.cliPath));
    try {
      await waitForHealth(config.baseUrl, 2_000);
      checks.push(check("trueforge_health", true, `${config.baseUrl}/healthz`, false));
    } catch {
      checks.push(
        check("trueforge_health", false, `TrueForge not healthy at ${config.baseUrl}`, false),
      );
    }
  } catch (error) {
    checks.push(
      check(
        "trueforge_package",
        false,
        error instanceof Error ? error.message : String(error),
      ),
    );
  }

  const gh = Bun.spawnSync(["gh", "auth", "status"], { stdout: "pipe", stderr: "pipe" });
  checks.push(
    check(
      "github_cli",
      gh.exitCode === 0,
      gh.exitCode === 0 ? "gh authenticated" : "gh not authenticated",
      false,
    ),
  );

  const probe = `${process.env.TMPDIR ?? "/tmp"}/clancode-doctor-${crypto.randomUUID()}`;
  let tmpWrite = false;
  try {
    await Bun.write(probe, "ok");
    tmpWrite = true;
    await Bun.file(probe).unlink();
  } catch {
    tmpWrite = false;
  }
  checks.push(check("filesystem", tmpWrite, tmpWrite ? "writable temp" : "cannot write temp"));

  const model = process.env.CLAN_TRUEFORGE_MODEL;
  checks.push(
    check(
      "model",
      true,
      model !== undefined && model.length > 0
        ? "CLAN_TRUEFORGE_MODEL is set"
        : "model will be selected from TrueForge when available",
      false,
    ),
  );

  const ok = checks.filter((item) => item.required).every((item) => item.ok);
  return { ok, checks };
}

export function formatDoctor(report: DoctorReport): string {
  const lines = ["Clan Code Doctor"];
  for (const item of report.checks) {
    lines.push(`${item.ok ? "✓" : "✗"} ${item.id}: ${item.detail}`);
  }
  return lines.join("\n");
}
