import type { RepositoryContext } from "../repository/repository.ts";
import {
  gitDiffTool,
  gitStatusTool,
  globTool,
  grepTool,
  listDirectory,
  readFileTool,
  repoInfo,
} from "./read.ts";
import {
  applyPatch,
  createFile,
  deleteFile,
  diffMetadata,
  replaceRange,
  writeFileTool,
} from "./write.ts";
import { runCommandTool } from "./shell.ts";
import type { ToolResult } from "./types.ts";

export type AgentMode = "plan" | "build";

export type ToolContext = {
  repo: RepositoryContext;
  mode: AgentMode;
  deleteApproved: boolean;
  commandApproved: boolean;
  onMutation?: () => Promise<void>;
};

export const PLAN_TOOLS = [
  "repo_info",
  "list_directory",
  "read_file",
  "glob",
  "grep",
  "git_status",
  "git_diff",
] as const;

export const BUILD_TOOLS = [
  ...PLAN_TOOLS,
  "create_file",
  "write_file",
  "apply_patch",
  "replace_range",
  "delete_file",
  "run_command",
] as const;

export function jsonSchemaFor(name: string): Record<string, unknown> {
  const pathProp = { path: { type: "string" } };
  switch (name) {
    case "repo_info":
    case "git_status":
    case "git_diff":
      return { type: "object", properties: {} };
    case "list_directory":
    case "read_file":
    case "delete_file":
      return { type: "object", properties: pathProp, required: ["path"] };
    case "glob":
      return {
        type: "object",
        properties: {
          pattern: { type: "string" },
          path: { type: "string" },
        },
        required: ["pattern"],
      };
    case "grep":
      return {
        type: "object",
        properties: {
          pattern: { type: "string" },
          path: { type: "string" },
          include: { type: "string" },
          glob: { type: "string" },
          caseSensitive: { type: "boolean" },
          fixedString: { type: "boolean" },
          maxMatches: { type: "number" },
        },
        required: ["pattern"],
      };
    case "create_file":
    case "write_file":
      return {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" },
          expected: { type: "string" },
        },
        required: ["path", "content"],
      };
    case "apply_patch":
      return {
        type: "object",
        properties: {
          path: { type: "string" },
          search: { type: "string" },
          replace: { type: "string" },
          replaceAll: { type: "boolean" },
        },
        required: ["path", "search", "replace"],
      };
    case "replace_range":
      return {
        type: "object",
        properties: {
          path: { type: "string" },
          startLine: { type: "number" },
          endLine: { type: "number" },
          replacement: { type: "string" },
        },
        required: ["path", "startLine", "endLine", "replacement"],
      };
    case "run_command":
      return {
        type: "object",
        properties: {
          command: { type: "string" },
          args: { type: "array", items: { type: "string" } },
          cwd: { type: "string" },
        },
        required: ["command"],
      };
    default:
      return { type: "object", properties: {} };
  }
}

export async function executeTool(
  context: ToolContext,
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResult<unknown>> {
  const str = (key: string): string =>
    typeof args[key] === "string" ? args[key] : "";
  const bool = (key: string): boolean => args[key] === true;
  const num = (key: string): number =>
    typeof args[key] === "number" ? args[key] : Number(args[key]);

  const writeAllowed = context.mode === "build";
  const writes = new Set([
    "create_file",
    "write_file",
    "apply_patch",
    "replace_range",
    "delete_file",
    "run_command",
  ]);
  if (writes.has(name) && !writeAllowed) {
    return {
      ok: false,
      error: { code: "plan_readonly", message: "Plan mode cannot mutate the repository" },
    };
  }

  switch (name) {
    case "repo_info":
      return await repoInfo(context.repo);
    case "list_directory":
      return await listDirectory(context.repo, str("path") || ".");
    case "read_file":
      return await readFileTool(context.repo, str("path"));
    case "glob":
      return await globTool(context.repo, str("pattern"), str("path") || undefined);
    case "grep":
      return await grepTool(context.repo, str("pattern"), {
        path: str("path") || undefined,
        include: str("include") || str("glob") || undefined,
        caseSensitive: bool("caseSensitive"),
        fixedString: bool("fixedString"),
        maxMatches: typeof args.maxMatches === "number" ? args.maxMatches : undefined,
      });
    case "git_status":
      return await gitStatusTool(context.repo);
    case "git_diff":
      return await gitDiffTool(context.repo);
    case "create_file":
      return await afterMutation(
        context,
        name,
        await createFile(context.repo, str("path"), str("content")),
      );
    case "write_file":
      return await afterMutation(
        context,
        name,
        await writeFileTool(
          context.repo,
          str("path"),
          str("content"),
          typeof args.expected === "string" ? args.expected : undefined,
        ),
      );
    case "apply_patch":
      return await afterMutation(
        context,
        name,
        await applyPatch(
          context.repo,
          str("path"),
          str("search"),
          str("replace"),
          bool("replaceAll"),
        ),
      );
    case "replace_range":
      return await afterMutation(
        context,
        name,
        await replaceRange(
          context.repo,
          str("path"),
          num("startLine"),
          num("endLine"),
          str("replacement"),
        ),
      );
    case "delete_file": {
      const result = await deleteFile(context.repo, str("path"), {
        approved: context.deleteApproved,
      });
      return await afterMutation(context, name, result);
    }
    case "run_command": {
      const rawArgs = args.args;
      const argv = Array.isArray(rawArgs)
        ? rawArgs.filter((item): item is string => typeof item === "string")
        : [];
      return await afterMutation(
        context,
        name,
        await runCommandTool(context.repo, {
          command: str("command"),
          args: argv,
          cwd: str("cwd") || undefined,
          approved: context.commandApproved,
        }),
      );
    }
    default:
      return {
        ok: false,
        error: { code: "unknown_tool", message: `Unknown tool ${name}` },
      };
  }
}

async function afterMutation(
  context: ToolContext,
  _name: string,
  result: ToolResult<unknown>,
): Promise<ToolResult<unknown>> {
  if (result.ok && context.onMutation !== undefined) {
    await context.onMutation();
  }
  return result;
}

export { diffMetadata };
