import type { ClanRunSnapshot } from "@/app/lib/clan-run/types";

export const TIMELINE_STEPS = [
  "request",
  "plan",
  "build",
  "approve",
  "validate",
  "deliver",
  "done",
] as const;

export type TimelineStepId = (typeof TIMELINE_STEPS)[number];
export type TimelineStepState = "pending" | "active" | "done" | "failed";

export type TimelineStep = {
  id: TimelineStepId;
  label: string;
  state: TimelineStepState;
};

const LABELS: Record<TimelineStepId, string> = {
  request: "REQUEST",
  plan: "PLAN",
  build: "BUILD",
  approve: "APPROVE",
  validate: "VALIDATE",
  deliver: "DELIVER",
  done: "DONE",
};

function mark(state: TimelineStepState, id: TimelineStepId): TimelineStep {
  return { id, label: LABELS[id], state };
}

export function clanRunTimeline(snapshot: ClanRunSnapshot): TimelineStep[] {
  if (snapshot.phase === "idle" && snapshot.runId === null) {
    return TIMELINE_STEPS.map((id) => mark("pending", id));
  }
  if (snapshot.phase === "failed" || snapshot.phase === "cancelled") {
    return TIMELINE_STEPS.map((id) =>
      mark(id === "done" ? "failed" : snapshot.runId !== null && id === "request" ? "done" : "pending", id),
    );
  }

  const steps: TimelineStep[] = [];
  const requested = snapshot.runId !== null;
  steps.push(mark(requested ? (snapshot.phase === "planning" ? "active" : "done") : "pending", "request"));

  const planning = snapshot.phase === "planning";
  const pastPlan =
    snapshot.phase === "building" ||
    snapshot.phase === "awaiting_approval" ||
    snapshot.phase === "validating" ||
    snapshot.phase === "success";
  steps.push(mark(planning ? "active" : pastPlan ? "done" : requested ? "pending" : "pending", "plan"));

  const building = snapshot.phase === "building";
  const pastBuild =
    snapshot.phase === "awaiting_approval" ||
    snapshot.phase === "validating" ||
    snapshot.phase === "success" ||
    snapshot.changed;
  steps.push(mark(building ? "active" : pastBuild && !planning ? "done" : "pending", "build"));

  const approving = snapshot.phase === "awaiting_approval";
  const approved = snapshot.approvalDecision === "granted";
  const denied = snapshot.approvalDecision === "denied";
  steps.push(
    mark(
      approving ? "active" : denied ? "failed" : approved || snapshot.phase === "validating" || snapshot.phase === "success" ? "done" : "pending",
      "approve",
    ),
  );

  const validating = snapshot.phase === "validating";
  const validated =
    snapshot.validationStatus === "passed" ||
    snapshot.validationStatus === "skipped" ||
    snapshot.validationStatus === "failed";
  steps.push(
    mark(
      validating
        ? "active"
        : snapshot.validationStatus === "failed"
          ? "failed"
          : validated || snapshot.phase === "success"
            ? "done"
            : "pending",
      "validate",
    ),
  );

  steps.push(
    mark(
      snapshot.deliveryStage === "failed"
        ? "failed"
        : snapshot.deliveryStage === "committing"
          ? "active"
          : snapshot.deliveryStage === "pr_created"
            ? "done"
            : snapshot.deliveryStage === "ready"
              ? "active"
              : "pending",
      "deliver",
    ),
  );

  steps.push(
    mark(
      snapshot.phase === "success" && snapshot.deliveryStage === "pr_created"
        ? "done"
        : snapshot.phase === "success" && snapshot.deliveryStage === "idle" && snapshot.requestedMode === "plan"
          ? "done"
          : "pending",
      "done",
    ),
  );
  return steps;
}