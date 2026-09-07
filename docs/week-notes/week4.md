# Week 4 — orchestrating the two tools with a Skill

Goal: tie `fetch_pr_diff` and `run_checks` together into one flow the
model runs end-to-end, instead of me manually asking for each tool.

## Skills vs Extensions, concretely
Extensions (`.pi/extensions/*.ts`) are TypeScript code that runs — they
add tools, commands, event handlers. Skills (`.pi/skills/<name>/SKILL.md`)
are just markdown instructions the model reads and follows using
whatever tools happen to be available. A Skill can't do anything an
Extension's tools don't already expose; it's purely "here's a recipe for
using them together."

Real convention discovered from Pi's own docs (not guessed):
- Skill file: `.pi/skills/<skill-name>/SKILL.md`
- Required YAML frontmatter: `name` (lowercase, hyphens) and
  `description` (what it does + when to use it — this is what the model
  uses to decide whether to invoke it unprompted)
- Invoked as `/skill:<name> <args>` — anything after the name is appended
  to the skill content as a user turn

## What was built
1. `.pi/skills/pr-review/SKILL.md` — instructs the model to: call
   `fetch_pr_diff` for the given PR number, read the diff itself and flag
   risk areas (new deps, deleted tests, changed type signatures, oversized
   diffs, secrets handling, missing error handling), call `run_checks`
   project-wide, then draft a short structured markdown review.
2. `.pi/extensions/pr-review-command.ts` — new extension file with:
   - `/review <pr-number>` command: calls `pi.sendUserMessage("/skill:pr-review <n>", { expandPromptTemplates: true })`
     so I don't have to type the skill invocation by hand.
   - An `agent_settled` event handler that grabs the final assistant
     message text and writes it to `reviews/PR-<n>.md`.

## Real problems hit building this (not guessed, verified against the
installed package's own `.d.ts` files)
1. `pi.sendUserMessage` vs `pi.sendMessage`: the former sends an actual
   user turn and can expand `/skill:` syntax via
   `{ expandPromptTemplates: true }`; the latter injects a custom message
   and does not expand skills. Needed the real one.
2. To save the review, an event handler needs the finished assistant
   text. `ctx.sessionManager.getBranch()` returns session entries;
   message entries have `entry.message.role` / `.content`. `content` for
   an assistant message is an array of `{ type: "text", text }` /
   thinking / tool-call items — only the `"text"` items are the visible
   review text.
3. Couldn't `import type { AssistantMessage, TextContent } from "@earendil-works/pi-ai"` —
   that package is only hoisted into `pi-coding-agent`'s own nested
   `node_modules`, not into ours, so it doesn't resolve from our code.
   Worked around it with a small structural (duck-typed) helper instead
   of fighting module resolution for a learning project.
4. There's no built-in per-PR-number tagging on session entries, so the
   command handler stashes the pending PR number in a module-level
   variable (`pendingReviewPr`) before firing the skill, and the
   `agent_settled` handler reads + clears it. Documented limitation: this
   only works for one review in flight at a time in a single session,
   which is fine for how I'm using this.

`npx tsc` (project-wide, via the tsconfig from earlier this week) passes
clean with the new file.

## Testing plan (not yet run by me — Lucas testing this in Pi directly)
- `/review 1` against the existing PR #1 / testpr branch
- Confirm: skill fires, fetch_pr_diff runs, run_checks runs, a markdown
  review is printed, and `reviews/PR-1.md` appears with that same content
- Deliberately break something (like the Week 3 `pr_number` type
  regression) before running `/review 1` again, confirm the review's
  "Type checks" section correctly reports Fail with the tsc output

## Bug found while testing: argument didn't reach the model
Ran `/review 1` and it fired the skill correctly, but the saved review
was just "Please provide the PR number you want to review." — the model
never picked up the "1".

Root cause, found by reading Pi's own bundled source directly (not
guessed): `pi.sendUserMessage("/skill:pr-review 1", { expandPromptTemplates: true })`
goes through `_expandSkillCommand()`, which expands to:

```
<skill name="pr-review" location="...">
...full SKILL.md body...
</skill>

1
```

The argument is appended as a bare, unlabeled trailing line — not as
"User: 1" or any other explicit framing (that was my mistaken assumption
from a doc summary, not the actual behavior). A weaker/local model sees
a lone "1" with nothing tying it to "PR number" and doesn't make the
connection reliably. SKILL.md's own text explained the argument in terms
of what the user *typed* (`/skill:pr-review 1`), which the model never
actually sees post-expansion — it only sees the expanded result.

Fix, two-sided:
1. `/review` now sends `/skill:pr-review PR_NUMBER=<n>` instead of a bare
   number, so the trailing line is self-describing.
2. SKILL.md now explicitly says: "look at the very last line of this
   message, it has the form PR_NUMBER=<number>, that IS the PR number."

Lesson: don't trust a doc summary's description of an expansion
mechanism — read the actual shipped source when something silently
doesn't work, especially for prompt-construction plumbing like this
where the exact string shape matters a lot to weaker models.
