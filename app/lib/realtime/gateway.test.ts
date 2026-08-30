import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";

import { emptyClanRunSnapshot } from "@/app/lib/clan-run/types";
import { createRealtimeGateway, type RealtimeGatewayDevice } from "./gateway";

describe("realtime gateway", () => {
  const deviceId = "550e8400-e29b-41d4-a716-446655440000";
  const token = "gateway-test-token";
  let gateway: ReturnType<typeof createRealtimeGateway>;
  let baseUrl: string;
  let devices = new Map<string, RealtimeGatewayDevice>();
  let presenceUpdates: Array<{ deviceId: string; connectionState: "online" | "offline" }> =
    [];
  let heartbeatUpdates: string[] = [];

  beforeEach(async () => {
    devices = new Map([
      [
        "hash",
        {
          id: deviceId,
          clerkUserId: "user-1",
          status: "active",
        },
      ],
    ]);
    presenceUpdates = [];
    heartbeatUpdates = [];

    gateway = createRealtimeGateway({
      hashToken: () => "hash",
      findDeviceByTokenHash: async () => devices.get("hash"),
      touchDeviceHeartbeat: async (id) => {
        heartbeatUpdates.push(id);
        return devices.get("hash")?.status === "active";
      },
      touchDevicePresence: async (input) => {
        presenceUpdates.push(input);
      },
      relaySecret: "test-relay-secret",
      ackTimeoutMs: 250,
      persistAcceptedTask: async (input) => ({
        ...emptyClanRunSnapshot(),
        runId: input.runId,
      }),
      persistRunEvent: async (input) => ({
        ...emptyClanRunSnapshot(),
        runId: input.event.runId,
      }),
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

  function connect(tokenValue: string): Promise<ClientSocket> {
    return new Promise((resolve, reject) => {
      const socket = ioClient(baseUrl, {
        autoConnect: false,
        reconnection: false,
        auth: { token: tokenValue },
      });
      socket.once("connect", () => resolve(socket));
      socket.once("connect_error", (error) => reject(error));
      socket.connect();
    });
  }

  test("rejects missing token", async () => {
    await expect(connect("")).rejects.toThrow();
  });

  test("rejects revoked device token", async () => {
    devices.set("hash", {
      id: deviceId,
      clerkUserId: "user-1",
      status: "revoked",
    });
    await expect(connect(token)).rejects.toThrow();
  });

  test("accepts active token and marks device online", async () => {
    const socket = await connect(token);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(presenceUpdates.some((entry) => entry.connectionState === "online")).toBe(
      true,
    );
    socket.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(presenceUpdates.some((entry) => entry.connectionState === "offline")).toBe(
      true,
    );
  });

  test("ignores events with mismatched device id", async () => {
    const socket = await connect(token);
    await new Promise((resolve) => setTimeout(resolve, 20));
    socket.emit("event", {
      version: 1,
      eventId: crypto.randomUUID(),
      deviceId: "00000000-0000-4000-8000-000000000001",
      issuedAt: new Date().toISOString(),
      type: "device.heartbeat",
      payload: { status: "idle" },
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(heartbeatUpdates).toHaveLength(0);
    socket.disconnect();
  });

  test("updates heartbeat for matching device id", async () => {
    const socket = await connect(token);
    await new Promise((resolve) => setTimeout(resolve, 20));
    socket.emit("event", {
      version: 1,
      eventId: crypto.randomUUID(),
      deviceId,
      issuedAt: new Date().toISOString(),
      type: "device.heartbeat",
      payload: { status: "idle" },
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(heartbeatUpdates).toContain(deviceId);
    socket.disconnect();
  });

  test("disconnects when heartbeat is rejected", async () => {
    const socket = await connect(token);
    await new Promise((resolve) => setTimeout(resolve, 20));
    devices.set("hash", {
      id: deviceId,
      clerkUserId: "user-1",
      status: "revoked",
    });
    socket.emit("event", {
      version: 1,
      eventId: crypto.randomUUID(),
      deviceId,
      issuedAt: new Date().toISOString(),
      type: "device.heartbeat",
      payload: { status: "idle" },
    });
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(socket.connected).toBe(false);
  });
});
