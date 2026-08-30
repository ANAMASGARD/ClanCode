export type ClanRunPhase =
  | "idle"
  | "planning"
  | "building"
  | "awaiting_approval"
  | "validating"
  | "success"
  | "failed"
  | "cancelled";

export type ClanRunMode = "plan" | "build";

export type ApprovalDecision = "granted" | "denied";

export type ValidationStatus = "idle" | "running" | "passed" | "failed" | "skipped";

export type DeliveryStage = "idle" | "ready" | "committing" | "pr_created" | "failed";

export type SanitizedApproval = {
  toolCallId: string;
  toolName: string;
  risk?: string;
  summary?: string;
};

export type ClanRunSnapshot = {
  deviceId: string | null;
  runId: string | null;
  requestedMode: ClanRunMode | null;
  phase: ClanRunPhase;
  promptPreview: string | null;
  lastTool: string | null;
  lastEventType: string | null;
  approvals: SanitizedApproval[];
  approvalDecision: ApprovalDecision | null;
  validationStatus: ValidationStatus;
  deliveryStage: DeliveryStage;
  prUrl: string | null;
  prNumber: number | null;
  storeys: 1 | 2 | 3 | 4;
  changed: boolean;
  lastSequence: number;
  lastCompletedRunId: string | null;
  repositoryDisplay: string | null;
};

export type ClanRunView = ClanRunSnapshot & {
  deviceOnline: boolean;
};

export function isClanRunBusy(snapshot: ClanRunSnapshot): boolean {
  return (
    snapshot.phase === "planning" ||
    snapshot.phase === "building" ||
    snapshot.phase === "awaiting_approval" ||
    snapshot.phase === "validating" ||
    snapshot.deliveryStage === "committing"
  );
}

/** Run accepted on the web but the local harness never progressed past task.start. */
export function isStaleClanRun(snapshot: ClanRunSnapshot): boolean {
  return (
    snapshot.runId !== null &&
    snapshot.phase === "planning" &&
    snapshot.lastEventType === "task.start" &&
    snapshot.lastSequence === 0
  );
}

export function emptyClanRunSnapshot(): ClanRunSnapshot {
  return {
    deviceId: null,
    runId: null,
    requestedMode: null,
    phase: "idle",
    promptPreview: null,
    lastTool: null,
    lastEventType: null,
    approvals: [],
    approvalDecision: null,
    validationStatus: "idle",
    deliveryStage: "idle",
    prUrl: null,
    prNumber: null,
    storeys: 1,
    changed: false,
    lastSequence: 0,
    lastCompletedRunId: null,
    repositoryDisplay: null,
  };
}

export function emptyClanRunView(): ClanRunView {
  return { ...emptyClanRunSnapshot(), deviceOnline: false };
}
