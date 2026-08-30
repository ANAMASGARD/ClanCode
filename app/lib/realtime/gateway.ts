import { createServer, type Server as HttpServer } from "node:http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import {
  parseClientEventEnvelope,
  parseRunEventNetworkPayload,
  projectRunEventForNetwork,
} from "../../../clan-cli/packages/protocol/src/network";
import { applyAcceptedTask, applyProjectedRunEvent } from "@/app/lib/clan-run/service";
import {
  createAckRegistry,
  DEFAULT_COMMAND_ACK_TIMEOUT_MS,
  handleInternalCommand,
} from "./relay";

export type RealtimeGatewayDevice = {
  id: string;
  clerkUserId: string;
  status: "pending" | "active" | "revoked";
};

export type RealtimeGatewayDeps = {
  hashToken: (token: string) => string;
  findDeviceByTokenHash: (tokenHash: string) => Promise<RealtimeGatewayDevice | undefined>;
  touchDeviceHeartbeat: (deviceId: string) => Promise<boolean>;
  touchDevicePresence: (input: {
    deviceId: string;
    connectionState: "online" | "offline";
  }) => Promise<void>;
  relaySecret?: string;
  ackTimeoutMs?: number;
  persistAcceptedTask?: typeof applyAcceptedTask;
  persistRunEvent?: typeof applyProjectedRunEvent;
};

export type RealtimeGateway = {
  httpServer: HttpServer;
  io: SocketIOServer;
  close: () => Promise<void>;
};

function runDetached(
  label: string,
  task: () => Promise<void>,
  cleanup?: () => void,
): void {
  void task().catch((error: unknown) => {
    console.error(`[realtime:${label}]`, error);
    cleanup?.();
  });
}

function pickNewestSocket(sockets: Set<Socket> | undefined): Socket | undefined {
  if (sockets === undefined) {
    return undefined;
  }
  let chosen: Socket | undefined;
  for (const socket of sockets) {
    chosen = socket;
  }
  return chosen;
}

