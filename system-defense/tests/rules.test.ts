import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BREACH_X, colX, COLS, DEFENSES, ENEMIES, GRID_RIGHT, GRID_X, LANES, POD_RESTART_TIME, START_CU, WORKER_AMOUNT, WORKER_FIRST } from '../src/config';
import { canUpgrade } from '../src/systems/InputSystem';
import { seedRandom, Sim } from './harness';

/* Game rules from the original spec, checked on the real engine (no screen). */

let restore: () => void;
beforeEach(() => {
  restore = seedRandom(42);
});
afterEach(() => restore());

describe('placing defenses', () => {
  it('costs CU, fills the cell and starts the card recharge', () => {
    const sim = new Sim('monolith', { quiet: true });
    expect(sim.ctx.cu).toBe(START_CU);
    expect(sim.place('worker', 0, 0)).not.toBeNull();
    expect(sim.ctx.cu).toBe(START_CU - DEFENSES.worker.cost);
    expect(sim.ctx.cooldowns.worker).toBeGreaterThan(0);
    expect(sim.place('loadBalancer', 1, 1)).not.toBeNull();
    expect(sim.ctx.cu).toBe(0);
  });

  it('refuses a full cell, a recharging card and missing CU', () => {
    const sim = new Sim('monolith', { quiet: true });
    sim.place('worker', 0, 0);
    const before = sim.defenses().length;
    // same cell
    sim.place('worker', 0, 0, { ignoreCooldown: true });
    // recharging card (Redis starts recharging)
    sim.place('redis', 2, 0);
    // not enough CU
    sim.ctx.cu = 10;
    sim.place('loadBalancer', 3, 0);
    expect(sim.defenses().length).toBe(before);
    expect(sim.ctx.cu).toBe(10);
  });

  it('costs match the spec (Worker 50, LB 100, Redis 50, Rate Limiter 175, Circuit Breaker 150)', () => {
    expect([DEFENSES.worker.cost, DEFENSES.loadBalancer.cost, DEFENSES.redis.cost, DEFENSES.rateLimiter.cost, DEFENSES.circuitBreaker.cost]).toEqual([
      50, 100, 50, 175, 150,
    ]);
  });
});

describe('economy', () => {
  it('a Worker Node makes CU that the player can collect', () => {
    const sim = new Sim('monolith', { quiet: true });
    sim.place('worker', 2, 0);
    const cu = sim.ctx.cu;
    sim.run(WORKER_FIRST + 0.5);
    expect(sim.world.query('collectible').length).toBe(1);
    expect(sim.collectAll()).toBe(1);
    expect(sim.ctx.cu).toBe(cu + WORKER_AMOUNT);
  });

  it('CU fall from the sky', () => {
    const sim = new Sim('monolith');
    sim.run(13);
    expect(sim.world.query('collectible').length).toBeGreaterThan(0);
  });
});

