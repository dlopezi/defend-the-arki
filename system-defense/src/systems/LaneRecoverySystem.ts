import { t } from '../i18n';
import { BASE_W, LANES, laneY, SERVICE_NAMES } from '../config';
import type { System } from '../ecs/System';
import { spawnEffect } from '../game/factories';
import { pushBanner, sound } from '../game/GameContext';

/** Kubernetes self-healing: a fallen lane restarts after its countdown (with no defenses). */
export const LaneRecoverySystem: System = {
  name: 'laneRecovery',
  update(world, ctx, dt) {
    if (ctx.mode !== 'kubernetes') return;
    for (let lane = 0; lane < LANES; lane++) {
      if (ctx.lanesAlive[lane] || ctx.laneRestart[lane] <= 0) continue;
      ctx.laneRestart[lane] = Math.max(0, ctx.laneRestart[lane] - dt);
      if (ctx.laneRestart[lane] > 0) continue;
      ctx.lanesAlive[lane] = true;
      spawnEffect(world, 'ring', BASE_W / 2, laneY(lane), '#818cf8', { size: 90, duration: 0.7 });
      pushBanner(
        ctx,
        `${SERVICE_NAMES[lane]} ${t('RESTARTED', 'REINICIADO')}`,
        '#818cf8',
        t('The pod is up again (without defenses)', 'El pod vuelve a estar en pie (sin defensas)'),
        2,
      );
      sound(ctx, 'laneUp');
    }
  },
};
