# Week 1 — The agent loop & RPC mode

## Goals
- Understand context engineering: AGENTS.md/SYSTEM.md, auto-compaction, session trees
- Drive Pi from Python via RPC mode
- Observe llama3.1:8b's tool-call reliability objectively (via script, not just eyeballing the UI)

## Context engineering notes
- `AGENTS.md`: project-root file with standing instructions for the agent about
  this specific codebase (conventions, how to run tests, gotchas). Read
  automatically at session start.
- `SYSTEM.md`: replaces/extends Pi's own system prompt for deeper behavior changes.
- Auto-compaction: long sessions get summarized automatically instead of
  truncated, so old context isn't abruptly lost.
- Session trees: conversation history branches instead of being linear — you
  can rewind and try a different instruction without losing the other path.

## RPC exercise
`experiments/rpc_client.py` — drives Pi over JSONL stdin/stdout, prints
streamed text plus an explicit `[TOOL CALL]` / `[TOOL RESULT]` line whenever
a real tool call fires. Run with:

    python3 experiments/rpc_client.py "read README.md and summarize it"

## Notes
(fill in what you observe)

## Tool-loop exercise findings (2026-08-22)

Built `git_stats.py` interactively with Pi (llama3.1:8b via Ollama). Hit
three distinct, real failure modes in one exercise:

1. **No autonomous continuation.** After a tool error, it explained the bug
   in prose but stopped rather than fixing it — had to be re-prompted.
   Confirmed this is a harness *design choice*, not a bug: Pi doesn't force
   a retry loop, the model decides. Fixable via AGENTS.md instructions
   (see below).

2. **Tool calls rendered as text.** Same issue as qwen2.5-coder in Week 0,
   just less frequent with llama3.1:8b. A proposed fix showed up as a
   literal `{"name": "write", ...}` JSON blob in the response instead of
   an actual executed tool call.

3. **Fabricated tool results (the important one).** After adding an
   AGENTS.md instruction ("verify before you're done, keep iterating on
   errors without waiting to be asked"), it DID continue automatically —
   but then claimed to "read" the file and displayed code that didn't match
   what was actually on disk (confirmed via direct `cat -n` from Terminal).
   It was reciting a stale/garbled memory of an earlier draft, not real
   tool output. Looked like verification was happening when it wasn't.

Also found: the malformed text-only tool call from (2) apparently *did*
partially leak through to disk with corrupted newlines (statements glued
together), suggesting these aren't fully inert — a fake tool call can
still cause damage.

## AGENTS.md added

Added a project-level instruction: after writing/editing code, always run
it, and on error diagnose + fix + re-run automatically without waiting to
be asked. This fixed failure mode (1) but did not fix or prevent (2) or
(3) — confirms these are model/template limitations, not something a
prompt instruction can reliably paper over.

## Takeaway

Tool-call reliability is not binary and not just about the interactive UI
"looking" like it worked — it can quietly fail into "looks done but the
verification itself was fabricated," which is worse than an obvious
crash. Worth remembering going into weeks 3-4: build in your own
independent verification (diffing actual file state, checking real
command output) rather than trusting the model's self-report, whichever
model ends up powering the real project.

Final `git_stats.py`: written manually from a known-correct reference
after the corrupted version proved not worth continuing to debug via Pi.

Week 1 complete.
