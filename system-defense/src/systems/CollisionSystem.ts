import { SLOW_DURATION, SLOW_FACTOR } from '../config';
import type { Entity } from '../ecs/World';
import type { System } from '../ecs/System';
import { spawnSparks } from '../game/factories';

/** Projectile vs. enemy hits in the same lane. The closest enemy takes the hit. */
export const CollisionSystem: System = {
  name: 'collision',
  update(world) {
    const enemies = world.query('enemy', 'transform', 'lane', 'health');
    for (const p of world.query('projectile', 'transform')) {
      const proj = world.req(p, 'projectile');
      const pt = world.req(p, 'transform');
      let best: Entity | null = null;
      let bestX = Infinity;
      for (const e of enemies) {
        if (world.req(e, 'lane').lane !== proj.lane) continue;
        const et = world.req(e, 'transform');
        const enemy = world.req(e, 'enemy');
        if (Math.abs(et.x - pt.x) <= enemy.width / 2 + proj.radius && et.x < bestX) {
          best = e;
          bestX = et.x;
        }
      }
      if (best === null) continue;

      const h = world.req(best, 'health');
      h.hp -= proj.damage;
      h.flash = 0.12;
      if (proj.slow) {
        const s = world.get(best, 'slowed');
        if (s) s.timer = SLOW_DURATION;
        else world.add(best, 'slowed', { timer: SLOW_DURATION, factor: SLOW_FACTOR });
      }
      spawnSparks(world, pt.x, pt.y, proj.slow ? '#c084fc' : '#4ade80', 5, 90);
      world.destroy(p);
    }
  },
};
