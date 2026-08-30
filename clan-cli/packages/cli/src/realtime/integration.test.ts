import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createServer, type Server as HttpServer } from "node:http";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Server as SocketIOServer, type Socket } from "socket.io";
import type { RunEvent } from "@clancode/protocol";
import type { CommandEnvelope } from "@clancode/protocol";
import { createRunEvent } from "@clancode/protocol";
import { connectRealtimeClient } from "./client.ts";
import { ConnectSession, type ConnectSupervisor } from "./session.ts";
import { saveStoredCredentials } from "../pairing/store.ts";
import { SupervisorRuntimeManager } from "../trueforge/runtime-manager.ts";
import type { RuntimeLease } from "../trueforge/runtime-manager.ts";
import type { TrueforgeConfig } from "../trueforge/config.ts";

class FakeSupervisor implements ConnectSupervisor {
  readonly runId: string;
  readonly pendingApprovals: Array<{ toolCallId: string }>;
  readonly worktree: { worktreePath: string; branchName: string } | undefined;
  mode: "plan" | "build";
  protected runStatus: string;
  #handlers: Array<(event: RunEvent) => void> = [];
  #sequence = 0;

  constructor(status = "idle", options?: { mode?: "plan" | "build"; worktree?: { worktreePath: string; branchName: string } }) {
    this.runId = `run-${crypto.randomUUID()}`;
    this.runStatus = status;
    this.pendingApprovals = [{ toolCallId: "call-approval-1" }];
    this.mode = options?.mode ?? "plan";
    this.worktree = options?.worktree;
  }

  status(): string {
    return this.runStatus;
  }

  async start(_repositoryPath: string): Promise<void> {
    this.runStatus = "streaming";
    this.#emit(
      createRunEvent({
        runId: this.runId,
        sequence: this.#nextSequence(),
        type: "run.started",
        payload: {
          baseUrl: "http://127.0.0.1:secret",
          repositoryPath: "/home/user/secret-repo",
          mode: "spawned",
        },
      }),
    );
  }

  async setMode(mode: "plan" | "build"): Promise<void> {
    this.mode = mode;
  }

  async submitMessage(_prompt: string): Promise<void> {
    this.runStatus = "streaming";
  }

  async stop(): Promise<void> {
    this.runStatus = "stopped";
  }

  async cancel(): Promise<void> {
    this.runStatus = "cancelled";
  }

  async resolveApproval(_allow: boolean): Promise<void> {
    this.runStatus = "streaming";
  }

  async commit(_message: string, _approved: boolean): Promise<void> {}

  async push(_approved: boolean): Promise<void> {}

  async createPr(_title: string, _approved: boolean): Promise<void> {
    this.#emit(
      createRunEvent({
        runId: this.runId,
        sequence: this.#nextSequence(),
        type: "pr.created",
        payload: { url: "https://github.com/org/repo/pull/1", number: 1, branch: "clancode/task" },
      }),
    );
  }

  subscribe(handler: (event: RunEvent) => void): () => void {
    this.#handlers.push(handler);
    return () => {
      this.#handlers = this.#handlers.filter((item) => item !== handler);
    };
  }

  complete(payload: Record<string, unknown> = {}): void {
    this.runStatus = "completed";
    this.#emit(
      createRunEvent({
        runId: this.runId,
        sequence: this.#nextSequence(),
        type: "run.completed",
        payload,
      }),
    );
  }

  #nextSequence(): number {
    this.#sequence += 1;
    return this.#sequence;
  }

  #emit(event: RunEvent): void {
    for (const handler of this.#handlers) {
      handler(event);
    }
  }
}

