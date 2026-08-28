export type ToolRisk =
  | "READ"
  | "WRITE"
  | "SHELL_SAFE"
  | "SHELL_UNKNOWN"
  | "DELETE"
  | "GIT_COMMIT"
  | "GIT_PUSH"
  | "CREATE_PR"
  | "SYSTEM_PRIVILEGED";

const WRITE_TOOLS = new Set([
  "create_file",
  "write_file",
  "apply_patch",
  "replace_range",
]);

export function classifyTool(name: string): ToolRisk {
  if (name === "delete_file") {
    return "DELETE";
  }
  if (WRITE_TOOLS.has(name)) {
    return "WRITE";
  }
  if (name === "run_command") {
    return "SHELL_UNKNOWN";
  }
  if (name === "git_commit") {
    return "GIT_COMMIT";
  }
  if (name === "git_push") {
    return "GIT_PUSH";
  }
  if (name === "create_pr") {
    return "CREATE_PR";
  }
  return "READ";
}

export function requiresHumanApproval(risk: ToolRisk): boolean {
  switch (risk) {
    case "READ":
    case "WRITE":
    case "SHELL_SAFE":
      return false;
    case "SHELL_UNKNOWN":
    case "DELETE":
    case "GIT_COMMIT":
    case "GIT_PUSH":
    case "CREATE_PR":
    case "SYSTEM_PRIVILEGED":
      return true;
    default: {
      const _never: never = risk;
      return _never;
    }
  }
}
