import { ConnectSession } from "../realtime/session.ts";
import { connectRealtimeClient } from "../realtime/client.ts";
import {
  CompositeCredentialsProvider,
  resolveConnectUrl,
} from "../realtime/credentials.ts";

export async function runConnectCommand(): Promise<number> {
  const url = await resolveConnectUrl();
  const client = await connectRealtimeClient({
    url,
    credentials: new CompositeCredentialsProvider(),
  });
  const session = new ConnectSession();
  await session.start(client);

  await new Promise<void>((resolve) => {
    const onSignal = () => {
      resolve();
    };
    const proc = process as NodeJS.EventEmitter;
    proc.on("SIGINT", onSignal);
    proc.on("SIGTERM", onSignal);
  });

  await session.stop(client);
  return 0;
}
