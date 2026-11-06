import { cellAt, colX, DEFENSES, laneY } from '../config';
import type { System } from '../ecs/System';
import { createDefense, spawnSparks, spawnText } from '../game/factories';

const PICK_RADIUS = 30;

/** Turns queued clicks into actions: collect CU, place a defense, or dismantle one. */
export const InputSystem: System = {
  name: 'input',
  update(world, ctx) {
    const clicks = ctx.input.clicks;
    for (const click of clicks) {
      // 1) Collecting CU has priority over placing.
      let picked = false;
      for (const e of world.query('collectible', 'transform')) {
        const c = world.req(e, 'collectible');
        if (c.collected) continue;
        const t = world.req(e, 'transform');
        if (Math.hypot(t.x - click.x, t.y - click.y) <= PICK_RADIUS) {
          c.collected = true;
          c.fromX = t.x;
          c.fromY = t.y;
          c.flyT = 0;
          ctx.cu += c.value;
          spawnText(world, t.x, t.y - 20, `+${c.value} CU`, '#fde047');
          picked = true;
          break;
        }
      }
      if (picked || !ctx.selected) continue;

      // 2) Placement / dismantle.
      const cell = cellAt(click.x, click.y);
      if (!cell) continue;
      const { lane, col } = cell;
      const x = colX(col);
      const y = laneY(lane);

      if (!ctx.lanesAlive[lane]) {
        spawnText(world, x, y, '503: servicio caído', '#f87171', 13);
        continue;
      }
      const occupant = ctx.grid[lane][col];

      if (ctx.selected === 'shovel') {
        if (occupant !== null) {
          world.destroy(occupant);
          ctx.grid[lane][col] = null;
          spawnSparks(world, x, y, '#94a3b8', 10);
          spawnText(world, x, y, 'desmantelado', '#94a3b8', 13);
          ctx.selected = null;
        }
        continue;
      }

      const type = ctx.selected;
      const spec = DEFENSES[type];
      if (occupant !== null) {
        spawnText(world, x, y, 'Celda ocupada', '#fbbf24', 13);
        continue;
      }
      if (ctx.cu < spec.cost) {
        spawnText(world, x, y, 'CU insuficiente', '#f87171', 13);
        continue;
      }
      if (ctx.cooldowns[type] > 0) {
        spawnText(world, x, y, 'Recargando…', '#fbbf24', 13);
        continue;
      }
      const e = createDefense(world, type, lane, col);
      ctx.grid[lane][col] = e;
      ctx.cu -= spec.cost;
      ctx.cooldowns[type] = spec.cooldown;
      spawnText(world, x, y - 30, `-${spec.cost} CU`, spec.color, 13);
      spawnSparks(world, x, y + 30, spec.color, 6, 80);
      ctx.selected = null;
    }
    clicks.length = 0;
  },
};
