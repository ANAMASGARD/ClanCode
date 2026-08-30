import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react/renderer";
import { Header } from "../components/header.tsx";
import { theme, type ControlPlaneState } from "../components/theme.ts";
import { startControlPlaneLink } from "../realtime/link.ts";
import { formatDoctor, runDoctor } from "../doctor/doctor.ts";
import {
  RunSupervisor,
  type PendingApproval,
  type RunStatus,
} from "../supervisor/supervisor.ts";
import { listSessions } from "../session/store.ts";
import { formatSessions } from "../session/format.ts";
import { formatRunEventLine } from "../session/event-line.ts";
import { archiveRunLog } from "../session/run-log.ts";
import { loadTrueforgeConfig } from "../trueforge/config.ts";
import { createAgentClient } from "../trueforge/agent.ts";
import { listAvailableModels, selectModel } from "../models/resolve.ts";
import type { RunEvent } from "@clancode/protocol";

type Props = {
  repo?: string;
  controlPlane?: boolean;
  onSupervisor?: (supervisor: RunSupervisor) => void;
  onControlPlaneStop?: (stop: () => Promise<void>) => void;
};

type Line = {
  kind: "user" | "agent" | "system" | "event";
  text: string;
};

const FLUSH_MS = 80;

const TRANSCRIPT_EVENTS = new Set<string>([
  "run.started",
  "run.completed",
  "run.failed",
  "run.cancelled",
  "tool.requested",
  "tool.started",
  "tool.completed",
  "tool.failed",
  "approval.required",
  "approval.granted",
  "approval.denied",
  "validation.started",
  "validation.completed",
  "session.created",
  "turn.started",
  "git.branch_created",
  "git.commit_created",
  "pr.created",
]);

