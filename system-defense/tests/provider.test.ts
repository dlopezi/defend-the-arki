import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LANES, MODES, POD_RESTART_TIME, PROVIDER_FAILURE_WAVE, REGION_RECOVERY_TIME, type Mode } from '../src/config';
import { buildWave } from '../src/game/waves';
import { seedRandom, Sim } from './harness';

/* Provider failure: the game takes down part of the system by itself, so the Player always sees the level's rule. */

let restore: () => void;
beforeEach(() => {
  restore = seedRandom(11);
});
afterEach(() => restore());

/** A quiet game with plenty of CU, before any wave. */
function quiet(mode: Mode): Sim {
  const sim = new Sim(mode, { quiet: true });
  sim.ctx.cu = 10_000;
  return sim;
}

/** Wave `n` was just mitigated (no threats left): the break starts on the next step. */
function endWave(sim: Sim, n: number): Sim {
  const w = sim.ctx.wave;
  w.number = n;
  w.phase = 'clearing';
  w.timer = 30;
  w.next = buildWave(n + 1, MODES[sim.ctx.mode].waves);
  return sim;
}

/** Places `count` Redis walls in a lane. */
function fortify(sim: Sim, lane: number, count: number): void {
  for (let col = 0; col < count; col++) sim.place('redis', lane, col, { ignoreCooldown: true });
}

/** From the break before the failure wave to just after that wave starts. */
function throughBreak(sim: Sim): void {
  sim.runUntil(() => sim.ctx.wave.number === PROVIDER_FAILURE_WAVE, 20);
  sim.step();
}

const defensesIn = (sim: Sim, lane: number) => sim.ctx.grid[lane].filter((e) => e !== null).length;
const rollbackIn = (sim: Sim, lane: number) => sim.world.query('rollback').some((e) => sim.world.req(e, 'rollback').lane === lane);

describe('Provider failure', () => {
  it('happens in wave 3 of levels 2 to 4', () => {
    expect(PROVIDER_FAILURE_WAVE).toBe(3);
  });

  it('is warned in the break before wave 3, not before', () => {
    const early = endWave(quiet('microservices'), 1);
    early.step();
    expect(early.ctx.wave.phase).toBe('break');
    expect(early.ctx.provider?.state).not.toBe('warned');

    const sim = quiet('microservices');
    fortify(sim, 3, 2);
    endWave(sim, 2);
    sim.step();
    expect(sim.ctx.wave.phase).toBe('break');
    expect(sim.ctx.provider).toMatchObject({ state: 'warned', lanes: [3] });
  });

  it('never happens in the Monolith', () => {
    const sim = quiet('monolith');
    fortify(sim, 1, 2);
    endWave(sim, 2);
    throughBreak(sim);
    expect(sim.ctx.provider).toBeNull();
    expect(sim.ctx.lanesAlive.every(Boolean)).toBe(true);
    expect(sim.ctx.status).toBe('playing');
  });

  it('Microservices: the service with most defenses falls for good, with its defenses and Rollback', () => {
    const sim = quiet('microservices');
    fortify(sim, 1, 1);
    fortify(sim, 3, 3);
    endWave(sim, 2);
    throughBreak(sim);
    expect(sim.ctx.lanesAlive).toEqual([true, true, true, false, true]);
    expect(defensesIn(sim, 3)).toBe(0);
    expect(defensesIn(sim, 1)).toBe(1);
    expect(rollbackIn(sim, 3)).toBe(false);
    expect(sim.ctx.laneRestart[3]).toBe(0);
    expect(sim.ctx.provider?.state).toBe('done');
    expect(sim.ctx.incidents.at(-1)).toMatchObject({ kind: 'provider', lane: 3, wave: PROVIDER_FAILURE_WAVE });
  });

  it('with a tie in defenses, the middle lane falls', () => {
    const sim = quiet('microservices');
    endWave(sim, 2);
    throughBreak(sim);
    expect(sim.ctx.lanesAlive).toEqual([true, true, false, true, true]);
  });

  it('Kubernetes: the pod with most defenses falls and restarts by itself', () => {
    const sim = quiet('kubernetes');
    fortify(sim, 0, 2);
    endWave(sim, 2);
    throughBreak(sim);
    expect(sim.ctx.lanesAlive[0]).toBe(false);
    expect(sim.ctx.laneRestart[0]).toBeCloseTo(POD_RESTART_TIME, 0);
    sim.run(POD_RESTART_TIME + 0.5);
    expect(sim.ctx.lanesAlive[0]).toBe(true);
  });

  it('Multi-region: eu-west (the larger region) falls and comes back; us-east stays up', () => {
    const sim = quiet('multiRegion');
    fortify(sim, 4, 3);
    endWave(sim, 2);
    sim.step();
    expect(sim.ctx.provider).toMatchObject({ state: 'warned', lanes: [0, 1, 2] });
    throughBreak(sim);
    expect(sim.ctx.lanesAlive).toEqual([false, false, false, true, true]);
    expect(sim.ctx.laneRestart[0]).toBeCloseTo(REGION_RECOVERY_TIME, 0);
  });

  it('never takes down the last service still up', () => {
    const sim = quiet('microservices');
    endWave(sim, 2);
    for (let lane = 0; lane < LANES - 1; lane++) sim.ctx.lanesAlive[lane] = false;
    throughBreak(sim);
    expect(sim.ctx.lanesAlive[4]).toBe(true);
    expect(sim.ctx.provider?.state).toBe('skipped');
    expect(sim.ctx.status).toBe('playing');
  });

  it('Multi-region: skipped when us-east is already down (eu-west would be the last region)', () => {
    const sim = quiet('multiRegion');
    endWave(sim, 2);
    sim.step();
    sim.ctx.lanesAlive[3] = false;
    sim.ctx.lanesAlive[4] = false;
    sim.ctx.laneRestart[3] = 99;
    sim.ctx.laneRestart[4] = 99;
    throughBreak(sim);
    expect(sim.ctx.lanesAlive.slice(0, 3)).toEqual([true, true, true]);
    expect(sim.ctx.provider?.state).toBe('skipped');
  });

  it('queues its concept card the first time, when cards are on', () => {
    const sim = quiet('microservices');
    endWave(sim, 2);
    sim.ctx.learnEnabled = true;
    throughBreak(sim);
    expect(sim.ctx.conceptQueue).toContain('providerFailure');
  });
});
