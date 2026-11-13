## Git Flow (simple)

- `main` is production: every push to `main` deploys to defend.thearki.com. Never push or merge to `main` directly.
- `develop` is integration. Start each change on `feature/<name>` from `develop`, in its own worktree (other sessions share the main checkout).
- A feature goes back by Pull Request: `gh pr create --base develop`.
- To publish, open a Pull Request from `develop` to `main` and merge it on GitHub, only when the user asks.
- `main` is protected on GitHub (ruleset "Protect main"): only Pull Requests, the `check`, `docker` and `from-develop` jobs must pass, no force-push, no delete. `from-develop` fails any PR into `main` whose source is not `develop`, and it runs on every PR. The admin can skip `check` and `docker` only when merging a PR that changes no game files (CI does not run there). A local `pre-push` hook also blocks pushes to `main`.
- `develop` has a ruleset "Keep develop" (no delete, no force-push), because the repo deletes merged branches and the release PR merges `develop`.

## Pointers

- The game is the Vite app in `system-defense/`. Read `docs/agents/running-the-game.md` before starting the dev server, running checks or taking screenshots.
- Levels: read `docs/agents/adding-a-level.md` before adding or changing a level.
- Art: read `docs/agents/art-prototypes.md` before drawing or changing defense or threat art.
- Release: read `docs/agents/release.md` when the user asks to release or publish a version.

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues (`gh` CLI). Player Feedback arrives by email and is copied into Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default triage roles, as GitHub labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and one `docs/adr/` at the repo root. See `docs/agents/domain.md`.
