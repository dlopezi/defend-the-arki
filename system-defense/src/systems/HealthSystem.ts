import type { System } from '../ecs/System';
import { createEnemy, spawnEffect, spawnSparks, spawnText } from '../game/factories';
import { sound } from '../game/GameContext';

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
          sound(ctx, 'explode');
        }
        if (enemy.type === 'botnet') {
          // A botnet splits into 3 small, fast bots.
          const lane = world.req(e, 'lane').lane;
          for (const dx of [-28, 0, 28]) createEnemy(world, 'botlet', lane, ctx.wave.hpScale, t.x + dx);
          spawnText(world, t.x, t.y - 40, '×3', '#fbbf24', 16);
          sound(ctx, 'split');
        }
      }

      const cell = world.get(e, 'gridCell');
      if (cell) {
        ctx.grid[cell.lane][cell.col] = null;
        if (ctx.inspect && ctx.inspect.lane === cell.lane && ctx.inspect.col === cell.col) ctx.inspect = null;
        spawnSparks(world, t.x, t.y, '#94a3b8', 12, 160);
        spawnText(world, t.x, t.y - 20, 'caído', '#f87171', 13);
      }
      world.destroy(e);
    }
  },
};
