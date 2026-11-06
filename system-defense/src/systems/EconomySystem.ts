import { CELL_H, DEFENSE_ORDER, GRID_RIGHT, GRID_X, GRID_Y, LANES, SKY_DROP_MAX, SKY_DROP_MIN, SKY_DROP_VALUE } from '../config';
import type { System } from '../ecs/System';
import { createCollectible } from '../game/factories';

/** HUD target where collected CU fly to (top-left of the board). */
const CU_TARGET = { x: 40, y: -10 };

/** Card recharge, CU falling from the sky, Worker Nodes, and CU pickups. */
export const EconomySystem: System = {
  name: 'economy',
  update(world, ctx, dt) {
    for (const d of DEFENSE_ORDER) ctx.cooldowns[d] = Math.max(0, ctx.cooldowns[d] - dt);

    // CU falling from the sky.
    ctx.skyTimer -= dt;
    if (ctx.skyTimer <= 0) {
      ctx.skyTimer = SKY_DROP_MIN + Math.random() * (SKY_DROP_MAX - SKY_DROP_MIN);
      const x = GRID_X + 40 + Math.random() * (GRID_RIGHT - GRID_X - 80);
      const targetY = GRID_Y + 40 + Math.random() * (LANES * CELL_H - 80);
      createCollectible(world, x, -30, targetY, SKY_DROP_VALUE, true);
    }

    // Worker Nodes generate CU.
    for (const e of world.query('generator', 'transform', 'gridCell')) {
      if (!ctx.lanesAlive[world.req(e, 'gridCell').lane]) continue;
      const g = world.req(e, 'generator');
      g.timer -= dt;
      if (g.timer <= 0) {
        g.timer = g.interval;
        const t = world.req(e, 'transform');
        createCollectible(world, t.x + (Math.random() * 30 - 15), t.y - 10, t.y + 26, g.amount, false);
      }
    }

    // Pickups: fall, expire, or fly to the counter once collected.
    for (const e of world.query('collectible', 'transform')) {
      const c = world.req(e, 'collectible');
      const t = world.req(e, 'transform');
      if (c.collected) {
        c.flyT += dt * 2.4;
        const k = Math.min(1, c.flyT);
        const ease = k * k * (3 - 2 * k);
        t.x = c.fromX + (CU_TARGET.x - c.fromX) * ease;
        t.y = c.fromY + (CU_TARGET.y - c.fromY) * ease;
        if (k >= 1) world.destroy(e);
        continue;
      }
      if (c.fromSky) {
        if (t.y < c.targetY) t.y = Math.min(c.targetY, t.y + c.vy * dt);
      } else if (c.vy < 0 || t.y < c.targetY) {
        c.vy += 420 * dt;
        t.y += c.vy * dt;
        if (c.vy > 0 && t.y >= c.targetY) {
          t.y = c.targetY;
          c.vy = 0;
        }
      }
      c.life -= dt;
      if (c.life <= 0) world.destroy(e);
    }
  },
};
