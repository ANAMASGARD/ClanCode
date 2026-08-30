import { hasStoredDeviceCredentials } from "../pairing/store.ts";
import { connectRealtimeClient, type RealtimeClient } from "./client.ts";
import { resolveRealtimeCredentials } from "./credentials.ts";
import { ConnectSession, type ConnectSupervisor } from "./session.ts";

export type ControlPlaneState = "offline" | "connecting" | "connected" | "error";

const RETRY_MS = 3_000;

export type ControlPlaneLinkOptions = {
  enabled: boolean;
  onState: (state: ControlPlaneState) => void;
  connect?: () => Promise<RealtimeClient>;
  createSession?: () => ConnectSession;
  getSharedSupervisor?: () => ConnectSupervisor | undefined;
  onRemoteTask?: (input: { prompt: string; mode: "plan" | "build" | undefined }) => void;
  retryMs?: number;
};

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

async function defaultConnect(): Promise<RealtimeClient> {
  const credentials = await resolveRealtimeCredentials();
  return await connectRealtimeClient({
    url: credentials.controlUrl,
    credentials: { getToken: async () => credentials.token },
  });
}

/**
 * Keeps the paired laptop online on the web dashboard.
 * Pairing credentials persist across reboots; this link reconnects whenever the CLI runs.
 */
export function startControlPlaneLink(
  options: ControlPlaneLinkOptions,
): { stop: () => Promise<void> } {
  const retryMs = options.retryMs ?? RETRY_MS;
  const abort = new AbortController();
  let client: RealtimeClient | undefined;
  let session: ConnectSession | undefined;
  const setState = (state: ControlPlaneState): void => {
    if (!abort.signal.aborted) {
      options.onState(state);
    }
  };

  const run = async (): Promise<void> => {
    if (!options.enabled) {
      setState("offline");
      return;
    }
    if (!(await hasStoredDeviceCredentials())) {
      setState("offline");
      return;
    }

    const onDisconnect = (): void => {
      setState("connecting");
    };
    const onReconnect = (): void => {
      setState("connected");
    };

    while (!abort.signal.aborted && client === undefined) {
      setState("connecting");
      try {
        const next = await (options.connect ?? defaultConnect)();
        if (abort.signal.aborted) {
          next.disconnect();
          return;
        }
        client = next;
        session = options.createSession?.() ?? new ConnectSession({
          getSharedSupervisor: options.getSharedSupervisor,
          onRemoteTask: options.onRemoteTask,
        });
        await session.start(next);
        setState("connected");
        next.socket.on("disconnect", onDisconnect);
        next.socket.on("reconnect", onReconnect);
        next.socket.on("connect", onReconnect);
      } catch {
        setState("error");
        await sleep(retryMs, abort.signal);
      }
    }
  };

  const loop = run();

  return {
    async stop() {
      abort.abort();
      const currentSession = session;
      const currentClient = client;
      session = undefined;
      client = undefined;
      if (currentSession !== undefined && currentClient !== undefined) {
        try {
          await currentSession.stop(currentClient);
        } catch {
          currentClient.disconnect();
        }
      } else {
        currentClient?.disconnect();
      }
      await loop;
      options.onState("offline");
    },
  };
}
