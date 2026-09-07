# pi-learning — PR Review Companion

A [Pi](https://pi.dev) extension package that reviews pull requests: it
fetches a PR's diff from GitHub, reads it for risk areas, runs the
project's own TypeScript type checks, and drafts a structured markdown
review — all from one command inside a `pi` session.

This repo doubles as a learning project for agentic development with Pi;
`docs/week-notes/` has a running log of what was built each week,
including real bugs hit and how they were diagnosed (not a cleaned-up
retelling — the actual dead ends too).

## What it does

Type `/review <pr-number>` (or just ask, e.g. "review pr 1" — the model
can invoke the skill on its own too) inside a `pi` session running in
this repo, and it will:

1. Fetch the PR's diff from GitHub (`fetch_pr_diff` tool)
2. Read the diff and flag risk areas: new dependencies, deleted tests,
   changed type signatures, oversized diffs, secrets handling, missing
   error handling
3. Run the whole project's TypeScript checks (`run_checks` tool)
4. Draft a short structured review and save it to `reviews/PR-<n>.md`

### Example output

```markdown
# Review: PR #1

## Summary

This PR adds a test line to the README.md file.

## Risk areas

None identified.

## Type checks

Passed

## Recommendation

Approve, as the changes are minimal and do not introduce any new risks.
```

## Install / setup

This is a Pi package (see `"pi"` in `package.json`) as well as an
ordinary git repo, so there are two ways to get it depending on what you
want.

**Working on it directly** (what this project's own development uses):
```bash
git clone git@github.com:LucasRT/pi-learning.git
cd pi-learning
npm install
```

**Installing its tools/skill into a different Pi project**, without
cloning or working in this repo at all:
```bash
pi install git:github.com/LucasRT/pi-learning@v0.1.0
```
This pulls the `.pi/extensions` and `.pi/skills` declared in
`package.json`'s `pi` field into whatever project you run it from. Pin a
tag (like `@v0.1.0`) for a stable snapshot, or drop it for whatever's on
`main`.

Either way, before it can actually review a PR:
1. Install Pi itself: `curl -fsSL https://pi.dev/install.sh | sh`, then
   set up a model provider (see `docs/week-notes/week0.md` and `week3.md`
   for notes on local vs. paid model tradeoffs — this project has been
   run against both Ollama and Azure AI Foundry models).
2. Set a GitHub personal access token with read-only access to the repo
   you're reviewing PRs in (Pull requests: read, Contents: read):
   ```bash
   export GITHUB_TOKEN=github_pat_...
   ```
   If you're using this package's tools in a project other than
   `pi-learning` itself, also set which repo to query:
   ```bash
   export GITHUB_REPO=owner/repo
   ```
   (defaults to `LucasRT/pi-learning` when unset, so it works out of the
   box for this project's own development)
3. Run `pi`. The tools, skill, and command below are available.

## Project layout

- `.pi/extensions/git-diff-stat.ts` — registers the `run_checks` and
  `git_diff_stat` tools, the `/diffstat` command, and a `tool_call` guard
  that blocks `rm -rf` via the bash tool
- `.pi/extensions/pr-review-command.ts` — registers the `/review`
  command and the `agent_settled` hook that saves finished reviews
- `.pi/utils/` — the actual logic behind the tools above (GitHub API
  calls, git shelling-out, review-text parsing), kept separate from the
  Pi-specific registration code so it can be unit tested directly
- `.pi/skills/pr-review/SKILL.md` — the markdown Skill that orchestrates
  `fetch_pr_diff` and `run_checks` into one review
- `reviews/` — saved output, one file per reviewed PR
- `docs/week-notes/` — week-by-week build log

## Development

```bash
npm run typecheck   # type-checks the whole .pi/ tree via tsconfig.json
npm test            # runs the unit tests in .pi/utils/*.test.ts
```

Tests cover the deterministic logic only — diff-stat formatting, review
text parsing, GitHub URL construction — not the LLM calls themselves or
live network requests, which aren't deterministic to begin with.

## Status

v0.1.0 — all five weeks complete (setup, RPC driving, first extension,
core tools, orchestrating skill, tests + packaging). See
`docs/RETROSPECTIVE.md` for what was hard, what I'd change, and what's
next. Full plan:
https://claude.ai/code/artifact/7acc8edc-6170-46d3-a38d-c0f96078e2ea
