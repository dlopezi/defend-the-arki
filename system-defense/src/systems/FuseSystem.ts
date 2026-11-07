import { t as tr } from '../i18n';
import { BOSS_BLAST_DAMAGE, CELL_W, GRID_X } from '../config';
import type { System } from '../ecs/System';
import { spawnEffect, spawnSparks, spawnText } from '../game/factories';
import { sound } from '../game/GameContext';

/** Circuit Breaker: after the fuse ends, wipes every threat in the 3x3 area around it. */
export const FuseSystem: System = {
  name: 'fuse',
  update(world, ctx, dt) {
    for (const e of world.query('fuse', 'gridCell', 'transform')) {
      const f = world.req(e, 'fuse');
      f.timer -= dt;
      if (f.timer > 0) continue;

      const { lane, col } = world.req(e, 'gridCell');
      const t = world.req(e, 'transform');
      const left = GRID_X + (col - 1) * CELL_W;
      const right = GRID_X + (col + 2) * CELL_W;
      let hits = 0;
      for (const en of world.query('enemy', 'transform', 'lane', 'health')) {
        const l = world.req(en, 'lane').lane;
        if (Math.abs(l - lane) > 1) continue;
        const et = world.req(en, 'transform');
        const half = world.req(en, 'enemy').width / 2;
        if (et.x + half < left || et.x - half > right) continue;
        const h = world.req(en, 'health');
        if (world.req(en, 'enemy').type === 'blackFriday') h.hp -= BOSS_BLAST_DAMAGE;
        else h.hp = 0;
        h.flash = 0.2;
        hits++;
      }

      spawnEffect(world, 'explosion', t.x, t.y, '#facc15', { size: 160, duration: 0.6 });
      spawnEffect(world, 'ring', t.x, t.y, '#fde68a', { size: 170, duration: 0.5 });
      spawnSparks(world, t.x, t.y, '#fb923c', 26, 320);
      spawnText(world, t.x, t.y - 50, hits > 0 ? `${tr('CIRCUIT OPEN', 'CIRCUITO ABIERTO')} ×${hits}` : tr('CIRCUIT OPEN', 'CIRCUITO ABIERTO'), '#fde047', 16);
      ctx.shake = Math.max(ctx.shake, 14);
      sound(ctx, 'explode');
      world.destroy(e);
    }
  },
};
