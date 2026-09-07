---
name: pr-review
description: Review a pull request in this repo by fetching its diff, checking it against the project's own TypeScript build, and drafting a short risk-focused review. Use when the user asks to review, check, or look at a specific PR number.
---

# PR Review

You are reviewing a pull request in the `pi-learning` repo.

**Where to find the PR number:** look at the very last line of this
message. It has the form `PR_NUMBER=<number>` (for example `PR_NUMBER=1`).
That number IS the PR number to review — extract it and use it directly
in step 1 below. It is not a typo or unrelated text. Only ask the user
for a PR number if that trailing `PR_NUMBER=...` line is genuinely
missing.

Follow these steps in order:

1. **Fetch the diff.** Call the `fetch_pr_diff` tool with the PR number.
   If it fails (404, missing token, etc.), stop and report the raw error
   back to the user — do not guess at what the PR might contain.

2. **Read the diff yourself and note risk areas.** Do not just summarize
   line-by-line. Specifically look for and call out, if present:
   - New dependencies added (`package.json` changes)
   - Deleted or weakened tests
   - Changes to type signatures or exported function contracts
   - Large diffs concentrated in one file (a sign it should have been
     split into smaller PRs)
   - Anything touching auth, tokens, or secrets handling
   - Missing error handling around new I/O (network calls, file reads)

3. **Run the project's type checks.** Call the `run_checks` tool. This
   checks the whole project, not just the files in the diff — that's
   deliberate, since a PR can break type-checking elsewhere (e.g. by
   changing a shared function's signature, exactly like the
   `fetchPRDiff` regression documented in week 3/4 notes). Report
   whether it passed or failed, and include the failure output verbatim
   if it failed.

4. **Draft the review.** Produce a short markdown report with this
   structure:

   ```markdown
   # Review: PR #<number>

   ## Summary
   <1-3 sentences on what the PR does>

   ## Risk areas
   <bulleted-in-prose list of anything flagged in step 2, or
   "None identified." if nothing stood out>

   ## Type checks
   <Pass/Fail, plus the tsc output if it failed>

   ## Recommendation
   <One of: Approve / Approve with comments / Request changes, with a
   one-sentence reason>
   ```

Output this report as your final response. Do not ask the user any
follow-up questions unless `fetch_pr_diff` genuinely failed and you need
a different PR number.
