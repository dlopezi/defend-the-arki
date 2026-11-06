import { GRID_RIGHT, LANES, laneY, SLOWLORIS_FACTOR } from '../config';
import type { System } from '../ecs/System';
import { createProjectile } from '../game/factories';
import { sound } from '../game/GameContext';

/** Shooters fire when a threat is ahead in a lane they cover. */
export const ShootingSystem: System = {
  name: 'shooting',
  update(world, ctx, dt) {
    // Rightmost visible threat per lane (cheap "is anything ahead?" test) and Slowloris lanes.
    const maxX: number[] = Array.from({ length: LANES }, () => -Infinity);
    ctx.laneThrottled.fill(false);
    for (const e of world.query('enemy', 'transform', 'lane')) {
      const x = world.req(e, 'transform').x;
      if (x > GRID_RIGHT + 50) continue; // not on screen yet
      const lane = world.req(e, 'lane').lane;
      if (x > maxX[lane]) maxX[lane] = x;
      if (world.req(e, 'enemy').type === 'slowloris' && x < GRID_RIGHT) ctx.laneThrottled[lane] = true;
    }

    let fired = false;
    for (const e of world.query('shooter', 'transform', 'gridCell')) {
      const lane = world.req(e, 'gridCell').lane;
      if (!ctx.lanesAlive[lane] || world.has(e, 'encrypted')) continue;
      const s = world.req(e, 'shooter');
      const t = world.req(e, 'transform');
      const rate = ctx.laneThrottled[lane] ? SLOWLORIS_FACTOR : 1;
      s.timer = Math.max(0, s.timer - dt * rate);
      if (s.timer > 0) continue;

      const lanes = s.spread ? [lane - 1, lane, lane + 1] : [lane];
      const covered = lanes.filter((l) => l >= 0 && l < LANES && ctx.lanesAlive[l]);
      if (!covered.some((l) => maxX[l] >= t.x - 10)) continue;

      for (const l of covered) {
        for (let i = 0; i < s.shots; i++) {
          createProjectile(world, t.x + 34 - i * 26, laneY(lane) - 6, l, s.damage, s.slow);
        }
      }
      s.timer = s.interval;
      fired = true;
    }
    if (fired) sound(ctx, 'shoot');
  },
};
