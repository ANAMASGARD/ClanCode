import type { ClanRunView } from "@/app/lib/clan-run/types";

export type ActivityLine = {
  id: string;
  kind: "user" | "system";
  text: string;
  href?: string;
};

/** Projection-only ClanCode lines — no invented assistant prose. */
export function projectionActivityLines(view: ClanRunView): ActivityLine[] {
  const lines: ActivityLine[] = [];
  const runKey = view.runId ?? "idle";

  if (view.phase !== "idle" || view.runId !== null) {
    lines.push({ id: `${runKey}-phase`, kind: "system", text: `Phase: ${view.phase}` });
  }
  if (view.lastTool !== null) {
    lines.push({ id: `${runKey}-tool`, kind: "system", text: `Tool: ${view.lastTool}` });
  }
  if (view.phase === "awaiting_approval" && view.approvals[0] !== undefined) {
    const pending = view.approvals[0];
    lines.push({
      id: `${runKey}-approval`,
      kind: "system",
      text: `Approval: ${pending.summary ?? pending.toolName}`,
    });
  }
  if (view.approvalDecision !== null) {
    lines.push({
      id: `${runKey}-approval-decision`,
      kind: "system",
      text: `Approval ${view.approvalDecision}`,
    });
  }
  if (view.validationStatus !== "idle") {
    lines.push({
      id: `${runKey}-validation`,
      kind: "system",
      text: `Validation: ${view.validationStatus}`,
    });
  }
  if (view.deliveryStage === "ready") {
    lines.push({ id: `${runKey}-delivery-ready`, kind: "system", text: "Ready for delivery" });
  }
  if (view.deliveryStage === "committing") {
    lines.push({ id: `${runKey}-delivery-commit`, kind: "system", text: "Creating pull request…" });
  }
  if (view.deliveryStage === "pr_created" && view.prUrl !== null) {
    lines.push({
      id: `${runKey}-pr`,
      kind: "system",
      text: `Pull request #${view.prNumber !== null ? String(view.prNumber) : "opened"}`,
      href: view.prUrl,
    });
  }
  if (view.phase === "failed") {
    lines.push({ id: `${runKey}-failed`, kind: "system", text: "Run failed" });
  }
  if (view.phase === "cancelled") {
    lines.push({ id: `${runKey}-cancelled`, kind: "system", text: "Run cancelled" });
  }
  if (view.phase === "success" && view.deliveryStage === "idle") {
    if (view.requestedMode === "build" && !view.changed) {
      lines.push({
        id: `${runKey}-success`,
        kind: "system",
        text: "Run completed with no file changes",
      });
    } else {
      lines.push({ id: `${runKey}-success`, kind: "system", text: "Run completed" });
    }
  }

  return lines;
}
