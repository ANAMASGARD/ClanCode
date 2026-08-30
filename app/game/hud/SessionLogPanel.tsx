"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import type { SessionLogEntry } from "@/app/game/hooks/useSessionLogs";

type SessionLogPanelProps = {
  open: boolean;
  onClose: () => void;
  logs: SessionLogEntry[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

function formatArchivedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function sessionTitle(entry: SessionLogEntry): string {
  if (entry.promptPreview !== null && entry.promptPreview.length > 0) {
    return entry.promptPreview.length > 72
      ? `${entry.promptPreview.slice(0, 72)}…`
      : entry.promptPreview;
  }
  if (entry.runId !== null) {
    return `Run ${entry.runId.slice(0, 8)}…`;
  }
  return "Harness session";
}

export function SessionLogPanel({
  open,
  onClose,
  logs,
  loading,
  error,
  onRefresh,
}: SessionLogPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          className="clan-session-log-panel"
          aria-label="Session history"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
        >
          <header className="clan-session-log-header">
            <div>
              <span className="clan-eyebrow">Session Lodge</span>
              <strong>Session history</strong>
            </div>
            <button type="button" className="clan-hud-button" aria-label="Close session history" onClick={onClose}>
              ×
            </button>
          </header>

          <p className="clan-chat-note">
            Past harness runs archived when you restart or cancel. Activity and prompts are stored here.
          </p>

          {loading ? <p className="clan-chat-placeholder">Loading session history…</p> : null}
          {error ? <p className="clan-dock-error">{error}</p> : null}

          {!loading && !error && logs.length === 0 ? (
            <p className="clan-chat-placeholder">No archived sessions yet. Restart or complete a run to save history.</p>
          ) : null}

          <ul className="clan-session-log-list">
            {logs.map((entry) => {
              const expanded = expandedId === entry.id;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    className="clan-session-log-row"
                    aria-expanded={expanded}
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                  >
                    <strong>{sessionTitle(entry)}</strong>
                    <span>{formatArchivedAt(entry.archivedAt)}</span>
                    <span>
                      {[entry.phase, entry.repositoryDisplay].filter(Boolean).join(" · ") || "Archived"}
                    </span>
                  </button>
                  {expanded ? (
                    <div className="clan-session-log-detail">
                      {entry.runId !== null ? (
                        <p className="clan-dock-meta">Run {entry.runId}</p>
                      ) : null}
                      {entry.prUrl !== null ? (
                        <a className="clan-activity-link" href={entry.prUrl} target="_blank" rel="noreferrer">
                          View pull request
                        </a>
                      ) : null}
                      {entry.activity.length === 0 ? (
                        <p className="clan-chat-placeholder">No activity lines were archived for this session.</p>
                      ) : (
                        <ul className="clan-session-log-activity">
                          {entry.activity.map((line) => (
                            <li key={line.id} data-kind={line.kind}>
                              {line.href !== undefined ? (
                                <a
                                  className="clan-activity-link"
                                  href={line.href}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {line.text}
                                </a>
                              ) : (
                                line.text
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <button type="button" className="clan-secondary-action" disabled={loading} onClick={onRefresh}>
            Refresh history
          </button>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
