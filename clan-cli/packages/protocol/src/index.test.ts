import { describe, expect, test } from "bun:test";
import { createRunEvent } from "./index.ts";

test("RunEvent is v1 with additive ids", () => {
  const event = createRunEvent({
    runId: "run-1",
    sequence: 1,
    type: "run.started",
    payload: { ok: true },
  });
  expect(event.version).toBe(1);
  expect(event.sequence).toBe(1);
  expect(event.eventId.length).toBeGreaterThan(0);
  expect(event.type).toBe("run.started");
});