describe("ConnectSession realtime integration", () => {
  let httpServer: HttpServer;
  let io: SocketIOServer;
  let baseUrl: string;
  let deviceSocket: Socket | undefined;
  let clientEvents: unknown[] = [];
  let stateHome: string;
  const deviceId = "550e8400-e29b-41d4-a716-446655440010";
  const token = "integration-test-token";

  beforeEach(async () => {
    clientEvents = [];
    stateHome = join("/tmp", `clancode-realtime-${crypto.randomUUID()}`);
    process.env.XDG_STATE_HOME = stateHome;
    await mkdir(join(stateHome, "clancode"), { recursive: true });

    httpServer = createServer();
    io = new SocketIOServer(httpServer, { cors: { origin: "*" } });
    io.use((socket, next) => {
      if (socket.handshake.auth?.token === token) {
        next();
        return;
      }
      next(new Error("unauthorized"));
    });
    io.on("connection", (socket) => {
      deviceSocket = socket;
      socket.on("event", (payload) => {
        clientEvents.push(payload);
      });
    });

    await new Promise<void>((resolve) => {
      httpServer.listen(0, "127.0.0.1", () => resolve());
    });
    const address = httpServer.address();
    if (address === null || typeof address === "string") {
      throw new Error("server did not bind");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;

    await saveStoredCredentials({
      deviceToken: token,
      deviceId,
      controlUrl: baseUrl,
      pairedAt: new Date().toISOString(),
    });
  });

  afterEach(async () => {
    io.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    deviceSocket = undefined;
    delete process.env.XDG_STATE_HOME;
    delete process.env.CLANCODE_DEVICE_TOKEN;
    delete process.env.CLANCODE_CONTROL_URL;
    delete process.env.CLANCODE_DEVICE_ID;
  });

  function command(overrides: Partial<CommandEnvelope> & Pick<CommandEnvelope, "type">): CommandEnvelope {
    return {
      version: 1,
      commandId: crypto.randomUUID(),
      deviceId,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 120_000).toISOString(),
      payload: {},
      ...overrides,
    };
  }

  async function startSession(input?: {
    supervisor?: ConnectSupervisor;
    runtimeManager?: SupervisorRuntimeManager;
  }): Promise<{ session: ConnectSession; client: Awaited<ReturnType<typeof connectRealtimeClient>> }> {
    const runtimeManager = input?.runtimeManager ?? {
      ensure: async () => ({
        mode: "spawned" as const,
        baseUrl: "http://127.0.0.1:9999",
        child: { kill: () => true },
      }),
      stopIfSpawned: async () => {},
      wasSpawned: () => true,
      getHandle: () => undefined,
      stop: async () => {},
    };
    const session = new ConnectSession({
      runtimeManager: runtimeManager as SupervisorRuntimeManager,
      createSupervisor: (_config: TrueforgeConfig, _options: { runtimeLease: RuntimeLease }) =>
        input?.supervisor ?? new FakeSupervisor(),
    });
    const client = await connectRealtimeClient({
      url: baseUrl,
      credentials: { getToken: async () => token },
    });
    await session.start(client);
    return { session, client };
  }

  test("hello and task.start ack with projected run.event", async () => {
    const { session, client } = await startSession();
    const start = command({
      type: "task.start",
      payload: {
        repositoryPath: "/tmp/repo",
        prompt: "inspect",
        mode: "plan",
      },
    });
    deviceSocket?.emit("command", start);
    await Bun.sleep(50);

    const hello = clientEvents.find(
      (item) => (item as { type?: string }).type === "device.hello",
    ) as { payload?: { status?: string } } | undefined;
    expect(hello?.payload?.status).toBeDefined();

    const ack = clientEvents.find(
      (item) =>
        (item as { type?: string }).type === "command.ack" &&
        (item as { payload?: { commandId?: string } }).payload?.commandId === start.commandId,
    ) as { payload?: { status?: string; runId?: string } } | undefined;
    expect(ack?.payload?.status).toBe("accepted");
    expect(typeof ack?.payload?.runId).toBe("string");

    const runEvent = clientEvents.find(
      (item) => (item as { type?: string }).type === "run.event",
    ) as { payload?: { event?: { payload?: Record<string, unknown> } } } | undefined;
    const projected = runEvent?.payload?.event?.payload ?? {};
    expect(projected.baseUrl).toBeUndefined();
    expect(projected.repositoryPath).toBeUndefined();
    expect(projected.mode).toBeUndefined();

    await session.stop(client);
  });

  test("duplicate commandId acks duplicate after journal reopen", async () => {
    const start = command({
      type: "task.start",
      commandId: "cmd-dup-1",
      payload: { repositoryPath: "/tmp/repo", prompt: "one" },
    });

    const first = await startSession();
    deviceSocket?.emit("command", start);
    await Bun.sleep(50);
    await first.session.stop(first.client);

    const second = await startSession();
    deviceSocket?.emit("command", start);
    await Bun.sleep(50);

    const dupAck = clientEvents.find(
      (item) =>
        (item as { type?: string }).type === "command.ack" &&
        (item as { payload?: { commandId?: string; status?: string } }).payload?.commandId ===
          "cmd-dup-1" &&
        (item as { payload?: { status?: string } }).payload?.status === "duplicate",
    );
    expect(dupAck).toBeDefined();
    await second.session.stop(second.client);
  });

  test("busy rejects overlapping task.start", async () => {
    const { session, client } = await startSession();
    const first = command({
      type: "task.start",
      payload: { repositoryPath: "/tmp/repo", prompt: "first" },
    });
    deviceSocket?.emit("command", first);
    await Bun.sleep(50);

    const rejected = command({
      type: "task.start",
      payload: { repositoryPath: "/tmp/repo", prompt: "second" },
    });
    deviceSocket?.emit("command", rejected);
    await Bun.sleep(50);

    const ack = clientEvents.find(
      (item) =>
        (item as { type?: string }).type === "command.ack" &&
        (item as { payload?: { commandId?: string } }).payload?.commandId === rejected.commandId,
    ) as { payload?: { status?: string; reason?: string } } | undefined;
    expect(ack?.payload?.status).toBe("rejected");
    expect(ack?.payload?.reason).toBe("busy");
    await session.stop(client);
  });

  test("concurrent duplicate commandId acks duplicate once", async () => {
    let startCount = 0;
    class CountingSupervisor extends FakeSupervisor {
      override async start(repositoryPath: string): Promise<void> {
        startCount += 1;
        await super.start(repositoryPath);
      }
    }
    const { session, client } = await startSession({
      supervisor: new CountingSupervisor(),
    });
    const start = command({
      type: "task.start",
      commandId: "cmd-concurrent-dup",
      payload: { repositoryPath: "/tmp/repo", prompt: "once" },
    });
    deviceSocket?.emit("command", start);
    deviceSocket?.emit("command", start);
    await Bun.sleep(150);

    const dupAcks = clientEvents.filter(
      (item) =>
        (item as { type?: string }).type === "command.ack" &&
        (item as { payload?: { commandId?: string; status?: string } }).payload?.commandId ===
          "cmd-concurrent-dup" &&
        (item as { payload?: { status?: string } }).payload?.status === "duplicate",
    );
    expect(startCount).toBe(1);
    expect(dupAcks.length).toBeGreaterThanOrEqual(1);
    await session.stop(client);
  });

  test("malformed command acks rejected when commandId is present", async () => {
    const { session, client } = await startSession();
    deviceSocket?.emit("command", {
      version: 1,
      commandId: "cmd-malformed-1",
      deviceId,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 120_000).toISOString(),
      type: "task.nope",
      payload: {},
    });
    await Bun.sleep(50);

    const ack = clientEvents.find(
      (item) =>
        (item as { type?: string }).type === "command.ack" &&
        (item as { payload?: { commandId?: string } }).payload?.commandId === "cmd-malformed-1",
    ) as { payload?: { status?: string; reason?: string } } | undefined;
    expect(ack?.payload?.status).toBe("rejected");
    expect(ack?.payload?.reason).toBe("invalid");
    await session.stop(client);
  });

  test("task.cancel rejects missing runId", async () => {
    const supervisor = new FakeSupervisor();
    const { session, client } = await startSession({ supervisor });
    const start = command({
      type: "task.start",
      payload: { repositoryPath: "/tmp/repo", prompt: "run" },
    });
    deviceSocket?.emit("command", start);
    await Bun.sleep(50);

    const cancel = command({
      type: "task.cancel",
      payload: {},
    });
    deviceSocket?.emit("command", cancel);
    await Bun.sleep(50);

    const ack = clientEvents.find(
      (item) =>
        (item as { type?: string }).type === "command.ack" &&
        (item as { payload?: { commandId?: string } }).payload?.commandId === cancel.commandId,
    ) as { payload?: { status?: string; reason?: string } } | undefined;
    expect(ack?.payload?.status).toBe("rejected");
    expect(ack?.payload?.reason).toBe("invalid");
    expect(supervisor.status()).toBe("streaming");
    await session.stop(client);
  });

  test("task.start failure before accept sends rejected failed ACK", async () => {
    class FailingSupervisor extends FakeSupervisor {
      override async start(_repositoryPath: string): Promise<void> {
        throw new Error("startup failed");
      }
    }
    const { session, client } = await startSession({ supervisor: new FailingSupervisor() });
    const start = command({
      type: "task.start",
      commandId: "cmd-start-fail",
      payload: { repositoryPath: "/tmp/repo", prompt: "boom" },
    });
    deviceSocket?.emit("command", start);
    await Bun.sleep(50);

    const ack = clientEvents.find(
      (item) =>
        (item as { type?: string }).type === "command.ack" &&
        (item as { payload?: { commandId?: string } }).payload?.commandId === "cmd-start-fail",
    ) as { payload?: { status?: string; reason?: string } } | undefined;
    expect(ack?.payload?.status).toBe("rejected");
    expect(ack?.payload?.reason).toBe("failed");
    await session.stop(client);
  });

  test("task.start failure after accept does not rewrite ACK", async () => {
    class LateFailSupervisor extends FakeSupervisor {
      override async submitMessage(_prompt: string): Promise<void> {
        this.complete();
        throw new Error("submit failed");
      }
    }
    const supervisor = new LateFailSupervisor();
    const { session, client } = await startSession({ supervisor });
    const start = command({
      type: "task.start",
      commandId: "cmd-submit-fail",
      payload: { repositoryPath: "/tmp/repo", prompt: "late boom" },
    });
    deviceSocket?.emit("command", start);
    await Bun.sleep(100);

    const acks = clientEvents.filter(
      (item) =>
        (item as { type?: string }).type === "command.ack" &&
        (item as { payload?: { commandId?: string } }).payload?.commandId === "cmd-submit-fail",
    ) as Array<{ payload?: { status?: string } }>;
    expect(acks.some((item) => item.payload?.status === "accepted")).toBe(true);
    expect(acks.some((item) => item.payload?.status === "rejected")).toBe(false);
    await session.stop(client);
  });

  test("approval.resolve matches runId and toolCallId", async () => {
    const supervisor = new FakeSupervisor();
    const { session, client } = await startSession({ supervisor });
    const start = command({
      type: "task.start",
      payload: { repositoryPath: "/tmp/repo", prompt: "approve me" },
    });
    deviceSocket?.emit("command", start);
    await Bun.sleep(50);

    const resolve = command({
      type: "approval.resolve",
      payload: {
        runId: supervisor.runId,
        toolCallId: "call-approval-1",
        allow: true,
      },
    });
    deviceSocket?.emit("command", resolve);
    await Bun.sleep(50);

    const ack = clientEvents.find(
      (item) =>
        (item as { type?: string }).type === "command.ack" &&
        (item as { payload?: { commandId?: string } }).payload?.commandId === resolve.commandId,
    ) as { payload?: { status?: string } } | undefined;
    expect(ack?.payload?.status).toBe("accepted");
    await session.stop(client);
  });

  test("task.start ignores browser repositoryPath", async () => {
    const startedWith: string[] = [];
    class CaptureSupervisor extends FakeSupervisor {
      override async start(repositoryPath: string): Promise<void> {
        startedWith.push(repositoryPath);
        await super.start(repositoryPath);
      }
    }
    const supervisor = new CaptureSupervisor();
    const { session, client } = await startSession({ supervisor });
    const start = command({
      type: "task.start",
      payload: { repositoryPath: "/tmp/evil-repo", prompt: "inspect" },
    });
    deviceSocket?.emit("command", start);
    await Bun.sleep(50);
    expect(startedWith.length).toBe(1);
    expect(startedWith[0]).not.toBe("/tmp/evil-repo");
    expect(startedWith[0]?.includes("secret-repo")).toBe(false);
    await session.stop(client);
  });

  test("task.start without prompt is invalid", async () => {
    const { session, client } = await startSession();
    const start = command({
      type: "task.start",
      payload: { repositoryPath: "/tmp/repo" },
    });
    deviceSocket?.emit("command", start);
    await Bun.sleep(50);
    const ack = clientEvents.find(
      (item) =>
        (item as { type?: string }).type === "command.ack" &&
        (item as { payload?: { commandId?: string } }).payload?.commandId === start.commandId,
    ) as { payload?: { status?: string; reason?: string } } | undefined;
    expect(ack?.payload?.status).toBe("rejected");
    expect(ack?.payload?.reason).toBe("invalid");
    await session.stop(client);
  });

  test("cancel is accepted while submitMessage is in flight", async () => {
    class HangingSupervisor extends FakeSupervisor {
      override async submitMessage(_prompt: string): Promise<void> {
        this.runStatus = "streaming";
        await new Promise(() => undefined);
      }
    }
    const supervisor = new HangingSupervisor();
    const { session, client } = await startSession({ supervisor });
    const start = command({
      type: "task.start",
      payload: { prompt: "hang" },
    });
    deviceSocket?.emit("command", start);
    await Bun.sleep(50);
    const cancel = command({
      type: "task.cancel",
      payload: { runId: supervisor.runId },
    });
    deviceSocket?.emit("command", cancel);
    await Bun.sleep(50);
    const ack = clientEvents.find(
      (item) =>
        (item as { type?: string }).type === "command.ack" &&
        (item as { payload?: { commandId?: string } }).payload?.commandId === cancel.commandId,
    ) as { payload?: { status?: string } } | undefined;
    expect(ack?.payload?.status).toBe("accepted");
    expect(supervisor.status()).toBe("cancelled");
    await session.stop(client);
  });

  test("cancel is accepted while approval continuation is in flight", async () => {
    class SlowApprovalSupervisor extends FakeSupervisor {
      override async resolveApproval(_allow: boolean): Promise<void> {
        this.runStatus = "streaming";
        await new Promise(() => undefined);
      }
    }
    const supervisor = new SlowApprovalSupervisor();
    const { session, client } = await startSession({ supervisor });
    const start = command({
      type: "task.start",
      payload: { prompt: "approve hang" },
    });
    deviceSocket?.emit("command", start);
    await Bun.sleep(50);
    const resolve = command({
      type: "approval.resolve",
      payload: { runId: supervisor.runId, toolCallId: "call-approval-1", allow: true },
    });
    deviceSocket?.emit("command", resolve);
    await Bun.sleep(50);
    const cancel = command({
      type: "task.cancel",
      payload: { runId: supervisor.runId },
    });
    deviceSocket?.emit("command", cancel);
    await Bun.sleep(50);
    const ack = clientEvents.find(
      (item) =>
        (item as { type?: string }).type === "command.ack" &&
        (item as { payload?: { commandId?: string } }).payload?.commandId === cancel.commandId,
    ) as { payload?: { status?: string } } | undefined;
    expect(ack?.payload?.status).toBe("accepted");
    await session.stop(client);
  });

  test("duplicate approval while continuation is in flight is busy", async () => {
    class SlowApprovalSupervisor extends FakeSupervisor {
      override async resolveApproval(_allow: boolean): Promise<void> {
        this.runStatus = "streaming";
        await new Promise(() => undefined);
      }
    }
    const supervisor = new SlowApprovalSupervisor();
    const { session, client } = await startSession({ supervisor });
    const start = command({
      type: "task.start",
      payload: { prompt: "dup approve" },
    });
    deviceSocket?.emit("command", start);
    await Bun.sleep(50);
    const first = command({
      type: "approval.resolve",
      payload: { runId: supervisor.runId, toolCallId: "call-approval-1", allow: true },
    });
    const second = command({
      type: "approval.resolve",
      payload: { runId: supervisor.runId, toolCallId: "call-approval-1", allow: false },
    });
    deviceSocket?.emit("command", first);
    await Bun.sleep(30);
    deviceSocket?.emit("command", second);
    await Bun.sleep(50);
    const secondAck = clientEvents.find(
      (item) =>
        (item as { type?: string }).type === "command.ack" &&
        (item as { payload?: { commandId?: string } }).payload?.commandId === second.commandId,
    ) as { payload?: { status?: string; reason?: string } } | undefined;
    expect(secondAck?.payload?.status).toBe("rejected");
    expect(secondAck?.payload?.reason).toBe("busy");
    await session.stop(client);
  });

  test("delivery.create_pr requires retained completed build", async () => {
    const supervisor = new FakeSupervisor("idle", {
      mode: "build",
      worktree: { worktreePath: "/tmp/wt", branchName: "clancode/task" },
    });
    const { session, client } = await startSession({ supervisor });
    const start = command({
      type: "task.start",
      payload: { prompt: "deliver", mode: "build" },
    });
    deviceSocket?.emit("command", start);
    await Bun.sleep(50);
    const tooEarly = command({
      type: "delivery.create_pr",
      payload: { runId: supervisor.runId },
    });
    deviceSocket?.emit("command", tooEarly);
    await Bun.sleep(50);
    const earlyAck = clientEvents.find(
      (item) =>
        (item as { type?: string }).type === "command.ack" &&
        (item as { payload?: { commandId?: string } }).payload?.commandId === tooEarly.commandId,
    ) as { payload?: { status?: string; reason?: string } } | undefined;
    expect(earlyAck?.payload?.status).toBe("rejected");
    expect(earlyAck?.payload?.reason).toBe("busy");

    supervisor.complete();
    await Bun.sleep(30);
    const deliver = command({
      type: "delivery.create_pr",
      payload: { runId: supervisor.runId, title: "Demo PR" },
    });
    deviceSocket?.emit("command", deliver);
    await Bun.sleep(50);
    const deliverAck = clientEvents.find(
      (item) =>
        (item as { type?: string }).type === "command.ack" &&
        (item as { payload?: { commandId?: string } }).payload?.commandId === deliver.commandId,
    ) as { payload?: { status?: string } } | undefined;
    expect(deliverAck?.payload?.status).toBe("accepted");
    await session.stop(client);
  });
});
