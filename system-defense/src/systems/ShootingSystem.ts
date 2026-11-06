import { GRID_RIGHT, LANES } from '../config';
import type { System } from '../ecs/System';
import { createProjectile } from '../game/factories';

/** Load Balancers and Rate Limiters fire when a threat is ahead in their lane. */
export const ShootingSystem: System = {
  name: 'shooting',
  update(world, ctx, dt) {
    // Rightmost visible threat per lane (cheap "is anything ahead?" test).
    const maxX: number[] = Array.from({ length: LANES }, () => -Infinity);
    for (const e of world.query('enemy', 'transform', 'lane')) {
      const x = world.req(e, 'transform').x;
      if (x > GRID_RIGHT + 50) continue; // not on screen yet
      const lane = world.req(e, 'lane').lane;
      if (x > maxX[lane]) maxX[lane] = x;
    }

    for (const e of world.query('shooter', 'transform', 'gridCell')) {
      const lane = world.req(e, 'gridCell').lane;
      if (!ctx.lanesAlive[lane]) continue;
      const s = world.req(e, 'shooter');
      const t = world.req(e, 'transform');
      s.timer = Math.max(0, s.timer - dt);
      if (maxX[lane] < t.x - 10 || s.timer > 0) continue;
      createProjectile(world, t.x + 34, lane, s.damage, s.slow);
      s.timer = s.interval;
    }
  },
};
