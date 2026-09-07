import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Pull the plain text out of an assistant message. We deliberately
 * duck-type this instead of importing AssistantMessage/TextContent from
 * @earendil-works/pi-ai, because that package is only hoisted into
 * pi-coding-agent's own nested node_modules, not into ours — importing
 * it directly fails to resolve. Structural typing sidesteps that.
 */
function extractAssistantText(message: unknown): string {
  const m = message as { role?: string; content?: unknown };
  if (m?.role !== "assistant" || !Array.isArray(m.content)) {
    return "";
  }
  return m.content
    .filter((c: any) => c && c.type === "text" && typeof c.text === "string")
    .map((c: any) => c.text as string)
    .join("\n");
}

// Matches the "# Review: PR #<number>" heading the pr-review skill is
// instructed to produce as the first line of its report.
const REVIEW_HEADING = /^#\s*Review:\s*PR\s*#(\d+)/m;

export default function (pi: ExtensionAPI) {
  // COMMAND — "/review <pr-number>" is a convenience shortcut that kicks
  // off the /skill:pr-review skill with the PR number pre-filled, instead
  // of typing the whole "/skill:pr-review PR_NUMBER=5" invocation by hand.
  // NOTE: this is *not* the only way the skill can end up running — the
  // model can also invoke it itself (e.g. typing "review pr 1" in plain
  // English was enough to trigger it in testing), so the save logic below
  // does NOT depend on this command having been used. It's just a
  // shortcut.
  pi.registerCommand("review", {
    description: "Run the pr-review skill for a given PR number and save the result to reviews/",
    async handler(args, ctx) {
      const prNumber = args.trim();
      if (!prNumber) {
        ctx.ui.notify("Usage: /review <pr-number>", "error");
        return;
      }
      pi.sendUserMessage(`/skill:pr-review PR_NUMBER=${prNumber}`, { expandPromptTemplates: true });
    },
  });

  // EVENT HANDLER — fires whenever an agent run fully settles, for any
  // reason (not just /review). Looks at the most recent assistant text;
  // if it looks like a finished pr-review report (starts with a
  // "# Review: PR #<n>" heading), saves it to reviews/PR-<n>.md. Reading
  // the PR number out of the report itself — rather than tracking it as
  // state set by the /review command — means this works no matter how
  // the skill was actually invoked.
  pi.on("agent_settled", async (_event, ctx) => {
    let latestAssistantText = "";
    for (const entry of ctx.sessionManager.getBranch()) {
      if (entry.type === "message") {
        const text = extractAssistantText(entry.message);
        if (text) {
          latestAssistantText = text; // keep overwriting; last one wins
        }
      }
    }

    const match = latestAssistantText.match(REVIEW_HEADING);
    if (!match) {
      return; // not a finished review — nothing to save
    }
    const prNumber = match[1];

    const reviewsDir = path.join(ctx.cwd, "reviews");
    await mkdir(reviewsDir, { recursive: true });
    const filePath = path.join(reviewsDir, `PR-${prNumber}.md`);
    await writeFile(filePath, latestAssistantText, "utf-8");
    ctx.ui.notify(`Saved review to reviews/PR-${prNumber}.md`, "info");
  });
}