describe('defenses', () => {
  it('do not hurt a threat before it touches the board', () => {
    const sim = new Sim('monolith', { quiet: true });
    sim.ctx.cu = 1000;
    sim.place('loadBalancer', 2, COLS - 1, { ignoreCooldown: true });
    const e = sim.spawn('normal', 2, GRID_RIGHT + 70);
    const front = () => sim.x(e) - ENEMIES.normal.width / 2;
    sim.runUntil(() => front() <= GRID_RIGHT + 1, 10);
    const h = sim.world.req(e, 'health');
    expect(h.hp).toBe(h.max);
    // once it is on the board, it gets hit
    sim.run(2);
    expect(h.hp).toBeLessThan(h.max);
  });

  it('a Load Balancer kills Tráfico Normal in its lane only', () => {
    const sim = new Sim('monolith', { quiet: true });
    sim.place('loadBalancer', 2, 0);
    const target = sim.spawn('normal', 2, colX(6));
    const other = sim.spawn('normal', 4, colX(6));
    const t = sim.runUntil(() => !sim.world.isAlive(target), 20);
    expect(t).toBeLessThan(15);
    expect(sim.world.isAlive(other)).toBe(true);
    expect(sim.world.req(other, 'health').hp).toBe(sim.world.req(other, 'health').max);
  });

  it('a Rate Limiter slows a threat by 50%', () => {
    const sim = new Sim('monolith', { quiet: true });
    sim.ctx.cu = 1000;
    sim.place('rateLimiter', 1, 0, { ignoreCooldown: true });
    const slowed = sim.spawn('scraper', 1, colX(6));
    const normal = sim.spawn('scraper', 3, colX(6));
    sim.runUntil(() => sim.world.has(slowed, 'slowed'), 10);
    const [a0, b0] = [sim.x(slowed), sim.x(normal)];
    sim.run(2);
    const ratio = (a0 - sim.x(slowed)) / (b0 - sim.x(normal));
    expect(ratio).toBeCloseTo(0.5, 1);
  });

  it('a Circuit Breaker wipes the 3×3 area after 1 second', () => {
    const sim = new Sim('monolith', { quiet: true });
    sim.ctx.cu = 1000;
    sim.place('circuitBreaker', 2, 4, { ignoreCooldown: true });
    const inside = [1, 2, 3].flatMap((lane) => [sim.spawn('normal', lane, colX(4) + 10), sim.spawn('normal', lane, colX(5))]);
    const outside = [sim.spawn('normal', 0, colX(4)), sim.spawn('normal', 2, colX(8))];
    sim.run(0.9);
    expect(inside.every((e) => sim.world.isAlive(e))).toBe(true);
    sim.run(0.3);
    expect(inside.some((e) => sim.world.isAlive(e))).toBe(false);
    expect(outside.every((e) => sim.world.isAlive(e))).toBe(true);
    expect(sim.ctx.grid[2][4]).toBeNull();
  });

  it('Redis Cache blocks and absorbs traffic', () => {
    const sim = new Sim('monolith', { quiet: true });
    sim.ctx.cu = 1000;
    const redis = sim.place('redis', 0, 3, { ignoreCooldown: true });
    expect(redis).not.toBeNull();
    const e = sim.spawn('normal', 0, colX(5));
    sim.run(20);
    expect(sim.world.isAlive(e)).toBe(true);
    expect(sim.x(e)).toBeGreaterThan(colX(3));
    expect(sim.world.req(e, 'enemy').state).toBe('attack');
    const h = sim.world.req(redis!, 'health');
    expect(h.hp).toBeLessThan(h.max);
  });

  it('SQL Injection goes through Redis', () => {
    const sim = new Sim('monolith', { quiet: true });
    sim.ctx.cu = 1000;
    sim.place('redis', 0, 3, { ignoreCooldown: true });
    const e = sim.spawn('sqli', 0, colX(5));
    sim.run(12);
    expect(sim.x(e)).toBeLessThan(colX(3) - 40);
  });

  it('Kafka holds a threat for a while', () => {
    const sim = new Sim('monolith', { quiet: true });
    sim.ctx.cu = 1000;
    sim.place('kafka', 3, 3, { ignoreCooldown: true });
    const e = sim.spawn('normal', 3, colX(4));
    sim.runUntil(() => sim.world.req(e, 'enemy').state === 'held', 10);
    const x = sim.x(e);
    sim.run(2);
    expect(sim.x(e)).toBe(x);
  });

  it('upgrading to v2 costs the defense price and changes it', () => {
    const sim = new Sim('monolith', { quiet: true });
    sim.ctx.cu = 1000;
    const lb = sim.place('loadBalancer', 0, 0)!;
    const cu = sim.ctx.cu;
    sim.upgrade(0, 0);
    expect(sim.world.req(lb, 'defense').level).toBe(2);
    expect(sim.world.req(lb, 'shooter').shots).toBe(2);
    expect(sim.ctx.cu).toBe(cu - DEFENSES.loadBalancer.cost);
    sim.place('circuitBreaker', 4, 4, { ignoreCooldown: true });
    expect(canUpgrade(sim.world, sim.ctx, 4, 4)).toBe(false);
  });
});

