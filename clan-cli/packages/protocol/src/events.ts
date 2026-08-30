export const RUN_EVENT_VERSION = 1 as const;

export const RUN_EVENT_TYPES = [
  "task.accepted",
  "run.started",
  "run.completed",
  "run.failed",
  "run.cancelled",
  "agent.started",
  "agent.message",
  "session.created",
  "turn.started",
  "model.delta",
  "model.completed",
  "tool.requested",
  "tool.started",
  "tool.completed",
  "tool.failed",
  "approval.required",
  "approval.granted",
  "approval.denied",
  "diff.updated",
  "validation.started",
  "validation.completed",
  "git.branch_created",
  "git.commit_created",
  "pr.created",
] as const;

export type RunEventType = (typeof RUN_EVENT_TYPES)[number];

export function isRunEventType(value: unknown): value is RunEventType {
  return typeof value === "string" && (RUN_EVENT_TYPES as readonly string[]).includes(value);
}

export type RunEvent = {
  version: typeof RUN_EVENT_VERSION;
  eventId: string;
  sequence: number;
  runId: string;
  taskId?: string;
  timestamp: string;
  type: RunEventType;
  payload: unknown;
};

export function createRunEvent(input: {
  runId: string;
  sequence: number;
  type: RunEventType;
  payload?: unknown;
  taskId?: string;
  eventId?: string;
}): RunEvent {
  return {
    version: RUN_EVENT_VERSION,
    eventId: input.eventId ?? crypto.randomUUID(),
    sequence: input.sequence,
    runId: input.runId,
    taskId: input.taskId,
    timestamp: new Date().toISOString(),
    type: input.type,
    payload: input.payload ?? {},
  };
}
