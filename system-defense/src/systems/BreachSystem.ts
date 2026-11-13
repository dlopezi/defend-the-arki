import { t as tr } from '../i18n';
import { BASE_W, BREACH_X, CANVAS_H, ENEMIES, laneY, POD_RESTART_TIME, REGION_RECOVERY_TIME, REGIONS, regionOf, SERVICE_NAMES } from '../config';
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
 * Takes `lanes` down with their defenses, and starts their comeback in the levels that
 * self-heal. Used by breaches and by the Provider failure.
 */
export function bringDown(world: World, ctx: GameContext, lanes: number[]): void {
  for (const l of lanes) {
    takeLaneDown(world, ctx, l);
    spawnEffect(world, 'explosion', BASE_W / 2, laneY(l), '#ef4444', { size: 120, duration: 0.9 });
    spawnSparks(world, BASE_W / 2, laneY(l), '#ef4444', 24, 260);
    if (ctx.mode === 'kubernetes') ctx.laneRestart[l] = POD_RESTART_TIME;
    if (ctx.mode === 'multiRegion') ctx.laneRestart[l] = REGION_RECOVERY_TIME;
  }
  ctx.shake = Math.max(ctx.shake, lanes.length > 1 ? 18 : 14);
}

/**
 * The architecture rule lives here.
 * - Monolith: any breach in any lane = the whole system goes down.
 * - Microservices: a breach only kills that lane's service; game over when all 5 are down.
 * - Kubernetes: like microservices, but fallen lanes restart (LaneRecoverySystem);
 *   game over only if all 5 are down at the same time.
 * - Multi-region: a breach takes down the lane's whole region; the region comes back
 *   (LaneRecoverySystem); game over only if both regions are down at the same time.
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
        ctx.incidents.push({ kind: 'breach', wave: ctx.wave.number, lane, enemy: type, cause: diagnose(world, ctx, lane, e), time: ctx.time });
      }

      if (ctx.mode === 'monolith') {
        ctx.status = 'gameover';
        ctx.endReason = tr(
          `"${name}" crossed lane ${lane + 1}. The monolith is a single point of failure: the whole system went down.`,
          `"${name}" cruzó el carril ${lane + 1}. El monolito es un único punto de fallo: todo el sistema cayó.`,
        );
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
      // Multi-region: the whole region of the lane falls, not only the lane.
      const region = ctx.mode === 'multiRegion' ? regionOf(lane) : null;
      bringDown(world, ctx, region ? region.lanes : [lane]);

      const k8s = ctx.mode === 'kubernetes';
      const alive = ctx.lanesAlive.filter(Boolean).length;
      if (alive === 0) {
        ctx.status = 'gameover';
        ctx.endReason = region
          ? tr('Both regions fell at the same time. No region was left to take the traffic.', 'Las 2 regiones cayeron a la vez. No quedó ninguna región para recibir el tráfico.')
          : k8s
            ? tr('All 5 pods fell at the same time. The cluster could not recover in time.', 'Los 5 pods cayeron a la vez. El clúster no pudo recuperarse a tiempo.')
            : tr('All 5 microservices fell. No service is left standing.', 'Los 5 microservicios cayeron. No queda ningún servicio en pie.');
        sound(ctx, 'gameOver');
        return;
      }
      sound(ctx, 'laneDown');
      if (region) {
        const other = REGIONS.find((r) => r !== region) ?? region;
        pushBanner(
          ctx,
          `${region.name} ${tr('DOWN', 'CAÍDA')}`,
          '#f87171',
          tr(
            `"${name}" broke lane ${lane + 1}. Failover to ${other.name}. Back in ${REGION_RECOVERY_TIME} s.`,
            `"${name}" rompió el carril ${lane + 1}. Failover a ${other.name}. Vuelve en ${REGION_RECOVERY_TIME} s.`,
          ),
          2.8,
        );
        continue;
      }
      pushBanner(
        ctx,
        `${SERVICE_NAMES[lane]} ${tr('DOWN', 'CAÍDO')}`,
        '#f87171',
        k8s
          ? tr(
              `"${name}" broke lane ${lane + 1}. Automatic restart in ${POD_RESTART_TIME} s.`,
              `"${name}" rompió el carril ${lane + 1}. Reinicio automático en ${POD_RESTART_TIME} s.`,
            )
          : tr(`"${name}" broke lane ${lane + 1}. ${alive}/5 services left.`, `"${name}" rompió el carril ${lane + 1}. Quedan ${alive}/5 servicios.`),
        2.8,
      );
    }
  },
};