describe('threats', () => {
  it('Zero-Day jumps the first defense, then walks and stops at the next one', () => {
    const sim = new Sim('monolith', { quiet: true });
    sim.ctx.cu = 1000;
    sim.place('redis', 1, 4, { ignoreCooldown: true });
    sim.place('redis', 1, 1, { ignoreCooldown: true });
    const e = sim.spawn('zeroDay', 1, colX(6));
    // wait until it lands on the other side of the first Redis
    sim.runUntil(() => sim.x(e) < colX(4) - 50 && sim.world.req(e, 'enemy').state === 'walk', 10);
    expect(sim.world.req(e, 'jumper').jumped).toBe(true);
    expect(sim.ctx.grid[1][4]).not.toBeNull();
    sim.runUntil(() => sim.world.req(e, 'enemy').state === 'attack', 20);
    expect(sim.x(e)).toBeGreaterThan(colX(1));
    expect(sim.x(e)).toBeLessThan(colX(2));
  });

  it('Zero-Day cannot jump the WAF', () => {
    const sim = new Sim('monolith', { quiet: true });
    sim.ctx.cu = 1000;
    sim.place('waf', 3, 4, { ignoreCooldown: true });
    const e = sim.spawn('zeroDay', 3, colX(6));
    sim.run(10);
    expect(sim.x(e)).toBeGreaterThan(colX(4));
    expect(sim.world.req(e, 'enemy').state).toBe('attack');
  });

  it('Black Friday destroys a defense with one hit', () => {
    const sim = new Sim('monolith', { quiet: true });
    sim.ctx.cu = 1000;
    sim.place('redis', 2, 2, { ignoreCooldown: true });
    sim.spawn('blackFriday', 2, colX(2) + 80);
    const t = sim.runUntil(() => sim.ctx.grid[2][2] === null, 5);
    expect(t).toBeLessThan(2.5);
  });

  it('a Botnet splits into 3 bots when it dies', () => {
    const sim = new Sim('monolith', { quiet: true });
    const e = sim.spawn('botnet', 2, colX(6));
    sim.world.req(e, 'health').hp = 0;
    sim.step();
    const bots = sim.enemies().filter((x) => sim.world.req(x, 'enemy').type === 'botlet');
    expect(bots.length).toBe(3);
  });

  it('Black Friday splits into 6 Normal Traffic requests when it dies', () => {
    const sim = new Sim('monolith', { quiet: true });
    const e = sim.spawn('blackFriday', 2, colX(6));
    sim.world.req(e, 'health').hp = 0;
    sim.step();
    const left = sim.enemies().map((x) => sim.world.req(x, 'enemy').type);
    expect(left.filter((t) => t === 'normal').length).toBe(6);
    expect(left).not.toContain('blackFriday');
  });

  it('a DDoS splits into 4 fake requests when it dies', () => {
    const sim = new Sim('monolith', { quiet: true });
    const e = sim.spawn('ddos', 2, colX(6));
    sim.world.req(e, 'health').hp = 0;
    sim.step();
    const left = sim.enemies().map((x) => sim.world.req(x, 'enemy').type);
    expect(left.filter((t) => t === 'fakeRequest').length).toBe(4);
  });

  it('every threat type moves toward the base', () => {
    const types = ['normal', 'scraper', 'ddos', 'zeroDay', 'blackFriday', 'sqli', 'botnet', 'botlet', 'fakeRequest', 'slowloris', 'ransomware', 'memoryLeak'] as const;
    for (const type of types) {
      const sim = new Sim('monolith', { quiet: true });
      const e = sim.spawn(type, 2, colX(6));
      const x0 = sim.x(e);
      sim.run(2);
      expect(sim.x(e), type).toBeLessThan(x0);
    }
  });
});

