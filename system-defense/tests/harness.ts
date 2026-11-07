import { colX, FIXED_DT, laneY, LANES, MODES, upgradePanelRect, type DefenseType, type EnemyType, type Mode } from '../src/config';
import { World, type Entity } from '../src/ecs/World';
import { createEnemy, createRollback } from '../src/game/factories';
import { createContext, type GameContext } from '../src/game/GameContext';
import { stepGame } from '../src/game/step';

/** Deterministic Math.random (mulberry32). Returns a function that restores the original. */
export function seedRandom(seed: number): () => void {
  const original = Math.random;
  let a = seed >>> 0;
  Math.random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => {
    Math.random = original;
  };
}

/**
 * Headless game: the real ECS world, context and systems, without canvas or DOM.
 * Clicks go through the real InputSystem, like a player's mouse.
 */
export class Sim {
  world = new World();
  ctx: GameContext;

  /** `quiet`: no waves and no CU from the sky, so a test controls every threat. */
  constructor(mode: Mode, opts: { quiet?: boolean } = {}) {
    this.ctx = createContext(mode);
    this.ctx.status = 'playing';
    if (MODES[mode].rollback) for (let lane = 0; lane < LANES; lane++) createRollback(this.world, lane);
    if (opts.quiet) {
      this.ctx.wave.timer = 1e9;
      this.ctx.skyTimer = 1e9;
    }
  }

  step(n = 1): void {
    for (let i = 0; i < n; i++) stepGame(this.world, this.ctx, FIXED_DT);
  }

  run(seconds: number): void {
    this.step(Math.round(seconds / FIXED_DT));
  }

  /** Runs until `done()` or the time limit. Returns the seconds it took (Infinity if never). */
  runUntil(done: () => boolean, maxSeconds: number): number {
    const steps = Math.round(maxSeconds / FIXED_DT);
    for (let i = 0; i < steps; i++) {
      if (done()) return i * FIXED_DT;
      this.step();
    }
    return done() ? maxSeconds : Infinity;
  }

  click(x: number, y: number): void {
    this.ctx.input.clicks.push({ x, y });
    this.ctx.input.hover = { x, y };
    this.step();
  }

  /** Selects a card and clicks a cell. Returns the new defense or null. */
  place(type: DefenseType, lane: number, col: number, opts: { ignoreCooldown?: boolean } = {}): Entity | null {
    if (opts.ignoreCooldown) this.ctx.cooldowns[type] = 0;
    this.ctx.selected = type;
    this.click(colX(col), laneY(lane));
    this.ctx.selected = null;
    return this.ctx.grid[lane][col];
  }

  /** Opens the upgrade panel of a defense and clicks its button. */
  upgrade(lane: number, col: number): void {
    this.ctx.selected = null;
    this.click(colX(col), laneY(lane));
    const r = upgradePanelRect(lane, col);
    this.click(r.x + r.w / 2, r.y + r.h / 2);
  }

  spawn(type: EnemyType, lane: number, x?: number): Entity {
    return createEnemy(this.world, type, lane, 1, x);
  }

  enemies(): Entity[] {
    return this.world.query('enemy');
  }

  defenses(): Entity[] {
    return this.world.query('defense');
  }

  x(e: Entity): number {
    return this.world.req(e, 'transform').x;
  }

  /** Clicks every CU on the board that is not collected yet. Returns how many. */
  collectAll(): number {
    let n = 0;
    for (const e of this.world.query('collectible', 'transform')) {
      if (this.world.req(e, 'collectible').collected) continue;
      const t = this.world.req(e, 'transform');
      this.ctx.input.clicks.push({ x: t.x, y: t.y });
      n++;
    }
    if (n) this.step();
    return n;
  }
}
