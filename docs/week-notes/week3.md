# Week 3 — Build: PR Review Companion, core tools

## Goal
Implement fetch_pr_diff and run_checks, the two tools the real project
depends on.

## fetch_pr_diff — done

Built as a tool in .pi/extensions/git-diff-stat.ts, calling GitHub's REST
API via a helper in .pi/utils/github.ts (axios). Uses a fine-grained PAT
(GITHUB_TOKEN env var, read-only pull-requests + contents scope).

Two real bugs hit and fixed along the way (Mistral Small 2503):

1. **registerTool argument nesting** — a bad in-place edit turned
   `pi.registerTool({...}); pi.registerTool({...});` into
   `pi.registerTool({...}, pi.registerTool({...}));` — nesting the second
   call as an extra argument to the first instead of two separate
   statements. This is what was blocking `pi` from launching at all.

2. **execute() signature bug** — `async execute({ pr_number }) {...}`
   destructured pr_number off the FIRST argument, but Pi actually calls
   execute(toolCallId, params, signal, onUpdate, ctx) — params is the
   SECOND argument. Destructuring a property off a string (toolCallId)
   silently returns undefined in JS rather than erroring, so this bug
   produced no error at all until the actual request URL was inspected
   (`pulls/undefined`). Fixed by adding the toolCallId parameter slot:
   `async execute(_toolCallId, { pr_number }) {...}`.

Neither of these was a hallucination or fabrication (Week 1/2's usual
failure modes) — both were genuine API-signature misunderstandings that
compiled and ran without any error, staying silent until actually
exercised with real data. Lesson: a tool with parameters needs real
end-to-end testing of the parameter-passing path specifically, not just
"does it load and run without crashing."

Confirmed working end-to-end against a real PR (kept PR #1 / branch
`testpr` open intentionally as a standing test fixture for future weeks,
rather than recreating a throwaway PR each time).

## run_checks — next
