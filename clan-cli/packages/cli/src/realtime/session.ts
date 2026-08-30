import { basename } from "node:path";
import {
  parseCommandEnvelope,
  projectRunEventForNetwork,
  type RunEvent,
  type ClientEventEnvelope,
  type CommandAckPayload,
  type CommandEnvelope,
  type DeviceHeartbeatPayload,
  type DeviceHelloPayload,
} from "@clancode/protocol";
import { RunSupervisor } from "../supervisor/supervisor.ts";
import { loadTrueforgeConfig, type TrueforgeConfig } from "../trueforge/config.ts";
import {
  SupervisorRuntimeManager,
  leaseRuntime,
  type RuntimeLease,
} from "../trueforge/runtime-manager.ts";
import { CommandJournal, isCommandExpired } from "./journal.ts";
import type { RealtimeClient } from "./client.ts";
import { resolveRealtimeCredentials } from "./credentials.ts";
import { resolveRepository } from "../repository/repository.ts";

const BUSY_STATUSES = new Set([
  "starting_runtime",
  "creating_session",
  "streaming",
  "awaiting_approval",
  "awaiting_response",
  "cancelling",
]);

export type ConnectSupervisor = {
  readonly runId: string;
  readonly pendingApprovals: ReadonlyArray<{ toolCallId: string }>;
  readonly mode: "plan" | "build";
  readonly worktree: { worktreePath: string; branchName: string } | undefined;
  status(): string;
  start(repositoryPath: string): Promise<void>;
  setMode(mode: "plan" | "build"): Promise<void>;
  submitMessage(prompt: string): Promise<void>;
  stop(): Promise<void>;
  cancel(): Promise<void>;
  resolveApproval(allow: boolean): Promise<void>;
  commit(message: string, approved: boolean): Promise<void>;
  push(approved: boolean): Promise<void>;
  createPr(title: string, approved: boolean): Promise<void>;
  subscribe(handler: (event: RunEvent) => void): () => void;
};

