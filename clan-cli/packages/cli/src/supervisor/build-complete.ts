import type { RunEventType } from "@clancode/protocol";
import type { AgentMode } from "../tools/registry.ts";

export type BuildFinalizeDeps = {
  mode: AgentMode;
  mutatedThisTurn: boolean;
  turnId: string | undefined;
  emitDiff: () => Promise<void>;
  runValidation: () => Promise<{ ok: boolean; output: string; skipped: boolean }>;
  emit: (type: RunEventType, payload?: unknown) => void;
  setReady: () => void;
};

export async function completeSuccessfulTurn(deps: BuildFinalizeDeps): Promise<void> {
  if (deps.mode === "build" && deps.mutatedThisTurn) {
    await deps.emitDiff();
    const validation = await deps.runValidation();
    deps.setReady();
    if (validation.skipped) {
    deps.emit("run.completed", {
      turnId: deps.turnId,
      validationSkipped: true,
      mutated: true,
    });
      return;
    }
    deps.emit("run.completed", {
      turnId: deps.turnId,
      validated: validation.ok,
      validationFailed: !validation.ok,
      mutated: true,
    });
    return;
  }
  deps.setReady();
  deps.emit("run.completed", { turnId: deps.turnId, mutated: deps.mutatedThisTurn });
}
