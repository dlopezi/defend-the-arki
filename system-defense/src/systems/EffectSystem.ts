import type { System } from '../ecs/System';

/** Ages visual effects, banners and screen shake. Also runs after game over. */
export const EffectSystem: System = {
  name: 'effects',
  update(world, ctx, dt) {
    for (const e of world.query('effect', 'transform')) {
      const fx = world.req(e, 'effect');
      const t = world.req(e, 'transform');
      fx.t += dt;
      t.x += fx.vx * dt;
      t.y += fx.vy * dt;
      if (fx.kind === 'spark') {
        fx.vx *= 0.92;
        fx.vy = fx.vy * 0.92 + 300 * dt;
      }
      if (fx.t >= fx.duration) world.destroy(e);
    }
    for (const b of ctx.banners) b.t += dt;
    ctx.banners = ctx.banners.filter((b) => b.t < b.duration);
    ctx.shake = Math.max(0, ctx.shake - dt * 40);
  },
};
