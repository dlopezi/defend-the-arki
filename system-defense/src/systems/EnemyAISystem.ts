import { CELL_W, COLS, colX, GRID_X } from '../config';
import type { Entity } from '../ecs/World';
import type { System } from '../ecs/System';
import type { GameContext } from '../game/GameContext';

/** Half width of a defense body. An enemy front inside it is blocked. */
const BODY = 35;

/** Defense that blocks an enemy whose left edge is at `front`, if any. */
export function findBlocker(ctx: GameContext, lane: number, front: number): { e: Entity; col: number } | null {
  const col = Math.floor((front - GRID_X) / CELL_W);
  if (col < 0 || col >= COLS) return null;
  const occupant = ctx.grid[lane][col];
  if (occupant === null) return null;
  const cx = colX(col);
  if (front <= cx + BODY && front >= cx - BODY - 10) return { e: occupant, col };
  return null;
}

/** Decides each enemy's state: walk, attack the defense in front, or jump over it. */
export const EnemyAISystem: System = {
  name: 'enemyAI',
  update(world, ctx) {
    for (const e of world.query('enemy', 'transform', 'lane', 'attacker')) {
      const enemy = world.req(e, 'enemy');
      if (enemy.state === 'jump') continue;
      const t = world.req(e, 'transform');
      const lane = world.req(e, 'lane').lane;
      const attacker = world.req(e, 'attacker');
      const blocker = findBlocker(ctx, lane, t.x - enemy.width / 2);

      if (!blocker) {
        if (enemy.state === 'attack') attacker.timer = attacker.interval * 0.6;
        enemy.state = 'walk';
        attacker.target = null;
        continue;
      }

      const jumper = world.get(e, 'jumper');
      if (jumper && !jumper.jumped) {
        // Zero-Day: leap over the first defense, landing just left of its cell.
        enemy.state = 'jump';
        jumper.t = 0;
        jumper.fromX = t.x;
        jumper.toX = GRID_X + blocker.col * CELL_W - enemy.width / 2 - 4;
        attacker.target = null;
        continue;
      }

      enemy.state = 'attack';
      attacker.target = blocker.e;
    }
  },
};
