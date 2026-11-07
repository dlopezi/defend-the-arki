import { t } from '../i18n';
import { CELL_H, CELL_W, cellAt, colX, DEFENSES, GRID_X, GRID_Y, inRect, laneY, upgradePanelRect } from '../config';
import type { System } from '../ecs/System';
import type { World } from '../ecs/World';
import { createDefense, spawnSparks, spawnText, upgradeDefense } from '../game/factories';
import { sound, type GameContext, type Point } from '../game/GameContext';

const PICK_RADIUS = 30;
/** Extra margin around the cell and panel before the panel closes on its own. */
const PANEL_MARGIN = 24;

/** True if the defense in that cell can still be upgraded. */
export function canUpgrade(world: World, ctx: GameContext, lane: number, col: number): boolean {
  const e = ctx.grid[lane][col];
  const d = e !== null ? world.get(e, 'defense') : undefined;
  return !!d && d.level < 2 && DEFENSES[d.type].upgrade !== null;
}

/** The upgrade panel closes when the pointer moves away from the cell and the panel. */
function closePanelIfAway(ctx: GameContext): void {
  const insp = ctx.inspect;
  if (!insp) return;
  const h = ctx.input.hover;
  if (!h) {
    ctx.inspect = null;
    return;
  }
  const m = PANEL_MARGIN;
  const cell = { x: GRID_X + insp.col * CELL_W - m, y: GRID_Y + insp.lane * CELL_H - m, w: CELL_W + 2 * m, h: CELL_H + 2 * m };
  const p = upgradePanelRect(insp.lane, insp.col);
  const panel = { x: p.x - m, y: p.y - m, w: p.w + 2 * m, h: p.h + 2 * m };
  if (!inRect(cell, h.x, h.y) && !inRect(panel, h.x, h.y)) ctx.inspect = null;
}

function tryCollect(world: World, ctx: GameContext, click: Point): boolean {
  for (const e of world.query('collectible', 'transform')) {
    const c = world.req(e, 'collectible');
    if (c.collected) continue;
    const t = world.req(e, 'transform');
    if (Math.hypot(t.x - click.x, t.y - click.y) > PICK_RADIUS) continue;
    c.collected = true;
    c.fromX = t.x;
    c.fromY = t.y;
    c.flyT = 0;
    ctx.cu += c.value;
    spawnText(world, t.x, t.y - 20, `+${c.value} CU`, '#fde047');
    sound(ctx, 'collect');
    return true;
  }
  return false;
}

/** Click on the open upgrade panel. Returns true if the click was used by the panel. */
function handlePanel(world: World, ctx: GameContext, click: Point): boolean {
  const insp = ctx.inspect;
  if (!insp) return false;
  ctx.inspect = null;
  if (!inRect(upgradePanelRect(insp.lane, insp.col), click.x, click.y)) return false;

  const e = ctx.grid[insp.lane][insp.col];
  const x = colX(insp.col);
  const y = laneY(insp.lane);
  const d = e !== null ? world.get(e, 'defense') : undefined;
  if (e === null || !d) return true;
  const spec = DEFENSES[d.type];
  if (spec.upgrade === null || d.level >= 2) return true;
  if (ctx.cu < spec.cost) {
    spawnText(world, x, y, t('Not enough CU', 'CU insuficiente'), '#f87171', 13);
    sound(ctx, 'deny');
    return true;
  }
  if (upgradeDefense(world, e)) {
    ctx.cu -= spec.cost;
    spawnText(world, x, y - 30, `${spec.short} v2`, spec.color, 15);
    spawnSparks(world, x, y, spec.color, 14, 160);
    sound(ctx, 'upgrade');
  }
  return true;
}

/** Turns queued clicks into actions: collect CU, upgrade, place, or dismantle. */
export const InputSystem: System = {
  name: 'input',
  update(world, ctx) {
    for (const click of ctx.input.clicks) {
      // 1) Collecting CU has priority over everything.
      if (tryCollect(world, ctx, click)) continue;
      // 2) Upgrade panel (any other click closes it).
      if (handlePanel(world, ctx, click)) continue;

      const cell = cellAt(click.x, click.y);
      if (!cell) continue;
      const { lane, col } = cell;
      const x = colX(col);
      const y = laneY(lane);
      const occupant = ctx.grid[lane][col];

      // 3) No tool selected: clicking a defense opens its upgrade panel (only if it can be upgraded).
      if (!ctx.selected) {
        if (occupant === null || !ctx.lanesAlive[lane]) continue;
        if (canUpgrade(world, ctx, lane, col)) {
          ctx.inspect = { lane, col };
        } else {
          const d = world.get(occupant, 'defense');
          spawnText(world, x, y - 44, d && d.level >= 2 ? t('Already v2', 'Ya es v2') : t('Cannot upgrade', 'No mejorable'), '#94a3b8', 13);
        }
        continue;
      }

      if (!ctx.lanesAlive[lane]) {
        spawnText(world, x, y, t('503: service down', '503: servicio caído'), '#f87171', 13);
        sound(ctx, 'deny');
        continue;
      }

      // 4) Dismantle.
      if (ctx.selected === 'shovel') {
        if (occupant !== null) {
          world.destroy(occupant);
          ctx.grid[lane][col] = null;
          spawnSparks(world, x, y, '#94a3b8', 10);
          spawnText(world, x, y, t('dismantled', 'desmantelado'), '#94a3b8', 13);
          sound(ctx, 'place');
          ctx.selected = null;
        }
        continue;
      }

      // 5) Place a defense.
      const type = ctx.selected;
      const spec = DEFENSES[type];
      let problem = '';
      if (occupant !== null) problem = t('Cell taken', 'Celda ocupada');
      else if (ctx.cu < spec.cost) problem = t('Not enough CU', 'CU insuficiente');
      else if (ctx.cooldowns[type] > 0) problem = t('Recharging…', 'Recargando…');
      if (problem) {
        spawnText(world, x, y, problem, '#fbbf24', 13);
        sound(ctx, 'deny');
        continue;
      }
      const e = createDefense(world, type, lane, col);
      ctx.grid[lane][col] = e;
      ctx.cu -= spec.cost;
      ctx.cooldowns[type] = spec.cooldown;
      ctx.placed[type]++;
      spawnText(world, x, y - 30, `-${spec.cost} CU`, spec.color, 13);
      spawnSparks(world, x, y + 30, spec.color, 6, 80);
      sound(ctx, 'place');
      ctx.selected = null;
    }
    ctx.input.clicks.length = 0;
    closePanelIfAway(ctx);
  },
};
