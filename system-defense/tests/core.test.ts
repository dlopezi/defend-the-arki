import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { COLS, DEFENSE_ORDER, DEFENSES, ENEMIES, ENEMY_ORDER, LANES, MODE_ORDER, MODES, type EnemyType } from '../src/config';
import { World } from '../src/ecs/World';
import { buildWave, countByType } from '../src/game/waves';
import { CONCEPT_TABLES, type ConceptId } from '../src/learn/concepts';
import { DEFENSE_ART } from '../src/render/defenseArt';
import { ENEMY_ART } from '../src/render/enemyArt';
import { seedRandom } from './harness';

describe('ECS world', () => {
  it('creates entities, queries by components and destroys at flush', () => {
    const w = new World();
    const a = w.create();
    const b = w.create();
    w.add(a, 'transform', { x: 1, y: 2 });
    w.add(b, 'transform', { x: 3, y: 4 });
    w.add(b, 'lane', { lane: 2 });
    expect(w.query('transform').length).toBe(2);
    expect(w.query('transform', 'lane')).toEqual([b]);
    w.destroy(b);
    expect(w.isAlive(b)).toBe(false);
    // still stored until the end of the tick
    expect(w.get(b, 'lane')).toBeDefined();
    w.flush();
    expect(w.query('transform')).toEqual([a]);
    expect(w.get(b, 'lane')).toBeUndefined();
    expect(() => w.req(b, 'transform')).toThrow();
  });
});

describe('config', () => {
  it('board is 5 lanes × 9 columns', () => {
    expect(LANES).toBe(5);
    expect(COLS).toBe(9);
  });

  it('every defense and threat has sane numbers', () => {
    for (const d of DEFENSE_ORDER) {
      const s = DEFENSES[d];
      expect(s.cost, d).toBeGreaterThan(0);
      expect(s.hp, d).toBeGreaterThan(0);
      expect(s.cooldown, d).toBeGreaterThanOrEqual(0);
    }
    for (const e of Object.keys(ENEMIES) as EnemyType[]) {
      const s = ENEMIES[e];
      expect(s.hp, e).toBeGreaterThan(0);
      expect(s.speed, e).toBeGreaterThan(0);
      expect(s.width, e).toBeGreaterThan(0);
    }
    // spec: DDoS slow with very high hp, Black Friday the slowest with the most hp
    expect(ENEMIES.ddos.speed).toBeLessThan(ENEMIES.normal.speed);
    expect(ENEMIES.ddos.hp).toBeGreaterThan(ENEMIES.scraper.hp);
    expect(ENEMIES.scraper.hp).toBeGreaterThan(ENEMIES.normal.hp);
    expect(ENEMIES.zeroDay.speed).toBeGreaterThan(ENEMIES.normal.speed);
    for (const e of Object.keys(ENEMIES) as EnemyType[]) {
      if (e === 'blackFriday') continue;
      expect(ENEMIES.blackFriday.hp).toBeGreaterThan(ENEMIES[e].hp);
      expect(ENEMIES.blackFriday.speed).toBeLessThanOrEqual(ENEMIES[e].speed);
    }
  });

  it('every element has a drawing and a concept card in both languages', () => {
    for (const d of DEFENSE_ORDER) expect(DEFENSE_ART[d], d).toBeTypeOf('function');
    for (const e of Object.keys(ENEMIES) as EnemyType[]) expect(ENEMY_ART[e], e).toBeTypeOf('function');
    const ids: ConceptId[] = [...DEFENSE_ORDER, ...(ENEMY_ORDER as ConceptId[]), 'rollback'];
    for (const [lang, table] of Object.entries(CONCEPT_TABLES)) {
      for (const id of ids) expect(table[id]?.real, `${lang}: ${id}`).toBeTruthy();
      // same cards, same kind and same link in English and Spanish
      expect(Object.keys(table).sort(), lang).toEqual(Object.keys(CONCEPT_TABLES.en).sort());
      for (const id of ids) {
        expect(table[id].kind, `${lang}: ${id}`).toBe(CONCEPT_TABLES.en[id].kind);
        expect(table[id].read, `${lang}: ${id}`).toBe(CONCEPT_TABLES.en[id].read);
      }
    }
    expect(MODE_ORDER).toEqual(['monolith', 'microservices', 'kubernetes', 'multiRegion']);
  });
});

describe('waves', () => {
  let restore: () => void;
  beforeEach(() => {
    restore = seedRandom(7);
  });
  afterEach(() => restore());

  it('Level 1 has 8 waves; levels 2 to 4 have 5 (they only add their rule)', () => {
    expect(MODE_ORDER.map((m) => MODES[m].waves)).toEqual([8, 5, 5, 5]);
  });

  it.each([8, 5])('get bigger and harder every wave (%i waves)', (total) => {
    let prevCount = 0;
    let prevHp = 0;
    for (let n = 1; n <= total; n++) {
      const w = buildWave(n, total);
      expect(w.queue.length).toBeGreaterThan(prevCount);
      expect(w.hpScale).toBeGreaterThan(prevHp);
      expect(w.interval).toBeGreaterThan(0);
      expect(w.surgeAt).toBeLessThan(w.queue.length);
      expect(w.queue.slice(0, 2)).toEqual(['normal', 'normal']);
      prevCount = w.queue.length;
      prevHp = w.hpScale;
    }
  });

  it('Black Friday: in level 1 at waves 4 and 8 (twice in the last); in a 5-wave level only as the final boss', () => {
    const bf = (n: number, total: number) => buildWave(n, total).queue.filter((t) => t === 'blackFriday').length;
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((n) => bf(n, 8))).toEqual([0, 0, 0, 1, 0, 0, 0, 2]);
    expect([1, 2, 3, 4, 5].map((n) => bf(n, 5))).toEqual([0, 0, 0, 0, 2]);
  });

  it.each([8, 5])('every threat shows up in a level of %i waves, whatever the random draw', (total) => {
    for (let seed = 1; seed <= 30; seed++) {
      const undo = seedRandom(seed);
      const seen = new Set<EnemyType>();
      for (let n = 1; n <= total; n++) for (const type of buildWave(n, total).queue) seen.add(type);
      undo();
      expect([...seen].sort()).toEqual([...ENEMY_ORDER].sort());
    }
  });

  it('the preview counts every threat of the wave', () => {
    const w = buildWave(4, 5);
    const total = countByType(w.queue).reduce((s, c) => s + c.count, 0);
    expect(total).toBe(w.queue.length);
  });
});
