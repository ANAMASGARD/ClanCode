import type { RunEvent } from "@clancode/protocol";

function payloadRecord(event: RunEvent): Record<string, unknown> {
  return typeof event.payload === "object" && event.payload !== null
    ? (event.payload as Record<string, unknown>)
    : {};
}

/** Human-readable harness log line for structured run events. */
export function formatRunEventLine(event: RunEvent, repoRoot?: string): string {
  const payload = payloadRecord(event);
  switch (event.type) {
    case "pr.created": {
      const url = typeof payload.url === "string" ? payload.url : "";
      const number = typeof payload.number === "number" ? `#${String(payload.number)}` : "";
      const head = typeof payload.head === "string" ? payload.head : "";
      const base = typeof payload.base === "string" ? payload.base : "";
      const branchPart = head.length > 0 ? ` branch ${head}${base.length > 0 ? ` → ${base}` : ""}` : "";
      const repoPart = repoRoot !== undefined && repoRoot.length > 0 ? ` repo=${repoRoot}` : "";
      return url.length > 0
        ? `Pull request ${number}: ${url}${branchPart}${repoPart}`.trim()
        : `pr.created ${number}${branchPart}${repoPart}`.trim();
    }
    case "git.commit_created": {
      const message = typeof payload.message === "string" ? payload.message : "commit";
      const branch =
        typeof payload.branch === "string"
          ? payload.branch
          : typeof (payload as { branchName?: string }).branchName === "string"
            ? (payload as { branchName: string }).branchName
            : "";
      return branch.length > 0 ? `git.commit_created ${message} (${branch})` : `git.commit_created ${message}`;
    }
    case "git.branch_created": {
      const branchName = typeof payload.branchName === "string" ? payload.branchName : "";
      return branchName.length > 0 ? `git.branch_created ${branchName}` : event.type;
    }
    case "run.started": {
      const repository =
        typeof payload.repository === "string"
          ? payload.repository
          : repoRoot !== undefined
            ? repoRoot
            : "";
      return repository.length > 0 ? `run.started repo=${repository}` : event.type;
    }
    case "run.completed":
    case "run.failed":
    case "run.cancelled":
      return event.type;
    case "tool.requested":
    case "tool.started":
    case "tool.completed":
    case "tool.failed": {
      const tool =
        typeof payload.toolName === "string"
          ? payload.toolName
          : typeof payload.name === "string"
            ? payload.name
            : "";
      return tool.length > 0 ? `${event.type} ${tool}` : event.type;
    }
    default:
      return event.type;
  }
}
