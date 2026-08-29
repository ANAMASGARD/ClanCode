import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createServer, type Server as HttpServer } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Server as SocketIOServer, type Socket } from "socket.io";
import type { RunEvent } from "@clancode/protocol";
import type { CommandEnvelope } from "@clancode/protocol";
import { createRunEvent } from "@clancode/protocol";
import { connectRealtimeClient } from "./client.ts";
import { ConnectSession, type ConnectSupervisor } from "./session.ts";
import { SupervisorRuntimeManager } from "../trueforge/runtime-manager.ts";
import type { RuntimeLease } from "../trueforge/runtime-manager.ts";
import type { TrueforgeConfig } from "../trueforge/config.ts";

class FakeSupervisor implements ConnectSupervisor {
  readonly runId: string;
  readonly pendingApprovals: Array<{ toolCallId: string }>;
  #status: string;
  #handlers: Array<(event: RunEvent) => void> = [];

  constructor(status = "idle") {
    this.runId = `run-${crypto.randomUUID()}`;
    this.#status = status;
    this.pendingApprovals = [{ toolCallId: "call-approval-1" }];
  }

  status(): string {
    return this.#status;
  }

  async start(_repositoryPath: string): Promise<void> {
    this.#status = "streaming";
    this.#emit(
      createRunEvent({
        runId: this.runId,
        sequence: 1,
        type: "run.started",
        payload: {
          baseUrl: "http://127.0.0.1:secret",
          repositoryPath: "/home/user/secret-repo",
          mode: "plan",
        },
      }),
    );
  }

  async setMode(_mode: "plan" | "build"): Promise<void> {}

  async submitMessage(_prompt: string): Promise<void> {
    this.#status = "streaming";
  }

  async stop(): Promise<void> {
    this.#status = "stopped";
  }

  async cancel(): Promise<void> {
    this.#status = "cancelled";
  }

  async resolveApproval(_allow: boolean): Promise<void> {
    this.#status = "streaming";
  }

  subscribe(handler: (event: RunEvent) => void): () => void {
    this.#handlers.push(handler);
    return () => {
      this.#handlers = this.#handlers.filter((item) => item !== handler);
    };
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
  const deviceId = "device-test-1";
  const token = "integration-test-token";

  beforeEach(async () => {
    clientEvents = [];
    stateHome = join("/tmp", `clancode-realtime-${crypto.randomUUID()}`);
    process.env.XDG_STATE_HOME = stateHome;
    process.env.CLANCODE_DEVICE_TOKEN = token;
    await mkdir(join(stateHome, "clancode"), { recursive: true });
    await writeFile(
      join(stateHome, "clancode", "preferences.json"),
      JSON.stringify({ deviceId }),
    );

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
  });

  afterEach(async () => {
    io.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    deviceSocket = undefined;
    delete process.env.XDG_STATE_HOME;
    delete process.env.CLANCODE_DEVICE_TOKEN;
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
});
