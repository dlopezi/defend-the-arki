import { afterEach, describe, expect, it } from 'vitest';
import { CANVAS_W, colX, COLS, DEFENSES, FIXED_DT, LANES, MODE_ORDER, type DefenseType, type Mode } from '../src/config';
import { stepGame } from '../src/game/step';
import { seedRandom, Sim } from './harness';

/*
 * Soak and load tests of the engine (no screen):
 * - a bot plays full games in the 3 levels with several random seeds;
 * - a stress test runs hundreds of threats at the same time.
 * They check that nothing throws, no number turns into NaN, the number of entities
 * stays bounded (no leaks) and one logic step stays far below the 16.7 ms frame budget.
 */

let restore: (() => void) | null = null;
afterEach(() => {
  restore?.();
  restore = null;
});

/** Cells the bot wants, in order, for each lane. */
const PLAN: [DefenseType, number][] = [
  ['worker', 0],
  ['loadBalancer', 1],
  ['loadBalancer', 2],
  ['redis', 6],
  ['rateLimiter', 3],
  ['worker', 4],
  ['waf', 7],
  ['cdn', 5],
  ['kafka', 8],
];

/** A simple player: collects CU, builds the plan lane by lane, upgrades, uses Circuit Breakers. */
function botTurn(sim: Sim, style: 'smart' | 'chaos'): void {
  const { ctx, world } = sim;
  sim.collectAll();
  // Circuit Breaker on a crowded lane
  if (ctx.cu >= DEFENSES.circuitBreaker.cost && ctx.cooldowns.circuitBreaker <= 0) {
    for (let lane = 0; lane < LANES; lane++) {
      if (!ctx.lanesAlive[lane]) continue;
      const xs = world
        .query('enemy', 'lane', 'transform')
        .filter((e) => world.req(e, 'lane').lane === lane)
        .map((e) => world.req(e, 'transform').x)
        .filter((x) => x < colX(COLS - 1));
      if (xs.length >= 3) {
        const col = Math.max(0, Math.min(COLS - 1, Math.floor((Math.min(...xs) - colX(0)) / 100 + 0.5)));
        if (ctx.grid[lane][col] === null) {
          sim.place('circuitBreaker', lane, col);
          return;
        }
      }
    }
  }
  // a lane with a threat on screen and no shooter gets a Load Balancer first
  for (let lane = 0; lane < LANES; lane++) {
    if (!ctx.lanesAlive[lane]) continue;
    const threatened = world.query('enemy', 'lane', 'transform').some((e) => world.req(e, 'lane').lane === lane && world.req(e, 'transform').x < CANVAS_W);
    const shooters = world.query('shooter', 'gridCell').some((e) => world.req(e, 'gridCell').lane === lane);
    if (!threatened || shooters) continue;
    const col = [1, 2, 0, 3].find((c) => ctx.grid[lane][c] === null);
    if (col === undefined) continue;
    // save CU for it instead of spending on other things
    if (ctx.cu < DEFENSES.loadBalancer.cost || ctx.cooldowns.loadBalancer > 0) return;
    sim.place('loadBalancer', lane, col);
    return;
  }
  // build the plan
  for (const [type, col] of PLAN) {
    for (let lane = 0; lane < LANES; lane++) {
      if (!ctx.lanesAlive[lane] || ctx.grid[lane][col] !== null) continue;
      if (ctx.cu < DEFENSES[type].cost || ctx.cooldowns[type] > 0) continue;
      sim.place(type, lane, col);
      return;
    }
  }
  // spare CU: upgrade shooters
  if (ctx.cu > 300) {
    for (let lane = 0; lane < LANES; lane++) {
      for (const col of [1, 2, 3]) {
        const e = ctx.grid[lane][col];
        if (e !== null && world.get(e, 'defense')?.level === 1) {
          sim.upgrade(lane, col);
          return;
        }
      }
    }
  }
  // chaos: random clicks, random dismantles, random cards
  if (style === 'chaos') {
    const r = Math.random();
    if (r < 0.2) sim.click(Math.random() * CANVAS_W, Math.random() * 500);
    else if (r < 0.25) {
      ctx.selected = 'shovel';
      sim.click(colX(Math.floor(Math.random() * COLS)), 50 + Math.floor(Math.random() * LANES) * 100);
      ctx.selected = null;
    }
  }
}

interface Report {
  mode: Mode;
  seed: number;
  result: string;
  wave: number;
  minutes: number;
  kills: number;
  maxEntities: number;
  avgMs: number;
  p99Ms: number;
}

