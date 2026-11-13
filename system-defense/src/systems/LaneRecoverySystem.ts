import { t } from '../i18n';
import { BASE_W, LANES, laneY, MODES, REGIONS, SERVICE_NAMES } from '../config';
import type { System } from '../ecs/System';
import { spawnEffect } from '../game/factories';
import { pushBanner, sound } from '../game/GameContext';

/**
 * Self-healing: a fallen lane comes back after its countdown (with no defenses).
 * Kubernetes restarts one pod (lane) at a time; Multi-region brings back a whole region.
 */
export const LaneRecoverySystem: System = {
  name: 'laneRecovery',
  update(world, ctx, dt) {
    if (ctx.mode !== 'kubernetes' && ctx.mode !== 'multiRegion') return;
    const restored: number[] = [];
    for (let lane = 0; lane < LANES; lane++) {
      if (ctx.lanesAlive[lane] || ctx.laneRestart[lane] <= 0) continue;
      ctx.laneRestart[lane] = Math.max(0, ctx.laneRestart[lane] - dt);
      if (ctx.laneRestart[lane] > 0) continue;
      ctx.lanesAlive[lane] = true;
      spawnEffect(world, 'ring', BASE_W / 2, laneY(lane), MODES[ctx.mode].color, { size: 90, duration: 0.7 });
      if (ctx.mode === 'kubernetes') {
        pushBanner(
          ctx,
          `${SERVICE_NAMES[lane]} ${t('RESTARTED', 'REINICIADO')}`,
          '#818cf8',
          t('The pod is up again (without defenses)', 'El pod vuelve a estar en pie (sin defensas)'),
          2,
        );
        sound(ctx, 'laneUp');
      } else {
        restored.push(lane);
      }
    }
    // Multi-region: one banner per region, not one per lane.
    for (const region of REGIONS) {
      if (!region.lanes.some((lane) => restored.includes(lane))) continue;
      pushBanner(
        ctx,
        `${region.name} ${t('RECOVERED', 'RECUPERADA')}`,
        MODES.multiRegion.color,
        t('The region takes traffic again (without defenses)', 'La región vuelve a recibir tráfico (sin defensas)'),
        2,
      );
      sound(ctx, 'laneUp');
    }
  },
};
