import type { System } from '../ecs/System';
import { spawnSparks, spawnText } from '../game/factories';
import { sound } from '../game/GameContext';

/** Kafka: captures the first threat that walks over it, then recharges. */
export const TrapSystem: System = {
  name: 'trap',
  update(world, ctx, dt) {
    const enemies = world.query('enemy', 'transform', 'lane');
    for (const e of world.query('trap', 'transform', 'gridCell', 'health')) {
      const trap = world.req(e, 'trap');
      if (world.has(e, 'encrypted')) continue;

      if (trap.captured !== null) {
        if (!world.isAlive(trap.captured) || !world.has(trap.captured, 'held')) {
          trap.captured = null;
          trap.timer = trap.recharge;
        }
        continue;
      }
      if (trap.timer > 0) {
        trap.timer = Math.max(0, trap.timer - dt);
        continue;
      }

      const t = world.req(e, 'transform');
      const lane = world.req(e, 'gridCell').lane;
      for (const en of enemies) {
        if (world.req(en, 'lane').lane !== lane || world.has(en, 'held')) continue;
        const enemy = world.req(en, 'enemy');
        if (enemy.state === 'jump') continue;
        const et = world.req(en, 'transform');
        const front = et.x - enemy.width / 2;
        if (front > t.x + 30 || et.x < t.x - 40) continue;

        if (enemy.type === 'blackFriday') {
          // Too big for the queue: the boss crushes it.
          world.req(e, 'health').hp = 0;
          spawnText(world, t.x, t.y - 40, 'cola desbordada', '#fb923c', 13);
          break;
        }
        world.add(en, 'held', { timer: trap.hold, total: trap.hold });
        enemy.state = 'held';
        world.req(en, 'attacker').target = null;
        trap.captured = en;
        spawnText(world, et.x, et.y - 44, 'ENCOLADO', '#fb923c', 13);
        spawnSparks(world, et.x, et.y, '#fb923c', 8, 90);
        sound(ctx, 'capture');
        break;
      }
    }
  },
};
