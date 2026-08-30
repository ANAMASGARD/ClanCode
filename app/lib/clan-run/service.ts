import { eq } from "drizzle-orm";

import type { RunEvent } from "../../../clan-cli/packages/protocol/src/events";
import { getDb } from "@/app/lib/db";
import {
  clanRunSessionLogs,
  type ArchivedActivityLine,
} from "@/app/lib/db/schema/clan-run-session-logs";
import {
  clanRunProjections,
  type ClanRunProjectionRow,
} from "@/app/lib/db/schema/clan-run-projections";
import { applyRunEvent, seedAcceptedTask } from "./projection";
import {
  emptyClanRunSnapshot,
  type ClanRunMode,
  type ClanRunPhase,
  type ClanRunSnapshot,
  type DeliveryStage,
  type SanitizedApproval,
  type ValidationStatus,
} from "./types";

const chains = new Map<string, Promise<void>>();

function enqueue<T>(clerkUserId: string, task: () => Promise<T>): Promise<T> {
  const previous = chains.get(clerkUserId) ?? Promise.resolve();
  const next = previous.then(task, task);
  chains.set(
    clerkUserId,
    next.then(
      () => undefined,
      () => undefined,
    ),
  );
  return next;
}

function isPhase(value: string): value is ClanRunPhase {
  return (
    value === "idle" ||
    value === "planning" ||
    value === "building" ||
    value === "awaiting_approval" ||
    value === "validating" ||
    value === "success" ||
    value === "failed" ||
    value === "cancelled"
  );
}

function isMode(value: string | null): value is ClanRunMode {
  return value === "plan" || value === "build";
}

function isValidation(value: string): value is ValidationStatus {
  return (
    value === "idle" ||
    value === "running" ||
    value === "passed" ||
    value === "failed" ||
    value === "skipped"
  );
}

function isDelivery(value: string): value is DeliveryStage {
  return (
    value === "idle" ||
    value === "ready" ||
    value === "committing" ||
    value === "pr_created" ||
    value === "failed"
  );
}

function clampStoreys(value: number): 1 | 2 | 3 | 4 {
  if (value <= 1) return 1;
  if (value === 2) return 2;
  if (value === 3) return 3;
  return 4;
}

function parseApprovals(value: unknown): SanitizedApproval[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const rows: SanitizedApproval[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const row = item as Record<string, unknown>;
    if (typeof row.toolCallId !== "string" || row.toolCallId.length === 0) continue;
    rows.push({
      toolCallId: row.toolCallId,
      toolName: typeof row.toolName === "string" ? row.toolName : "tool",
      risk: typeof row.risk === "string" ? row.risk : undefined,
      summary: typeof row.summary === "string" ? row.summary : undefined,
    });
  }
  return rows;
}

export function rowToSnapshot(row: ClanRunProjectionRow): ClanRunSnapshot {
  return {
    deviceId: row.deviceId,
    runId: row.runId,
    requestedMode: isMode(row.requestedMode) ? row.requestedMode : null,
    phase: isPhase(row.phase) ? row.phase : "idle",
    promptPreview: row.promptPreview,
    lastTool: row.lastTool,
    lastEventType: row.lastEventType,
    approvals: parseApprovals(row.approvals),
    approvalDecision:
      row.approvalDecision === "granted" || row.approvalDecision === "denied"
        ? row.approvalDecision
        : null,
    validationStatus: isValidation(row.validationStatus) ? row.validationStatus : "idle",
    deliveryStage: isDelivery(row.deliveryStage) ? row.deliveryStage : "idle",
    prUrl: row.prUrl,
    prNumber: row.prNumber,
    storeys: clampStoreys(row.storeys),
    changed: row.changed,
    lastSequence: row.lastSequence,
    lastCompletedRunId: row.lastCompletedRunId,
    repositoryDisplay: row.repositoryDisplay,
  };
}

async function loadSnapshot(clerkUserId: string): Promise<ClanRunSnapshot> {
  const db = getDb();
  const rows = await db
    .select()
    .from(clanRunProjections)
    .where(eq(clanRunProjections.clerkUserId, clerkUserId))
    .limit(1);
  const row = rows[0];
  return row === undefined ? emptyClanRunSnapshot() : rowToSnapshot(row);
}

