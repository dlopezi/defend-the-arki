import { CELL_W, COLS, colX, GRID_X, ZERO_DAY_SPEED_AFTER_JUMP, type EnemyType } from '../config';
import type { Entity, World } from '../ecs/World';
import type { System } from '../ecs/System';
import { spawnText } from '../game/factories';
import type { GameContext } from '../game/GameContext';

/** Half width of a defense body. An enemy front inside it is blocked. */
const BODY = 35;

/** Defense that blocks an enemy whose left edge is at `front`, if any. */
export function findBlocker(
  world: World,
  ctx: GameContext,
  lane: number,
  front: number,
  enemyType: EnemyType,
): { e: Entity; col: number } | null {
  const col = Math.floor((front - GRID_X) / CELL_W);
  if (col < 0 || col >= COLS) return null;
  const occupant = ctx.grid[lane][col];
  if (occupant === null) return null;
  const cx = colX(col);
  if (front > cx + BODY || front < cx - BODY - 10) return null;
  const type = world.get(occupant, 'defense')?.type;
  // Kafka is a ground queue: threats walk over it.
  if (type === 'kafka') return null;
  // SQL Injection goes straight through the cache.
  if (type === 'redis' && enemyType === 'sqli') return null;
  return { e: occupant, col };
}

/** Decides each enemy's state: walk, attack the defense in front, or jump over it. */
export const EnemyAISystem: System = {
  name: 'enemyAI',
  update(world, ctx) {
    for (const e of world.query('enemy', 'transform', 'lane', 'attacker')) {
      const enemy = world.req(e, 'enemy');
      if (enemy.state === 'jump' || enemy.state === 'held') continue;
      const t = world.req(e, 'transform');
      const lane = world.req(e, 'lane').lane;
      const attacker = world.req(e, 'attacker');
      const blocker = findBlocker(world, ctx, lane, t.x - enemy.width / 2, enemy.type);

      if (!blocker) {
        if (enemy.state === 'attack') attacker.timer = attacker.interval * 0.6;
        enemy.state = 'walk';
        attacker.target = null;
        continue;
      }

      const jumper = world.get(e, 'jumper');
      if (jumper && !jumper.jumped) {
        if (world.get(blocker.e, 'defense')?.type === 'waf') {
          // The WAF is too tall: the exploit loses its jump.
          jumper.jumped = true;
          enemy.speed = ZERO_DAY_SPEED_AFTER_JUMP;
          spawnText(world, t.x, t.y - 40, 'bloqueado', '#2dd4bf', 13);
        } else {
          // Zero-Day: leap over the first defense, landing just left of its cell.
          enemy.state = 'jump';
          jumper.t = 0;
          jumper.fromX = t.x;
          jumper.toX = GRID_X + blocker.col * CELL_W - enemy.width / 2 - 4;
          attacker.target = null;
          continue;
        }
      }

      enemy.state = 'attack';
      attacker.target = blocker.e;
    }
  },
};