export function createRealtimeGateway(deps: RealtimeGatewayDeps): RealtimeGateway {
  const socketsByDevice = new Map<string, Set<Socket>>();
  const ack = createAckRegistry(deps.ackTimeoutMs ?? DEFAULT_COMMAND_ACK_TIMEOUT_MS);
  const persistAcceptedTask = deps.persistAcceptedTask ?? applyAcceptedTask;
  const persistRunEvent = deps.persistRunEvent ?? applyProjectedRunEvent;
  const relaySecret = deps.relaySecret ?? "";
  const runEventChains = new Map<string, Promise<void>>();

  function enqueueRunEvent(clerkUserId: string, task: () => Promise<void>): void {
    const previous = runEventChains.get(clerkUserId) ?? Promise.resolve();
    const next = previous.then(task, task);
    runEventChains.set(
      clerkUserId,
      next.then(
        () => undefined,
        () => undefined,
      ),
    );
  }

  function trackSocket(deviceId: string, socket: Socket): void {
    const existing = socketsByDevice.get(deviceId) ?? new Set<Socket>();
    existing.add(socket);
    socketsByDevice.set(deviceId, existing);
  }

  function untrackSocket(deviceId: string, socket: Socket): void {
    const existing = socketsByDevice.get(deviceId);
    if (existing === undefined) {
      return;
    }
    existing.delete(socket);
    if (existing.size === 0) {
      socketsByDevice.delete(deviceId);
    }
  }

  async function disconnectDevice(deviceId: string, reason: string): Promise<void> {
    const sockets = socketsByDevice.get(deviceId);
    if (sockets === undefined) {
      return;
    }
    for (const socket of sockets) {
      ack.rejectSocket(socket.id);
      socket.disconnect(true);
    }
    socketsByDevice.delete(deviceId);
    try {
      await deps.touchDevicePresence({ deviceId, connectionState: "offline" });
    } catch (error) {
      console.error(`[realtime:presence-offline] deviceId=${deviceId}`, error);
    }
    console.log(`Disconnected device ${deviceId}: ${reason}`);
  }

  const httpServer = createServer((req, res) => {
    if (req.method === "POST" && req.url === "/internal/command") {
      void handleInternalCommand(req, res, {
        relaySecret,
        ack,
        pickSocket: (deviceId) => pickNewestSocket(socketsByDevice.get(deviceId)),
        onAccepted: async (input) => {
          await persistAcceptedTask(input);
        },
      });
      return;
    }
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ClanCode realtime gateway\n");
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== "string" || token.length === 0) {
        next(new Error("unauthorized"));
        return;
      }
      const tokenHash = deps.hashToken(token);
      const device = await deps.findDeviceByTokenHash(tokenHash);
      if (device === undefined || device.status !== "active") {
        next(new Error("unauthorized"));
        return;
      }
      socket.data.deviceId = device.id;
      socket.data.clerkUserId = device.clerkUserId;
      next();
    } catch (error) {
      console.error("[realtime:auth]", error);
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const deviceId = socket.data.deviceId as string | undefined;
    if (deviceId === undefined) {
      socket.disconnect(true);
      return;
    }

    let tracked = false;
    runDetached(
      "connect",
      async () => {
        const token = String(socket.handshake.auth?.token ?? "");
        const device = await deps.findDeviceByTokenHash(deps.hashToken(token));
        if (device === undefined || device.status !== "active") {
          socket.disconnect(true);
          return;
        }
        await deps.touchDevicePresence({ deviceId, connectionState: "online" });
        trackSocket(deviceId, socket);
        tracked = true;
      },
      () => {
        if (tracked) {
          untrackSocket(deviceId, socket);
        }
        socket.disconnect(true);
      },
    );

    socket.on("event", (payload) => {
      runDetached(
        "event",
        async () => {
          let envelope;
          try {
            envelope = parseClientEventEnvelope(payload);
          } catch {
            return;
          }
          if (envelope.deviceId !== deviceId) {
            return;
          }
          const token = String(socket.handshake.auth?.token ?? "");
          const device = await deps.findDeviceByTokenHash(deps.hashToken(token));
          if (device === undefined || device.status !== "active") {
            await disconnectDevice(deviceId, "revoked_or_inactive");
            return;
          }
          if (envelope.type === "device.hello" || envelope.type === "device.heartbeat") {
            const ok = await deps.touchDeviceHeartbeat(deviceId);
            if (!ok) {
              await disconnectDevice(deviceId, "heartbeat_rejected");
            }
            return;
          }
          if (envelope.type === "command.ack") {
            ack.resolveAck(socket.id, deviceId, envelope.payload);
            return;
          }
          if (envelope.type === "run.event") {
            const clerkUserId = socket.data.clerkUserId as string | undefined;
            if (clerkUserId === undefined) {
              return;
            }
            enqueueRunEvent(clerkUserId, async () => {
              const token = String(socket.handshake.auth?.token ?? "");
              const device = await deps.findDeviceByTokenHash(deps.hashToken(token));
              if (device === undefined || device.status !== "active") {
                await disconnectDevice(deviceId, "revoked_or_inactive");
                return;
              }
              try {
                const parsed = parseRunEventNetworkPayload(envelope.payload);
                const projected = projectRunEventForNetwork(parsed);
                await persistRunEvent({
                  clerkUserId,
                  deviceId,
                  event: projected,
                });
              } catch (error) {
                console.error("[realtime:run.event]", error);
              }
            });
            return;
          }
        },
        () => {
          void disconnectDevice(deviceId, "event_handler_failed");
        },
      );
    });

    socket.on("disconnect", () => {
      if (deviceId === undefined) {
        return;
      }
      ack.rejectSocket(socket.id);
      untrackSocket(deviceId, socket);
      const remaining = socketsByDevice.get(deviceId);
      if (remaining === undefined || remaining.size === 0) {
        runDetached("disconnect", async () => {
          await deps.touchDevicePresence({ deviceId, connectionState: "offline" });
        });
      }
    });
  });

  return {
    httpServer,
    io,
    async close() {
      ack.rejectAll();
      await new Promise<void>((resolve, reject) => {
        io.close((error) => {
          if (error !== undefined) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}
