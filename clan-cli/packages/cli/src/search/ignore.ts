import { isSecretPath } from "../tools/types.ts";

export const NOISY_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  "target",
  "vendor",
  "__pycache__",
  ".venv",
  "venv",
  "pack",
]);

export function shouldSkipRelativePath(relativePath: string): boolean {
  if (isSecretPath(relativePath)) {
    return true;
  }
  const parts = relativePath.split("/");
  for (const part of parts) {
    if (NOISY_DIRS.has(part)) {
      return true;
    }
  }
  return false;
}
