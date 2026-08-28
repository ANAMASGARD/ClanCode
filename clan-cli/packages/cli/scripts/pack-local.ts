import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cliRoot = join(import.meta.dir, "..");
const distDir = join(cliRoot, "dist");
const packedDir = join(cliRoot, "pack");

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
    { cwd: cliRoot, stdout: "inherit", stderr: "inherit" },
  );
  if (build.exitCode !== 0) {
    throw new Error("bun build failed");
  }

  const packManifest = {
    name: "clancode",
    version: "0.1.0",
    type: "module",
    bin: { clancode: "dist/cli.js" },
    files: ["dist"],
    engines: { node: ">=22.14.0" },
    dependencies: {
      "@opentui/core": "^0.5.6",
      "@opentui/react": "^0.5.6",
      "@truefoundry/trueforge": "0.1.4",
      "@truefoundry/trueforge-sdk": "0.1.3",
      react: "^19.2.6",
    },
  };

  await rm(packedDir, { recursive: true, force: true });
  await Bun.write(join(packedDir, "package.json"), JSON.stringify(packManifest, null, 2));
  await Bun.write(join(packedDir, "dist/cli.js"), Bun.file(join(distDir, "cli.js")));

  const packed = Bun.spawnSync(["bun", "pm", "pack"], {
    cwd: packedDir,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (packed.exitCode !== 0) {
    throw new Error(packed.stderr.toString() || "bun pm pack failed");
  }
  const tarball = join(packedDir, "clancode-0.1.0.tgz");
  if (!(await Bun.file(tarball).exists())) {
    throw new Error("expected clancode-0.1.0.tgz after bun pm pack");
  }
  console.log(`packed ${tarball}`);

  const inspect = Bun.spawnSync(["tar", "-tzf", tarball], { stdout: "pipe", stderr: "pipe" });
  const listing = inspect.stdout.toString();
  if (listing.includes(".env") || listing.includes("node_modules") || listing.includes(".ssh")) {
    throw new Error("tarball contains forbidden paths");
  }

  const installDir = await mkdtemp(join(tmpdir(), "clancode-install-"));
  await Bun.write(
    join(installDir, "package.json"),
    JSON.stringify({ name: "clancode-install-probe", private: true }, null, 2),
  );
  const install = Bun.spawnSync(["bun", "add", "--ignore-scripts", tarball], {
    cwd: installDir,
    stdout: "inherit",
    stderr: "inherit",
  });
    cwd: installDir,
    stdout: "inherit",
    stderr: "inherit",
  });
  if (install.exitCode !== 0) {
    throw new Error("clean install of packed tarball failed");
  }

  const bin = join(installDir, "node_modules", ".bin", "clancode");
  for (const args of [["--version"], ["--help"], ["doctor"], ["doctor", "--json"]]) {
    const result = Bun.spawnSync(["bun", bin, ...args], {
      cwd: installDir,
      stdout: "pipe",
      stderr: "pipe",
    });
    console.log(`clancode ${args.join(" ")} -> ${String(result.exitCode)}`);
    const combined = result.stdout.toString() + result.stderr.toString();
    if (/sk-|BEGIN OPENSSH|GITHUB_TOKEN=/.test(combined)) {
      throw new Error("doctor/help leaked a secret");
    }
    if (result.exitCode !== 0 && args[0] !== "doctor") {
      throw new Error(`clancode ${args.join(" ")} failed`);
    }
  }
}

await main();
