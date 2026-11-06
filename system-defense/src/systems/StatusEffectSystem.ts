import type { System } from '../ecs/System';

/** Ticks temporary statuses: slow, Kafka hold, Ransomware lock, and hit flashes. */
export const StatusEffectSystem: System = {
  name: 'status',
  update(world, _ctx, dt) {
    for (const e of world.query('slowed')) {
      const s = world.req(e, 'slowed');
      s.timer -= dt;
      if (s.timer <= 0) world.remove(e, 'slowed');
    }
    for (const e of world.query('held', 'enemy')) {
      const h = world.req(e, 'held');
      h.timer -= dt;
      if (h.timer <= 0) {
        world.remove(e, 'held');
        world.req(e, 'enemy').state = 'walk';
      }
    }
    for (const e of world.query('encrypted')) {
      const lock = world.req(e, 'encrypted');
      lock.timer -= dt;
      if (lock.timer <= 0) world.remove(e, 'encrypted');
    }
    for (const e of world.query('health')) {
      const h = world.req(e, 'health');
      if (h.flash > 0) h.flash = Math.max(0, h.flash - dt);
    }
  },
};
