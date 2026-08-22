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
