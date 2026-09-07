# Retrospective — PR Review Companion (v0.1.0)

Five weeks, building a real Pi extension package (two tools, one skill,
one command, an event hook) instead of toy exercises. Below is what was
actually hard, what I'd do differently, and what's next — written after
finishing, not touched up to look tidier than it was.

## What was hard

**Tool-calling reliability is the real bottleneck, not the code.**
Every model tried had a different failure mode, and none of them was
fixable by writing better TypeScript:
- qwen2.5-coder:7b (Ollama) printed tool calls as literal JSON text
  instead of invoking them — consistently, not occasionally.
- llama3.1:8b (Ollama) was better but had three distinct failure modes:
  no autonomous retry after an error, tool-calls-as-text under some
  prompts, and outright fabricated tool results (claimed to have read a
  file whose actual content didn't match what it reported).
- mistral-small-2503 (Azure) was reliable for direct tool prompts in
  Week 3, then intermittently printed tool-calls-as-text once prompts
  got longer and more structured (a skill-expanded prompt in Week 4) —
  same failure mode as the free models, just far rarer, and the same
  prompt succeeded on an identical retry. That's a genuinely different
  (and harder to reason about) problem than a model being categorically
  broken.

The lesson that stuck: build in a way that makes it obvious when the
model is the problem vs. when the code is the problem. Testing each
tool's own code directly before testing it through the model (Week 2's
habit) and, later, extracting deterministic logic into `.pi/utils/` with
real unit tests (Week 5) both exist specifically to keep that boundary
clear.

**Doc summaries are not a substitute for reading the actual source.**
Twice this cost real time: assuming `/skill:` argument expansion worked
like "User: <args>" (it doesn't — it's a bare trailing line, no label)
because that's what a fetched doc summary implied, not what the shipped
code does; and assuming a save hook could safely track "which PR is
being reviewed" from the command that triggered it, when the skill can
also fire from the model deciding to invoke it on its own. Both bugs
were fixed correctly and quickly once I actually read
`node_modules/@earendil-works/pi-coding-agent`'s own `.d.ts` and bundled
source instead of trusting a paraphrase.

**The Mac bridge's git lock-file limitation was a constant low-grade
tax.** The bridge can create `.git/*.lock` files during git operations
but can't `unlink` them — this needed manual `rm -f` from Lucas's own
Terminal something like half a dozen times across the project. Not a
bug in the project, but a real friction point worth naming, because it
shaped the workflow (commits got handed off to Lucas's own terminal
rather than run through the bridge, especially later on).

**TypeScript's ecosystem churn.** This project landed on TypeScript
7.0.2, a very new major version, which meant several of its own
breaking changes showed up mid-project: `moduleResolution: "node"`
removed outright (had to move to `bundler`), and `module`/
`moduleResolution` now required to agree with each other in ways
Node's own ESM loader doesn't. None of this was "wrong code" — it was
keeping up with a moving target while also learning the language for
the first time.

## What I'd change

**Start the tests earlier, not in Week 5.** The `.pi/utils/` split
(pulling deterministic logic out of extension files so it's testable
without mocking Pi's runtime) is a Week 2-level idea, not a Week 5
one. Doing it from the start would have made every week's manual
testing faster and would have caught the `fetchPRDiff(pr_number:
string)` regression (Week 4) via `npm test` in seconds instead of via a
full manual `/review` run and a reverse-engineering session.

**Decide on a model earlier and stick with it for the whole build,
switching only deliberately.** Bouncing between Ollama models, then
multiple Azure deployments, meant several bugs were entangled with
"is this the model or the code" questions that ate debugging time. A
short, explicit "which model for which phase" decision up front (even
if it changes later) would have kept that separated.

**Treat "make it shareable" as a Week 3 concern, not a Week 5
afterthought.** The hardcoded `LucasRT/pi-learning` repo string in
`fetch_pr_diff` sat there for two weeks before packaging work forced it
into the open. Nothing failed because of it (it always worked for this
project's own repo) — but it's exactly the kind of assumption that
should get flagged the moment a tool is written, not the moment someone
tries to reuse it.

## What to build next

- **Automate the tests.** `npm test` and `npm run typecheck` exist but
  nothing runs them automatically — a GitHub Actions workflow on every
  push/PR would close that gap cheaply.
- **A second, real skill.** `pr-review` is the only orchestration built
  so far. A natural next one: a `/skill:triage` that reads open issues
  and suggests labels/priority, reusing the same "tool does the
  fetching, skill does the reasoning, event hook saves the result"
  shape this project settled into.
- **Multi-PR / batch review.** Right now `/review` handles one PR per
  invocation. A `/review-all` that loops over open PRs would exercise
  a different part of Pi's extension API (probably `pi.exec` in a loop,
  or multiple `sendUserMessage` calls) not touched yet.
- **Actually try Foundry Local or another on-device runtime** as a
  middle ground between "free but unreliable" (Ollama) and "reliable
  but metered" (Azure Foundry) — flagged as an option back in the model
  comparison but never actually tried.