export function ChatApp(props: Props) {
  const supervisorRef = useRef<RunSupervisor | undefined>(undefined);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [repo, setRepo] = useState("resolving…");
  const [branch, setBranch] = useState("?");
  const [mode, setMode] = useState<"PLAN" | "BUILD">("PLAN");
  const [model, setModel] = useState("unselected");
  const [runtime, setRuntime] = useState("starting");
  const [lines, setLines] = useState<Line[]>([
    { kind: "system", text: "What would you like to build?" },
  ]);
  const [input, setInput] = useState("");
  const [approval, setApproval] = useState<PendingApproval | undefined>(undefined);
  const [connection, setConnection] = useState<ControlPlaneState>(
    props.controlPlane === true ? "connecting" : "offline",
  );
  const deltaBuffer = useRef("");
  const shutdownRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const linesRef = useRef(lines);

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  async function archiveCurrentTranscript(supervisor: RunSupervisor): Promise<string | undefined> {
    if (linesRef.current.length === 0) {
      return undefined;
    }
    try {
      return await archiveRunLog({
        runId: supervisor.runId,
        repoRoot: supervisor.repo?.root,
        branchName: supervisor.worktree?.branchName ?? supervisor.repo?.currentBranch,
        phase: supervisor.status(),
        lines: linesRef.current.map((entry) => ({
          kind: entry.kind,
          text: entry.text,
          at: new Date().toISOString(),
        })),
      });
    } catch (error) {
      console.error("[clan-cli:archive-transcript]", error);
      throw error;
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      if (deltaBuffer.current.length === 0) {
        return;
      }
      const text = deltaBuffer.current;
      deltaBuffer.current = "";
      setLines((current) => [...current, { kind: "agent", text }]);
    }, FLUSH_MS);
    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const supervisor = new RunSupervisor();
    supervisorRef.current = supervisor;
    props.onSupervisor?.(supervisor);
    const unsubscribe = supervisor.subscribe((event: RunEvent) => {
      setStatus(supervisor.status());
      if (event.type === "model.delta") {
        const payload = event.payload as { text?: string };
        deltaBuffer.current += payload.text ?? "";
        return;
      }
      if (event.type === "agent.message") {
        return;
      }
      if (event.type === "model.completed") {
        if (deltaBuffer.current.length > 0) {
          const text = deltaBuffer.current;
          deltaBuffer.current = "";
          setLines((current) => [...current, { kind: "agent", text }]);
        }
        return;
      }
      if (deltaBuffer.current.length > 0) {
        const text = deltaBuffer.current;
        deltaBuffer.current = "";
        setLines((current) => [...current, { kind: "agent", text }]);
      }
      if (event.type === "approval.required") {
        const payload = event.payload as { approvals?: PendingApproval[] };
        setApproval(payload.approvals?.[0]);
      }
      if (event.type === "run.started") {
        const payload = event.payload as {
          repository?: string;
          mode?: string;
        };
        if (payload.repository !== undefined) {
          setRepo(payload.repository);
        }
        setRuntime(payload.mode ?? "ready");
      }
      if (event.type === "session.created") {
        const payload = event.payload as { model?: string };
        if (payload.model !== undefined) {
          setModel(payload.model);
        }
      }
      if (event.type === "git.branch_created") {
        const payload = event.payload as { branchName?: string };
        if (payload.branchName !== undefined) {
          setBranch(payload.branchName);
        }
      }
      if (TRANSCRIPT_EVENTS.has(event.type)) {
        const repoRoot = supervisor.repo?.root;
        setLines((current) => [
          ...current,
          { kind: "event", text: formatRunEventLine(event, repoRoot) },
        ]);
      }
      if (event.type === "run.cancelled") {
        void archiveCurrentTranscript(supervisor).catch(() => {
          setLines((current) => [
            ...current,
            {
              kind: "system",
              text: "Transcript archive failed — see stderr for details.",
            },
          ]);
        });
      }
    });

    if (props.controlPlane !== true) {
      void supervisor.start(props.repo).then(() => {
        setStatus(supervisor.status());
        setRuntime(supervisor.runtimeMode());
        if (supervisor.repo !== undefined) {
          setRepo(supervisor.repo.root);
          setBranch(supervisor.repo.currentBranch ?? "?");
        }
      });
    }

    return () => {
      unsubscribe();
      if (props.controlPlane !== true) {
        void supervisor.stop();
      }
    };
  }, [props.repo, props.controlPlane, props.onSupervisor]);

  useEffect(() => {
    if (props.controlPlane !== true) {
      shutdownRef.current = async () => {
        await supervisorRef.current?.stop();
        process.exit(0);
      };
      return;
    }
    const link = startControlPlaneLink({
      enabled: true,
      onState: setConnection,
      getSharedSupervisor: () => supervisorRef.current,
      onRemoteTask: ({ prompt, mode: remoteMode }) => {
        setMode(remoteMode === "build" ? "BUILD" : "PLAN");
        setLines((current) => [...current, { kind: "user", text: `[castle] ${prompt}` }]);
      },
    });
    props.onControlPlaneStop?.(link.stop);
    shutdownRef.current = async () => {
      await link.stop();
      await supervisorRef.current?.stop();
      process.exit(0);
    };
    return () => {
      void link.stop();
    };
  }, [props.controlPlane, props.onControlPlaneStop]);

  const ensureSupervisorReady = useCallback(async (supervisor: RunSupervisor): Promise<void> => {
    const current = supervisor.status();
    if (current !== "idle" && current !== "stopped") {
      return;
    }
    await supervisor.start(props.repo);
    setStatus(supervisor.status());
    setRuntime(supervisor.runtimeMode());
    if (supervisor.repo !== undefined) {
      setRepo(supervisor.repo.root);
      setBranch(supervisor.repo.currentBranch ?? "?");
    }
  }, [props.repo]);

  const submit = useCallback(
    async (value?: string) => {
      const supervisor = supervisorRef.current;
      const text = (value ?? input).trim();
      if (supervisor === undefined || text.length === 0) {
        return;
      }
      setInput("");
      if (text.startsWith("/")) {
        await ensureSupervisorReady(supervisor);
        await handleSlash(
          supervisor,
          text,
          setMode,
          setLines,
          setApproval,
          setBranch,
          () => shutdownRef.current?.(),
          archiveCurrentTranscript,
        );
        setStatus(supervisor.status());
        return;
      }
      await ensureSupervisorReady(supervisor);
      setLines((current) => [...current, { kind: "user", text }]);
      await supervisor.submitMessage(text);
      setStatus(supervisor.status());
    },
    [ensureSupervisorReady, input],
  );

  return (
    <box flexDirection="column" width="100%" height="100%" backgroundColor={theme.ink}>
      <box width="100%" alignItems="center">
        <Header
          repository={repo}
          branch={branch}
          mode={mode}
          model={model}
          runtime={runtime}
          status={status}
          connection={connection}
        />
      </box>
      <box
        flexGrow={1}
        flexDirection="column"
        marginLeft={1}
        marginRight={1}
        marginBottom={1}
        border
        borderStyle="single"
        title="Transcript"
        titleColor={theme.goldDim}
        padding={1}
        backgroundColor="#12121A"
      >
        {lines.slice(-24).map((line, index) => (
          <text key={`${line.kind}-${String(index)}`} fg={colorFor(line.kind)}>
            {`${line.kind}: ${line.text}`}
          </text>
        ))}
      </box>
      {approval !== undefined ? (
        <box
          marginLeft={1}
          marginRight={1}
          marginBottom={1}
          padding={1}
          border
          borderStyle="single"
          title="Approval"
          titleColor={theme.danger}
        >
          <text fg={theme.danger}>
            {`Approval ${approval.risk}: ${approval.toolName}\n${approval.summary}\ncwd=${approval.cwd ?? ""}  /approve or /deny`}
          </text>
        </box>
      ) : null}
      <box
        height={3}
        marginLeft={1}
        marginRight={1}
        marginBottom={1}
        border
        borderStyle="single"
        title="Message"
        titleColor={theme.gold}
        paddingLeft={1}
        paddingRight={1}
      >
        <input
          placeholder="> message or /help"
          value={input}
          onChange={setInput}
          onSubmit={() => {
            void submit();
          }}
          focused
        />
      </box>
    </box>
  );
}

