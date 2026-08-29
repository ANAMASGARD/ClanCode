import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cliRoot = join(import.meta.dir, "..");
const distDir = join(cliRoot, "dist");

async function main(): Promise<void> {
  const build = Bun.spawnSync(
    [
      "bun",
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
      stdout: "pipe",
      stderr: "pipe",
    },
  );
  if (build.exitCode !== 0) {
    throw new Error(build.stderr.toString() || "bun build failed");
  }

  const normalize = Bun.spawnSync(["bun", "run", "scripts/normalize-dist.ts"], {
    cwd: cliRoot,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (normalize.exitCode !== 0) {
    throw new Error(normalize.stderr.toString() || "normalize-dist failed");
  }

  const distPath = join(distDir, "cli.js");
  const distHead = (await readFile(distPath, "utf8")).slice(0, 32);
  if (!distHead.startsWith("#!/usr/bin/env bun")) {
    throw new Error("dist/cli.js must begin with #!/usr/bin/env bun");
  }

  const packed = Bun.spawnSync(["npm", "pack", "--ignore-scripts", "--json"], {
    cwd: cliRoot,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (packed.exitCode !== 0) {
    throw new Error(packed.stderr.toString() || "npm pack failed");
  }

  const stdout = packed.stdout.toString();
  const jsonStart = stdout.indexOf("[");
  if (jsonStart < 0) {
    throw new Error(`npm pack did not emit JSON: ${stdout}`);
  }
  const parsed = JSON.parse(stdout.slice(jsonStart)) as Array<{ filename?: string }>;
  const tarballName = parsed[0]?.filename;
  if (tarballName === undefined) {
    throw new Error("npm pack did not return tarball name");
  }
  const tarball = join(cliRoot, tarballName);
  console.log(`packed ${tarball}`);

  const manifestText = await Bun.spawnSync(["tar", "-xOf", tarball, "package/package.json"], {
    stdout: "pipe",
  }).stdout.toString();
  if (manifestText.includes("workspace:*")) {
    throw new Error("packed manifest contains workspace:* dependency");
  }

  const installPrefix = await mkdtemp(join(tmpdir(), "clancode-npm-prefix-"));
  const npmInstall = Bun.spawnSync(
    ["npm", "install", "-g", tarball, "--prefix", installPrefix, "--ignore-scripts"],
    { stdout: "inherit", stderr: "inherit" },
  );
  if (npmInstall.exitCode !== 0) {
    throw new Error("npm install -g failed");
  }

  const bin = join(installPrefix, "bin", "clancode");
  for (const args of [["--version"], ["--help"], ["doctor", "--json"]]) {
    const result = Bun.spawnSync([bin, ...args], {
      cwd: installPrefix,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PATH: `${join(installPrefix, "bin")}:${process.env.PATH ?? ""}` },
    });
    console.log(`clancode ${args.join(" ")} -> ${String(result.exitCode)}`);
    const combined = result.stdout.toString() + result.stderr.toString();
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
