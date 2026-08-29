import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const USER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DEVICE_TOKEN_BYTES = 32;
const DEVICE_CODE_BYTES = 32;
const USER_CODE_LENGTH = 8;

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function generateDeviceToken(): string {
  return randomBytes(DEVICE_TOKEN_BYTES).toString("base64url");
}

export function generateDeviceCode(): string {
  return randomBytes(DEVICE_CODE_BYTES).toString("base64url");
}

export function generateUserCode(): string {
  const bytes = randomBytes(USER_CODE_LENGTH);
  let code = "";
  for (let i = 0; i < USER_CODE_LENGTH; i += 1) {
    const byte = bytes[i] ?? 0;
    code += USER_CODE_ALPHABET[byte % USER_CODE_ALPHABET.length];
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export function formatUserCodeForDisplay(userCode: string): string {
  const normalized = userCode.replace(/-/g, "").toUpperCase();
  if (normalized.length !== USER_CODE_LENGTH) {
    return userCode;
  }
  return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
}

export function normalizeUserCode(userCode: string): string {
  return userCode.replace(/-/g, "").toUpperCase();
}

export function safeCompareHashes(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export const PAIRING_CHALLENGE_TTL_MS = 10 * 60 * 1000;
export const PAIRING_POLL_INTERVAL_MS = 2_000;
export const DEVICE_HEARTBEAT_TTL_MS = 45_000;
