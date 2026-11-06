import { CANVAS_W, laneY, ZERO_DAY_SPEED_AFTER_JUMP } from '../config';
import type { System } from '../ecs/System';
import { spawnSparks } from '../game/factories';

const LANE_SHIFT_SPEED = 420;

/** Moves enemies (walk / jump) and projectiles. Held enemies do not move. */
export const MovementSystem: System = {
  name: 'movement',
  update(world, _ctx, dt) {
    for (const e of world.query('enemy', 'transform')) {
      const enemy = world.req(e, 'enemy');
      const t = world.req(e, 'transform');
      if (enemy.state === 'walk') {
        const slow = world.get(e, 'slowed');
        t.x -= enemy.speed * (slow ? slow.factor : 1) * dt;
      } else if (enemy.state === 'jump') {
        const j = world.req(e, 'jumper');
        j.t += dt;
        const p = Math.min(1, j.t / j.duration);
        t.x = j.fromX + (j.toX - j.fromX) * p;
        if (p >= 1) {
          j.jumped = true;
          enemy.state = 'walk';
          enemy.speed = ZERO_DAY_SPEED_AFTER_JUMP;
          spawnSparks(world, t.x, t.y + enemy.height / 2, '#f0abfc', 6, 70);
        }
      }
    }

    for (const e of world.query('projectile', 'transform')) {
      const p = world.req(e, 'projectile');
      const t = world.req(e, 'transform');
      t.x += p.speed * dt;
      // CDN packets drift into their target lane.
      const ty = laneY(p.lane) - 6;
      if (t.y !== ty) {
        const step = LANE_SHIFT_SPEED * dt;
        t.y = Math.abs(ty - t.y) <= step ? ty : t.y + Math.sign(ty - t.y) * step;
      }
      if (t.x > CANVAS_W + 30) world.destroy(e);
    }
  },
};
