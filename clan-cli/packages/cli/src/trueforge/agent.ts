import { TrueForge, type TrueForgeApi } from "@truefoundry/trueforge-sdk";
import type { TrueforgeConfig } from "./config.ts";

export type TrueforgeAgentClient = TrueForge;
export type TurnStreamingEvent = TrueForgeApi.TurnStreamingEvent;

export function createAgentClient(config: TrueforgeConfig): TrueforgeAgentClient {
  return new TrueForge({
    baseUrl: config.baseUrl,
    timeoutInSeconds: config.sdkTimeoutSeconds,
  });
}

export async function listModelNames(client: TrueforgeAgentClient): Promise<string[]> {
  const listed = await client.models.list();
  return listed.data.map((model) => model.name);
}

export async function registerLoopbackMcp(
  client: TrueforgeAgentClient,
  url: string,
): Promise<void> {
  await client.settings.mcpServers.createOrUpdate({
    manifest: {
      description: "Clan Code local repository tools",
      name: "clancode-local",
      type: "remote",
      url,
    },
  });
}

export async function createInlineSession(
  client: TrueforgeAgentClient,
  input: {
    instructions: string;
    model: string;
    enableTools: string[];
    requireApprovalForTools: string[];
  },
): Promise<string> {
  const created = await client.sessions.create({
    agent: {
      spec: {
        instructions: input.instructions,
        model: { name: input.model },
        mcpServers: [
          {
            name: "clancode-local",
            enableTools: input.enableTools,
            requireApprovalForTools: input.requireApprovalForTools,
          },
        ],
      },
    },
  });
  return created.data.id;
}

export async function streamTurn(
  client: TrueforgeAgentClient,
  sessionId: string,
  input: TrueForgeApi.TurnInputItem[],
): Promise<AsyncIterable<TurnStreamingEvent>> {
  return await client.sessions.createTurnStream(sessionId, { input });
}

export async function cancelSession(
  client: TrueforgeAgentClient,
  sessionId: string,
): Promise<void> {
  await client.sessions.cancel(sessionId);
}

export async function getSession(
  client: TrueforgeAgentClient,
  sessionId: string,
): Promise<void> {
  await client.sessions.get(sessionId);
}
