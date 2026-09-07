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

## run_checks — done

Runs `npx tsc --noEmit --skipLibCheck` against the extension files, returns
pass/fail with real error output captured (not just a generic failure
message — needed `encoding: "utf-8"` instead of `stdio: "inherit"` to
actually capture output, otherwise it streams straight to the terminal
and gets lost).

Bugs found and fixed (all real API-signature/type issues, not
hallucinations — same category as fetch_pr_diff's execute() bug):

1. Duplicate `import { execSync }` line from a bad in-place edit — TS
   would flag as duplicate identifier.
2. `execute()`'s actual return type (`AgentToolResult`) requires a
   `details` field alongside `content` — not optional like the reference
   doc's shorthand example implied. All three tools were missing it.
3. Event handler accessed `event.input.command` without a type
   assertion — `input` is typed generically as `{}` since different
   tools have different input shapes; needed
   `(event.input as { command?: string })`.
4. `tsc` initially failed on missing type declarations for `typebox` and
   `@earendil-works/pi-coding-agent` — these are real npm packages that
   just weren't installed as devDependencies yet.
5. Once properly typed, `tsc` also surfaced two errors from INSIDE
   `pi-coding-agent`'s own bundled dependencies (unrelated to our code,
   likely a TypeScript version mismatch) — fixed by adding
   `--skipLibCheck`, standard practice for exactly this situation.

Verified both directions directly (bypassing the model, given repeated
Azure rate-limit hits mid-session): deliberately introduced a type
error, confirmed tsc caught it; reverted, confirmed it reports clean.

Key lesson: running `tsc --noEmit` directly on extension files is only a
reliable check once (a) the extension's actual dependencies are properly
installed as devDependencies for their types, and (b) library-internal
noise is excluded with `--skipLibCheck`. A naive first attempt produces
a lot of misleading "failures" that aren't about your code at all.

## Rate limits
Hit Azure's per-minute rate limit on mistral-small-2503 again mid-session
during iterative testing. Worth requesting a quota increase in the
Foundry portal if this keeps interrupting work, or switching to a
different deployed model (Kimi/Claude/GPT-5.4-mini/Llama) when it happens
rather than waiting.

## Scoping run_checks to the whole project
Originally `run_checks` called `tsc` with two hardcoded file paths, so it
only ever checked those two files — a new extension file added later
would be silently invisible to it. Fixed by adding a root `tsconfig.json`
with `"include": [".pi/**/*.ts"]` and changing `run_checks` to just run
`npx tsc` (no file args), which now picks up every `.ts` file under
`.pi/` automatically as the project grows.

Hit one real snag getting there: the installed TypeScript is v7.0.2, a
very new major version. `"moduleResolution": "node"` has been removed
in TS7 (error TS5108, it's treated as the deprecated `node10` strategy).
Tried `"node16"` next, but that enforces strict CJS/ESM interop rules
and broke on `typebox` (an ESM-only package) being required from a
CommonJS file. Since this tsconfig only ever type-checks (`noEmit: true`
— nothing is actually emitted or run from it), the right fix was
`"moduleResolution": "bundler"` paired with `"module": "esnext"`:
bundler resolution is designed for exactly this "type-check only" case
and skips the CJS/ESM boundary rules entirely.

Verified both directions again with the new config: deliberately
introduced a type error project-wide, confirmed `npx tsc` caught it;
reverted, confirmed clean.

Week 3 complete: both fetch_pr_diff and run_checks working, tested
end-to-end, and run_checks now scales to the whole project automatically.
