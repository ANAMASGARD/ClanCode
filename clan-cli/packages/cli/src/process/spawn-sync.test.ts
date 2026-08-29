import { describe, expect, test } from "bun:test";
import { SpawnSyncOutputLimitError, spawnSyncBounded } from "./spawn-sync.ts";

describe("spawnSyncBounded", () => {
  test("fails closed when stdout exceeds maxBuffer", () => {
    expect(() =>
      spawnSyncBounded("python3", ["-c", "print('x' * 5000)"], {
        maxOutputBytes: 128,
        timeoutMs: 5_000,
      }),
    ).toThrow(SpawnSyncOutputLimitError);
  });
});
