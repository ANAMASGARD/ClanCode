import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react/renderer";
import { Header } from "../components/header.tsx";
import { formatDoctor, runDoctor } from "../doctor/doctor.ts";
import {
  listSessions,
  RunSupervisor,
  type PendingApproval,
  type RunStatus,
} from "../supervisor/supervisor.ts";
import type { RunEvent } from "@clanofagents/protocol";

type Props = {
  repo?: string;
  onSupervisor?: (supervisor: RunSupervisor) => void;
};

type Line = {
  kind: "user" | "agent" | "system" | "event";
  text: string;
};

const FLUSH_MS = 80;

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
  const deltaBuffer = useRef("");

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
      setLines((current) => [...current, { kind: "event", text: event.type }]);
    });

    void supervisor.start(props.repo).then(() => {
      setStatus(supervisor.status());
      setRuntime(supervisor.runtimeMode());
      if (supervisor.repo !== undefined) {
        setRepo(supervisor.repo.root);
        setBranch(supervisor.repo.currentBranch ?? "?");
      }
    });

    return () => {
      unsubscribe();
      void supervisor.stop();
    };
  }, [props.repo, props.onSupervisor]);

  const submit = useCallback(
    async (value?: string) => {
      const supervisor = supervisorRef.current;
      const text = (value ?? input).trim();
      if (supervisor === undefined || text.length === 0) {
        return;
      }
      setInput("");
      if (text.startsWith("/")) {
        await handleSlash(supervisor, text, setMode, setLines, setApproval, setBranch);
        setStatus(supervisor.status());
        return;
      }
      setLines((current) => [...current, { kind: "user", text }]);
      await supervisor.submitMessage(text);
      setStatus(supervisor.status());
    },
    [input],
  );

  return (
    <box flexDirection="column" width="100%" height="100%" backgroundColor="#0D0D12">
      <box height={5}>
        <Header
          repository={repo}
          branch={branch}
          mode={mode}
          model={model}
          runtime={runtime}
          status={status}
        />
      </box>
      <box flexGrow={1} flexDirection="column" paddingLeft={1}>
        {lines.slice(-24).map((line, index) => (
          <text key={`${line.kind}-${String(index)}`} fg={colorFor(line.kind)}>
            {`${line.kind}: ${line.text}`}
          </text>
        ))}
      </box>
      {approval !== undefined ? (
        <box height={5} paddingLeft={1}>
          <text fg="#FF8A80">
            {`Approval ${approval.risk}: ${approval.toolName}\n${approval.summary}\ncwd=${approval.cwd ?? ""}  /approve or /deny`}
          </text>
        </box>
      ) : null}
      <box height={3} paddingLeft={1}>
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
      return "#80D8FF";
    case "agent":
      return "#FFFFFF";
    case "system":
      return "#FFD54A";
    case "event":
      return "#90A4AE";
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
): Promise<void> {
  const [command] = text.split(" ");
  switch (command) {
    case "/help":
      setLines((current) => [
        ...current,
        {
          kind: "system",
          text: "/plan /build /cancel /status /diff /validate /sessions /resume /doctor /approve /deny /commit /push /pr /exit",
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
    case "/cancel":
      await supervisor.cancel();
      return;
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
      setLines((current) => [
        ...current,
        { kind: "system", text: JSON.stringify(rows.map((row) => row.key)) },
      ]);
      return;
    }
    case "/resume":
      await supervisor.resumeStoredSession();
      setLines((current) => [
        ...current,
        { kind: "system", text: `resumed ${supervisor.sessionId ?? "none"}` },
      ]);
      return;
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
      const message = text.slice("/commit".length).trim() || "clan code";
      await supervisor.commit(message, true);
      setLines((current) => [...current, { kind: "system", text: `committed: ${message}` }]);
      return;
    }
    case "/push":
      await supervisor.push(true);
      setLines((current) => [...current, { kind: "system", text: "pushed task branch" }]);
      return;
    case "/pr": {
      const title = text.slice("/pr".length).trim() || "Clan Code task";
      await supervisor.createPr(title, true);
      setLines((current) => [...current, { kind: "system", text: `pull request: ${title}` }]);
      return;
    }
    case "/exit":
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

export async function startInteractiveUi(options: { repo?: string }): Promise<void> {
  const renderer = await createCliRenderer({ exitOnCtrlC: false });
  let supervisor: RunSupervisor | undefined;
  createRoot(renderer).render(
    <ChatApp
      repo={options.repo}
      onSupervisor={(instance) => {
        supervisor = instance;
      }}
    />,
  );
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
    void current?.stop().finally(() => {
      process.exit(0);
    });
  });
  await new Promise<void>(() => {
    // OpenTUI owns the process until /exit or idle Ctrl+C.
  });
}
