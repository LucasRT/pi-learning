import { execSync } from "node:child_process";

/**
 * Show `git diff --stat` for the current repo. Takes an injectable exec
 * function (defaulting to Node's real execSync) purely so tests can pass
 * a fake one instead of needing an actual git repo with staged changes —
 * see git.test.ts.
 */
export function getDiffStat(exec: typeof execSync = execSync): string {
  try {
    const output = exec("git diff --stat", { encoding: "utf-8" });
    return output.toString() || "No changes.";
  } catch (err) {
    return `Error: ${(err as Error).message}`;
  }
}
