import { test } from "node:test";
import assert from "node:assert/strict";
import { extractAssistantText, parseReviewPrNumber } from "./review-parsing.ts";

test("extractAssistantText returns '' for a non-assistant message", () => {
  assert.equal(extractAssistantText({ role: "user", content: "hi" }), "");
});

test("extractAssistantText returns '' when content isn't an array", () => {
  assert.equal(extractAssistantText({ role: "assistant", content: "not an array" }), "");
});

test("extractAssistantText joins only the text content items", () => {
  const message = {
    role: "assistant",
    content: [
      { type: "thinking", thinking: "let me consider..." },
      { type: "text", text: "first line" },
      { type: "toolCall", id: "1", name: "run_checks", arguments: {} },
      { type: "text", text: "second line" },
    ],
  };
  assert.equal(extractAssistantText(message), "first line\nsecond line");
});

test("extractAssistantText handles garbage input without throwing", () => {
  assert.equal(extractAssistantText(null), "");
  assert.equal(extractAssistantText(undefined), "");
  assert.equal(extractAssistantText("just a string"), "");
});

test("parseReviewPrNumber finds the PR number in a real review report", () => {
  const report = [
    "# Review: PR #42",
    "",
    "## Summary",
    "Adds a new tool.",
  ].join("\n");
  assert.equal(parseReviewPrNumber(report), "42");
});

test("parseReviewPrNumber returns null for text that isn't a review report", () => {
  assert.equal(parseReviewPrNumber("Please provide the PR number you want to review."), null);
  assert.equal(parseReviewPrNumber(""), null);
});

test("parseReviewPrNumber only matches the specific heading format, not any mention of PR numbers", () => {
  assert.equal(parseReviewPrNumber("I looked at PR #42 briefly."), null);
});