describe('levels: the Game Over rule', () => {
  it('Monolith: one breach in any lane takes the whole system down', () => {
    const sim = new Sim('monolith', { quiet: true });
    sim.spawn('normal', 3, BREACH_X + 5);
    sim.run(1);
    expect(sim.ctx.status).toBe('gameover');
  });

  it('Microservices: Rollback first, then only that lane falls; all 5 down = Game Over', () => {
    const sim = new Sim('microservices', { quiet: true });
    sim.place('worker', 1, 3);
    // 1st threat: the lane's Rollback sweeps it away
    const first = sim.spawn('normal', 1, GRID_X + 40);
    sim.run(3);
    expect(sim.world.isAlive(first)).toBe(false);
    expect(sim.ctx.lanesAlive[1]).toBe(true);
    // 2nd threat: no Rollback left, the service falls with its defenses
    sim.spawn('normal', 1, GRID_X + 40);
    sim.run(4);
    expect(sim.ctx.lanesAlive[1]).toBe(false);
    expect(sim.ctx.grid[1].every((c) => c === null)).toBe(true);
    expect(sim.defenses().length).toBe(0);
    expect(sim.ctx.status).toBe('playing');
    // the other 4 lanes fall too (their Rollbacks removed first)
    for (const rb of sim.world.query('rollback')) sim.world.destroy(rb);
    for (const lane of [0, 2, 3, 4]) sim.spawn('normal', lane, BREACH_X + 5);
    sim.run(2);
    expect(sim.ctx.lanesAlive.every((a) => !a)).toBe(true);
    expect(sim.ctx.status).toBe('gameover');
  });

  it('Kubernetes: a fallen lane restarts by itself after 30 s', () => {
    const sim = new Sim('kubernetes', { quiet: true });
    for (const rb of sim.world.query('rollback')) sim.world.destroy(rb);
    sim.spawn('normal', 2, BREACH_X + 5);
    sim.run(1);
    expect(sim.ctx.lanesAlive[2]).toBe(false);
    sim.run(POD_RESTART_TIME - 2);
    expect(sim.ctx.lanesAlive[2]).toBe(false);
    sim.run(2);
    expect(sim.ctx.lanesAlive[2]).toBe(true);
    expect(sim.ctx.status).toBe('playing');
  });

  it('Kubernetes: all 5 lanes down at the same time = Game Over', () => {
    const sim = new Sim('kubernetes', { quiet: true });
    for (const rb of sim.world.query('rollback')) sim.world.destroy(rb);
    for (let lane = 0; lane < LANES; lane++) sim.spawn('normal', lane, BREACH_X + 5);
    sim.run(1);
    expect(sim.ctx.status).toBe('gameover');
  });

  it('Multi-region: a breach takes down its whole region with its defenses; the other region stays up', () => {
    const sim = new Sim('multiRegion', { quiet: true });
    for (const rb of sim.world.query('rollback')) sim.world.destroy(rb);
    sim.place('worker', 0, 3);
    sim.place('worker', 3, 3, { ignoreCooldown: true });
    sim.spawn('normal', 1, BREACH_X + 5);
    sim.run(1);
    // eu-west (lanes 1–3) falls with its defenses; us-east (lanes 4–5) keeps working
    expect(sim.ctx.lanesAlive).toEqual([false, false, false, true, true]);
    expect(sim.ctx.grid[0][3]).toBeNull();
    expect(sim.ctx.grid[3][3]).not.toBeNull();
    expect(sim.ctx.status).toBe('playing');
  });

  it('Multi-region: failover, while a region is down new threats arrive only in the other region', () => {
    const sim = new Sim('multiRegion', { quiet: true });
    for (const rb of sim.world.query('rollback')) sim.world.destroy(rb);
    sim.spawn('normal', 4, BREACH_X + 5);
    sim.run(1);
    expect(sim.ctx.lanesAlive).toEqual([true, true, true, false, false]);
    // start the first wave now: its threats must all go to eu-west (lanes 1–3)
    sim.ctx.wave.timer = 0;
    sim.runUntil(() => sim.ctx.wave.spawned >= 5, 40);
    const lanes = sim.enemies().map((e) => sim.world.req(e, 'lane').lane);
    expect(lanes.length).toBe(5);
    expect(lanes.every((lane) => lane <= 2)).toBe(true);
  });

  it('Multi-region: a fallen region comes back by itself after 45 s, without defenses', () => {
    const sim = new Sim('multiRegion', { quiet: true });
    for (const rb of sim.world.query('rollback')) sim.world.destroy(rb);
    sim.place('worker', 3, 2);
    sim.spawn('normal', 3, BREACH_X + 5);
    sim.run(1);
    expect(sim.ctx.lanesAlive).toEqual([true, true, true, false, false]);
    sim.run(45 - 2);
    expect(sim.ctx.lanesAlive).toEqual([true, true, true, false, false]);
    sim.run(2);
    expect(sim.ctx.lanesAlive).toEqual([true, true, true, true, true]);
    expect(sim.ctx.grid[3][2]).toBeNull();
    expect(sim.ctx.status).toBe('playing');
  });

  it('Multi-region: one region down is not Game Over; both down at the same time is', () => {
    const sim = new Sim('multiRegion', { quiet: true });
    for (const rb of sim.world.query('rollback')) sim.world.destroy(rb);
    sim.spawn('normal', 0, BREACH_X + 5);
    sim.run(1);
    expect(sim.ctx.status).toBe('playing');
    // eu-west is still coming back when us-east falls
    sim.spawn('normal', 4, BREACH_X + 5);
    sim.run(1);
    expect(sim.ctx.status).toBe('gameover');
  });

  it('Multi-region: every lane has a Rollback; a fallen region loses its Rollbacks for good', () => {
    const sim = new Sim('multiRegion', { quiet: true });
    const rollbackLanes = () => sim.world.query('rollback').map((e) => sim.world.req(e, 'rollback').lane).sort();
    expect(rollbackLanes()).toEqual([0, 1, 2, 3, 4]);
    // 1st threat in lane 2: its Rollback sweeps it away and the region stays up
    const first = sim.spawn('normal', 1, GRID_X + 40);
    sim.run(3);
    expect(sim.world.isAlive(first)).toBe(false);
    expect(sim.ctx.lanesAlive.every(Boolean)).toBe(true);
    // 2nd threat in the same lane: no Rollback left, so eu-west falls with all its Rollbacks
    sim.spawn('normal', 1, GRID_X + 40);
    sim.run(4);
    expect(sim.ctx.lanesAlive).toEqual([false, false, false, true, true]);
    sim.run(45);
    expect(sim.ctx.lanesAlive.every(Boolean)).toBe(true);
    expect(rollbackLanes()).toEqual([3, 4]);
  });

  it('the last wave cleared = victory', () => {
    const sim = new Sim('monolith', { quiet: true });
    Object.assign(sim.ctx.wave, { number: 10, phase: 'clearing', timer: 30 });
    sim.step();
    expect(sim.ctx.status).toBe('victory');
  });
});
