import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";
import { emptyClanRunSnapshot } from "@/app/lib/clan-run/types";
import { createRealtimeGateway, type RealtimeGatewayDevice } from "./gateway";
import { assertLoopbackInternalUrl, authorizeRelaySecret } from "./relay";
import { hashToken } from "@/app/lib/pairing/constants";

describe("internal command relay", () => {
  const deviceId = "550e8400-e29b-41d4-a716-446655440000";
  const token = "gateway-test-token";
  const secret = "relay-secret";
  let gateway: ReturnType<typeof createRealtimeGateway>;
  let baseUrl: string;
  let accepted: string[] = [];

  beforeEach(async () => {
    accepted = [];
    const devices = new Map<string, RealtimeGatewayDevice>([
      ["hash", { id: deviceId, clerkUserId: "user-1", status: "active" }],
    ]);
    gateway = createRealtimeGateway({
      hashToken: () => "hash",
      findDeviceByTokenHash: async () => devices.get("hash"),
      touchDeviceHeartbeat: async () => true,
      touchDevicePresence: async () => undefined,
      relaySecret: secret,
      ackTimeoutMs: 200,
      persistAcceptedTask: async (input) => {
        accepted.push(input.runId);
        return { ...emptyClanRunSnapshot(), runId: input.runId };
      },
      persistRunEvent: async () => emptyClanRunSnapshot(),
    });
    await new Promise<void>((resolve) => {
      gateway.httpServer.listen(0, "127.0.0.1", () => resolve());
    });
    const address = gateway.httpServer.address();
    if (address === null || typeof address === "string") {
      throw new Error("gateway did not bind");
    }
    baseUrl = `http://127.0.0.1:${String(address.port)}`;
  });

  afterEach(async () => {
    await gateway.close();
  });

  function connect(): Promise<ClientSocket> {
    return new Promise((resolve, reject) => {
      const socket = ioClient(baseUrl, {
        autoConnect: false,
        reconnection: false,
        auth: { token },
      });
      socket.once("connect", () => resolve(socket));
      socket.once("connect_error", (error) => reject(error));
      socket.connect();
    });
  }

  function command() {
    return {
      version: 1,
      commandId: crypto.randomUUID(),
      deviceId,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      type: "task.start" as const,
      payload: { prompt: "hello", mode: "build" },
    };
  }

  async function post(body: unknown, header?: string): Promise<{ status: number; json: Record<string, unknown> }> {
    const response = await fetch(`${baseUrl}/internal/command`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(header !== undefined ? { Authorization: header } : {}),
      },
      body: JSON.stringify(body),
    });
    return { status: response.status, json: (await response.json()) as Record<string, unknown> };
  }

  test("missing secret is 401", async () => {
    const result = await post({ clerkUserId: "user-1", command: command() });
    expect(result.status).toBe(401);
  });

  test("wrong owner is 403", async () => {
    const socket = await connect();
    await Bun.sleep(30);
    const envelope = command();
    socket.on("command", () => {
      socket.emit("event", {
        version: 1,
        eventId: crypto.randomUUID(),
        deviceId,
        issuedAt: new Date().toISOString(),
        type: "command.ack",
        payload: { commandId: envelope.commandId, status: "accepted", runId: "run-x" },
      });
    });
    const result = await post(
      { clerkUserId: "user-other", command: envelope },
      `Bearer ${secret}`,
    );
    expect(result.status).toBe(403);
    socket.disconnect();
  });

  test("no socket is 503", async () => {
    const result = await post(
      { clerkUserId: "user-1", command: command() },
      `Bearer ${secret}`,
    );
    expect(result.status).toBe(503);
  });

  test("cancel command does not seed projection", async () => {
    const socket = await connect();
    await Bun.sleep(30);
    const envelope = {
      ...command(),
      type: "task.cancel" as const,
      payload: { runId: "run-active" },
    };
    socket.on("command", (payload: { commandId?: string }) => {
      socket.emit("event", {
        version: 1,
        eventId: crypto.randomUUID(),
        deviceId,
        issuedAt: new Date().toISOString(),
        type: "command.ack",
        payload: { commandId: payload.commandId, status: "accepted", runId: "run-active" },
      });
    });
    const result = await post(
      { clerkUserId: "user-1", command: envelope },
      `Bearer ${secret}`,
    );
    expect(result.status).toBe(200);
    expect(result.json.status).toBe("accepted");
    expect(accepted).toEqual([]);
    socket.disconnect();
  });

  test("accepted ACK returns runId and seeds projection", async () => {
    const socket = await connect();
    await Bun.sleep(30);
    const envelope = command();
    socket.on("command", (payload: { commandId?: string }) => {
      socket.emit("event", {
        version: 1,
        eventId: crypto.randomUUID(),
        deviceId,
        issuedAt: new Date().toISOString(),
        type: "command.ack",
        payload: { commandId: payload.commandId, status: "accepted", runId: "run-ok" },
      });
    });
    const result = await post(
      { clerkUserId: "user-1", command: envelope, promptPreview: "hello", mode: "build" },
      `Bearer ${secret}`,
    );
    expect(result.status).toBe(200);
    expect(result.json.status).toBe("accepted");
    expect(result.json.runId).toBe("run-ok");
    expect(accepted).toEqual(["run-ok"]);
    socket.disconnect();
  });

  test("busy ACK is returned without growing", async () => {
    const socket = await connect();
    await Bun.sleep(30);
    const envelope = command();
    socket.on("command", (payload: { commandId?: string }) => {
      socket.emit("event", {
        version: 1,
        eventId: crypto.randomUUID(),
        deviceId,
        issuedAt: new Date().toISOString(),
        type: "command.ack",
        payload: { commandId: payload.commandId, status: "rejected", reason: "busy" },
      });
    });
    const result = await post(
      { clerkUserId: "user-1", command: envelope },
      `Bearer ${secret}`,
    );
    expect(result.json.status).toBe("rejected");
    expect(result.json.reason).toBe("busy");
    expect(accepted).toEqual([]);
    socket.disconnect();
  });

  test("timeout fail-closed", async () => {
    const socket = await connect();
    await Bun.sleep(30);
    const result = await post(
      { clerkUserId: "user-1", command: command() },
      `Bearer ${secret}`,
    );
    expect(result.status).toBe(200);
    expect(result.json.status).toBe("rejected");
    expect(result.json.reason).toBe("expired");
    socket.disconnect();
  });

  test("run.event is parsed, reprojected, and persisted", async () => {
    const events: string[] = [];
    await gateway.close();
    const devices = new Map<string, RealtimeGatewayDevice>([
      ["hash", { id: deviceId, clerkUserId: "user-1", status: "active" }],
    ]);
    gateway = createRealtimeGateway({
      hashToken: () => "hash",
      findDeviceByTokenHash: async () => devices.get("hash"),
      touchDeviceHeartbeat: async () => true,
      touchDevicePresence: async () => undefined,
      relaySecret: secret,
      ackTimeoutMs: 200,
      persistAcceptedTask: async () => emptyClanRunSnapshot(),
      persistRunEvent: async (input) => {
        events.push(input.event.type);
        return emptyClanRunSnapshot();
      },
    });
    await new Promise<void>((resolve) => {
      gateway.httpServer.listen(0, "127.0.0.1", () => resolve());
    });
    const address = gateway.httpServer.address();
    if (address === null || typeof address === "string") {
      throw new Error("gateway did not bind");
    }
    baseUrl = `http://127.0.0.1:${String(address.port)}`;
    const socket = await connect();
    await Bun.sleep(30);
    socket.emit("event", {
      version: 1,
      eventId: crypto.randomUUID(),
      deviceId,
      issuedAt: new Date().toISOString(),
      type: "run.event",
      payload: {
        event: {
          version: 1,
          eventId: crypto.randomUUID(),
          sequence: 1,
          runId: "run-ok",
          timestamp: new Date().toISOString(),
          type: "tool.requested",
          payload: { toolCallId: "c1", name: "grep", arguments: { query: "secret" } },
        },
      },
    });
    await Bun.sleep(40);
    expect(events).toEqual(["tool.requested"]);
    socket.disconnect();
  });

  test("hashed secret compare accepts the raw secret", () => {
    expect(authorizeRelaySecret(`Bearer ${secret}`, secret)).toBe(true);
    expect(authorizeRelaySecret("Bearer nope", secret)).toBe(false);
    expect(hashToken(secret).length).toBe(64);
  });

  test("internal url must be loopback", () => {
    expect(assertLoopbackInternalUrl("http://127.0.0.1:3001").port).toBe("3001");
    expect(() => assertLoopbackInternalUrl("http://example.com:3001")).toThrow();
  });
});
