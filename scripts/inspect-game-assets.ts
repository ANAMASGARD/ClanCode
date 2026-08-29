import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Box3, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GAME_ASSETS } from "../app/game/assets/catalog";
import {
  KENNEY_GLB_DIRECTORIES,
  KENNEY_KIT_DIRECTORIES,
} from "../app/lib/visualization/kenney";

const requestedKeys = process.argv.slice(2);
const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const entries = Object.entries(GAME_ASSETS).filter(([key]) =>
  requestedKeys.length === 0 || requestedKeys.includes(key),
);
const loader = new GLTFLoader();

for (const [key, definition] of entries) {
  const filePath = join(
    scriptsDirectory,
    "..",
    "public",
    "assets",
    KENNEY_KIT_DIRECTORIES[definition.kit],
    ...KENNEY_GLB_DIRECTORIES[definition.kit],
    `${definition.model}.glb`,
  );
  const bytes = await readFile(filePath);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const gltf = await loader.parseAsync(buffer, "");
  const bounds = new Box3().setFromObject(gltf.scene);
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  const rounded = (vector: Vector3) => vector.toArray().map((value) => Number(value.toFixed(3)));
  console.log(`${key}\tsize=${rounded(size).join(",")}\tcenter=${rounded(center).join(",")}`);
}
