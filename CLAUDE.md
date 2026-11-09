## Git Flow (simple)

- `main` is production: every push to `main` deploys to defend.thearki.com. Never push or merge to `main` directly.
- `develop` is integration. Start each change on `feature/<name>` from `develop`, in its own worktree (other sessions share the main checkout).
- A feature goes back by Pull Request: `gh pr create --base develop`.
- To publish, open a Pull Request from `develop` to `main` and merge it on GitHub, only when the user asks.
- A local `pre-push` hook blocks pushes to `main` (GitHub branch protection is not available on this plan).

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default triage roles, written as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and one `docs/adr/` at the repo root. See `docs/agents/domain.md`.
