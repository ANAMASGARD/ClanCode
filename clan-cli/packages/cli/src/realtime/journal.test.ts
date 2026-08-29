import { describe, expect, test } from "bun:test";
import { CommandJournal } from "./journal.ts";
import { clancodeStatePath } from "../session/lock.ts";
import { unlink } from "node:fs/promises";

describe("CommandJournal", () => {
  test("survives reopen for duplicate ack", async () => {
    const journalPath = clancodeStatePath("realtime-commands.json");
    await unlink(journalPath).catch(() => undefined);
    const journal = new CommandJournal();
    await journal.record({
      commandId: "abc-123",
      receivedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      status: "accepted",
      runId: "run-1",
    });
    const reopened = new CommandJournal();
    const cached = await reopened.get("abc-123");
    expect(cached?.status).toBe("accepted");
    expect(cached?.runId).toBe("run-1");
    await unlink(journalPath).catch(() => undefined);
  });
});
