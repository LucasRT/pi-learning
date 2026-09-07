import { test } from "node:test";
import assert from "node:assert/strict";
import { getDiffStat } from "./git.ts";

test("getDiffStat returns 'No changes.' when the exec output is empty", () => {
  const fakeExec = () => "" as any;
  assert.equal(getDiffStat(fakeExec as any), "No changes.");
});

test("getDiffStat returns the raw diff stat output when there is one", () => {
  const fakeOutput = " README.md | 2 +-\n 1 file changed, 1 insertion(+), 1 deletion(-)\n";
  const fakeExec = () => fakeOutput as any;
  assert.equal(getDiffStat(fakeExec as any), fakeOutput);
});

test("getDiffStat turns a thrown error into an 'Error: ...' string instead of crashing", () => {
  const fakeExec = () => {
    throw new Error("not a git repository");
  };
  assert.equal(getDiffStat(fakeExec as any), "Error: not a git repository");
});

test("getDiffStat works against the real repo (smoke test, no mocking)", () => {
  // This is the actual pi-learning repo, so this should never throw.
  const result = getDiffStat();
  assert.equal(typeof result, "string");
});
