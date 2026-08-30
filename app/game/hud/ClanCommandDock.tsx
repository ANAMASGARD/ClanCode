"use client";

import { useEffect, useRef, useState } from "react";

import { isClanRunBusy, isStaleClanRun, type ClanRunView } from "@/app/lib/clan-run/types";
import { appendTranscript, useVoiceTranscription } from "@/app/game/hooks/useVoiceTranscription";
import { requestClanRunRefresh } from "@/app/game/hooks/useClanRunProjection";
import { constructionProgressFraction, runPhaseLabel } from "@/app/game/state/construction-site";
import { type ActivityLine, projectionActivityLines } from "@/app/game/state/run-activity";
import { snapshotActivityDelta } from "@/app/game/state/run-activity-history";

type ClanCommandChatProps = {
  view: ClanRunView;
  deviceOnline: boolean;
  presenceLabel: string;
  editMode: boolean;
  onClose: () => void;
  onInteract: () => void;
};

const PR_CONFIRM =
  "This will commit the worktree, push the task branch, and open a GitHub pull request.";

function formatRecordingTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function MicIcon() {
  return (
    <svg className="clan-recorder-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V19H9v2h6v-2h-2v-1.08A7 7 0 0 0 19 11h-2Z"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg className="clan-recorder-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" />
    </svg>
  );
}

