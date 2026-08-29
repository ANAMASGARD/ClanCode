import { afterEach, describe, expect, mock, test } from "bun:test";
import { EventEmitter } from "node:events";
import type { ChildProcess } from "node:child_process";
import type { TrueforgeRuntimeHandle } from "./runtime.ts";

const fakeChild = Object.assign(new EventEmitter(), {
  kill: () => true,
  exitCode: null,
  signalCode: null,
}) as ChildProcess;

const ensureRuntime = mock(
  async (): Promise<TrueforgeRuntimeHandle> => ({
    mode: "spawned",
    baseUrl: "http://127.0.0.1:9999",
    child: fakeChild,
  }),
);

const stopRuntime = mock(async () => {});

mock.module("./runtime.ts", () => ({
  ensureRuntime,
  stopRuntime,
  TrueforgeHealthError: class extends Error {},
  waitForHealth: async () => {},
}));

const { SupervisorRuntimeManager } = await import("./runtime-manager.ts");

describe("SupervisorRuntimeManager", () => {
  afterEach(() => {
    ensureRuntime.mockClear();
    stopRuntime.mockClear();
  });

  test("spawned handle stays spawned across repeated ensure calls", async () => {
    const manager = new SupervisorRuntimeManager();
    const first = await manager.ensure();
    const second = await manager.ensure();
    expect(first.mode).toBe("spawned");
    expect(second.mode).toBe("spawned");
    expect(first).toBe(second);
    expect(ensureRuntime).toHaveBeenCalledTimes(1);
    expect(manager.wasSpawned()).toBe(true);
  });

  test("stopIfSpawned stops only ClanCode-spawned runtimes", async () => {
    const manager = new SupervisorRuntimeManager();
    await manager.ensure();
    await manager.stopIfSpawned();
    expect(stopRuntime).toHaveBeenCalledTimes(1);
    expect(manager.getHandle()).toBeUndefined();
  });

  test("attached runtime is left running on stopIfSpawned", async () => {
    ensureRuntime.mockImplementationOnce(async () => ({
      mode: "attached",
      baseUrl: "http://127.0.0.1:8080",
    }));
    const manager = new SupervisorRuntimeManager();
    await manager.ensure();
    await manager.stopIfSpawned();
    expect(stopRuntime).toHaveBeenCalledTimes(0);
    expect(manager.getHandle()).toBeUndefined();
  });
});
