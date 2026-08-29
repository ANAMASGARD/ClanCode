import {
  createRunEvent,
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
  status(): string;
  start(repositoryPath: string): Promise<void>;
  setMode(mode: "plan" | "build"): Promise<void>;
  submitMessage(prompt: string): Promise<void>;
  stop(): Promise<void>;
  cancel(): Promise<void>;
  resolveApproval(allow: boolean): Promise<void>;
  subscribe(handler: (event: RunEvent) => void): () => void;
};

export type ConnectSessionOptions = {
  runtimeManager?: SupervisorRuntimeManager;
  createSupervisor?: (
    config: TrueforgeConfig,
    options: { runtimeLease: RuntimeLease },
  ) => ConnectSupervisor;
};

export class ConnectSession {
  readonly #runtimeManager: SupervisorRuntimeManager;
  readonly #createSupervisor: (
    config: TrueforgeConfig,
    options: { runtimeLease: RuntimeLease },
  ) => ConnectSupervisor;
  readonly #journal = new CommandJournal();
  #supervisor: ConnectSupervisor | undefined;
  #deviceId: string | undefined;
  #heartbeat: ReturnType<typeof setInterval> | undefined;
  #unsubscribe: (() => void) | undefined;
  #commandChain: Promise<void> = Promise.resolve();

  constructor(options: ConnectSessionOptions = {}) {
    this.#runtimeManager = options.runtimeManager ?? new SupervisorRuntimeManager();
    this.#createSupervisor =
      options.createSupervisor ??
      ((config, runtimeOptions) => new RunSupervisor(config, runtimeOptions));
  }

  async start(client: RealtimeClient): Promise<void> {
    const credentials = await resolveRealtimeCredentials();
    this.#deviceId = credentials.deviceId;
    this.#sendHello(client, "idle");
    this.#heartbeat = setInterval(() => {
      this.#sendHeartbeat(client);
    }, 20_000);
    client.onCommand((payload) => {
      this.#commandChain = this.#commandChain.then(() => this.#handleCommand(client, payload));
    });
  }

  async stop(client: RealtimeClient): Promise<void> {
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
    await this.#disposeSupervisor();
    this.#sendHello(client, "idle");
  }

  async #handlePostAcceptFailure(
    client: RealtimeClient,
    command: CommandEnvelope,
    error: unknown,
  ): Promise<void> {
    const runId = this.#supervisor?.runId;
    const message = error instanceof Error ? error.message : String(error);
    console.error("connect task failed after accept:", message);
    if (runId !== undefined) {
      this.#emitRunEvent(
        client,
        createRunEvent({
          runId,
          sequence: 0,
          type: "run.failed",
          payload: { message, code: "execution_failed" },
        }),
      );
    }
    await this.#disposeSupervisor();
    this.#sendHello(client, "idle");
  }

  async #disposeSupervisor(): Promise<void> {
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
    if (this.#supervisor === undefined) {
      return;
    }
    try {
      await this.#supervisor.stop();
    } catch {
      // Best-effort cleanup after failures.
    }
    this.#supervisor = undefined;
  }

  async #taskStart(client: RealtimeClient, command: CommandEnvelope): Promise<void> {
    if (
      this.#supervisor !== undefined &&
      BUSY_STATUSES.has(this.#supervisor.status())
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
    const payload = command.payload as {
      repositoryPath?: string;
      prompt?: string;
      mode?: "plan" | "build";
    };
    if (
      typeof payload.repositoryPath !== "string" ||
      typeof payload.prompt !== "string"
    ) {
      this.#ack(client, command.commandId, "rejected", undefined, "invalid");
      return;
    }
    if (this.#supervisor !== undefined) {
      await this.#disposeSupervisor();
    }
    let accepted = false;
    try {
      const handle = await this.#runtimeManager.ensure();
      this.#supervisor = this.#createSupervisor(loadTrueforgeConfig(), {
        runtimeLease: leaseRuntime(handle),
      });
      this.#wireEvents(client);
      await this.#supervisor.start(payload.repositoryPath);
      if (payload.mode === "build") {
        await this.#supervisor.setMode("build");
      }
      await this.#journal.record({
        commandId: command.commandId,
        receivedAt: new Date().toISOString(),
        expiresAt: command.expiresAt,
        status: "accepted",
        runId: this.#supervisor.runId,
      });
      this.#ack(client, command.commandId, "accepted", this.#supervisor.runId);
      accepted = true;
      this.#sendHello(client, "busy");
      await this.#supervisor.submitMessage(payload.prompt);
      this.#sendHello(client, this.#connectStatus());
    } catch (error) {
      if (accepted) {
        await this.#handlePostAcceptFailure(client, command, error);
      } else {
        await this.#rejectBeforeAccept(client, command, error);
      }
    }
  }

  async #taskCancel(client: RealtimeClient, command: CommandEnvelope): Promise<void> {
    const payload = command.payload as { runId?: string };
    if (this.#supervisor === undefined) {
      this.#ack(client, command.commandId, "rejected", undefined, "no_active_run");
      return;
    }
    if (typeof payload.runId !== "string" || payload.runId.length === 0) {
      this.#ack(client, command.commandId, "rejected", undefined, "invalid");
      return;
    }
    if (payload.runId !== this.#supervisor.runId) {
      this.#ack(client, command.commandId, "rejected", undefined, "run_mismatch");
      return;
    }
    await this.#supervisor.cancel();
    await this.#journal.record({
      commandId: command.commandId,
      receivedAt: new Date().toISOString(),
      expiresAt: command.expiresAt,
      status: "accepted",
      runId: this.#supervisor.runId,
    });
    this.#ack(client, command.commandId, "accepted", this.#supervisor.runId);
    this.#sendHello(client, "idle");
  }

  async #approvalResolve(client: RealtimeClient, command: CommandEnvelope): Promise<void> {
    const payload = command.payload as {
      runId?: string;
      toolCallId?: string;
      allow?: boolean;
    };
    if (
      this.#supervisor === undefined ||
      typeof payload.runId !== "string" ||
      typeof payload.toolCallId !== "string" ||
      typeof payload.allow !== "boolean"
    ) {
      this.#ack(client, command.commandId, "rejected", undefined, "invalid");
      return;
    }
    if (payload.runId !== this.#supervisor.runId) {
      this.#ack(client, command.commandId, "rejected", undefined, "run_mismatch");
      return;
    }
    const pending = this.#supervisor.pendingApprovals.find(
      (item) => item.toolCallId === payload.toolCallId,
    );
    if (pending === undefined) {
      this.#ack(client, command.commandId, "rejected", undefined, "no_pending_approval");
      return;
    }
    await this.#supervisor.resolveApproval(payload.allow);
    await this.#journal.record({
      commandId: command.commandId,
      receivedAt: new Date().toISOString(),
      expiresAt: command.expiresAt,
      status: "accepted",
      runId: this.#supervisor.runId,
    });
    this.#ack(client, command.commandId, "accepted", this.#supervisor.runId);
  }

  #wireEvents(client: RealtimeClient): void {
    if (this.#supervisor === undefined) {
      return;
    }
    this.#unsubscribe?.();
    this.#unsubscribe = this.#supervisor.subscribe((event) => {
      this.#emitRunEvent(client, event);
    });
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
    if (this.#supervisor === undefined) {
      return "idle";
    }
    if (this.#supervisor.status() === "awaiting_approval") {
      return "awaiting_approval";
    }
    if (BUSY_STATUSES.has(this.#supervisor.status())) {
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
      activeRunId: this.#supervisor?.runId,
      capabilities: ["task.start", "task.cancel", "approval.resolve"],
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
      activeRunId: this.#supervisor?.runId,
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
  return typeof commandId === "string" && commandId.length > 0 ? commandId : undefined;
}
