import { BASE_W, BREACH_X, CANVAS_H, ENEMIES, laneY, POD_RESTART_TIME, SERVICE_NAMES } from '../config';
import type { World } from '../ecs/World';
import type { System } from '../ecs/System';
import { spawnEffect, spawnSparks } from '../game/factories';
import { pushBanner, sound, type GameContext } from '../game/GameContext';
import { diagnose } from '../learn/postmortem';

/** A fallen service loses every entity in its lane. */
function takeLaneDown(world: World, ctx: GameContext, lane: number): void {
  ctx.lanesAlive[lane] = false;
  for (const e of world.query('gridCell')) {
    if (world.req(e, 'gridCell').lane === lane) world.destroy(e);
  }
  for (const e of world.query('lane')) {
    if (world.req(e, 'lane').lane === lane) world.destroy(e);
  }
  for (const e of world.query('projectile')) {
    if (world.req(e, 'projectile').lane === lane) world.destroy(e);
  }
  for (const e of world.query('rollback')) {
    if (world.req(e, 'rollback').lane === lane) world.destroy(e);
  }
  ctx.grid[lane].fill(null);
  ctx.laneLosses[lane] = 0;
  if (ctx.inspect?.lane === lane) ctx.inspect = null;
}

/**
 * The architecture rule lives here.
 * - Monolith: any breach in any lane = the whole system goes down.
 * - Microservices: a breach only kills that lane's service; game over when all 5 are down.
 * - Kubernetes: like microservices, but fallen lanes restart (LaneRecoverySystem);
 *   game over only if all 5 are down at the same time.
 */
export const BreachSystem: System = {
  name: 'breach',
  update(world, ctx) {
    for (const e of world.query('enemy', 'transform', 'lane')) {
      const t = world.req(e, 'transform');
      if (t.x >= BREACH_X) continue;
      const lane = world.req(e, 'lane').lane;
      const type = world.req(e, 'enemy').type;
      const name = ENEMIES[type].name;
      if (ctx.lanesAlive[lane]) {
        ctx.incidents.push({ wave: ctx.wave.number, lane, enemy: type, cause: diagnose(world, ctx, lane, e), time: ctx.time });
      }

      if (ctx.mode === 'monolith') {
        ctx.status = 'gameover';
        ctx.endReason = `"${name}" cruzó el carril ${lane + 1}. El monolito es un único punto de fallo: todo el sistema cayó.`;
        spawnEffect(world, 'explosion', BASE_W / 2, CANVAS_H / 2, '#ef4444', { size: 260, duration: 1.2 });
        spawnSparks(world, BASE_W / 2, laneY(lane), '#ef4444', 40, 320);
        ctx.shake = 22;
        sound(ctx, 'gameOver');
        world.destroy(e);
        return;
      }

      if (!ctx.lanesAlive[lane]) {
        world.destroy(e);
        continue;
      }
      takeLaneDown(world, ctx, lane);
      spawnEffect(world, 'explosion', BASE_W / 2, laneY(lane), '#ef4444', { size: 120, duration: 0.9 });
      spawnSparks(world, BASE_W / 2, laneY(lane), '#ef4444', 24, 260);
      ctx.shake = Math.max(ctx.shake, 14);

      const k8s = ctx.mode === 'kubernetes';
      if (k8s) ctx.laneRestart[lane] = POD_RESTART_TIME;
      const alive = ctx.lanesAlive.filter(Boolean).length;
      if (alive === 0) {
        ctx.status = 'gameover';
        ctx.endReason = k8s
          ? 'Los 5 pods cayeron a la vez. El clúster no pudo recuperarse a tiempo.'
          : 'Los 5 microservicios cayeron. No queda ningún servicio en pie.';
        sound(ctx, 'gameOver');
        return;
      }
      sound(ctx, 'laneDown');
      pushBanner(
        ctx,
        `${SERVICE_NAMES[lane]} CAÍDO`,
        '#f87171',
        k8s
          ? `"${name}" rompió el carril ${lane + 1}. Reinicio automático en ${POD_RESTART_TIME} s.`
          : `"${name}" rompió el carril ${lane + 1}. Quedan ${alive}/5 servicios.`,
        2.8,
      );
    }
  },
};
