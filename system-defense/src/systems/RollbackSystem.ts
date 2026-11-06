import { CANVAS_W, GRID_X, ROLLBACK_SPEED } from '../config';
import type { System } from '../ecs/System';
import { spawnSparks, spawnText } from '../game/factories';
import { sound } from '../game/GameContext';

/**
 * Rollback: waits next to the base. When a threat reaches it, it sweeps the lane
 * once and removes every threat it touches. Removed threats do not split (no botlets).
 */
export const RollbackSystem: System = {
  name: 'rollback',
  update(world, ctx, dt) {
    const enemies = world.query('enemy', 'transform', 'lane');
    for (const e of world.query('rollback', 'transform')) {
      const rb = world.req(e, 'rollback');
      const t = world.req(e, 'transform');
      if (!ctx.lanesAlive[rb.lane]) {
        world.destroy(e);
        continue;
      }

      if (!rb.running) {
        const triggered = enemies.some((en) => {
          if (world.req(en, 'lane').lane !== rb.lane) return false;
          return world.req(en, 'transform').x - world.req(en, 'enemy').width / 2 <= GRID_X + 4;
        });
        if (triggered) {
          rb.running = true;
          spawnText(world, t.x + 60, t.y - 40, 'ROLLBACK', '#22d3ee', 18);
          sound(ctx, 'rollback');
          ctx.shake = Math.max(ctx.shake, 6);
        }
        continue;
      }

      t.x += ROLLBACK_SPEED * dt;
      for (const en of enemies) {
        if (!world.isAlive(en) || world.req(en, 'lane').lane !== rb.lane) continue;
        const et = world.req(en, 'transform');
        if (Math.abs(et.x - t.x) > world.req(en, 'enemy').width / 2 + 24) continue;
        spawnSparks(world, et.x, et.y, '#22d3ee', 10, 160);
        world.destroy(en);
        ctx.kills++;
      }
      if (t.x > CANVAS_W + 40) world.destroy(e);
    }
  },
};
