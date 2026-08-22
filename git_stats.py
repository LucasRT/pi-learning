import os
import git
import calendar
import collections
def main():    # Git repo path    repo_path = '/Users/bopeng/Projects/pi-learning'

    # Initialize Git    repo = git.Git(repo_path)

    # Get commits per day    commits_per_day = {}
    for commit in repo.log():        commits_per_day[commit] = commits_per_day.get(commit, 0) + 1

    # Get files changed most often    files_changed = {}
    for commit in repo.log():        for file in commit.stats.files:
            files_changed[file] = files_changed.get(file, 0) + 1

    # Print results    print('Commits per day:')
    for date, count in commits_per_day.items():        print(f'{date}: {count}')
    print('Files changed most often:')
    for file, count in files_changed.items():        print(f'{file}: {count}')
if __name__ == '__main__':
    main()