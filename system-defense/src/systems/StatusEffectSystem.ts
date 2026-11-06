import type { System } from '../ecs/System';

/** Ticks temporary status effects (slow from Rate Limiter) and hit flashes. */
export const StatusEffectSystem: System = {
  name: 'status',
  update(world, _ctx, dt) {
    for (const e of world.query('slowed')) {
      const s = world.req(e, 'slowed');
      s.timer -= dt;
      if (s.timer <= 0) world.remove(e, 'slowed');
    }
    for (const e of world.query('health')) {
      const h = world.req(e, 'health');
      if (h.flash > 0) h.flash = Math.max(0, h.flash - dt);
    }
  },
};