async function saveSnapshot(clerkUserId: string, snapshot: ClanRunSnapshot): Promise<void> {
  const db = getDb();
  await db
    .insert(clanRunProjections)
    .values({
      clerkUserId,
      deviceId: snapshot.deviceId,
      runId: snapshot.runId,
      requestedMode: snapshot.requestedMode,
      phase: snapshot.phase,
      promptPreview: snapshot.promptPreview,
      lastTool: snapshot.lastTool,
      lastEventType: snapshot.lastEventType,
      approvals: snapshot.approvals,
      approvalDecision: snapshot.approvalDecision,
      validationStatus: snapshot.validationStatus,
      deliveryStage: snapshot.deliveryStage,
      prUrl: snapshot.prUrl,
      prNumber: snapshot.prNumber,
      storeys: snapshot.storeys,
      changed: snapshot.changed,
      lastSequence: snapshot.lastSequence,
      lastCompletedRunId: snapshot.lastCompletedRunId,
      repositoryDisplay: snapshot.repositoryDisplay,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: clanRunProjections.clerkUserId,
      set: {
        deviceId: snapshot.deviceId,
        runId: snapshot.runId,
        requestedMode: snapshot.requestedMode,
        phase: snapshot.phase,
        promptPreview: snapshot.promptPreview,
        lastTool: snapshot.lastTool,
        lastEventType: snapshot.lastEventType,
        approvals: snapshot.approvals,
        approvalDecision: snapshot.approvalDecision,
        validationStatus: snapshot.validationStatus,
        deliveryStage: snapshot.deliveryStage,
        prUrl: snapshot.prUrl,
        prNumber: snapshot.prNumber,
        storeys: snapshot.storeys,
        changed: snapshot.changed,
        lastSequence: snapshot.lastSequence,
        lastCompletedRunId: snapshot.lastCompletedRunId,
        repositoryDisplay: snapshot.repositoryDisplay,
        updatedAt: new Date(),
      },
    });
}

export async function getClanRunSnapshot(clerkUserId: string): Promise<ClanRunSnapshot> {
  return await loadSnapshot(clerkUserId);
}

export async function applyAcceptedTask(input: {
  clerkUserId: string;
  deviceId: string;
  runId: string;
  requestedMode: ClanRunMode;
  promptPreview: string;
  repositoryDisplay?: string | null;
}): Promise<ClanRunSnapshot> {
  return await enqueue(input.clerkUserId, async () => {
    const current = await loadSnapshot(input.clerkUserId);
    const next = seedAcceptedTask(current, input);
    await saveSnapshot(input.clerkUserId, next);
    return next;
  });
}

export async function applyProjectedRunEvent(input: {
  clerkUserId: string;
  deviceId: string;
  event: RunEvent;
}): Promise<ClanRunSnapshot> {
  return await enqueue(input.clerkUserId, async () => {
    const current = await loadSnapshot(input.clerkUserId);
    const withDevice: ClanRunSnapshot = {
      ...current,
      deviceId: current.deviceId ?? input.deviceId,
    };
    const next = applyRunEvent(withDevice, input.event);
    await saveSnapshot(input.clerkUserId, next);
    return next;
  });
}

export async function applyCancelledRun(
  clerkUserId: string,
  runId: string,
): Promise<ClanRunSnapshot> {
  return await enqueue(clerkUserId, async () => {
    const current = await loadSnapshot(clerkUserId);
    if (current.runId !== runId) {
      return current;
    }
    const next: ClanRunSnapshot = {
      ...current,
      phase: "cancelled",
      deliveryStage: "idle",
      approvals: [],
      approvalDecision: null,
      validationStatus: "idle",
      lastTool: null,
      lastEventType: "run.cancelled",
    };
    await saveSnapshot(clerkUserId, next);
    return next;
  });
}

export async function archiveSessionLog(input: {
  clerkUserId: string;
  runId: string | null;
  promptPreview: string | null;
  phase: string;
  repositoryDisplay: string | null;
  prUrl: string | null;
  activity: ArchivedActivityLine[];
}): Promise<void> {
  if (input.runId === null && input.activity.length === 0) {
    return;
  }
  const db = getDb();
  await db.insert(clanRunSessionLogs).values({
    id: crypto.randomUUID(),
    clerkUserId: input.clerkUserId,
    runId: input.runId,
    promptPreview: input.promptPreview,
    phase: input.phase,
    repositoryDisplay: input.repositoryDisplay,
    prUrl: input.prUrl,
    activity: input.activity,
  });
}

export async function resetRunProjection(input: {
  clerkUserId: string;
  activity?: ArchivedActivityLine[];
}): Promise<ClanRunSnapshot> {
  return await enqueue(input.clerkUserId, async () => {
    const current = await loadSnapshot(input.clerkUserId);
    if (current.runId !== null || (input.activity !== undefined && input.activity.length > 0)) {
      await archiveSessionLog({
        clerkUserId: input.clerkUserId,
        runId: current.runId,
        promptPreview: current.promptPreview,
        phase: current.phase,
        repositoryDisplay: current.repositoryDisplay,
        prUrl: current.prUrl,
        activity: input.activity ?? [],
      });
    }
    const next: ClanRunSnapshot = {
      ...emptyClanRunSnapshot(),
      deviceId: current.deviceId,
      storeys: current.storeys,
      repositoryDisplay: current.repositoryDisplay,
      lastCompletedRunId: current.runId ?? current.lastCompletedRunId,
    };
    await saveSnapshot(input.clerkUserId, next);
    return next;
  });
}
