export type KnownToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

type PartialToolCall = {
  id?: string;
  name?: string;
  arguments: string;
};

export class ToolCallTracker {
  #partials = new Map<number, PartialToolCall>();
  #calls = new Map<string, KnownToolCall>();

  reset(): void {
    this.#partials.clear();
    this.#calls.clear();
  }

  get(callId: string): KnownToolCall | undefined {
    return this.#calls.get(callId);
  }

  ingestDelta(toolCalls: Array<{
    index?: number;
    id?: string;
    function?: { name?: string; arguments?: string };
  }>): void {
    for (const call of toolCalls) {
      const index = call.index ?? 0;
      const partial = this.#partials.get(index) ?? { arguments: "" };
      if (call.id !== undefined) {
        partial.id = call.id;
      }
      if (call.function?.name !== undefined) {
        partial.name = call.function.name;
      }
      if (call.function?.arguments !== undefined) {
        partial.arguments += call.function.arguments;
      }
      this.#partials.set(index, partial);
      this.#commitPartial(index, partial);
    }
  }

  ingestMessage(toolCalls: Array<{
    id: string;
    function: { name: string; arguments: string };
  }>): void {
    for (const call of toolCalls) {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(call.function.arguments) as Record<string, unknown>;
      } catch {
        parsed = {};
      }
      const resolved = resolveToolCall(call.function.name, parsed);
      if (resolved !== undefined) {
        this.#calls.set(call.id, resolved);
      }
    }
  }

  #commitPartial(index: number, partial: PartialToolCall): void {
    if (partial.id === undefined || partial.name === undefined) {
      return;
    }
    let parsed: Record<string, unknown> = {};
    if (partial.arguments.length > 0) {
      try {
        parsed = JSON.parse(partial.arguments) as Record<string, unknown>;
      } catch {
        return;
      }
    }
    const resolved = resolveToolCall(partial.name, parsed);
    if (resolved !== undefined) {
      this.#calls.set(partial.id, resolved);
      this.#partials.delete(index);
    }
  }
}

export function resolveToolCall(
  rawName: string,
  args: Record<string, unknown>,
): KnownToolCall | undefined {
  if (rawName === "call_tool") {
    const toolName = args["tool_name"];
    const input = args["input"];
    if (typeof toolName !== "string") {
      return undefined;
    }
    return {
      name: toolName,
      arguments:
        typeof input === "object" && input !== null
          ? (input as Record<string, unknown>)
          : {},
    };
  }
  return { name: rawName, arguments: args };
}