function colorFor(kind: Line["kind"]): string {
  switch (kind) {
    case "user":
      return theme.sky;
    case "agent":
      return theme.white;
    case "system":
      return theme.gold;
    case "event":
      return theme.muted;
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}

async function handleSlash(
  supervisor: RunSupervisor,
  text: string,
  setMode: (mode: "PLAN" | "BUILD") => void,
  setLines: Dispatch<SetStateAction<Line[]>>,
  setApproval: (value: PendingApproval | undefined) => void,
  setBranch: (value: string) => void,
  requestShutdown?: () => void,
  archiveTranscript?: (supervisor: RunSupervisor) => Promise<string | undefined>,
): Promise<void> {
  const [command] = text.split(" ");
  switch (command) {
    case "/help":
      setLines((current) => [
        ...current,
        {
          kind: "system",
          text: "/plan /build /new /cancel /status /diff /validate /sessions /resume /models /model /doctor /approve /deny /commit /push /pr /exit",
        },
      ]);
      return;
    case "/plan":
      await supervisor.setMode("plan");
      setMode("PLAN");
      return;
    case "/build":
      await supervisor.setMode("build");
      setMode("BUILD");
      if (supervisor.worktree !== undefined) {
        setBranch(supervisor.worktree.branchName);
      }
      return;
    case "/cancel": {
      let archived: string | undefined;
      let archiveFailed = false;
      try {
        archived = await archiveTranscript?.(supervisor);
      } catch {
        archiveFailed = true;
      }
      await supervisor.cancel();
      setLines([
        {
          kind: "system",
          text: archiveFailed
            ? "Run cancelled. Transcript archive failed — see stderr for details."
            : archived !== undefined
              ? `Run cancelled. Transcript archived to ${archived}`
              : "Run cancelled.",
        },
        { kind: "system", text: "What would you like to build?" },
      ]);
      return;
    }
    case "/status":
      setLines((current) => [
        ...current,
        {
          kind: "system",
          text: `status=${supervisor.status()} session=${supervisor.sessionId ?? "none"} mode=${supervisor.mode}`,
        },
      ]);
      return;
    case "/diff": {
      const diff = await supervisor.emitDiff();
      setLines((current) => [...current, { kind: "system", text: diff.stat || "(no diff)" }]);
      return;
    }
    case "/validate": {
      const result = await supervisor.runValidation();
      setLines((current) => [
        ...current,
        {
          kind: "system",
          text: result.skipped
            ? "validation skipped (no test/typecheck script)"
            : `validation ${result.ok ? "passed" : "failed"}`,
        },
      ]);
      return;
    }
    case "/sessions": {
      const rows = await listSessions();
      const formatted = formatSessions(rows);
      setLines((current) => [
        ...current,
        ...formatted.map((row) => ({ kind: "system" as const, text: row.line })),
      ]);
      return;
    }
    case "/new": {
      const archived = await archiveTranscript?.(supervisor);
      await supervisor.startNewConversation();
      setLines([
        {
          kind: "system",
          text:
            archived !== undefined
              ? `Transcript archived to ${archived}`
              : "Starting a fresh harness session.",
        },
        { kind: "system", text: `new session ${supervisor.sessionId ?? "none"}` },
        { kind: "system", text: "What would you like to build?" },
      ]);
      return;
    }
    case "/models": {
      const client = createAgentClient(loadTrueforgeConfig());
      const models = await listAvailableModels(client);
      setLines((current) => [
        ...current,
        { kind: "system", text: models.length > 0 ? models.join(", ") : "(no models)" },
      ]);
      return;
    }
    case "/model": {
      const name = text.slice("/model".length).trim();
      if (name.length === 0) {
        setLines((current) => [...current, { kind: "system", text: "Usage: /model <name>" }]);
        return;
      }
      const client = createAgentClient(loadTrueforgeConfig());
      await selectModel(client, name);
      setLines((current) => [...current, { kind: "system", text: `model set to ${name}` }]);
      return;
    }
    case "/resume": {
      const selector = text.slice("/resume".length).trim();
      await supervisor.resumeStoredSession(selector.length > 0 ? selector : undefined);
      setLines((current) => [
        ...current,
        { kind: "system", text: `resumed ${supervisor.sessionId ?? "none"}` },
      ]);
      return;
    }
    case "/doctor": {
      const report = await runDoctor();
      setLines((current) => [...current, { kind: "system", text: formatDoctor(report) }]);
      return;
    }
    case "/approve":
      await supervisor.resolveApproval(true);
      setApproval(undefined);
      return;
    case "/deny":
      await supervisor.resolveApproval(false);
      setApproval(undefined);
      return;
    case "/commit": {
      const message = text.slice("/commit".length).trim() || "ClanCode";
      await supervisor.commit(message, true);
      setLines((current) => [...current, { kind: "system", text: `committed: ${message}` }]);
      return;
    }
    case "/push":
      await supervisor.push(true);
      setLines((current) => [...current, { kind: "system", text: "pushed task branch" }]);
      return;
    case "/pr": {
      const title = text.slice("/pr".length).trim() || "ClanCode task";
      await supervisor.createPr(title, true);
      setLines((current) => [
        ...current,
        {
          kind: "system",
          text: `Opening pull request for ${supervisor.repo?.root ?? "repository"} (${supervisor.worktree?.branchName ?? "task branch"})…`,
        },
      ]);
      return;
    }
    case "/exit":
      if (requestShutdown !== undefined) {
        requestShutdown();
        return;
      }
      await supervisor.stop();
      process.exit(0);
      return;
    default:
      setLines((current) => [
        ...current,
        { kind: "system", text: `Unknown command ${text}` },
      ]);
  }
}

export async function startInteractiveUi(options: {
  repo?: string;
  controlPlane?: boolean;
}): Promise<void> {
  const renderer = await createCliRenderer({ exitOnCtrlC: false });
  let supervisor: RunSupervisor | undefined;
  let stopControlPlane: (() => Promise<void>) | undefined;
  createRoot(renderer).render(
    <ChatApp
      repo={options.repo}
      controlPlane={options.controlPlane === true}
      onSupervisor={(instance) => {
        supervisor = instance;
      }}
      onControlPlaneStop={(stop) => {
        stopControlPlane = stop;
      }}
    />,
  );
  const shutdown = async (): Promise<void> => {
    await stopControlPlane?.();
    await supervisor?.stop();
    process.exit(0);
  };
  renderer.keyInput.on("keypress", (event) => {
    if (!(event.ctrl && event.name === "c")) {
      return;
    }
    event.preventDefault();
    const current = supervisor;
    const busy =
      current !== undefined &&
      (current.status() === "streaming" ||
        current.status() === "awaiting_approval" ||
        current.status() === "creating_session");
    if (busy) {
      void current.cancel();
      return;
    }
    void shutdown();
  });
  await new Promise<void>(() => {
    // OpenTUI owns the process until /exit or idle Ctrl+C.
  });
}
