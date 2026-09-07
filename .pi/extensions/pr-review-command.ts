import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Tracks which PR number (if any) the *current* agent run is reviewing, so
// the agent_settled handler below knows whether/where to save a result.
// This only works because Pi runs one agent turn at a time per session —
// it would need to be keyed by session id to be safe with multiple
// concurrent sessions, but for a single interactive `pi` session this is
// fine.
let pendingReviewPr: string | null = null;

/**
 * Pull the plain text out of the most recent assistant message on the
 * current branch. We deliberately duck-type this instead of importing
 * AssistantMessage/TextContent from @earendil-works/pi-ai, because that
 * package is only hoisted into pi-coding-agent's own nested node_modules,
 * not into ours — importing it directly fails to resolve. Structural
 * typing sidesteps that.
 */
function extractLatestAssistantText(message: unknown): string {
  const m = message as { role?: string; content?: unknown };
  if (m?.role !== "assistant" || !Array.isArray(m.content)) {
    return "";
  }
  return m.content
    .filter((c: any) => c && c.type === "text" && typeof c.text === "string")
    .map((c: any) => c.text as string)
    .join("\n");
}

export default function (pi: ExtensionAPI) {
  // COMMAND — "/review <pr-number>" kicks off the /skill:pr-review skill
  // with the PR number pre-filled, instead of the user typing the whole
  // "/skill:pr-review 5" invocation by hand.
  pi.registerCommand("review", {
    description: "Run the pr-review skill for a given PR number and save the result to reviews/",
    async handler(args, ctx) {
      const prNumber = args.trim();
      if (!prNumber) {
        ctx.ui.notify("Usage: /review <pr-number>", "error");
        return;
      }
      pendingReviewPr = prNumber;
      pi.sendUserMessage(`/skill:pr-review PR_NUMBER=${prNumber}`, { expandPromptTemplates: true });
    },
  });

  // EVENT HANDLER — fires once the agent run kicked off by /review has
  // fully settled (model is done, no auto-retry/compaction pending).
  // Grabs the final assistant text (the markdown review drafted by the
  // pr-review skill) and writes it to reviews/PR-<n>.md.
  pi.on("agent_settled", async (_event, ctx) => {
    if (!pendingReviewPr) {
      return;
    }
    const prNumber = pendingReviewPr;
    pendingReviewPr = null;

    let reviewText = "";
    for (const entry of ctx.sessionManager.getBranch()) {
      if (entry.type === "message") {
        const text = extractLatestAssistantText(entry.message);
        if (text) {
          reviewText = text; // keep overwriting; last one wins
        }
      }
    }

    if (!reviewText) {
      ctx.ui.notify(`/review: no assistant text found to save for PR #${prNumber}`, "error");
      return;
    }

    const reviewsDir = path.join(ctx.cwd, "reviews");
    await mkdir(reviewsDir, { recursive: true });
    const filePath = path.join(reviewsDir, `PR-${prNumber}.md`);
    await writeFile(filePath, reviewText, "utf-8");
    ctx.ui.notify(`Saved review to reviews/PR-${prNumber}.md`, "info");
  });
}
