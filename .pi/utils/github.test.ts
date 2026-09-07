import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPrDiffUrl } from "./github.ts";

// fetchPRDiff itself hits the real GitHub API and isn't covered here — same
// reasoning as skipping LLM calls: it's non-deterministic (network,
// external service, token-dependent) rather than logic we own. What we DO
// own and can test deterministically is the URL it constructs.

test("buildPrDiffUrl builds the correct GitHub API URL for a PR number, defaulting to this project's repo", () => {
  assert.equal(
    buildPrDiffUrl(1),
    "https://api.github.com/repos/LucasRT/pi-learning/pulls/1"
  );
});

test("buildPrDiffUrl works for multi-digit PR numbers", () => {
  assert.equal(
    buildPrDiffUrl(1234),
    "https://api.github.com/repos/LucasRT/pi-learning/pulls/1234"
  );
});

test("buildPrDiffUrl uses a different repo when explicitly given one (GITHUB_REPO override)", () => {
  assert.equal(
    buildPrDiffUrl(7, "someone-else/their-project"),
    "https://api.github.com/repos/someone-else/their-project/pulls/7"
  );
});
