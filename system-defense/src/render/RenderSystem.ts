import { t } from '../i18n';
import {
  BASE_W,
  CANVAS_H,
  CANVAS_W,
  CELL_H,
  CELL_W,
  cellAt,
  colX,
  COLS,
  DEFENSES,
  GRID_RIGHT,
  GRID_X,
  GRID_Y,
  LANES,
  laneName,
  laneY,
  MODES,
  POD_RESTART_TIME,
  REGION_RECOVERY_TIME,
  REGIONS,
  SERVICE_NAMES,
  upgradePanelRect,
} from '../config';
import type { Entity, World } from '../ecs/World';
import type { GameContext } from '../game/GameContext';
import { canUpgrade } from '../systems/InputSystem';
import { drawCU, drawDefense, drawEnemy, drawProjectile, drawRollback } from './sprites';

type G = CanvasRenderingContext2D;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const SHOW_DEBUG = import.meta.env.DEV || (typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug'));
/** Width of the base drawing (the rest of BASE_W is the Rollback column). */
const BASE_DRAW_W = BASE_W - 52;

/**
 * Render system. It only reads components and context; it never changes game state.
 * It runs once per animation frame, separate from the fixed-step update systems.
 */
export class RenderSystem {
  private readonly g: G;

  constructor(g: G) {
    this.g = g;
  }

  render(world: World, ctx: GameContext, time: number, fps: number): void {
    const g = this.g;
    g.save();
    g.clearRect(0, 0, CANVAS_W, CANVAS_H);
    if (ctx.shake > 0) {
      g.translate((Math.random() - 0.5) * ctx.shake, (Math.random() - 0.5) * ctx.shake);
    }
    this.drawBoard(ctx, time);
    this.drawBase(ctx, time);
    this.drawHover(world, ctx);
    this.drawDefenses(world, ctx, time);
    this.drawRollbacks(world, time);
    this.drawEnemies(world, time);
    this.drawProjectiles(world);
    this.drawCollectibles(world, time);
    this.drawEffects(world);
    this.drawDeadLanes(ctx);
    this.drawUpgradePanel(world, ctx);
    g.restore();
    this.drawBanners(ctx);
    // FPS and entity count: only for developers (dev server or ?debug in the URL).
    if (SHOW_DEBUG) this.drawDebug(world, fps);
  }

  private drawBoard(ctx: GameContext, time: number): void {
    const g = this.g;
    g.fillStyle = '#070b17';
    g.fillRect(0, 0, CANVAS_W, CANVAS_H);
    for (let lane = 0; lane < LANES; lane++) {
      for (let col = 0; col < COLS; col++) {
        const x = GRID_X + col * CELL_W;
        const y = GRID_Y + lane * CELL_H;
        g.fillStyle = (lane + col) % 2 === 0 ? '#0f1730' : '#121c39';
        g.fillRect(x, y, CELL_W, CELL_H);
        g.strokeStyle = '#1a2547';
        g.lineWidth = 1;
        g.strokeRect(x + 0.5, y + 0.5, CELL_W - 1, CELL_H - 1);
      }
      const y = laneY(lane) + 38;
      g.strokeStyle = 'rgba(56,189,248,0.10)';
      g.lineWidth = 2;
      g.setLineDash([6, 10]);
      g.lineDashOffset = time * 30;
      g.beginPath();
      g.moveTo(GRID_X, y);
      g.lineTo(CANVAS_W, y);
      g.stroke();
      g.setLineDash([]);
      // Slowloris: the lane's connections are held open.
      if (ctx.laneThrottled[lane] && ctx.lanesAlive[lane]) {
        g.fillStyle = 'rgba(14,165,233,0.06)';
        g.fillRect(GRID_X, GRID_Y + lane * CELL_H, GRID_RIGHT - GRID_X, CELL_H);
      }
    }
    // Internet side
    const grad = g.createLinearGradient(GRID_RIGHT, 0, CANVAS_W, 0);
    grad.addColorStop(0, 'rgba(239,68,68,0.02)');
    grad.addColorStop(1, 'rgba(239,68,68,0.14)');
    g.fillStyle = grad;
    g.fillRect(GRID_RIGHT, 0, CANVAS_W - GRID_RIGHT, CANVAS_H);
    g.save();
    g.translate(CANVAS_W - 18, CANVAS_H / 2);
    g.rotate(Math.PI / 2);
    g.font = `700 12px ${MONO}`;
    g.textAlign = 'center';
    g.fillStyle = 'rgba(248,113,113,0.45)';
    g.fillText(t('INTERNET  ·  INCOMING TRAFFIC', 'INTERNET  ·  TRÁFICO ENTRANTE'), 0, 0);
    g.restore();
    // firewall line (left limit)
    g.strokeStyle = ctx.status === 'gameover' ? '#ef4444' : 'rgba(56,189,248,0.6)';
    g.lineWidth = 2;
    g.setLineDash([4, 6]);
    g.beginPath();
    g.moveTo(GRID_X - 4, 0);
    g.lineTo(GRID_X - 4, CANVAS_H);
    g.stroke();
    g.setLineDash([]);
  }

  private drawBase(ctx: GameContext, time: number): void {
    const g = this.g;
    if (ctx.mode === 'monolith') {
      const down = ctx.status === 'gameover';
      const x = 8;
      const y = 8;
      const w = BASE_DRAW_W;
      const h = CANVAS_H - 16;
      const grad = g.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, down ? '#450a0a' : '#1e293b');
      grad.addColorStop(1, down ? '#1c0505' : '#0b1222');
      g.beginPath();
      g.roundRect(x, y, w, h, 10);
      g.fillStyle = grad;
      g.fill();
      g.strokeStyle = down ? '#ef4444' : '#38bdf8';
      g.lineWidth = 3;
      g.stroke();
      g.font = `800 13px ${MONO}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = down ? '#fca5a5' : '#e0f2fe';
      g.fillText(t('MONOLITH', 'MONOLITO'), x + w / 2, y + 18);
      for (let i = 0; i < 17; i++) {
        const ry = y + 34 + i * 25;
        g.beginPath();
        g.roundRect(x + 9, ry, w - 18, 16, 3);
        g.fillStyle = '#080e1c';
        g.fill();
        const on = Math.sin(time * 3 + i * 0.9) > -0.4;
        g.fillStyle = down ? (on ? '#ef4444' : '#450a0a') : on ? '#4ade80' : '#14532d';
        g.beginPath();
        g.arc(x + w - 17, ry + 8, 2.6, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#1e3a5f';
        g.fillRect(x + 15, ry + 6, 30, 2);
        g.fillRect(x + 15, ry + 10, 20, 2);
      }
      g.font = `700 10px ${MONO}`;
      g.fillStyle = down ? '#f87171' : '#fbbf24';
      g.fillText(down ? 'SYSTEM DOWN' : '⚠ SPOF', x + w / 2, y + h - 12);
      return;
    }

    const k8s = ctx.mode === 'kubernetes';
    const multi = ctx.mode === 'multiRegion';
    const accent = MODES[ctx.mode].color;
    for (let lane = 0; lane < LANES; lane++) {
      const alive = ctx.lanesAlive[lane];
      const restarting = !alive && ctx.laneRestart[lane] > 0;
      const x = 8;
      const y = GRID_Y + lane * CELL_H + 8;
      const w = BASE_DRAW_W;
      const h = CELL_H - 16;
      g.beginPath();
      g.roundRect(x, y, w, h, 8);
      g.fillStyle = alive ? (k8s ? '#1e1b4b' : multi ? '#2a0f22' : '#0f2a24') : restarting ? '#1c1917' : '#1f0b0b';
      g.fill();
      g.strokeStyle = alive ? accent : restarting ? '#f59e0b' : '#7f1d1d';
      g.lineWidth = 2;
      g.stroke();
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = `700 11px ${MONO}`;
      g.fillStyle = alive ? '#e0e7ff' : restarting ? '#fcd34d' : '#7f1d1d';
      g.fillText(k8s ? SERVICE_NAMES[lane].replace('-svc', '-pod') : laneName(ctx.mode, lane), x + w / 2, y + 16);
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.roundRect(x + 10 + i * 24, y + 30, 18, 16, 3);
        g.fillStyle = alive ? (k8s ? '#3730a3' : multi ? '#831843' : '#065f46') : '#2a0e0e';
        g.fill();
      }
      const on = Math.sin(time * 4 + lane) > -0.5;
      g.fillStyle = alive ? (on ? '#4ade80' : '#166534') : restarting ? '#f59e0b' : '#ef4444';
      g.beginPath();
      g.arc(x + 12, y + h - 13, 3.5, 0, Math.PI * 2);
      g.fill();
      g.font = `700 10px ${MONO}`;
      g.fillStyle = alive ? '#a7f3d0' : restarting ? '#fcd34d' : '#f87171';
      const status = alive ? '200 OK' : restarting ? `↻ ${Math.ceil(ctx.laneRestart[lane])}s` : '503';
      g.fillText(status, x + w / 2 + 6, y + h - 13);
    }
    // Multi-region: a line in the base between the two regions (after lane 3).
    if (multi) {
      for (const region of REGIONS.slice(0, -1)) {
        const y = GRID_Y + (region.lanes[region.lanes.length - 1] + 1) * CELL_H;
        g.save();
        g.strokeStyle = accent;
        g.lineWidth = 3;
        g.shadowColor = accent;
        g.shadowBlur = 8;
        g.beginPath();
        g.moveTo(2, y);
        g.lineTo(BASE_DRAW_W + 14, y);
        g.stroke();
        g.restore();
      }
    }
  }

  private drawHover(world: World, ctx: GameContext): void {
    const hover = ctx.input.hover;
    if (!hover || ctx.status !== 'playing') return;
    const cell = cellAt(hover.x, hover.y);
    if (!cell) return;
    const g = this.g;
    const x = GRID_X + cell.col * CELL_W;
    const y = GRID_Y + cell.lane * CELL_H;
    const occupant = ctx.grid[cell.lane][cell.col];
    const laneOk = ctx.lanesAlive[cell.lane];

    if (!ctx.selected) {
      // Hint: only defenses that can still be upgraded are outlined.
      if (occupant !== null && laneOk && canUpgrade(world, ctx, cell.lane, cell.col)) {
        g.strokeStyle = 'rgba(253,224,71,0.55)';
        g.lineWidth = 2;
        g.strokeRect(x + 2, y + 2, CELL_W - 4, CELL_H - 4);
      }
      return;
    }
    if (ctx.selected === 'shovel') {
      g.fillStyle = occupant !== null && laneOk ? 'rgba(248,113,113,0.25)' : 'rgba(148,163,184,0.10)';
      g.fillRect(x, y, CELL_W, CELL_H);
      return;
    }
    const spec = DEFENSES[ctx.selected];
    const ok = laneOk && occupant === null && ctx.cu >= spec.cost && ctx.cooldowns[ctx.selected] <= 0;

    if (ctx.selected === 'circuitBreaker' || ctx.selected === 'cdn') {
      const cb = ctx.selected === 'circuitBreaker';
      const ax = cb ? GRID_X + Math.max(0, cell.col - 1) * CELL_W : x;
      const ax2 = cb ? GRID_X + Math.min(COLS, cell.col + 2) * CELL_W : GRID_RIGHT;
      const ay = GRID_Y + Math.max(0, cell.lane - 1) * CELL_H;
      const ay2 = GRID_Y + Math.min(LANES, cell.lane + 2) * CELL_H;
      g.fillStyle = cb ? 'rgba(250,204,21,0.08)' : 'rgba(244,114,182,0.07)';
      g.fillRect(ax, ay, ax2 - ax, ay2 - ay);
      g.strokeStyle = cb ? 'rgba(250,204,21,0.6)' : 'rgba(244,114,182,0.5)';
      g.setLineDash([6, 4]);
      g.strokeRect(ax + 1, ay + 1, ax2 - ax - 2, ay2 - ay - 2);
      g.setLineDash([]);
    }
    g.fillStyle = ok ? 'rgba(74,222,128,0.16)' : 'rgba(248,113,113,0.18)';
    g.fillRect(x, y, CELL_W, CELL_H);
    if (ok) {
      g.globalAlpha = 0.5;
      drawDefense(g, ctx.selected, colX(cell.col), laneY(cell.lane), 0);
      g.globalAlpha = 1;
    }
  }

  private drawDefenses(world: World, ctx: GameContext, time: number): void {
    const g = this.g;
    for (const e of world.query('defense', 'transform', 'health', 'gridCell')) {
      const d = world.req(e, 'defense');
      const t = world.req(e, 'transform');
      const h = world.req(e, 'health');
      const gen = world.get(e, 'generator');
      const fuse = world.get(e, 'fuse');
      const trap = world.get(e, 'trap');
      const shooter = world.get(e, 'shooter');
      const lane = world.req(e, 'gridCell').lane;
      // recoil right after a shot; walls shake while they are being hit
      const sinceShot = shooter ? shooter.interval - shooter.timer : Infinity;
      const kick = sinceShot < 0.15 ? 1 - sinceShot / 0.15 : h.flash > 0 ? 1 : 0;
      drawDefense(g, d.type, t.x, t.y, time, {
        flash: h.flash,
        kick,
        charge: gen ? 1 - gen.timer / gen.interval : undefined,
        fuse: fuse ? fuse.timer / fuse.total : undefined,
        hpRatio: h.hp / h.max,
        level: d.level,
        encrypted: world.has(e, 'encrypted'),
        throttled: world.has(e, 'shooter') && ctx.laneThrottled[lane],
        trapReady: trap ? 1 - trap.timer / trap.recharge : undefined,
        trapBusy: trap ? trap.captured !== null : undefined,
      });
      const showHp = h.hp < h.max && d.type !== 'circuitBreaker' && d.type !== 'kafka';
      if (showHp) this.hpBar(t.x, t.y - (d.type === 'waf' ? 54 : 44), 54, h.hp / h.max, '#4ade80');
    }
  }

  private drawRollbacks(world: World, time: number): void {
    for (const e of world.query('rollback', 'transform')) {
      const t = world.req(e, 'transform');
      drawRollback(this.g, t.x, t.y, world.req(e, 'rollback').running, time);
    }
  }

  private drawEnemies(world: World, time: number): void {
    const g = this.g;
    const list: Entity[] = world.query('enemy', 'transform', 'health');
    list.sort((a, b) => world.req(a, 'transform').y - world.req(b, 'transform').y);
    for (const e of list) {
      const en = world.req(e, 'enemy');
      const t = world.req(e, 'transform');
      const h = world.req(e, 'health');
      const j = world.get(e, 'jumper');
      const held = world.get(e, 'held');
      let jumpHeight = 0;
      if (j && en.state === 'jump') {
        const p = Math.min(1, j.t / j.duration);
        jumpHeight = Math.sin(p * Math.PI) * 70;
      }
      // the boss is taller than a lane (it may use the board margin); small threats stand on the lane's ground line
      const yOffset = en.type === 'blackFriday' ? -12 : en.type === 'botlet' || en.type === 'fakeRequest' ? 12 : 0;
      drawEnemy(g, en.type, t.x, t.y + yOffset, en.width, en.height, time, {
        flash: h.flash,
        slowed: world.has(e, 'slowed'),
        state: en.state,
        jumpHeight,
        held: held ? held.timer / held.total : undefined,
      });
      if (h.hp < h.max && en.type !== 'memoryLeak') {
        // Black Friday's "-70%" sign sticks out above its box: the bar goes over it.
        const above = en.type === 'blackFriday' ? 22 : 10;
        this.hpBar(t.x, t.y + yOffset - en.height / 2 - above - jumpHeight, Math.max(30, en.width), h.hp / h.max, '#f87171');
      } else if (en.type === 'memoryLeak') {
        // Leak shows its total size instead: the bar keeps growing.
        this.hpBar(t.x, t.y - en.height / 2 - 12, Math.max(30, en.width), h.hp / h.max, '#c084fc');
      }
    }
  }

  private drawProjectiles(world: World): void {
    for (const e of world.query('projectile', 'transform')) {
      const t = world.req(e, 'transform');
      drawProjectile(this.g, t.x, t.y, world.req(e, 'projectile').slow);
    }
  }

  private drawCollectibles(world: World, time: number): void {
    for (const e of world.query('collectible', 'transform')) {
      const c = world.req(e, 'collectible');
      const t = world.req(e, 'transform');
      let alpha = 1;
      if (c.collected) alpha = 1 - c.flyT * 0.6;
      else if (c.life < 3) alpha = Math.sin(time * 14) > 0 ? 1 : 0.35;
      drawCU(this.g, t.x, t.y, c.value, time, alpha);
    }
  }

  private drawEffects(world: World): void {
    const g = this.g;
    for (const e of world.query('effect', 'transform')) {
      const fx = world.req(e, 'effect');
      const t = world.req(e, 'transform');
      const k = fx.t / fx.duration;
      g.globalAlpha = Math.max(0, 1 - k);
      switch (fx.kind) {
        case 'spark':
          g.fillStyle = fx.color;
          g.fillRect(t.x - fx.size / 2, t.y - fx.size / 2, fx.size, fx.size);
          break;
        case 'text':
          g.font = `800 ${fx.size}px ${MONO}`;
          g.textAlign = 'center';
          g.textBaseline = 'middle';
          g.lineWidth = 3;
          g.strokeStyle = 'rgba(0,0,0,0.75)';
          g.strokeText(fx.text ?? '', t.x, t.y);
          g.fillStyle = fx.color;
          g.fillText(fx.text ?? '', t.x, t.y);
          break;
        case 'ring':
          g.strokeStyle = fx.color;
          g.lineWidth = 4 * (1 - k) + 1;
          g.beginPath();
          g.arc(t.x, t.y, fx.size * (0.2 + 0.8 * k), 0, Math.PI * 2);
          g.stroke();
          break;
        case 'explosion': {
          const r = fx.size * (0.3 + 0.7 * Math.sqrt(k));
          const grad = g.createRadialGradient(t.x, t.y, 0, t.x, t.y, r);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, fx.color);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = grad;
          g.beginPath();
          g.arc(t.x, t.y, r, 0, Math.PI * 2);
          g.fill();
          break;
        }
      }
      g.globalAlpha = 1;
    }
  }

  private drawDeadLanes(ctx: GameContext): void {
    const g = this.g;
    const multi = ctx.mode === 'multiRegion';
    for (let lane = 0; lane < LANES; lane++) {
      if (ctx.lanesAlive[lane]) continue;
      const y = GRID_Y + lane * CELL_H;
      const restarting = ctx.laneRestart[lane] > 0;
      g.fillStyle = 'rgba(2,4,10,0.78)';
      g.fillRect(GRID_X - 30, y, CANVAS_W - GRID_X + 30, CELL_H);
      g.save();
      g.beginPath();
      g.rect(GRID_X - 30, y, CANVAS_W - GRID_X + 30, CELL_H);
      g.clip();
      g.strokeStyle = restarting ? 'rgba(245,158,11,0.10)' : 'rgba(239,68,68,0.10)';
      g.lineWidth = 10;
      for (let x = GRID_X - 130; x < CANVAS_W + 100; x += 40) {
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + CELL_H, y + CELL_H);
        g.stroke();
      }
      g.restore();
      g.font = `800 20px ${MONO}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      const cx = (GRID_X + GRID_RIGHT) / 2;
      if (restarting) {
        const left = ctx.laneRestart[lane];
        g.fillStyle = 'rgba(252,211,77,0.9)';
        const secs = Math.ceil(left);
        g.fillText(multi ? t(`Recovering region… ${secs} s`, `Recuperando región… ${secs} s`) : t(`Restarting pod… ${secs} s`, `Reiniciando pod… ${secs} s`), cx, y + CELL_H / 2 - 8);
        const bw = 260;
        g.fillStyle = 'rgba(0,0,0,0.6)';
        g.fillRect(cx - bw / 2, y + CELL_H / 2 + 14, bw, 6);
        g.fillStyle = '#f59e0b';
        g.fillRect(cx - bw / 2, y + CELL_H / 2 + 14, bw * (1 - left / (multi ? REGION_RECOVERY_TIME : POD_RESTART_TIME)), 6);
      } else {
        g.fillStyle = 'rgba(248,113,113,0.85)';
        g.fillText(`503 SERVICE UNAVAILABLE · ${laneName(ctx.mode, lane)}`, cx, y + CELL_H / 2);
      }
    }
    if (ctx.mode === 'monolith' && ctx.status === 'gameover') {
      g.fillStyle = 'rgba(127,29,29,0.35)';
      g.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
  }

  private drawUpgradePanel(world: World, ctx: GameContext): void {
    const insp = ctx.inspect;
    if (!insp || ctx.status !== 'playing') return;
    const e = ctx.grid[insp.lane][insp.col];
    const d = e !== null ? world.get(e, 'defense') : undefined;
    if (e === null || !d) return;
    const spec = DEFENSES[d.type];
    const g = this.g;
    const r = upgradePanelRect(insp.lane, insp.col);

    g.strokeStyle = '#fde047';
    g.lineWidth = 2;
    g.strokeRect(GRID_X + insp.col * CELL_W + 2, GRID_Y + insp.lane * CELL_H + 2, CELL_W - 4, CELL_H - 4);

    const can = spec.upgrade !== null && d.level < 2;
    const afford = ctx.cu >= spec.cost;
    g.beginPath();
    g.roundRect(r.x, r.y, r.w, r.h, 8);
    g.fillStyle = 'rgba(11,18,36,0.96)';
    g.fill();
    g.strokeStyle = can ? (afford ? '#fde047' : '#f87171') : '#475569';
    g.lineWidth = 2;
    g.stroke();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const cx = r.x + r.w / 2;
    if (!can) {
      g.font = `700 12px ${MONO}`;
      g.fillStyle = '#94a3b8';
      g.fillText(spec.upgrade === null ? t('Cannot upgrade', 'No mejorable') : t(`${spec.short} is already v2`, `${spec.short} ya es v2`), cx, r.y + r.h / 2);
      return;
    }
    g.font = `800 13px ${MONO}`;
    g.fillStyle = afford ? '#fde047' : '#f87171';
    g.fillText(`⬆ ${t('Upgrade to v2', 'Mejorar a v2')} · ${spec.cost} CU`, cx, r.y + 16);
    g.font = `500 10px ${MONO}`;
    g.fillStyle = '#cbd5e1';
    g.fillText(spec.upgrade ?? '', cx, r.y + 35);
  }

  private drawBanners(ctx: GameContext): void {
    const g = this.g;
    ctx.banners.forEach((b, i) => {
      const fadeIn = Math.min(1, b.t / 0.25);
      const fadeOut = Math.min(1, (b.duration - b.t) / 0.5);
      const a = Math.max(0, Math.min(fadeIn, fadeOut));
      const y = CANVAS_H / 2 - 30 + i * 70;
      g.globalAlpha = a;
      g.fillStyle = 'rgba(2,6,23,0.7)';
      g.fillRect(0, y - 34, CANVAS_W, b.sub ? 70 : 54);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = `900 34px ${MONO}`;
      g.lineWidth = 6;
      g.strokeStyle = 'rgba(0,0,0,0.8)';
      g.strokeText(b.text, CANVAS_W / 2, y - 6);
      g.fillStyle = b.color;
      g.fillText(b.text, CANVAS_W / 2, y - 6);
      if (b.sub) {
        g.font = `600 14px ${MONO}`;
        g.fillStyle = '#cbd5e1';
        g.fillText(b.sub, CANVAS_W / 2, y + 22);
      }
      g.globalAlpha = 1;
    });
  }

  private drawDebug(world: World, fps: number): void {
    const g = this.g;
    g.font = `600 10px ${MONO}`;
    g.textAlign = 'right';
    g.textBaseline = 'bottom';
    g.fillStyle = 'rgba(148,163,184,0.7)';
    g.fillText(`${fps} FPS · ECS ${world.size} ${t('entities', 'entidades')}`, CANVAS_W - 32, CANVAS_H - 4);
  }

  private hpBar(x: number, y: number, w: number, ratio: number, color: string): void {
    const g = this.g;
    g.fillStyle = 'rgba(0,0,0,0.6)';
    g.fillRect(x - w / 2 - 1, y - 1, w + 2, 6);
    g.fillStyle = ratio > 0.5 ? color : ratio > 0.25 ? '#fbbf24' : '#ef4444';
    g.fillRect(x - w / 2, y, w * Math.max(0, ratio), 4);
  }
}
