export type ToolSuccess<T> = {
  ok: true;
  data: T;
  truncated: boolean;
};

export type ToolFailure = {
  ok: false;
  error: { code: string; message: string };
};

export type ToolResult<T> = ToolSuccess<T> | ToolFailure;

export const TOOL_LIMITS = {
  maxFileBytes: 256_000,
  maxOutputBytes: 64_000,
  maxGrepMatches: 50,
  maxDirectoryEntries: 200,
};

const SECRET_PATTERNS = [
  /^\.env($|\.)/,
  /\.pem$/i,
  /\.key$/i,
  /(^|\/)credentials/i,
  /(^|\/)secrets/i,
  /(^|\/)id_rsa($|\.)/,
  /(^|\/)id_ed25519($|\.)/,
  /token/i,
];

export function isSecretPath(relativePath: string): boolean {
  const base = relativePath.split("/").at(-1) ?? relativePath;
  return SECRET_PATTERNS.some((pattern) => pattern.test(base) || pattern.test(relativePath));
}

export function fail(code: string, message: string): ToolFailure {
  return { ok: false, error: { code, message } };
}

export function ok<T>(data: T, truncated = false): ToolSuccess<T> {
  return { ok: true, data, truncated };
}
