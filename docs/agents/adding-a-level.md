# Adding or changing a level

A **level** is a `Mode` in `system-defense/src/config.ts`. Levels share the waves, defenses and threats; a level changes only its architecture rule: what a **breach** takes down and whether it comes back. Terms are in `GLOSSARY.md`.

## Touch points

All paths are under `system-defense/`.

| Where | What the level needs there |
|---|---|
| `src/config.ts` | `Mode` union, `MODE_ORDER`, `MODES` entry (`name` and `rule` are getters with `t()`) |
| `src/systems/BreachSystem.ts` | what a breach takes down, banners, Game Over text |
| `src/systems/LaneRecoverySystem.ts` | whether fallen lanes come back, and after how long |
| `src/systems/WaveSystem.ts` | nothing usually: threats only spawn in live lanes, so failover is free |
| `src/render/RenderSystem.ts` | base column (labels, colors, status), fallen-lane overlay |
| `src/ui/Hud.ts` | lane dots in the top bar |
| `src/ui/Overlays.ts` | end screen stats ("Services up"), incident timeline |
| `src/ui/HomeMenu.ts` + `src/style.css` | level cards (`.levels` grid columns), Rollback note in the Guide, "Clear records" text |
| `src/ui/howtoScenes.ts` | step "Each level changes the Game Over" |
| `src/learn/postmortem.ts` | `levelLessonLoss` / `levelLessonWin` |
| `src/game/Game.ts` | start banner subtitle |
| `tests/rules.test.ts` | one test per new rule, on the headless `Sim` |
| `tests/core.test.ts` | `MODE_ORDER` list |

`tests/soak.test.ts` plays every level automatically; `npm run test:soak` shows the results per level.

## Finding them

- `npx tsc` flags the `Record<Mode, …>` maps and exhaustive `switch`es that miss the new level.
- `grep -rn "ctx.mode ===" src` finds the per-level branches tsc cannot see.
- Every new player-facing text goes in `t('English', 'Español')`; `tests/i18n.test.ts` fails otherwise.
