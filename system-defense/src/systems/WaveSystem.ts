import { t } from '../i18n';
import { ENEMIES, LANES, MODES, PROVIDER_FAILURE_WAVE } from '../config';
import type { System } from '../ecs/System';
import { createEnemy } from '../game/factories';
import { pushBanner, sound, type GameContext } from '../game/GameContext';
import { buildWave } from '../game/waves';
import { runProviderFailure, warnProviderFailure } from '../game/providerFailure';
import type { World } from '../ecs/World';

const BREAK_TIME = 7;
/** If a wave is not cleared after this time, the next one starts anyway (constant flow). */
const CLEAR_TIMEOUT = 30;

function startWave(world: World, ctx: GameContext): void {
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
  const total = MODES[ctx.mode].waves;
  if (w.number < total) w.next = buildWave(w.number + 1, total);
  const last = w.number === total;
  pushBanner(
    ctx,
    last ? t(`FINAL WAVE ${w.number}`, `OLA FINAL ${w.number}`) : `${t('WAVE', 'OLA')} ${w.number}`,
    last ? '#f87171' : '#38bdf8',
    t(`${w.total} incoming threats`, `${w.total} amenazas entrantes`),
  );
  sound(ctx, 'wave');
  runProviderFailure(world, ctx);
}

/**
 * A short pause between waves. Before the Provider failure wave, it carries its warning.
 * `mitigated` is false when the wave timed out with threats still on the board.
 */
function startBreak(ctx: GameContext, mitigated: boolean): void {
  const w = ctx.wave;
  if (mitigated) pushBanner(ctx, t(`WAVE ${w.number} MITIGATED`, `OLA ${w.number} MITIGADA`), '#4ade80', t(`Next wave in ${BREAK_TIME} s`, `Siguiente ola en ${BREAK_TIME} s`));
  w.phase = 'break';
  w.timer = BREAK_TIME;
  warnProviderFailure(ctx);
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
        if (w.timer <= 0) startWave(world, ctx);
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
          pushBanner(ctx, t('TRAFFIC SPIKE!', '¡PICO DE TRÁFICO!'), '#fb923c', t('A burst of requests is coming', 'Llega una ráfaga de peticiones'), 2);
          sound(ctx, 'wave');
        }
        if (type === 'blackFriday') {
          pushBanner(ctx, ENEMIES.blackFriday.name.toUpperCase(), '#facc15', t('Boss: destroys defenses in one hit', 'Jefe: destruye defensas de un golpe'), 2.6);
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
          if (w.number >= MODES[ctx.mode].waves) {
            ctx.status = 'victory';
            ctx.endReason = t('Every wave was mitigated. The system scales.', 'Todas las olas fueron mitigadas. El sistema escala.');
            sound(ctx, 'victory');
            return;
          }
          startBreak(ctx, true);
        } else if (w.timer <= 0 && w.number < MODES[ctx.mode].waves) {
          // The warning needs its break, even when threats are still on the board.
          if (ctx.provider?.state === 'waiting' && w.number === PROVIDER_FAILURE_WAVE - 1) startBreak(ctx, false);
          else startWave(world, ctx);
        }
        return;
      }
    }
  },
};
