import type { CommandAckPayload, CommandAckStatus } from "@clancode/protocol";
import {
  clancodeStatePath,
  readJsonFile,
  withClancodeLock,
  writeJsonAtomic,
} from "../session/lock.ts";

export type CommandJournalEntry = {
  commandId: string;
  receivedAt: string;
  expiresAt: string;
  status: CommandAckStatus;
  runId?: string;
  reason?: CommandAckPayload["reason"];
};

const JOURNAL_FILE = "realtime-commands.json";
const MAX_AGE_MS = 120_000;

function journalPath(): string {
  return clancodeStatePath(JOURNAL_FILE);
}

function prune(entries: CommandJournalEntry[]): CommandJournalEntry[] {
  const cutoff = Date.now() - MAX_AGE_MS;
  return entries.filter((entry) => Date.parse(entry.expiresAt) >= cutoff);
}

export class CommandJournal {
  async get(commandId: string): Promise<CommandJournalEntry | undefined> {
    return await withClancodeLock("realtime-commands", async () => {
      const rows = prune(await readJsonFile<CommandJournalEntry[]>(journalPath(), []));
      return rows.find((row) => row.commandId === commandId);
    });
  }

  async record(entry: CommandJournalEntry): Promise<void> {
    await withClancodeLock("realtime-commands", async () => {
      const rows = prune(await readJsonFile<CommandJournalEntry[]>(journalPath(), []));
      const next = rows.filter((row) => row.commandId !== entry.commandId);
      next.push(entry);
      await writeJsonAtomic(journalPath(), prune(next));
    });
  }
}

export function isCommandExpired(expiresAt: string, skewMs = 60_000): boolean {
  return Date.now() > Date.parse(expiresAt) + skewMs;
}
