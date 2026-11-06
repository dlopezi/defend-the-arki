import type { System } from '../ecs/System';

/** Memory Leak: max HP, HP and size grow every second until the cap. */
export const GrowthSystem: System = {
  name: 'growth',
  update(world, _ctx, dt) {
    for (const e of world.query('grows', 'health', 'enemy')) {
      const g = world.req(e, 'grows');
      const h = world.req(e, 'health');
      if (h.max >= g.cap) continue;
      const add = Math.min(g.rate * dt, g.cap - h.max);
      h.max += add;
      h.hp += add;
      const k = (h.max - g.startMax) / (g.cap - g.startMax);
      const scale = 1 + 0.9 * k;
      const enemy = world.req(e, 'enemy');
      enemy.width = g.baseW * scale;
      enemy.height = g.baseH * scale;
    }
  },
};
