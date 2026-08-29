const USER_CODE_LENGTH = 8;

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
