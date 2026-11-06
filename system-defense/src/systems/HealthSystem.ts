import type { System } from '../ecs/System';
import { spawnEffect, spawnSparks, spawnText } from '../game/factories';

/** Removes entities whose HP reached zero and plays their death effects. */
export const HealthSystem: System = {
  name: 'health',
  update(world, ctx) {
    for (const e of world.query('health', 'transform')) {
      const h = world.req(e, 'health');
      if (h.hp > 0) continue;
      const t = world.req(e, 'transform');

      const enemy = world.get(e, 'enemy');
      if (enemy) {
        ctx.kills++;
        const boss = enemy.type === 'blackFriday';
        spawnSparks(world, t.x, t.y, boss ? '#facc15' : '#f87171', boss ? 40 : 10, boss ? 300 : 150);
        if (boss) {
          spawnEffect(world, 'explosion', t.x, t.y, '#facc15', { size: 180, duration: 0.8 });
          spawnText(world, t.x, t.y - 60, 'BLACK FRIDAY MITIGADO', '#facc15', 18);
          ctx.shake = Math.max(ctx.shake, 16);
        }
      }

      const cell = world.get(e, 'gridCell');
      if (cell) {
        ctx.grid[cell.lane][cell.col] = null;
        spawnSparks(world, t.x, t.y, '#94a3b8', 12, 160);
        spawnText(world, t.x, t.y - 20, 'caído', '#f87171', 13);
      }
      world.destroy(e);
    }
  },
};
