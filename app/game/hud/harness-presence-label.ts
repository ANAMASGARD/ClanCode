/** User-facing label for paired CLI / TrueForge harness presence. */
export function harnessPresenceLabel(
  online: boolean | null,
  checking = online === null,
): string {
  if (checking) {
    return "Checking harness";
  }
  return online ? "AI Harness Online" : "AI Harness Offline";
}
