import { io, type Socket } from "socket.io-client";
import type { ClientEventEnvelope } from "@clancode/protocol";
import type { RealtimeCredentialsProvider } from "./credentials.ts";

export type RealtimeClient = {
  socket: Socket;
  sendEvent: (envelope: ClientEventEnvelope) => void;
  onCommand: (handler: (payload: unknown) => void) => () => void;
  disconnect: () => void;
};

export async function connectRealtimeClient(input: {
  url: string;
  credentials: RealtimeCredentialsProvider;
}): Promise<RealtimeClient> {
  const token = await input.credentials.getToken();
  const socket = io(input.url, {
    autoConnect: false,
    reconnection: true,
    auth: { token },
  });

  await new Promise<void>((resolve, reject) => {
    socket.connect();
    socket.once("connect", () => resolve());
    socket.once("connect_error", (error) => reject(error));
  });

  return {
    socket,
    sendEvent(envelope) {
      socket.emit("event", envelope);
    },
    onCommand(handler) {
      const listener = (payload: unknown) => handler(payload);
      socket.on("command", listener);
      return () => {
        socket.off("command", listener);
      };
    },
    disconnect() {
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
}
