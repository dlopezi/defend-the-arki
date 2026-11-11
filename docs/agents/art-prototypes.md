# Art prototypes (the avatar picker)

Defense and threat art is chosen by the user in **rounds** on a dev-only page, then moved into the game.

## Style reference

The look follows our other game, Design the Arki, in the sibling repo `../archi-game-rts`. Its buildings are in `src/ui/componentArt.tsx`: isometric boxes and cylinders, one colour per building, dark diamond pad, flat faces. Our port of that kit is `system-defense/src/render/isoKit.ts` (same 64 × 64 box, same `shade` rule). Build new art from `isoKit`, not from scratch.

## The picker page

All paths under `system-defense/`.

- `avatars.html` → `src/dev/avatars.ts` mounts every round, newest at the top. Open `/avatars.html` on the dev server (`docs/agents/running-the-game.md`).
- A round is `src/dev/roundNSection.ts` (a `RoundConfig` for `mountRoundSection` in `src/dev/roundSection.ts`) plus its options file. Defense rounds live in `src/dev/defenseSection.ts`.
- Each row shows the current art ("Mantener actual") next to 2–3 options, animated at game scale (walk, attack, hit). Make every animation big enough to see at game scale.
- The user's picks and comments are saved in `localStorage` under the round's `key` (`system-defense:avatar-picks-rN`). If the user picked in the Playwright browser, read them with `browser_evaluate` instead of asking them to copy.

## Adding a round

1. Copy the last `roundNSection.ts`, give it a new `key`, mount it first in `avatars.ts`.
2. Put the round's options left to right: current, then A, B.
3. Add a test in `tests/isoAvatars.test.ts` that every option draws without throwing.

## Moving the chosen art into the game

The chosen look goes to `src/render/defenseArt.ts` (defenses) or `src/render/enemyArt.ts` (threats), drawn through `src/render/sprites.ts`. The picker keeps drawing the same functions, so the page and the game never drift. Keep sprites inside the board: `BOARD_MARGIN` in `src/config.ts` (24 px above and below the lanes) exists for the big Black Friday cart.
