/**
 * Pull the plain text out of an assistant message. Duck-typed on purpose
 * instead of importing AssistantMessage/TextContent from
 * @earendil-works/pi-ai, because that package is only hoisted into
 * pi-coding-agent's own nested node_modules, not into ours — importing
 * it directly fails to resolve.
 */
export function extractAssistantText(message: unknown): string {
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

/**
 * If the given text looks like a finished pr-review report, return the PR
 * number it's reviewing. Otherwise return null. Reading the PR number out
 * of the report's own heading (rather than tracking which command
 * triggered it) means this works no matter how the skill was invoked.
 */
export function parseReviewPrNumber(text: string): string | null {
  const match = text.match(REVIEW_HEADING);
  return match ? match[1] : null;
}
