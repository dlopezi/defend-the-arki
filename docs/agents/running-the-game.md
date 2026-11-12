# Running and checking the game

The game is the Vite app in `system-defense/`. Run every command below from there.

## Dev server

- A new worktree has no `node_modules`: run `npm install` first.
- The main checkout uses the default port 5173 (`npm run dev`). In a worktree, start on its own port so the two never mix: `npx vite --port 5175 --strictPort`.
- To find a server already running: `lsof -iTCP -sTCP:LISTEN -n -P | grep node`, then `lsof -a -d cwd -p <pid>` shows which checkout it serves.
- Dev-only pages (not in the production build): `/avatars.html`, the art picker. See `docs/agents/art-prototypes.md`.

## Checks

`npm run check` runs what CI runs before deploy: types, all tests, production build. `npm run typecheck` and `npm test` are the fast parts. `npm run test:soak` prints frame and load numbers for a full board.

## Screenshots (Playwright MCP)

Call `browser_take_screenshot` **without `filename`**: the image comes back in the tool result, so there is nothing to Read. With a `filename` the result is text only, and the file is written to the main checkout, not your worktree.

When you need the file (to crop a tall `fullPage` shot with `sips`, for example), the auto-named file is in `/tmp/playwright-mcp/`. Read it in a later message, after the screenshot result has arrived.
