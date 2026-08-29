import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSyncBounded } from "../src/process/spawn-sync.ts";

const cliRoot = join(import.meta.dir, "..");
const distDir = join(cliRoot, "dist");

async function main(): Promise<void> {
  const build = spawnSyncBounded(
    "bun",
    [
      "build",
      "src/cli.ts",
      "--outfile",
      "dist/cli.js",
      "--target",
      "bun",
      "--banner",
      "#!/usr/bin/env bun",
      "--external",
      "@truefoundry/trueforge",
      "--external",
      "@truefoundry/trueforge-sdk",
      "--external",
      "@opentui/core",
      "--external",
      "@opentui/react",
      "--external",
      "react",
    ],
    {
      cwd: cliRoot,
      timeoutMs: 120_000,
      maxOutputBytes: 4_194_304,
    },
  );
  if (build.exitCode !== 0) {
    throw new Error(build.stderr || "bun build failed");
  }

  const normalize = spawnSyncBounded("bun", ["run", "scripts/normalize-dist.ts"], {
    cwd: cliRoot,
    timeoutMs: 30_000,
    maxOutputBytes: 1_048_576,
  });
  if (normalize.exitCode !== 0) {
    throw new Error(normalize.stderr || "normalize-dist failed");
  }

  const distPath = join(distDir, "cli.js");
  const distHead = (await readFile(distPath, "utf8")).slice(0, 32);
  if (!distHead.startsWith("#!/usr/bin/env bun")) {
    throw new Error("dist/cli.js must begin with #!/usr/bin/env bun");
  }

  const packed = spawnSyncBounded("npm", ["pack", "--ignore-scripts", "--json"], {
    cwd: cliRoot,
    timeoutMs: 120_000,
    maxOutputBytes: 4_194_304,
  });
  if (packed.exitCode !== 0) {
    throw new Error(packed.stderr || "npm pack failed");
  }

  const jsonStart = packed.stdout.indexOf("[");
  if (jsonStart < 0) {
    throw new Error(`npm pack did not emit JSON: ${packed.stdout}`);
  }
  const parsed = JSON.parse(packed.stdout.slice(jsonStart)) as Array<{ filename?: string }>;
  const tarballName = parsed[0]?.filename;
  if (tarballName === undefined) {
    throw new Error("npm pack did not return tarball name");
  }
  const tarball = join(cliRoot, tarballName);
  console.log(`packed ${tarball}`);

  const manifest = spawnSyncBounded("tar", ["-xOf", tarball, "package/package.json"], {
    timeoutMs: 30_000,
    maxOutputBytes: 1_048_576,
  });
  if (manifest.exitCode !== 0) {
    throw new Error(manifest.stderr || "tar extract failed");
  }
  if (manifest.stdout.includes("workspace:*")) {
    throw new Error("packed manifest contains workspace:* dependency");
  }

  const installPrefix = await mkdtemp(join(tmpdir(), "clancode-npm-prefix-"));
  const npmInstall = spawnSyncBounded(
    "npm",
    ["install", "-g", tarball, "--prefix", installPrefix, "--ignore-scripts"],
    {
      timeoutMs: 300_000,
      maxOutputBytes: 8_388_608,
    },
  );
  if (npmInstall.exitCode !== 0) {
    throw new Error(npmInstall.stderr || "npm install -g failed");
  }

  const bin = join(installPrefix, "bin", "clancode");
  for (const args of [["--version"], ["--help"], ["doctor", "--json"]]) {
    const result = spawnSyncBounded(bin, args, {
      cwd: installPrefix,
      timeoutMs: 60_000,
      maxOutputBytes: 2_097_152,
      env: { ...process.env, PATH: `${join(installPrefix, "bin")}:${process.env.PATH ?? ""}` },
    });
    console.log(`clancode ${args.join(" ")} -> ${String(result.exitCode)}`);
    const combined = result.stdout + result.stderr;
    if (/sk-|BEGIN OPENSSH|GITHUB_TOKEN=/.test(combined)) {
      throw new Error("installed clancode leaked a secret");
    }
    if (result.exitCode !== 0 && args[0] !== "doctor") {
      throw new Error(`installed clancode ${args.join(" ")} failed`);
    }
  }

  await rm(installPrefix, { recursive: true, force: true });
  console.log("pack:local npm install smoke passed");
}

await main();
