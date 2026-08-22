# Week 0 — Setup & orientation

## Goals
- Install Pi, run one interactive session
- TypeScript-for-Python-devs primer
- Project repo initialized

## Notes
(fill in as you go)

## Model setup decision (2026-08-21)

Using a local model via Ollama instead of a paid API key, to avoid any
billing exposure while learning the harness basics.

- Provider: Ollama, `http://localhost:11434/v1`
- Model: `qwen2.5-coder:7b`
- Config: `~/.pi/agent/models.json` (provider), `~/.pi/agent/settings.json` (default)

Known tradeoff: qwen2.5-coder:7b via Ollama's OpenAI-compatible endpoint
sometimes prints a tool call as plain text instead of actually invoking it
(confirmed: this is a known limitation of small models on Ollama's
tool-calling translation layer, not specific to this setup). Working
around it in weeks 1-2 by:
- testing tool code directly before testing it through Pi
- being more explicit in prompts when asking it to use a tool
- treating tool-call reliability itself as something worth observing

`qwen3-coder` (Ollama's own recommended model for Pi) needs ~19GB and
doesn't fit this machine's ~11.8GB available unified memory, so it's not
an option here. Revisit a small capped-balance paid model (e.g. Claude
Haiku) if this becomes a blocker once we reach the real project in
week 3+.

## Model setup — resolved (2026-08-21)

`qwen2.5-coder:7b` couldn't reliably issue real tool calls (printed JSON
as text instead of invoking tools, and wasn't grounded in the actual
working directory). Switched to `llama3.1:8b` on the same Ollama setup —
confirmed working: `pi` correctly executed a `read` tool call on
`README.md` and summarized it accurately.

Current config:
- Provider: Ollama, `http://localhost:11434/v1`
- Model: `llama3.1:8b`
- Still fully local, zero billing exposure

Takeaway for later weeks: model choice matters as much as harness config
when it comes to reliable tool-calling. Worth remembering if a future
model swap (e.g. for the real project in week 3+) starts misbehaving —
check whether it's a config issue or a model-capability issue first,
the way this was.

## Week 0 reading — done (2026-08-21)

**Pi's philosophy**: Agent = Model + Harness. 4 tools only (read/write/edit/bash),
no built-in search/list/etc — the model shells out for those. System prompt
kept under ~1000 tokens (vs. e.g. Claude Code's ~55k). Deliberately omits
sub-agents, plan mode, permission gating from core — those are extension-built,
not framework-opinionated. 4 run modes: interactive, print/JSON, RPC
(stdin/stdout JSON — next week's exercise), SDK (embed in Node app).

**TS-for-Python primer**: type annotations map onto Python type hints
(`name: string` vs `name: str`), `interface` ~= dataclass/TypedDict,
`async`/`await` ~= asyncio (no explicit event loop needed), npm/package.json
~= pip/requirements.txt, node_modules ~= venv site-packages (per-project by
default). Main adjustment: more explicit typing up front, and a `tsc` compile
step (Pi's tooling handles this when writing extensions).

Week 0 complete. Model working end-to-end (llama3.1:8b via Ollama, confirmed
real tool calls). Ready for Week 1: RPC mode + driving Pi from Python.
