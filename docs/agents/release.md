# Releasing a version

A **release** merges `develop` into `main` (which deploys to defend.thearki.com) and publishes a GitHub Release `vX.Y.Z`. Start only when the user asks; each merge below also waits for the user's go.

## Steps

1. **Version.** On a feature branch: `cd system-defense && npm version X.Y.Z --no-git-tag-version` (updates `package.json` and `package-lock.json`). The game shows it on the title screen, links it to `releases/tag/vX.Y.Z`, and attaches it to every Feedback. New art or rule changes: minor. Fixes only: patch. Merge this PR into `develop` like any feature.
2. **Release PR.** `gh pr create --base main --head develop --title "Release vX.Y.Z: <headline>"`. Body with the `pr` skill; the Summary lists the PRs since the last release (`git log --oneline origin/main..origin/develop`). Done when `gh pr checks <n> --watch` is green.
3. **Merge** when the user says so: `gh pr merge <n> --merge` (a merge commit, never squash: `develop` must stay an ancestor of `main`).
4. **Deploy.** `gh run list --branch main --limit 1`, then `gh run watch <id> --exit-status`. Done when `check`, `docker` and `deploy` all pass.
5. **Verify live.** The bundle carries the version string:
   ```sh
   js=$(curl -s https://defend.thearki.com/ | grep -o 'assets/[^"]*\.js' | head -1)
   curl -s "https://defend.thearki.com/$js" | grep -c '"X.Y.Z"'
   ```
   Done when the count is not 0.
6. **GitHub Release.** `gh release create vX.Y.Z --target <merge commit sha> --title "Defend the Arki vX.Y.Z" --notes-file <file>`. The notes are for players, not developers; copy the shape of the last one (`gh release view --json body -q .body`): one-line intro, **Play:** link, "In this version" bullets, Feedback section.
7. **Clean up** the worktree (`git worktree remove`). GitHub deletes merged branches; the local branch needs `git branch -D` after `git merge-base --is-ancestor <branch> origin/develop` confirms it is merged.

To roll back: revert the merge commit on `main` by PR. Nothing is stored server-side.