export type ConnectSessionOptions = {
  runtimeManager?: SupervisorRuntimeManager;
  createSupervisor?: (
    config: TrueforgeConfig,
    options: { runtimeLease: RuntimeLease },
  ) => ConnectSupervisor;
  /** When set (interactive CLI), web `task.start` runs on this supervisor instead of spawning another. */
  getSharedSupervisor?: () => ConnectSupervisor | undefined;
  onRemoteTask?: (input: { prompt: string; mode: "plan" | "build" | undefined }) => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export class ConnectSession {
  readonly #runtimeManager: SupervisorRuntimeManager;
  readonly #createSupervisor: (
    config: TrueforgeConfig,
    options: { runtimeLease: RuntimeLease },
  ) => ConnectSupervisor;
  readonly #getSharedSupervisor: (() => ConnectSupervisor | undefined) | undefined;
  readonly #onRemoteTask:
    | ((input: { prompt: string; mode: "plan" | "build" | undefined }) => void)
    | undefined;
  readonly #journal = new CommandJournal();
  #supervisor: ConnectSupervisor | undefined;
  #deviceId: string | undefined;
  #heartbeat: ReturnType<typeof setInterval> | undefined;
  #unsubscribe: (() => void) | undefined;
  #commandChain: Promise<void> = Promise.resolve();
  #repositoryRoot: string | undefined;
  #repositoryDisplay: string | undefined;
  #activeRunId: string | undefined;
  #retainedDeliveryRunId: string | undefined;
  #requestedMode: "plan" | "build" | undefined;
  #approvalInFlight = false;
  #generation = 0;
  #cancelled = false;

  constructor(options: ConnectSessionOptions = {}) {
    this.#runtimeManager = options.runtimeManager ?? new SupervisorRuntimeManager();
    this.#createSupervisor =
      options.createSupervisor ??
      ((config, runtimeOptions) => new RunSupervisor(config, runtimeOptions));
    this.#getSharedSupervisor = options.getSharedSupervisor;
    this.#onRemoteTask = options.onRemoteTask;
  }

  async start(client: RealtimeClient): Promise<void> {
    const credentials = await resolveRealtimeCredentials();
    this.#deviceId = credentials.deviceId;
    try {
      const repo = await resolveRepository(process.cwd());
      this.#repositoryRoot = repo.root;
      this.#repositoryDisplay = basename(repo.root);
    } catch {
      this.#repositoryRoot = undefined;
      this.#repositoryDisplay = undefined;
    }
    this.#attachSharedSupervisor(client);
    this.#sendHello(client, this.#connectStatus());
    this.#heartbeat = setInterval(() => {
      this.#sendHeartbeat(client);
    }, 20_000);
    client.onCommand((payload) => {
      this.#commandChain = this.#commandChain.then(() => this.#handleCommand(client, payload));
    });
  }

  async stop(client: RealtimeClient): Promise<void> {
    this.#generation += 1;
    this.#cancelled = true;
    if (this.#heartbeat !== undefined) {
      clearInterval(this.#heartbeat);
      this.#heartbeat = undefined;
    }
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
    if (this.#supervisor !== undefined) {
      await this.#supervisor.stop();
      this.#supervisor = undefined;
    }
    this.#activeRunId = undefined;
    this.#retainedDeliveryRunId = undefined;
    await this.#runtimeManager.stopIfSpawned();
    client.disconnect();
  }

  async #handleCommand(client: RealtimeClient, raw: unknown): Promise<void> {
    let command: CommandEnvelope;
    try {
      command = parseCommandEnvelope(raw);
    } catch (error) {
      const commandId = extractCommandId(raw);
      console.error(
        "connect command parse failed:",
        error instanceof Error ? error.message : String(error),
      );
      if (commandId !== undefined) {
        this.#ack(client, commandId, "rejected", undefined, "invalid");
      }
      return;
    }
    if (command.deviceId !== this.#deviceId) {
      this.#ack(client, command.commandId, "rejected", undefined, "unauthorized");
      return;
    }
    if (isCommandExpired(command.expiresAt)) {
      await this.#journal.record({
        commandId: command.commandId,
        receivedAt: new Date().toISOString(),
        expiresAt: command.expiresAt,
        status: "expired",
      });
      this.#ack(client, command.commandId, "expired", undefined, "expired");
      return;
    }
    const cached = await this.#journal.get(command.commandId);
    if (cached !== undefined) {
      this.#ack(client, command.commandId, "duplicate", cached.runId, cached.reason);
      return;
    }

    switch (command.type) {
      case "task.start":
        await this.#taskStart(client, command);
        break;
      case "task.cancel":
        await this.#taskCancel(client, command);
        break;
      case "approval.resolve":
        await this.#approvalResolve(client, command);
        break;
      case "delivery.create_pr":
        await this.#deliveryCreatePr(client, command);
        break;
      default: {
        const _never: never = command.type;
        this.#ack(client, command.commandId, "rejected", undefined, "invalid");
        return _never;
      }
    }
  }

  async #rejectBeforeAccept(
    client: RealtimeClient,
    command: CommandEnvelope,
    error: unknown,
  ): Promise<void> {
    console.error(
      "connect command failed before accept:",
      error instanceof Error ? error.message : String(error),
    );
    await this.#journal.record({
      commandId: command.commandId,
      receivedAt: new Date().toISOString(),
      expiresAt: command.expiresAt,
      status: "rejected",
      reason: "failed",
    });
    this.#ack(client, command.commandId, "rejected", undefined, "failed");
    const shared = this.#getSharedSupervisor?.();
    if (this.#supervisor === undefined || this.#supervisor !== shared) {
      await this.#disposeSupervisor();
    } else {
      this.#unsubscribe?.();
      this.#unsubscribe = undefined;
      this.#supervisor = undefined;
      this.#activeRunId = undefined;
    }
    this.#sendHello(client, "idle");
  }

  async #disposeSupervisor(): Promise<void> {
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
    if (this.#supervisor === undefined) {
      return;
    }
    const shared = this.#getSharedSupervisor?.();
    if (shared !== undefined && this.#supervisor === shared) {
      this.#supervisor = undefined;
      this.#activeRunId = undefined;
      return;
    }
    try {
      await this.#supervisor.stop();
    } catch {
      // Best-effort cleanup after failures.
    }
    this.#supervisor = undefined;
    this.#activeRunId = undefined;
  }

  async #taskStart(client: RealtimeClient, command: CommandEnvelope): Promise<void> {
    const sharedSupervisor = this.#getSharedSupervisor?.();
    const candidate = this.#supervisor ?? sharedSupervisor;
    if (
      this.#activeRunId !== undefined ||
      (candidate !== undefined && BUSY_STATUSES.has(candidate.status()))
    ) {
      await this.#journal.record({
        commandId: command.commandId,
        receivedAt: new Date().toISOString(),
        expiresAt: command.expiresAt,
        status: "rejected",
        reason: "busy",
      });
      this.#ack(client, command.commandId, "rejected", undefined, "busy");
      return;
    }
    const payload = isRecord(command.payload) ? command.payload : {};
    const prompt = payload.prompt;
    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      this.#ack(client, command.commandId, "rejected", undefined, "invalid");
      return;
    }
    if (this.#repositoryRoot === undefined) {
      this.#ack(client, command.commandId, "rejected", undefined, "invalid");
      return;
    }
    const mode = payload.mode === "plan" || payload.mode === "build" ? payload.mode : undefined;
    const trimmedPrompt = prompt.trim();
    this.#retainedDeliveryRunId = undefined;
    this.#cancelled = false;
    try {
      const shared = this.#getSharedSupervisor?.();
      const useShared = shared !== undefined;
      if (useShared) {
        if (BUSY_STATUSES.has(shared.status())) {
          await this.#journal.record({
            commandId: command.commandId,
            receivedAt: new Date().toISOString(),
            expiresAt: command.expiresAt,
            status: "rejected",
            reason: "busy",
          });
          this.#ack(client, command.commandId, "rejected", undefined, "busy");
          return;
        }
        this.#supervisor = shared;
      } else if (this.#supervisor !== undefined) {
        await this.#disposeSupervisor();
      }

      if (this.#supervisor === undefined) {
        const handle = await this.#runtimeManager.ensure();
        this.#supervisor = this.#createSupervisor(loadTrueforgeConfig(), {
          runtimeLease: leaseRuntime(handle),
        });
      }

      this.#wireEvents(client);
      const supervisorStatus = this.#supervisor.status();
      if (supervisorStatus === "idle" || supervisorStatus === "stopped") {
        await this.#supervisor.start(this.#repositoryRoot);
      }
      if (mode === "build") {
        await this.#supervisor.setMode("build");
      } else if (mode === "plan") {
        await this.#supervisor.setMode("plan");
      }
      this.#requestedMode = mode ?? this.#supervisor.mode;
      this.#activeRunId = this.#supervisor.runId;
      this.#generation += 1;
      const generation = this.#generation;
      await this.#journal.record({
        commandId: command.commandId,
        receivedAt: new Date().toISOString(),
        expiresAt: command.expiresAt,
        status: "accepted",
        runId: this.#supervisor.runId,
      });
      this.#ack(client, command.commandId, "accepted", this.#supervisor.runId);
      this.#sendHello(client, "busy");
      this.#onRemoteTask?.({ prompt: trimmedPrompt, mode });
      this.#launchDetached(client, generation, async () => {
        await this.#supervisor?.submitMessage(trimmedPrompt);
      });
    } catch (error) {
      await this.#rejectBeforeAccept(client, command, error);
    }
  }

  async #taskCancel(client: RealtimeClient, command: CommandEnvelope): Promise<void> {
    const payload = isRecord(command.payload) ? command.payload : {};
    const supervisor = this.#resolveSupervisor();
    if (supervisor === undefined) {
      this.#ack(client, command.commandId, "rejected", undefined, "no_active_run");
      return;
    }
    if (typeof payload.runId !== "string" || payload.runId.length === 0) {
      this.#ack(client, command.commandId, "rejected", undefined, "invalid");
      return;
    }
    if (payload.runId !== supervisor.runId) {
      this.#ack(client, command.commandId, "rejected", undefined, "run_mismatch");
      return;
    }
    this.#cancelled = true;
    this.#generation += 1;
    await supervisor.cancel();
    this.#activeRunId = undefined;
    this.#retainedDeliveryRunId = undefined;
    await this.#journal.record({
      commandId: command.commandId,
      receivedAt: new Date().toISOString(),
      expiresAt: command.expiresAt,
      status: "accepted",
      runId: supervisor.runId,
    });
    this.#ack(client, command.commandId, "accepted", supervisor.runId);
    this.#sendHello(client, "idle");
  }

  async #approvalResolve(client: RealtimeClient, command: CommandEnvelope): Promise<void> {
    const payload = isRecord(command.payload) ? command.payload : {};
    const runId = payload.runId;
    const toolCallId = payload.toolCallId;
    const allow = payload.allow;
    if (
      this.#supervisor === undefined ||
      typeof runId !== "string" ||
      typeof toolCallId !== "string" ||
      typeof allow !== "boolean"
    ) {
      this.#ack(client, command.commandId, "rejected", undefined, "invalid");
      return;
    }
    if (runId !== this.#supervisor.runId) {
      this.#ack(client, command.commandId, "rejected", undefined, "run_mismatch");
      return;
    }
    if (this.#approvalInFlight) {
      this.#ack(client, command.commandId, "rejected", undefined, "busy");
      return;
    }
    const pending = this.#supervisor.pendingApprovals.find(
      (item) => item.toolCallId === toolCallId,
    );
    if (pending === undefined) {
      this.#ack(client, command.commandId, "rejected", undefined, "no_pending_approval");
      return;
    }
    this.#approvalInFlight = true;
    this.#generation += 1;
    const generation = this.#generation;
    await this.#journal.record({
      commandId: command.commandId,
      receivedAt: new Date().toISOString(),
      expiresAt: command.expiresAt,
      status: "accepted",
      runId: this.#supervisor.runId,
    });
    this.#ack(client, command.commandId, "accepted", this.#supervisor.runId);
    this.#launchDetached(client, generation, async () => {
      try {
        await this.#supervisor?.resolveApproval(allow);
      } finally {
        if (generation === this.#generation) {
          this.#approvalInFlight = false;
        }
      }
    });
  }

  async #deliveryCreatePr(client: RealtimeClient, command: CommandEnvelope): Promise<void> {
    const payload = isRecord(command.payload) ? command.payload : {};
    if (typeof payload.runId !== "string" || payload.runId.length === 0) {
      this.#ack(client, command.commandId, "rejected", undefined, "invalid");
      return;
    }
    if (this.#activeRunId !== undefined) {
      this.#ack(client, command.commandId, "rejected", undefined, "busy");
      return;
    }
    if (this.#retainedDeliveryRunId === undefined || this.#supervisor === undefined) {
      this.#ack(client, command.commandId, "rejected", undefined, "no_active_run");
      return;
    }
    if (payload.runId !== this.#retainedDeliveryRunId || payload.runId !== this.#supervisor.runId) {
      this.#ack(client, command.commandId, "rejected", undefined, "run_mismatch");
      return;
    }
    if (this.#supervisor.mode !== "build" || this.#supervisor.worktree === undefined) {
      this.#ack(client, command.commandId, "rejected", undefined, "invalid");
      return;
    }
    const title = typeof payload.title === "string" && payload.title.trim().length > 0
      ? payload.title.trim()
      : "ClanCode task";
    try {
      await this.#supervisor.commit(title, true);
      await this.#supervisor.push(true);
      await this.#supervisor.createPr(title, true);
      await this.#journal.record({
        commandId: command.commandId,
        receivedAt: new Date().toISOString(),
        expiresAt: command.expiresAt,
        status: "accepted",
        runId: this.#supervisor.runId,
      });
      this.#ack(client, command.commandId, "accepted", this.#supervisor.runId);
    } catch (error) {
      console.error(
        "connect delivery.create_pr failed:",
        error instanceof Error ? error.message : String(error),
      );
      await this.#journal.record({
        commandId: command.commandId,
        receivedAt: new Date().toISOString(),
        expiresAt: command.expiresAt,
        status: "rejected",
        reason: "failed",
        runId: this.#supervisor.runId,
      });
      this.#ack(client, command.commandId, "rejected", this.#supervisor.runId, "failed");
    }
  }

  #launchDetached(client: RealtimeClient, generation: number, task: () => Promise<void>): void {
    void task()
      .catch((error: unknown) => {
        if (this.#cancelled || generation !== this.#generation) {
          return;
        }
        console.error(
          "connect detached execution failed:",
          error instanceof Error ? error.message : String(error),
        );
      })
      .finally(() => {
        if (generation === this.#generation) {
          this.#sendHello(client, this.#connectStatus());
        }
      });
  }

  #wireEvents(client: RealtimeClient): void {
    const supervisor = this.#resolveSupervisor();
    if (supervisor === undefined) {
      return;
    }
    this.#unsubscribe?.();
    this.#unsubscribe = supervisor.subscribe((event) => {
      this.#onSupervisorEvent(client, event);
    });
  }

  #resolveSupervisor(): ConnectSupervisor | undefined {
    return this.#supervisor ?? this.#getSharedSupervisor?.();
  }

  #attachSharedSupervisor(client: RealtimeClient): void {
    const shared = this.#getSharedSupervisor?.();
    if (shared === undefined) {
      return;
    }
    this.#supervisor = shared;
    this.#wireEvents(client);
  }

  #onSupervisorEvent(client: RealtimeClient, event: RunEvent): void {
    this.#emitRunEvent(client, event);
    const supervisor = this.#resolveSupervisor();
    if (supervisor === undefined || event.runId !== supervisor.runId) {
      return;
    }
    if (event.type === "run.completed") {
      this.#activeRunId = undefined;
      const payload = isRecord(event.payload) ? event.payload : {};
      const validationFailed = payload.validationFailed === true;
      if (this.#requestedMode === "build" && !validationFailed) {
        this.#retainedDeliveryRunId = event.runId;
      } else {
        this.#retainedDeliveryRunId = undefined;
      }
      return;
    }
    if (event.type === "run.failed" || event.type === "run.cancelled") {
      this.#activeRunId = undefined;
      this.#retainedDeliveryRunId = undefined;
    }
  }

  #emitRunEvent(client: RealtimeClient, event: RunEvent): void {
    if (this.#deviceId === undefined) {
      return;
    }
    const envelope: ClientEventEnvelope = {
      version: 1,
      eventId: crypto.randomUUID(),
      deviceId: this.#deviceId,
      issuedAt: new Date().toISOString(),
      type: "run.event",
      payload: { event: projectRunEventForNetwork(event) },
    };
    client.sendEvent(envelope);
  }

  #ack(
    client: RealtimeClient,
    commandId: string,
    status: CommandAckPayload["status"],
    runId?: string,
    reason?: CommandAckPayload["reason"],
  ): void {
    if (this.#deviceId === undefined) {
      return;
    }
    const payload: CommandAckPayload = { commandId, status, runId, reason };
    client.sendEvent({
      version: 1,
      eventId: crypto.randomUUID(),
      deviceId: this.#deviceId,
      issuedAt: new Date().toISOString(),
      type: "command.ack",
      payload,
    });
  }

  #connectStatus(): DeviceHelloPayload["status"] {
    const supervisor = this.#resolveSupervisor();
    if (supervisor === undefined) {
      return "idle";
    }
    if (supervisor.status() === "awaiting_approval") {
      return "awaiting_approval";
    }
    if (BUSY_STATUSES.has(supervisor.status())) {
      return "busy";
    }
    return "idle";
  }

  #sendHello(client: RealtimeClient, status: DeviceHelloPayload["status"]): void {
    if (this.#deviceId === undefined) {
      return;
    }
    const payload: DeviceHelloPayload = {
      protocolVersion: 1,
      deviceId: this.#deviceId,
      status,
      activeRunId: this.#activeRunId,
      repositoryDisplay: this.#repositoryDisplay,
      capabilities: ["task.start", "task.cancel", "approval.resolve", "delivery.create_pr"],
    };
    client.sendEvent({
      version: 1,
      eventId: crypto.randomUUID(),
      deviceId: this.#deviceId,
      issuedAt: new Date().toISOString(),
      type: "device.hello",
      payload,
    });
  }

  #sendHeartbeat(client: RealtimeClient): void {
    if (this.#deviceId === undefined) {
      return;
    }
    const payload: DeviceHeartbeatPayload = {
      deviceId: this.#deviceId,
      status: this.#connectStatus(),
      activeRunId: this.#activeRunId,
    };
    client.sendEvent({
      version: 1,
      eventId: crypto.randomUUID(),
      deviceId: this.#deviceId,
      issuedAt: new Date().toISOString(),
      type: "device.heartbeat",
      payload,
    });
  }
}

function extractCommandId(raw: unknown): string | undefined {
  if (typeof raw !== "object" || raw === null) {
    return undefined;
  }
  const commandId = (raw as Record<string, unknown>).commandId;
  if (typeof commandId !== "string" || commandId.length === 0) {
    return undefined;
  }
  return commandId;
}
