import { LANES, laneName, POD_RESTART_TIME, PROVIDER_COLOR, PROVIDER_FAILURE_WAVE, REGION_RECOVERY_TIME, REGIONS } from '../config';
import type { World } from '../ecs/World';
import { t } from '../i18n';
import { discoverConcept } from '../systems/LearningSystem';
import { bringDown } from '../systems/BreachSystem';
import { pushBanner, sound, type GameContext } from './GameContext';

/** The middle lane: it breaks ties, so the choice does not depend on the lane order. */
const MIDDLE = Math.floor(LANES / 2);

/**
 * Lanes the Provider failure will take down: eu-west (the larger region) in Multi-region,
 * otherwise the lane still up with most defenses (a tie goes to the lane nearest the middle).
 */
function pickLanes(ctx: GameContext): number[] {
  if (ctx.mode === 'multiRegion') return [...REGIONS[0].lanes];
  let best = -1;
  let bestCount = -1;
  for (let lane = 0; lane < LANES; lane++) {
    if (!ctx.lanesAlive[lane]) continue;
    const count = ctx.grid[lane].filter((e) => e !== null).length;
    const closer = best < 0 || Math.abs(lane - MIDDLE) < Math.abs(best - MIDDLE);
    if (count > bestCount || (count === bestCount && closer)) {
      best = lane;
      bestCount = count;
    }
  }
  return best < 0 ? [] : [best];
}

/** Name of what will fall, for the texts: a region, or a service / pod. */
function targetName(ctx: GameContext, lanes: number[]): string {
  return lanes.length > 0 ? laneName(ctx.mode, lanes[0]) : '';
}

/** Called when a break starts: in the break before the failure wave, warns the Player. */
export function warnProviderFailure(ctx: GameContext): void {
  const p = ctx.provider;
  if (!p || p.state !== 'waiting' || ctx.wave.number !== PROVIDER_FAILURE_WAVE - 1) return;
  const lanes = pickLanes(ctx);
  // Nothing up to warn about (eu-west already down): no warning; wave 3 decides again.
  if (!lanes.some((l) => ctx.lanesAlive[l])) return;
  p.lanes = lanes;
  p.state = 'warned';
  const name = targetName(ctx, p.lanes);
  pushBanner(
    ctx,
    t('⚠ PROVIDER FAILURE AHEAD', '⚠ PROVIDER FAILURE EN CAMINO'),
    PROVIDER_COLOR,
    t(`The provider of ${name} reports problems. Strengthen the rest.`, `El proveedor de ${name} reporta problemas. Refuerza el resto.`),
    6,
  );
  sound(ctx, 'wave');
}

/** True if the warning should be on screen (HUD chip, lane outline). */
export function providerWarned(ctx: GameContext): boolean {
  return ctx.provider?.state === 'warned';
}

/**
 * Called when a wave starts: at the failure wave, takes the warned lanes down by itself,
 * with the same rules as a breach. It never takes down the last part still up.
 */
export function runProviderFailure(world: World, ctx: GameContext): void {
  const p = ctx.provider;
  if (!p || ctx.wave.number !== PROVIDER_FAILURE_WAVE) return;
  if (p.state !== 'waiting' && p.state !== 'warned') return;
  // Not warned, or the warned lane fell during the break: choose again among the lanes up.
  if (p.state === 'waiting' || !p.lanes.some((l) => ctx.lanesAlive[l])) p.lanes = pickLanes(ctx);
  const name = targetName(ctx, p.lanes);
  const up = p.lanes.filter((l) => ctx.lanesAlive[l]);
  if (up.length === 0) {
    p.state = 'skipped'; // already down (eu-west): nothing to take down, nothing to say
    return;
  }
  const othersUp = ctx.lanesAlive.some((alive, l) => alive && !p.lanes.includes(l));
  if (!othersUp) {
    p.state = 'skipped';
    pushBanner(
      ctx,
      t('PROVIDER RECOVERED', 'PROVEEDOR RECUPERADO'),
      '#4ade80',
      t(`The provider of ${name} fixed the problem in time.`, `El proveedor de ${name} arregló el problema a tiempo.`),
      2.8,
    );
    return;
  }
  p.state = 'done';
  bringDown(world, ctx, up);
  ctx.incidents.push({ kind: 'provider', wave: ctx.wave.number, lane: up[0], time: ctx.time });
  sound(ctx, 'laneDown');
  const back =
    ctx.mode === 'multiRegion'
      ? t(`Failover to the other region. Back in ${REGION_RECOVERY_TIME} s.`, `Failover a la otra región. Vuelve en ${REGION_RECOVERY_TIME} s.`)
      : ctx.mode === 'kubernetes'
        ? t(`Automatic restart in ${POD_RESTART_TIME} s.`, `Reinicio automático en ${POD_RESTART_TIME} s.`)
        : t('It does not come back. The other services keep working.', 'No vuelve. Los otros servicios siguen funcionando.');
  const down = t('DOWN', ctx.mode === 'multiRegion' ? 'CAÍDA' : 'CAÍDO'); // a region / a service
  pushBanner(ctx, `PROVIDER FAILURE · ${name} ${down}`, '#f87171', `${t('It was not a threat.', 'No fue una amenaza.')} ${back}`, 3.2);
  discoverConcept(ctx, 'providerFailure');
}