function checkSane(sim: Sim): void {
  const { world, ctx } = sim;
  for (const e of world.query('transform')) {
    const t = world.req(e, 'transform');
    if (!Number.isFinite(t.x) || !Number.isFinite(t.y)) throw new Error(`entity ${e} has a bad position`);
  }
  for (const e of world.query('health')) {
    if (Number.isNaN(world.req(e, 'health').hp)) throw new Error(`entity ${e} has NaN hp`);
  }
  if (!Number.isFinite(ctx.cu) || ctx.cu < 0) throw new Error(`bad CU: ${ctx.cu}`);
  for (let lane = 0; lane < LANES; lane++) {
    for (let col = 0; col < COLS; col++) {
      const e = ctx.grid[lane][col];
      if (e !== null && !world.isAlive(e)) throw new Error(`grid[${lane}][${col}] points to a dead entity`);
    }
  }
}

function playFullGame(mode: Mode, seed: number, style: 'smart' | 'chaos'): Report {
  restore = seedRandom(seed);
  const sim = new Sim(mode);
  const times: number[] = [];
  let maxEntities = 0;
  const limit = 40 * 60; // 40 minutes of game time
  let next = 0;
  while (sim.ctx.status === 'playing' && sim.ctx.time < limit) {
    if (sim.ctx.time >= next) {
      botTurn(sim, style);
      next = sim.ctx.time + 0.25;
    }
    const t0 = performance.now();
    stepGame(sim.world, sim.ctx, FIXED_DT);
    times.push(performance.now() - t0);
    if (times.length % 60 === 0) {
      checkSane(sim);
      maxEntities = Math.max(maxEntities, sim.world.query('transform').length);
    }
  }
  // let the end effects finish: the world must empty out (no leaks)
  for (let i = 0; i < 180; i++) stepGame(sim.world, sim.ctx, FIXED_DT);
  checkSane(sim);
  times.sort((a, b) => a - b);
  return {
    mode,
    seed,
    result: sim.ctx.status,
    wave: sim.ctx.wave.number,
    minutes: Math.round((sim.ctx.time / 60) * 10) / 10,
    kills: sim.ctx.kills,
    maxEntities,
    avgMs: Math.round((times.reduce((s, x) => s + x, 0) / times.length) * 1000) / 1000,
    p99Ms: Math.round(times[Math.floor(times.length * 0.99)] * 1000) / 1000,
  };
}

describe('soak: full games played by a bot', () => {
  const reports: Report[] = [];
  for (const mode of MODE_ORDER) {
    for (const [seed, style] of [
      [1, 'smart'],
      [2, 'smart'],
      [3, 'chaos'],
    ] as [number, 'smart' | 'chaos'][]) {
      it(`${mode} · seed ${seed} · ${style}`, () => {
        const r = playFullGame(mode, seed, style);
        reports.push(r);
        expect(['victory', 'gameover']).toContain(r.result);
        expect(r.maxEntities).toBeLessThan(2500);
        expect(r.p99Ms).toBeLessThan(8);
      });
    }
  }
  it('report', () => {
    console.table(reports);
    expect(reports.length).toBe(9);
  });
});

describe('load: hundreds of threats at the same time', () => {
  it('keeps one logic step far below the frame budget with a full board', () => {
    restore = seedRandom(99);
    const sim = new Sim('microservices', { quiet: true });
    sim.ctx.cu = 1e9;
    const types: DefenseType[] = ['loadBalancer', 'rateLimiter', 'cdn', 'redis', 'waf', 'worker', 'kafka', 'loadBalancer', 'redis'];
    for (let lane = 0; lane < LANES; lane++) {
      for (let col = 0; col < COLS; col++) sim.place(types[(col + lane) % types.length], lane, col, { ignoreCooldown: true });
    }
    expect(sim.defenses().length).toBe(LANES * COLS);
    // 500 threats, refilled while they die
    const kinds = ['normal', 'scraper', 'ddos', 'botnet', 'memoryLeak', 'sqli', 'ransomware', 'slowloris', 'zeroDay'] as const;
    const fill = () => {
      while (sim.enemies().length < 500) sim.spawn(kinds[Math.floor(Math.random() * kinds.length)], Math.floor(Math.random() * LANES), CANVAS_W + Math.random() * 600);
    };
    const times: number[] = [];
    let peak = 0;
    for (let i = 0; i < 60 * 60; i++) {
      if (i % 30 === 0) fill();
      const t0 = performance.now();
      stepGame(sim.world, sim.ctx, FIXED_DT);
      times.push(performance.now() - t0);
      peak = Math.max(peak, sim.world.query('transform').length);
      if (i % 120 === 0) checkSane(sim);
    }
    times.sort((a, b) => a - b);
    const avg = times.reduce((s, x) => s + x, 0) / times.length;
    const p99 = times[Math.floor(times.length * 0.99)];
    console.log(`load: 500 threats + 45 defenses · peak ${peak} entities · avg ${avg.toFixed(3)} ms · p99 ${p99.toFixed(3)} ms per step`);
    expect(p99).toBeLessThan(8);
  });
});
