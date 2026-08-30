"use client";

import { useCallback, useState } from "react";

import type { ArchivedActivityLine } from "@/app/lib/db/schema/clan-run-session-logs";

export type SessionLogEntry = {
  id: string;
  runId: string | null;
  promptPreview: string | null;
  phase: string | null;
  repositoryDisplay: string | null;
  prUrl: string | null;
  archivedAt: string;
  activity: ArchivedActivityLine[];
};

export function useSessionLogs() {
  const [logs, setLogs] = useState<SessionLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/clan/session-logs", { cache: "no-store" });
      const payload = (await response.json()) as { logs?: SessionLogEntry[]; error?: string };
      if (!response.ok) {
        setError(payload.error ?? "load_failed");
        setLogs([]);
        return;
      }
      setLogs(payload.logs ?? []);
    } catch {
      setError("network_error");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { logs, loading, error, refresh };
}
