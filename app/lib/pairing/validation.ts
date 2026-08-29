import { normalizeUserCode } from "./constants";

const USER_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/;
const DEVICE_CODE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUserCode(userCode: string): boolean {
  return USER_CODE_PATTERN.test(normalizeUserCode(userCode));
}

export function isValidDeviceCode(deviceCode: string): boolean {
  return DEVICE_CODE_PATTERN.test(deviceCode);
}

export function isValidDeviceId(deviceId: string): boolean {
  return UUID_PATTERN.test(deviceId);
}
