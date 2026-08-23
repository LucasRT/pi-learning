# Pi extension API reference (condensed, for Week 2)

Extensions export a default factory function:

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // register tools, commands, event handlers here
}
```

## Registering a custom tool

```typescript
import { Type } from "typebox";

pi.registerTool({
  name: "my_tool",                    // snake_case identifier
  label: "My Tool",                   // display name
  description: "What it does",        // shown to the LLM
  promptSnippet: "Short description", // one-liner in system prompt
  promptGuidelines: [
    "Use my_tool when...",
  ],
  parameters: Type.Object({
    // define expected arguments here, e.g.:
    // path: Type.String(),
  }),
  async execute(toolCallId, params, signal, onUpdate, ctx) {
    // do the work here (can shell out, read files, etc.)
    return {
      content: [{ type: "text", text: "Result to show the model" }],
    };
  },
});
```

## Registering a slash command

```typescript
pi.registerCommand("my-command", {
  description: "What the command does",
  async handler(args, ctx) {
    ctx.ui.notify(`Executed with: ${args}`, "info");
  },
});
```

## File locations (project-local, auto-discovered)

- Single file: `.pi/extensions/my-extension.ts`
- Directory: `.pi/extensions/my-extension/index.ts`

Extensions in `.pi/extensions/` load automatically when Pi starts in this
repo. Use `/reload` inside a running session to hot-reload after edits.

## This week's exercise

Build a tool called `git_diff_stat`:
- No parameters needed (it should just operate on the current repo)
- `execute()` should run `git diff --stat` via Node's `child_process`
  (e.g. `execSync("git diff --stat", { cwd: ... })`) and return the output
  as the tool's `content` text
- Save it at `.pi/extensions/git-diff-stat.ts`
