import type { System } from '../ecs/System';
import { spawnSparks, spawnText } from '../game/factories';

/** Enemies in "attack" state damage the defense in front of them. */
export const MeleeSystem: System = {
  name: 'melee',
  update(world, ctx, dt) {
    for (const e of world.query('enemy', 'attacker')) {
      const enemy = world.req(e, 'enemy');
      const a = world.req(e, 'attacker');
      if (enemy.state !== 'attack' || a.target === null) continue;
      if (!world.isAlive(a.target)) {
        a.target = null;
        continue;
      }
      const h = world.get(a.target, 'health');
      if (!h) continue;
      const slow = world.get(e, 'slowed');
      const rate = slow ? slow.factor : 1;

      if (a.oneShot) {
        a.timer -= dt * rate;
        if (a.timer <= 0) {
          a.timer = a.interval;
          h.hp = 0;
          h.flash = 0.2;
          ctx.shake = Math.max(ctx.shake, 10);
          const t = world.get(a.target, 'transform');
          if (t) {
            spawnText(world, t.x, t.y - 40, 'SMASH!', '#facc15', 20);
            spawnSparks(world, t.x, t.y, '#facc15', 16, 220);
          }
        }
      } else {
        h.hp -= a.dps * dt * rate;
        h.flash = Math.max(h.flash, 0.05);
      }
    }
  },
};
