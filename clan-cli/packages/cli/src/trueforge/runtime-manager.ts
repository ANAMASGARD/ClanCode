import {
  assertNodeRuntime,
  loadTrueforgeConfig,
  type TrueforgeConfig,
} from "./config.ts";
import {
  ensureRuntime,
  stopRuntime,
  type TrueforgeRuntimeHandle,
} from "./runtime.ts";

/** Owns TrueForge spawn/attach for an entire `clancode connect` session. */
export class SupervisorRuntimeManager {
  readonly #config: TrueforgeConfig;
  #handle: TrueforgeRuntimeHandle | undefined;
  #abort = new AbortController();

  constructor(config: TrueforgeConfig = loadTrueforgeConfig()) {
    this.#config = config;
  }

  async ensure(): Promise<TrueforgeRuntimeHandle> {
    if (this.#handle !== undefined) {
      return this.#handle;
    }
    assertNodeRuntime(this.#config.nodeBin);
    this.#handle = await ensureRuntime(this.#config, this.#abort.signal);
    return this.#handle;
  }

  getHandle(): TrueforgeRuntimeHandle | undefined {
    return this.#handle;
  }

  wasSpawned(): boolean {
    return this.#handle?.mode === "spawned";
  }

  async stopIfSpawned(): Promise<void> {
    if (this.#handle === undefined) {
      return;
    }
    if (this.#handle.mode === "spawned") {
      await stopRuntime(this.#handle);
    }
    this.#handle = undefined;
  }

  async stop(): Promise<void> {
    await this.stopIfSpawned();
    this.#abort.abort();
  }
}

export type RuntimeLease = {
  readonly handle: TrueforgeRuntimeHandle;
  readonly ownsStop: false;
};

export function leaseRuntime(handle: TrueforgeRuntimeHandle): RuntimeLease {
  return { handle, ownsStop: false };
}
