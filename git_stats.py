#!/usr/bin/env python3
"""git_stats.py — commit frequency and most-changed files in this repo."""

import collections
import git


def main() -> None:
    repo = git.Repo(".")

    commits_per_day = collections.Counter()
    files_changed = collections.Counter()

    for commit in repo.iter_commits():
        day = commit.committed_datetime.date().isoformat()
        commits_per_day[day] += 1
        for filename in commit.stats.files:
            files_changed[filename] += 1

    print("Commits per day:")
    for day, count in sorted(commits_per_day.items()):
        print(f"  {day}: {count}")

    print("\nFiles changed most often:")
    for filename, count in files_changed.most_common():
        print(f"  {filename}: {count}")


if __name__ == "__main__":
    main()