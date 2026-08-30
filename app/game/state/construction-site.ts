import { isClanRunBusy, type ClanRunSnapshot, type ClanRunView } from "@/app/lib/clan-run/types";

import { clanRunTimeline } from "./run-timeline";

const PLAN_TOOLS = new Set([
  "repo_info",
  "list_directory",
  "read_file",
  "glob",
  "grep",
  "git_status",
  "git_diff",
]);

export type CrewActivity = "idle" | "approach" | "hammer" | "frozen" | "paused";

/** True while the harness is actively working on a dispatched task. */
export function constructionSiteVisible(snapshot: ClanRunSnapshot): boolean {
  return isClanRunBusy(snapshot);
}

/** Clash-style bar fill from real timeline steps (done = 1, active = 0.5). */
export function constructionProgressFraction(snapshot: ClanRunSnapshot): number {
  const steps = clanRunTimeline(snapshot);
  if (steps.length === 0) {
    return 0;
  }
  let score = 0;
  for (const step of steps) {
    if (step.state === "done") {
      score += 1;
    } else if (step.state === "active") {
      score += 0.5;
    }
  }
  return Math.min(1, score / steps.length);
}

export function runPhaseLabel(view: ClanRunView, deviceOnline: boolean): string {
  if (!deviceOnline) return "Offline";
  if (view.phase === "awaiting_approval" && view.approvalDecision === "denied") return "Denied";
  if (view.deliveryStage === "ready") return "Ready for delivery";
  if (view.deliveryStage === "committing") return "Delivering";
  if (view.deliveryStage === "pr_created") return "Pull request opened";
  if (view.phase === "idle") return "Idle";
  if (view.phase === "planning") return "Planning";
  if (view.phase === "building") return "Building";
  if (view.phase === "awaiting_approval") return "Awaiting approval";
  if (view.phase === "validating") return "Validating";
  if (view.phase === "success") {
    if (view.requestedMode === "build" && !view.changed) {
      return "Completed (no changes)";
    }
    return "Success";
  }
  if (view.phase === "failed") return "Failed";
  if (view.phase === "cancelled") return "Cancelled";
  return view.phase;
}

export function crewActivityFromSnapshot(input: {
  phase: string;
  changed: boolean;
  lastTool: string | null;
  approvalDecision: string | null;
}): CrewActivity {
  if (input.phase === "awaiting_approval" && input.approvalDecision !== "granted") {
    return "frozen";
  }
  if (input.phase === "validating") {
    return "paused";
  }
  if (input.phase === "planning") {
    return "approach";
  }
  if (input.phase === "building") {
    return "hammer";
  }
  if (input.lastTool !== null && !PLAN_TOOLS.has(input.lastTool)) {
    return "approach";
  }
  return "idle";
}
