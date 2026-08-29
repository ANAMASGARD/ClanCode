import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const distPath = join(import.meta.dir, "..", "dist", "cli.js");

const raw = await readFile(distPath, "utf8");
const body = raw
  .replace(/^#!\/usr\/bin\/env bun\s*\n\/\/ @bun\s*\n#!\/usr\/bin\/env bun\s*\n/, "")
  .replace(/^#!\/usr\/bin\/env bun\s*\n\/\/ @bun\s*\n/, "")
  .replace(/^#!\/usr\/bin\/env bun\s*\n/, "");

await writeFile(distPath, `#!/usr/bin/env bun\n${body}`);
