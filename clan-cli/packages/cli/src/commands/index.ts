export type CommandName = "ui" | "pair" | "run" | "status";

export type CommandResolution =
  | { kind: "known"; name: CommandName }
  | { kind: "unknown"; name: string };

/**
 * Resolves argv without executing a command.
 * Execution and policy enforcement belong to the run supervisor.
 */
export function resolveCommand(args: readonly string[]): CommandResolution {
  const command = args[0];

  if (
    command === undefined ||
    command === "ui" ||
    command === "pair" ||
    command === "run" ||
    command === "status"
  ) {
    return { kind: "known", name: command ?? "ui" };
  }

  return { kind: "unknown", name: command };
}
