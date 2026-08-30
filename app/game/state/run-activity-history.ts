import type { ClanRunView } from "@/app/lib/clan-run/types";

import type { ActivityLine } from "./run-activity";

function line(id: string, text: string, href?: string): ActivityLine {
  return href === undefined ? { id, kind: "system", text } : { id, kind: "system", text, href };
}

/** Append-only activity deltas as the run projection updates. */
export function snapshotActivityDelta(prev: ClanRunView | null, next: ClanRunView): ActivityLine[] {
  const lines: ActivityLine[] = [];
  const runKey = next.runId ?? "idle";
  const seq = String(next.lastSequence);

  if (next.runId !== null && prev?.runId !== next.runId) {
    if (next.promptPreview !== null && next.promptPreview.length > 0) {
      lines.push(line(`${runKey}-task`, `Task: ${next.promptPreview}`));
    }
    lines.push(line(`${runKey}-mode`, `Mode: ${next.requestedMode ?? "build"}`));
  }

  if (prev?.phase !== next.phase) {
    lines.push(line(`${runKey}-phase-${seq}`, `Phase: ${next.phase}`));
  }

  if (next.lastTool !== null && prev?.lastTool !== next.lastTool) {
    lines.push(line(`${runKey}-tool-${seq}`, `Tool: ${next.lastTool}`));
  }

  if (prev?.lastEventType !== next.lastEventType && next.lastEventType !== null) {
    lines.push(line(`${runKey}-event-${seq}`, `Event: ${next.lastEventType}`));
  }

  if (prev?.validationStatus !== next.validationStatus && next.validationStatus !== "idle") {
    lines.push(line(`${runKey}-validation-${seq}`, `Validation: ${next.validationStatus}`));
  }

  if (prev?.approvalDecision !== next.approvalDecision && next.approvalDecision !== null) {
    lines.push(line(`${runKey}-approval-${seq}`, `Approval ${next.approvalDecision}`));
  }

  if (
    next.phase === "success" &&
    prev?.phase !== "success" &&
    next.deliveryStage === "idle"
  ) {
    if (next.requestedMode === "build" && !next.changed) {
      lines.push(line(`${runKey}-done`, "Run completed with no file changes"));
    } else if (next.changed) {
      lines.push(line(`${runKey}-done`, "Run completed — files updated"));
    } else {
      lines.push(line(`${runKey}-done`, "Run completed"));
    }
  }

  if (next.phase === "failed" && prev?.phase !== "failed") {
    lines.push(line(`${runKey}-failed`, "Run failed"));
  }

  if (next.phase === "cancelled" && prev?.phase !== "cancelled") {
    lines.push(line(`${runKey}-cancelled`, "Run cancelled"));
  }

  if (next.deliveryStage === "ready" && prev?.deliveryStage !== "ready") {
    lines.push(line(`${runKey}-delivery`, "Ready for delivery"));
  }

  if (next.deliveryStage === "pr_created" && prev?.deliveryStage !== "pr_created" && next.prUrl !== null) {
    lines.push(
      line(
        `${runKey}-pr`,
        `Pull request #${next.prNumber !== null ? String(next.prNumber) : "opened"}`,
        next.prUrl,
      ),
    );
  }

  if (next.repositoryDisplay !== null && prev?.repositoryDisplay !== next.repositoryDisplay) {
    lines.push(line(`${runKey}-repo`, `Repository: ${next.repositoryDisplay}`));
  }

  return lines;
}
