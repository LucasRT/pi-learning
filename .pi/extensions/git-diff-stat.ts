import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execSync } from "child_process";

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "git_diff_stat",
    label: "Git Diff Stat",
    description: "Show git diff --stat output for the current repo",
    promptSnippet: "Show what files have changed and by how much",
    promptGuidelines: ["Use git_diff_stat to see a summary of uncommitted changes."],
    parameters: Type.Object({}),
    async execute() {
      try {
        const output = execSync("git diff --stat", { encoding: "utf-8" });
        return { content: [{ type: "text", text: output || "No changes." }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] };
      }
    },
  });
}