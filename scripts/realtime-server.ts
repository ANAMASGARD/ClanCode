#!/usr/bin/env bun
import { config } from "dotenv";
import { createServer } from "node:http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import { parseClientEventEnvelope } from "../clan-cli/packages/protocol/src/network";
import {
  findDeviceByTokenHash,
  hashToken,
  touchDeviceHeartbeat,
  touchDevicePresence,
} from "../app/lib/pairing/service";

config({ path: ".env.local" });

const port = Number(process.env.CLANCODE_REALTIME_PORT ?? "3001");
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
  await touchDevicePresence({ deviceId, connectionState: "offline" });
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
  const token = socket.handshake.auth?.token;
  if (typeof token !== "string" || token.length === 0) {
    next(new Error("unauthorized"));
    return;
  }
  const tokenHash = hashToken(token);
  const device = await findDeviceByTokenHash(tokenHash);
  if (device === undefined || device.status !== "active") {
    next(new Error("unauthorized"));
    return;
  }
  socket.data.deviceId = device.id;
  socket.data.clerkUserId = device.clerkUserId;
  next();
});

io.on("connection", (socket) => {
  const deviceId = socket.data.deviceId as string | undefined;
  if (deviceId === undefined) {
    socket.disconnect(true);
    return;
  }

  void (async () => {
    const device = await findDeviceByTokenHash(
      hashToken(String(socket.handshake.auth?.token ?? "")),
    );
    if (device === undefined || device.status !== "active") {
      socket.disconnect(true);
      return;
    }
    trackSocket(deviceId, socket);
    await touchDevicePresence({ deviceId, connectionState: "online" });
  })();

  socket.on("event", (payload) => {
    void (async () => {
      let envelope;
      try {
        envelope = parseClientEventEnvelope(payload);
      } catch {
        return;
      }
      if (envelope.deviceId !== deviceId) {
        return;
      }
      const device = await findDeviceByTokenHash(
        hashToken(String(socket.handshake.auth?.token ?? "")),
      );
      if (device === undefined || device.status !== "active") {
        await disconnectDevice(deviceId, "revoked_or_inactive");
        return;
      }
      if (
        envelope.type === "device.hello" ||
        envelope.type === "device.heartbeat"
      ) {
        const ok = await touchDeviceHeartbeat(deviceId);
        if (!ok) {
          await disconnectDevice(deviceId, "heartbeat_rejected");
        }
      }
    })();
  });

  socket.on("disconnect", () => {
    if (deviceId === undefined) {
      return;
    }
    untrackSocket(deviceId, socket);
    const remaining = socketsByDevice.get(deviceId);
    if (remaining === undefined || remaining.size === 0) {
      void touchDevicePresence({ deviceId, connectionState: "offline" });
    }
  });
});

httpServer.listen(port, () => {
  console.log(`ClanCode realtime gateway listening on http://localhost:${String(port)}`);
});
