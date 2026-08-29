import {
  BUILD_TOOLS,
  executeTool,
  jsonSchemaFor,
  PLAN_TOOLS,
  type ToolContext,
} from "../tools/registry.ts";

type JsonRpc = {
  jsonrpc?: string;
  id?: unknown;
  method?: string;
  params?: Record<string, unknown>;
};

export type McpHandle = {
  url: string;
  close: () => void;
};

const PROTOCOL_VERSION = "2025-03-26";

export function startLoopbackMcp(getContext: () => ToolContext): McpHandle {
  const sessions = new Set<string>();
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      if (request.method === "DELETE") {
        const session = request.headers.get("mcp-session-id");
        if (session !== null) {
          sessions.delete(session);
        }
        return new Response(null, { status: 200 });
      }
      if (request.method === "GET") {
        return new Response("method not allowed", { status: 405 });
      }
      if (request.method !== "POST") {
        return new Response("method not allowed", { status: 405 });
      }
      const body = (await request.json()) as JsonRpc | JsonRpc[];
      const messages = Array.isArray(body) ? body : [body];
      const sessionId =
        request.headers.get("mcp-session-id") ?? crypto.randomUUID();
      sessions.add(sessionId);

      if (messages.length === 1 && messages[0] !== undefined && messages[0].id === undefined) {
        if (messages[0].method !== undefined) {
          void handleRpc(messages[0], getContext());
        }
        return new Response(null, {
          status: 202,
          headers: {
            "mcp-session-id": sessionId,
            "mcp-protocol-version": PROTOCOL_VERSION,
          },
        });
      }

      const payloads = [];
      for (const message of messages) {
        payloads.push(await handleRpc(message, getContext()));
      }
      const payload = Array.isArray(body) ? payloads : payloads[0];
      const accept = request.headers.get("accept") ?? "";
      const headers = {
        "mcp-session-id": sessionId,
        "mcp-protocol-version": PROTOCOL_VERSION,
      };
      if (accept.includes("text/event-stream") && !accept.includes("application/json")) {
        return new Response(`event: message\ndata: ${JSON.stringify(payload)}\n\n`, {
          status: 200,
          headers: {
            ...headers,
            "content-type": "text/event-stream",
          },
        });
      }
      return Response.json(payload, { headers });
    },
  });

  return {
    url: `http://127.0.0.1:${String(server.port)}/mcp`,
    close: () => server.stop(true),
  };
}

async function handleRpc(body: JsonRpc, context: ToolContext): Promise<unknown> {
  const id = body.id ?? null;
  const method = body.method ?? "";
  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "clancode-local", version: "0.1.0" },
      },
    };
  }
  if (method === "notifications/initialized" || method === "notifications/cancelled") {
    return { jsonrpc: "2.0", id, result: {} };
  }
  if (method === "ping") {
    return { jsonrpc: "2.0", id, result: {} };
  }
  if (method === "tools/list") {
    const names = context.mode === "build" ? BUILD_TOOLS : PLAN_TOOLS;
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: names.map((name) => ({
          name,
          description: `Clan Code ${context.mode} tool: ${name}`,
          inputSchema: jsonSchemaFor(name),
        })),
      },
    };
  }
  if (method === "tools/call") {
    const name = String(body.params?.["name"] ?? "");
    const args =
      body.params?.["arguments"] !== undefined &&
      typeof body.params["arguments"] === "object" &&
      body.params["arguments"] !== null
        ? (body.params["arguments"] as Record<string, unknown>)
        : {};
    const output = await executeTool(context, name, args);
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [{ type: "text", text: JSON.stringify(output) }],
        isError: output.ok === false,
      },
    };
  }
  return {
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: `Unknown method ${method}` },
  };
}
