import type { SessionMapping } from "./store.ts";

export type FormattedSession = {
  id: string;
  line: string;
};

export function formatSessions(rows: SessionMapping[]): FormattedSession[] {
  const sorted = [...rows].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
  return sorted.map((row, index) => {
    const mode = row.agentProfile.toUpperCase();
    const pending =
      row.pendingApprovals !== undefined && row.pendingApprovals.length > 0
        ? "yes"
        : "no";
    const branch = row.branchName ?? "-";
    const repo = row.repositoryIdentity.split("/").at(-1) ?? row.repositoryIdentity;
    const updated = row.updatedAt.slice(0, 19).replace("T", " ");
    return {
      id: row.id,
      line: `${String(index + 1)}. ${repo} | ${mode} | ${row.model} | ${updated} | approval:${pending} | branch:${branch}`,
    };
  });
}

export function resolveSessionSelector(
  rows: FormattedSession[],
  selector: string | undefined,
): string | undefined {
  if (selector === undefined || selector.trim().length === 0) {
    return rows[0]?.id;
  }
  const trimmed = selector.trim();
  const asNumber = Number.parseInt(trimmed, 10);
  if (!Number.isNaN(asNumber) && asNumber >= 1 && asNumber <= rows.length) {
    return rows[asNumber - 1]?.id;
  }
  const byId = rows.find((row) => row.id === trimmed || row.id.startsWith(trimmed));
  return byId?.id;
}
