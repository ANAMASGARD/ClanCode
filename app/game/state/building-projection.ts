import type { ClanRunView } from "@/app/lib/clan-run/types";
import type { SemanticBuildingId } from "@/app/game/state/default-layout";

export type BuildingProjectionStatus = {
  status: string;
  detail: string;
};

const READ_TOOLS = new Set(["read", "grep", "glob", "list_dir", "search"]);

function isReadTool(tool: string | null): boolean {
  if (tool === null) {
    return false;
  }
  return READ_TOOLS.has(tool) || tool.includes("read") || tool.includes("grep");
}

function isWriteTool(tool: string | null): boolean {
  if (tool === null) {
    return false;
  }
  return (
    tool.includes("write") ||
    tool.includes("edit") ||
    tool.includes("patch") ||
    tool.includes("create")
  );
}

function isValidationTool(tool: string | null): boolean {
  if (tool === null) {
    return false;
  }
  return tool.includes("test") || tool.includes("build") || tool.includes("lint") || tool.includes("typecheck");
}

/** Truthful building status derived from the run projection — never invented. */
export function buildingStatusFromProjection(
  buildingId: SemanticBuildingId,
  view: ClanRunView,
): BuildingProjectionStatus {
  switch (buildingId) {
    case "town-hall":
      if (!view.deviceOnline) {
        return {
          status: "Offline",
          detail: "Start ClanCode in the repository you want to work on.",
        };
      }
      if (view.phase === "idle" && view.runId === null) {
        return { status: "Ready", detail: "Open command chat to dispatch a task." };
      }
      return { status: statusLabel(view), detail: view.repositoryDisplay ?? "Active run" };

    case "search-tower":
      if (view.phase === "planning" || (view.phase === "building" && isReadTool(view.lastTool))) {
        return { status: "Working", detail: view.lastTool ?? "Searching the repository" };
      }
      return { status: "Watching", detail: "Idle until the next read or search tool runs." };

    case "builder-workshop":
      if (view.phase === "building" && isWriteTool(view.lastTool)) {
        return { status: "Working", detail: view.lastTool ?? "Applying changes" };
      }
      if (view.changed && view.validationStatus === "passed") {
        return {
          status: "Expanded",
          detail: `${String(view.storeys)} floor${view.storeys === 1 ? "" : "s"} after validated changes`,
        };
      }
      if (view.phase === "success" && view.changed) {
        return { status: "Complete", detail: "Validated changes recorded on the workshop." };
      }
      return { status: "Idle", detail: "No validated file changes yet." };

    case "validation-forge":
      if (view.phase === "validating" || view.validationStatus === "running") {
        return { status: "Running", detail: view.lastTool ?? "Validation in progress" };
      }
      if (view.validationStatus === "passed") {
        return { status: "Passed", detail: "Last validation succeeded." };
      }
      if (view.validationStatus === "failed") {
        return { status: "Failed", detail: "Last validation did not pass." };
      }
      if (isValidationTool(view.lastTool)) {
        return { status: "Recent", detail: view.lastTool as string };
      }
      return { status: "Banked", detail: "Waiting for the next validation run." };

    case "approval-gate":
      if (view.phase === "awaiting_approval") {
        if (view.approvalDecision === "denied") {
          return { status: "Denied", detail: "Sensitive action was blocked." };
        }
        return {
          status: "Awaiting you",
          detail: view.approvals[0]?.summary ?? view.approvals[0]?.toolName ?? "Approval required",
        };
      }
      if (view.approvalDecision === "granted") {
        return { status: "Open", detail: "Last sensitive action was approved." };
      }
      return { status: "Closed", detail: "No approval is pending." };

    case "test-camp":
      if (view.phase !== "idle" && view.runId !== null) {
        return { status: "Active", detail: `Run phase: ${view.phase}` };
      }
      return { status: "Standing by", detail: "No active run on the island." };

    case "session-lodge":
      return {
        status: view.runId !== null ? "Attached" : "Quiet",
        detail: view.runId !== null ? `Run ${view.runId.slice(0, 8)}…` : "No session resume UI yet.",
      };

    case "model-shrine":
      return {
        status: "Attuned",
        detail: view.requestedMode !== null ? `Last mode: ${view.requestedMode}` : "Model selection UI coming soon.",
      };

    case "market":
      return {
        status: view.lastTool !== null ? "In use" : "Open",
        detail: view.lastTool ?? "Tool catalog follows runtime policy.",
      };

    case "windmill":
      return {
        status: view.phase === "idle" ? "Turning" : "Busy",
        detail: view.phase === "idle" ? "Background idle motion only." : `Run phase: ${view.phase}`,
      };

    case "watermill":
      return {
        status: view.lastEventType !== null ? "Flowing" : "Flowing",
        detail: view.lastEventType ?? "Structured events drive the mill.",
      };

    case "farm":
      return {
        status: view.deliveryStage === "ready" ? "Ready to harvest" : "Growing",
        detail:
          view.deliveryStage === "ready"
            ? "Delivery is ready after human confirmation."
            : "Queued work appears when tasks dispatch.",
      };

    default: {
      const exhaustive: never = buildingId;
      return exhaustive;
    }
  }
}

function statusLabel(view: ClanRunView): string {
  if (!view.deviceOnline) {
    return "Offline";
  }
  if (view.phase === "awaiting_approval" && view.approvalDecision === "denied") {
    return "Denied";
  }
  if (view.deliveryStage === "ready") {
    return "Ready for delivery";
  }
  if (view.deliveryStage === "committing") {
    return "Delivering";
  }
  if (view.deliveryStage === "pr_created") {
    return "Pull request opened";
  }
  if (view.phase === "idle") {
    return "Idle";
  }
  if (view.phase === "planning") {
    return "Planning";
  }
  if (view.phase === "building") {
    return "Building";
  }
  if (view.phase === "awaiting_approval") {
    return "Awaiting approval";
  }
  if (view.phase === "validating") {
    return "Validating";
  }
  if (view.phase === "success") {
    return "Success";
  }
  if (view.phase === "failed") {
    return "Failed";
  }
  if (view.phase === "cancelled") {
    return "Cancelled";
  }
  return view.phase;
}