export function ClanCommandChat({
  view,
  deviceOnline,
  presenceLabel,
  editMode,
  onClose,
  onInteract,
}: ClanCommandChatProps) {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"plan" | "build">("build");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmPr, setConfirmPr] = useState(false);
  const [userLines, setUserLines] = useState<ActivityLine[]>([]);
  const [systemHistory, setSystemHistory] = useState<ActivityLine[]>(() =>
    view.runId !== null ? snapshotActivityDelta(null, view) : [],
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activityEndRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef(view);
  const runBusy = isClanRunBusy(view);
  const staleRun = isStaleClanRun(view);
  const pending = view.approvals[0];
  const canCompose = deviceOnline && !editMode && !busy;
  const canSend = canCompose && !runBusy && prompt.trim().length > 0;
  const phaseLabel = runPhaseLabel(view, deviceOnline);

  const voice = useVoiceTranscription(
    (transcript) => {
      setPrompt((current) => appendTranscript(current, transcript));
    },
    true,
  );

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (voice.state !== "recording") {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        voice.stopRecording();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [voice]);

  useEffect(() => {
    const prev = viewRef.current;
    viewRef.current = view;
    if (view.runId !== prev.runId) {
      setSystemHistory(snapshotActivityDelta(null, view));
      return;
    }
    const delta = snapshotActivityDelta(prev, view);
    if (delta.length > 0) {
      setSystemHistory((current) => [...current, ...delta]);
    }
  }, [view]);

  useEffect(() => {
    activityEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [systemHistory.length, userLines.length]);

  const activityLines = [...userLines, ...(systemHistory.length > 0 ? systemHistory : projectionActivityLines(view))];
  const runProgress = Math.round(constructionProgressFraction(view) * 100);
  const showActivity = activityLines.length > 0 || runBusy;
  const canRecord =
    voice.voiceConfigured && canCompose && !runBusy && voice.state !== "transcribing";

  const recorderHint =
    !voice.voiceConfigured
      ? "Add OPENAI_API_KEY to enable voice"
      : voice.state === "recording"
        ? "Tap to stop recording"
        : voice.state === "transcribing"
          ? "Transcribing your voice…"
          : canCompose
            ? "Ready to record"
            : "Harness unavailable";

  async function post(path: string, body?: unknown): Promise<boolean> {
    setBusy(true);
    setError(null);
    onInteract();
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string; status?: string; reason?: string };
      if (!response.ok) {
        setError(payload.error ?? "request_failed");
        return false;
      }
      if (payload.status === "rejected") {
        setError(payload.reason ?? "rejected");
        return false;
      }
      return true;
    } catch {
      setError("network_error");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function toggleRecording(): void {
    if (voice.state === "recording") {
      voice.stopRecording();
      return;
    }
    if (canRecord) {
      void voice.startRecording();
    }
  }

  async function restartHarness(): Promise<void> {
    const activityPayload = activityLines.map(({ id, kind, text, href }) => ({
      id,
      kind,
      text,
      ...(href !== undefined ? { href } : {}),
    }));
    const ok = await post("/api/clan/run/reset", { activity: activityPayload });
    if (ok) {
      requestClanRunRefresh();
      setUserLines([]);
      setSystemHistory([]);
      setPrompt("");
      setError(null);
    }
  }

  const composeOpen =
    view.phase === "idle" ||
    view.phase === "success" ||
    view.phase === "failed" ||
    view.phase === "cancelled";

  return (
    <div className="clan-command-chat" aria-label="Clan Castle command chat">
      <header className="clan-chat-header">
        <div>
          <span className="clan-eyebrow">Clan Castle</span>
          <strong>Command</strong>
        </div>
        <button type="button" className="clan-hud-button" aria-label="Close command chat" onClick={onClose}>
          ×
        </button>
      </header>

      <div className="clan-chat-status-row">
        <span className={`clan-presence ${deviceOnline ? "is-online" : ""}`}>
          <i />
          {presenceLabel}
        </span>
        <span className="clan-chat-phase">{phaseLabel}</span>
      </div>

      {!deviceOnline ? (
        <p className="clan-chat-note">Start ClanCode in the repo you want to work on.</p>
      ) : null}
      {editMode ? <p className="clan-chat-note">Finish layout editing to dispatch a run.</p> : null}
      {staleRun ? (
        <p className="clan-chat-note">
          Harness did not start this run. Restart to clear stale state and dispatch a new task.
        </p>
      ) : null}
      {error ? <p className="clan-dock-error">{error}</p> : null}
      {voice.error ? <p className="clan-dock-error">{voice.error}</p> : null}

      {composeOpen ? (
        <form
          className="clan-command-form"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = prompt.trim();
            if (!canSend) {
              return;
            }
            void post("/api/clan/tasks", { prompt: trimmed, mode }).then((ok) => {
              if (ok) {
                requestClanRunRefresh();
                setUserLines([{ id: `user-${String(Date.now())}`, kind: "user", text: trimmed }]);
                setSystemHistory([]);
                setPrompt("");
              }
            });
          }}
        >
          <section className="clan-recorder" aria-label="Voice input">
            <p className="clan-recorder-time" aria-live="polite">
              {voice.state === "recording" ? formatRecordingTime(voice.seconds) : "00:00"}
            </p>
            <button
              type="button"
              className={`clan-recorder-button ${
                voice.state === "recording"
                  ? "is-recording"
                  : voice.state === "transcribing"
                    ? "is-busy"
                    : ""
              }`}
              aria-label={
                voice.state === "recording" ? "Stop recording" : "Start recording"
              }
              disabled={!voice.voiceConfigured || !canCompose || runBusy || voice.state === "transcribing"}
              onClick={toggleRecording}
            >
              {voice.state === "recording" ? <StopIcon /> : voice.state === "transcribing" ? "…" : <MicIcon />}
            </button>
            <p className="clan-recorder-hint">{recorderHint}</p>
          </section>

          <section className="clan-task-panel">
            <div className="clan-task-panel-head">Task</div>
            <textarea
              ref={textareaRef}
              className="clan-task-input"
              value={prompt}
              maxLength={4000}
              disabled={!canCompose || runBusy}
              placeholder="Type or record what the harness should do…"
              aria-label="Task"
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
          </section>

          <div className="clan-mode-segment" role="radiogroup" aria-label="Run mode">
            <button
              type="button"
              className={mode === "plan" ? "is-active" : ""}
              disabled={!canCompose || runBusy}
              aria-pressed={mode === "plan"}
              onClick={() => setMode("plan")}
            >
              Plan
            </button>
            <button
              type="button"
              className={mode === "build" ? "is-active" : ""}
              disabled={!canCompose || runBusy}
              aria-pressed={mode === "build"}
              onClick={() => setMode("build")}
            >
              Build
            </button>
          </div>

          <button type="submit" className="clan-send-primary" disabled={!canSend}>
            Send to harness
          </button>
        </form>
      ) : null}

      {showActivity ? (
        <section className="clan-activity-panel" aria-live="polite">
          <div className="clan-task-panel-head">Activity</div>
          {runBusy ? (
            <div className="clan-activity-progress" aria-hidden="true">
              <div className="clan-construction-bar" role="progressbar" aria-valuenow={runProgress} aria-valuemin={0} aria-valuemax={100}>
                <i style={{ width: `${String(runProgress)}%` }} />
              </div>
              <span className="clan-activity-progress-label">{phaseLabel}</span>
            </div>
          ) : null}
          <div className="clan-activity-body">
            {activityLines.length === 0 ? (
              <p className="clan-chat-placeholder">Run in progress…</p>
            ) : (
              <ul>
                {activityLines.map((line) => (
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
            <div ref={activityEndRef} />
          </div>
        </section>
      ) : null}

      {runBusy || view.runId !== null ? (
        <div className="clan-run-actions">
          {runBusy ? (
            <button
              type="button"
              className="clan-cancel-action"
              disabled={busy || editMode}
              onClick={() => {
                void post("/api/clan/tasks/cancel").then((ok) => {
                  if (ok) {
                    requestClanRunRefresh();
                    setSystemHistory([{ id: "cancelled", kind: "system", text: "Run cancelled" }]);
                  }
                });
              }}
            >
              Cancel run
            </button>
          ) : null}
          <button
            type="button"
            className="clan-restart-action"
            disabled={busy || editMode}
            onClick={() => {
              void restartHarness();
            }}
          >
            Restart harness
          </button>
        </div>
      ) : null}

      {view.phase === "awaiting_approval" && pending ? (
        <div className="clan-approval-card">
          <strong>Approval required</strong>
          <p>{pending.summary ?? pending.toolName}</p>
          {pending.risk ? <span>{pending.risk}</span> : null}
          {view.approvalDecision === "denied" ? (
            <p>Denied. Start a new task — this tool call cannot be approved later.</p>
          ) : (
            <div className="clan-dock-actions">
              <button
                type="button"
                disabled={busy || editMode || view.approvalDecision !== null}
                onClick={() => {
                  void post("/api/clan/approvals", {
                    runId: view.runId,
                    toolCallId: pending.toolCallId,
                    allow: false,
                  });
                }}
              >
                Deny
              </button>
              <button
                type="button"
                disabled={busy || editMode || view.approvalDecision !== null}
                onClick={() => {
                  void post("/api/clan/approvals", {
                    runId: view.runId,
                    toolCallId: pending.toolCallId,
                    allow: true,
                  });
                }}
              >
                Approve
              </button>
            </div>
          )}
        </div>
      ) : null}

      {view.deliveryStage === "ready" ? (
        <div className="clan-approval-card">
          <strong>Ready for delivery</strong>
          {confirmPr ? (
            <>
              <p>{PR_CONFIRM}</p>
              <div className="clan-dock-actions">
                <button type="button" disabled={busy} onClick={() => setConfirmPr(false)}>
                  Back
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void post("/api/clan/delivery/pr").then((ok) => {
                      if (ok) setConfirmPr(false);
                    });
                  }}
                >
                  Create Pull Request
                </button>
              </div>
            </>
          ) : (
            <button type="button" disabled={busy} onClick={() => setConfirmPr(true)}>
              Create Pull Request
            </button>
          )}
        </div>
      ) : null}

      {view.deliveryStage === "committing" ? (
        <p className="clan-dock-meta">Committing and opening the PR…</p>
      ) : null}
      {view.deliveryStage === "pr_created" && view.prUrl ? (
        <a className="clan-pr-link" href={view.prUrl} target="_blank" rel="noreferrer">
          Pull request{view.prNumber !== null ? ` #${String(view.prNumber)}` : ""}
        </a>
      ) : null}
    </div>
  );
}
