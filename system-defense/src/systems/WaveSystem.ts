import { ENEMIES, LANES, TOTAL_WAVES } from '../config';
import type { System } from '../ecs/System';
import { createEnemy } from '../game/factories';
import { pushBanner, sound, type GameContext } from '../game/GameContext';
import { buildWave } from '../game/waves';

const BREAK_TIME = 7;
/** If a wave is not cleared after this time, the next one starts anyway (constant flow). */
const CLEAR_TIMEOUT = 30;

function startWave(ctx: GameContext): void {
  const w = ctx.wave;
  w.number += 1;
  const plan = w.next;
  w.queue = plan.queue;
  w.total = plan.queue.length;
  w.spawned = 0;
  w.interval = plan.interval;
  w.hpScale = plan.hpScale;
  w.surgeAt = plan.surgeAt;
  w.spawnTimer = 1;
  w.phase = 'spawning';
  if (w.number < TOTAL_WAVES) w.next = buildWave(w.number + 1);
  const last = w.number === TOTAL_WAVES;
  pushBanner(ctx, last ? `OLA FINAL ${w.number}` : `OLA ${w.number}`, last ? '#f87171' : '#38bdf8', `${w.total} amenazas entrantes`);
  sound(ctx, 'wave');
}

function randomAliveLane(ctx: GameContext): number {
  const alive: number[] = [];
  for (let i = 0; i < LANES; i++) if (ctx.lanesAlive[i]) alive.push(i);
  if (alive.length === 0) return Math.floor(Math.random() * LANES);
  return alive[Math.floor(Math.random() * alive.length)];
}

/** Drives the stream of threats: prep -> spawning -> clearing -> break -> next wave. */
export const WaveSystem: System = {
  name: 'waves',
  update(world, ctx, dt) {
    const w = ctx.wave;
    switch (w.phase) {
      case 'prep':
      case 'break':
        w.timer -= dt;
        if (w.timer <= 0) startWave(ctx);
        return;

      case 'spawning': {
        w.spawnTimer -= dt;
        if (w.spawnTimer > 0) return;
        // Kubernetes: wait while every pod is restarting.
        if (!ctx.lanesAlive.some(Boolean)) return;
        const type = w.queue[w.spawned];
        createEnemy(world, type, randomAliveLane(ctx), w.hpScale);
        w.spawned += 1;
        if (w.spawned === w.surgeAt) {
          pushBanner(ctx, '¡PICO DE TRÁFICO!', '#fb923c', 'Llega una ráfaga de peticiones', 2);
          sound(ctx, 'wave');
        }
        if (type === 'blackFriday') {
          pushBanner(ctx, ENEMIES.blackFriday.name.toUpperCase(), '#facc15', 'Jefe: destruye defensas de un golpe', 2.6);
        }
        const surge = w.spawned >= w.surgeAt;
        w.spawnTimer = w.interval * (surge ? 0.3 : 0.7 + Math.random() * 0.6);
        if (w.spawned >= w.total) {
          w.phase = 'clearing';
          w.timer = CLEAR_TIMEOUT;
        }
        return;
      }

      case 'clearing': {
        w.timer -= dt;
        const remaining = world.query('enemy').length;
        if (remaining === 0) {
          if (w.number >= TOTAL_WAVES) {
            ctx.status = 'victory';
            ctx.endReason = 'Todas las olas fueron mitigadas. El sistema escala.';
            sound(ctx, 'victory');
            return;
          }
          pushBanner(ctx, `OLA ${w.number} MITIGADA`, '#4ade80', `Siguiente ola en ${BREAK_TIME} s`);
          w.phase = 'break';
          w.timer = BREAK_TIME;
        } else if (w.timer <= 0 && w.number < TOTAL_WAVES) {
          startWave(ctx);
        }
        return;
      }
    }
  },
};
