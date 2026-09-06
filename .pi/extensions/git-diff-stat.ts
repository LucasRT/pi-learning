import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execSync } from "child_process";
import { fetchPRDiff } from "../utils/github";

function getDiffStat(): string {
  try {
    const output = execSync("git diff --stat", { encoding: "utf-8" });
    return output || "No changes.";
  } catch (err) {
    return `Error: ${(err as Error).message}`;
  }
}

export default function (pi: ExtensionAPI) {
  // TOOL — the model decides when to call this, based on the task at hand.
  pi.registerTool({
    name: "git_diff_stat",
    label: "Git Diff Stat",
    description: "Show git diff --stat output for the current repo",
    promptSnippet: "Show what files have changed and by how much",
    promptGuidelines: ["Use git_diff_stat to see a summary of uncommitted changes."],
    parameters: Type.Object({}),
    async execute() {
      return { content: [{ type: "text", text: getDiffStat() }] };
    },
  });

  // TOOL — fetches a PR's diff from the GitHub API (Week 3 work in progress).
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
      return { content: [{ type: "text", text: diff }] };
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
    if (event.toolName === "bash" && event.input?.command?.includes("rm -rf")) {
      return { block: true, reason: "Blocked: rm -rf is not allowed via this session." };
    }
  });
}
