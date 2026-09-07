import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execSync } from "child_process";
import { fetchPRDiff } from "../utils/github";
import { getDiffStat } from "../utils/git";

export default function (pi: ExtensionAPI) {
  // TOOL — run type checks on the whole project, via tsconfig.json
  pi.registerTool({
    name: "run_checks",
    label: "Run Type Checks",
    description: "Run TypeScript checks across the whole project (uses tsconfig.json)",
    promptSnippet: "Run TypeScript checks",
    promptGuidelines: ["Use run_checks to run TypeScript checks across the whole project."],
    parameters: Type.Object({}),
    async execute() {
      try {
        execSync(
          "npx tsc",
          { encoding: "utf-8" }
        );
        return { content: [{ type: "text", text: "Type checks passed." }], details: {} };
      } catch (err: any) {
        const output = err?.stdout || err?.stderr || err?.message || "Unknown error";
        return { content: [{ type: "text", text: `Type checks failed:\n${output}` }], details: {} };
      }
    },
  });
  // TOOL — the model decides when to call this, based on the task at hand.
  pi.registerTool({
    name: "git_diff_stat",
    label: "Git Diff Stat",
    description: "Show git diff --stat output for the current repo",
    promptSnippet: "Show what files have changed and by how much",
    promptGuidelines: ["Use git_diff_stat to see a summary of uncommitted changes."],
    parameters: Type.Object({}),
    async execute() {
      return { content: [{ type: "text", text: getDiffStat() }], details: {} };
    },
  });

  // TOOL — fetches a PR's diff from the GitHub API.
  pi.registerTool({
    name: "fetch_pr_diff",
    label: "Fetch PR Diff",
    description: "Fetch the diff for a specific PR number",
    promptSnippet: "Fetch the diff for PR #{{pr_number}}",
    promptGuidelines: ["Use fetch_pr_diff to get the raw diff text for a specific PR number."],
    parameters: Type.Object({
      pr_number: Type.Integer({ description: "The PR number to fetch the diff for" }),
    }),
    async execute(_toolCallId, { pr_number }) {
      const diff = await fetchPRDiff(pr_number);
      return { content: [{ type: "text", text: diff }], details: {} };
    },
  });

  // COMMAND — a human types "/diffstat" directly; the model is never involved
  // in deciding whether this runs.
  pi.registerCommand("diffstat", {
    description: "Show git diff --stat directly, no model involved",
    async handler(_args, ctx) {
      ctx.ui.notify(getDiffStat(), "info");
    },
  });

  // EVENT HANDLER — Pi itself fires this automatically before every bash
  // tool call, regardless of what the human or model intended. This is a
  // small safety guardrail: block an obviously destructive command.
  pi.on("tool_call", async (event) => {
    if (event.toolName === "bash" && (event.input as { command?: string })?.command?.includes("rm -rf")) {
      return { block: true, reason: "Blocked: rm -rf is not allowed via this session." };
    }
  });
}
