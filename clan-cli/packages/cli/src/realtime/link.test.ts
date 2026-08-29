import { describe, expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import { startControlPlaneLink } from "./link.ts";
import type { RealtimeClient } from "./client.ts";
import { ConnectSession } from "./session.ts";

class FakeSocket extends EventEmitter {
  disconnect(): void {
    this.emit("disconnect");
  }

  override off(event: string | symbol, listener?: (...args: unknown[]) => void): this {
    if (listener === undefined) {
      this.removeAllListeners(event);
      return this;
    }
    return super.off(event, listener);
  }
}

function fakeClient(): RealtimeClient {
  const socket = new FakeSocket() as unknown as RealtimeClient["socket"];
  return {
    socket,
    sendEvent() {},
    onCommand() {
      return () => {};
    },
    disconnect() {
      (socket as unknown as FakeSocket).disconnect();
    },
  };
}

describe("control plane link", () => {
  test("stays offline when disabled", async () => {
    const states: string[] = [];
    const link = startControlPlaneLink({
      enabled: false,
      onState: (state) => states.push(state),
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    await link.stop();
    expect(states[0]).toBe("offline");
  });

  test("reports connected after a successful handshake", async () => {
    const previousHome = process.env.XDG_STATE_HOME;
    process.env.XDG_STATE_HOME = join("/tmp", `clancode-link-${crypto.randomUUID()}`);
    await mkdir(join(process.env.XDG_STATE_HOME, "clancode"), { recursive: true });
    await import("../pairing/store.ts").then(({ saveStoredCredentials }) =>
      saveStoredCredentials({
        deviceToken: "token",
        deviceId: "550e8400-e29b-41d4-a716-446655440020",
        controlUrl: "http://localhost:3001",
        pairedAt: new Date().toISOString(),
      }),
    );
    const states: string[] = [];
    const client = fakeClient();
    const link = startControlPlaneLink({
      enabled: true,
      onState: (state) => states.push(state),
      connect: async () => client,
      createSession: () =>
        ({
          start: async () => {},
          stop: async (_client?: RealtimeClient) => {},
        }) as unknown as ConnectSession,
    });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(states).toContain("connecting");
    expect(states).toContain("connected");
    await link.stop();
    expect(states.at(-1)).toBe("offline");
    if (previousHome === undefined) {
      delete process.env.XDG_STATE_HOME;
    } else {
      process.env.XDG_STATE_HOME = previousHome;
    }
  });
});
