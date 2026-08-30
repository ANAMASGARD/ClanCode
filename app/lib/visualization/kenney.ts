export const KENNEY_KIT_DIRECTORIES = {
  fantasyTown: "kenney_fantasy-town-kit_2.0",
  nature: "kenney_nature-kit",
  pirate: "kenney_pirate-kit",
  survival: "kenney_survival-kit",
  blockyCharacters: "kenney_blocky-characters_20",
} as const;

const MODEL_DIRECTORIES = {
  obj: ["Models", "OBJ format"],
  fbx: ["Models", "FBX format"],
} as const;

export const KENNEY_GLB_DIRECTORIES = {
  fantasyTown: ["Models", "GLB format"],
  nature: ["Models", "GLTF format"],
  pirate: ["Models", "GLB format"],
  survival: ["Models", "GLB format"],
  blockyCharacters: ["Models", "GLB format"],
} as const;

const TEXTURE_DIRECTORIES = {
  models: ["Models", "Textures"],
  fbx: ["Models", "FBX format", "Textures"],
} as const;

export type KenneyKitId = keyof typeof KENNEY_KIT_DIRECTORIES;
export type KenneyModelFormat = keyof typeof MODEL_DIRECTORIES;
export type KenneyTextureSource = keyof typeof TEXTURE_DIRECTORIES;

function encodePathSegment(segment: string): string {
  return encodeURIComponent(segment);
}

function encodeModelName(modelName: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(modelName)) {
    throw new Error(`Invalid Kenney model name: ${modelName}`);
  }

  return encodePathSegment(modelName);
}

function encodeFileName(fileName: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(fileName) || fileName.includes("..")) {
    throw new Error(`Invalid Kenney file name: ${fileName}`);
  }

  return encodePathSegment(fileName);
}

function assetUrl(...segments: readonly string[]): string {
  return `/${segments.map(encodePathSegment).join("/")}`;
}

export function kenneyModelUrl(
  kit: KenneyKitId,
  format: KenneyModelFormat,
  modelName: string,
): string {
  return assetUrl(
    "assets",
    KENNEY_KIT_DIRECTORIES[kit],
    ...MODEL_DIRECTORIES[format],
    `${encodeModelName(modelName)}.${format}`,
  );
}

export function kenneyMaterialUrl(
  kit: KenneyKitId,
  modelName: string,
): string {
  return assetUrl(
    "assets",
    KENNEY_KIT_DIRECTORIES[kit],
    ...MODEL_DIRECTORIES.obj,
    `${encodeModelName(modelName)}.mtl`,
  );
}

export function kenneyTextureUrl(
  kit: KenneyKitId,
  fileName: string,
  source: KenneyTextureSource = "models",
): string {
  return assetUrl(
    "assets",
    KENNEY_KIT_DIRECTORIES[kit],
    ...TEXTURE_DIRECTORIES[source],
    encodeFileName(fileName),
  );
}

export function kenneyGlbUrl(
  kit: KenneyKitId,
  modelName: string,
): string {
  return assetUrl(
    "assets",
    KENNEY_KIT_DIRECTORIES[kit],
    ...KENNEY_GLB_DIRECTORIES[kit],
    `${encodeModelName(modelName)}.glb`,
  );
}
