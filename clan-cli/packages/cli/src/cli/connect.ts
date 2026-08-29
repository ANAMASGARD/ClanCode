import { ConnectSession } from "../realtime/session.ts";
import { connectRealtimeClient } from "../realtime/client.ts";
import { EnvCredentialsProvider, resolveControlUrl } from "../realtime/credentials.ts";

export async function runConnectCommand(): Promise<number> {
  const url = resolveControlUrl();
  const client = await connectRealtimeClient({
    url,
    credentials: new EnvCredentialsProvider(),
  });
  const session = new ConnectSession();
  await session.start(client);

  await new Promise<void>((resolve) => {
    const onSignal = () => {
      process.off("SIGINT", onSignal);
      process.off("SIGTERM", onSignal);
      resolve();
    };
    process.on("SIGINT", onSignal);
    process.on("SIGTERM", onSignal);
  });

  await session.stop(client);
  return 0;
}
