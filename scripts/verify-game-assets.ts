import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GAME_ASSETS } from "../app/game/assets/catalog";
import {
  KENNEY_GLB_DIRECTORIES,
  KENNEY_KIT_DIRECTORIES,
} from "../app/lib/visualization/kenney";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const definitions = Object.values(GAME_ASSETS);
const errors: string[] = [];
const seenKeys = new Set<string>();

for (const definition of definitions) {
  if (seenKeys.has(definition.key)) {
    errors.push(`duplicate key: ${definition.key}`);
  }
  seenKeys.add(definition.key);

  const segments = [
    "public",
    "assets",
    KENNEY_KIT_DIRECTORIES[definition.kit],
    ...KENNEY_GLB_DIRECTORIES[definition.kit],
    `${definition.model}.glb`,
  ];
  const normalized = segments.join("/").toLowerCase();
  if (normalized.includes("overview.html") || normalized.includes("previews/")) {
    errors.push(`${definition.key}: preview/overview sources are forbidden`);
  }
  if (normalized.endsWith(".obj") || normalized.endsWith(".fbx")) {
    errors.push(`${definition.key}: runtime asset must be GLB`);
  }

  const diskPath = join(repositoryRoot, ...segments);
  if (!existsSync(diskPath)) {
    errors.push(`${definition.key}: missing ${segments.join("/")}`);
  }
}

if (errors.length > 0) {
  console.error(`ClanCode game asset check failed (${errors.length} errors)`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const kitCounts = definitions.reduce<Record<string, number>>((counts, asset) => {
  counts[asset.kit] = (counts[asset.kit] ?? 0) + 1;
  return counts;
}, {});

console.log(`ClanCode game asset check passed: ${definitions.length} verified GLBs`);
for (const [kit, count] of Object.entries(kitCounts)) {
  console.log(`- ${kit}: ${count}`);
}
