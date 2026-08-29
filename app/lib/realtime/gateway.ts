import { createServer, type Server as HttpServer } from "node:http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import { parseClientEventEnvelope } from "../../../clan-cli/packages/protocol/src/network";

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

export function createRealtimeGateway(deps: RealtimeGatewayDeps): RealtimeGateway {
  const socketsByDevice = new Map<string, Set<Socket>>();

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

  const httpServer = createServer((_req, res) => {
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
          if (
            envelope.type === "device.hello" ||
            envelope.type === "device.heartbeat"
          ) {
            const ok = await deps.touchDeviceHeartbeat(deviceId);
            if (!ok) {
              await disconnectDevice(deviceId, "heartbeat_rejected");
            }
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
