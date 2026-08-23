# Week 2 — First TypeScript extension

## Goal
Build a trivial custom Pi tool (`git_diff_stat`), learn extension anatomy,
understand Skills vs Extensions.

## Model switch mid-week
Deployed several models via Azure AI Foundry serverless (using free Azure
credits) to get past llama3.1:8b's unreliability on Pi's niche extension
API specifically:
- Mistral Small 2503 (cheap, ~$0.10/$0.30 per M) — ended up using this one
- Also provisioned: Kimi K2.6, Claude Sonnet, GPT-5.4-mini, Llama 3.3 70B
  (available for later weeks if needed)

Azure config note: newer unified endpoint (`.../openai/v1`) is genuinely
OpenAI-compatible (plain Bearer token, no api-version param). Needed a
`compat` block in models.json to fix a 422 error — this backend rejects
`stream_options.include_usage`, `store`, and `max_completion_tokens` as
unknown fields:
```json
"compat": {
  "supportsUsageInStreaming": false,
  "supportsStore": false,
  "maxTokensField": "max_tokens"
}
```

## Extension-building findings (Mistral Small 2503)

Different failure modes than Week 1's local-model issues — this wasn't
about fake/fabricated tool calls, it was about confidently applying the
WRONG API from memory:

1. First attempt imported `from 'vscode'` — confused Pi's extension API
   with the much more common VS Code extension API (similar terminology:
   "extensions", "registerCommand"). Niche framework + common-sounding
   terms = high hallucination risk, even for a better model.

2. When asked to fix it using the reference doc, it responded "I don't
   have the capability to do that" and gave generic advice instead of
   acting — turned out to be a prompting issue, not a tool-calling
   regression (confirmed via a `read README.md` isolation test, which
   worked fine). Needed a much more imperative, explicit instruction
   ("use the write tool right now, do not explain") to get it to
   actually act.

3. Second attempt fixed the import but still had two bugs: (a) wrong
   package name (`from 'pi'` instead of `@earendil-works/pi-coding-agent`)
   and (b) the `execute()` function used Node's callback-style `exec()`
   and never returned `{ content: [...] }` — would have loaded fine but
   silently produced no result.

Ended up hand-writing the final correct version rather than continuing to
iterate through the model, same call as Week 1's git_stats.py.

## Working extension
`.pi/extensions/git-diff-stat.ts` — registers `git_diff_stat` tool,
wraps `git diff --stat` via `execSync`. Confirmed working: real tool
call, real diff output returned to the model.

## Skills vs Extensions
Extension = TypeScript code hooking into Pi's API directly (tools,
commands, event handlers) — for giving Pi new hard capabilities.
Skill = packaged instructions (markdown + optional scripts), invoked via
`/skill:name` — for packaging "how to do X well" as guidance. Week 4's
`/skill:pr-review` will be a Skill orchestrating Week 3's tools.

Week 2 complete.
