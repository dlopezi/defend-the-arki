import { describe, expect, it } from 'vitest';
import { shade } from '../src/render/isoKit';
import { DEF_OPTIONS_R4 } from '../src/dev/defenseOptions4';
import { BOTLET_R5, THREAT_OPTIONS_R5 } from '../src/dev/threatOptionsR5';
import { THREAT_R6 } from '../src/dev/threatOptionsR6';
import { DEFENSE_ART, rollbackArt } from '../src/render/defenseArt';
import { ENEMY_ART } from '../src/render/enemyArt';

describe('isoKit shade', () => {
  it('mixes a colour toward white with a positive amount', () => {
    expect(shade('#000000', 0.5)).toBe('#808080');
    expect(shade('#204060', 1)).toBe('#ffffff');
  });

  it('mixes a colour toward black with a negative amount', () => {
    expect(shade('#ffffff', -0.5)).toBe('#808080');
    expect(shade('#4f8ef7', -1)).toBe('#000000');
  });

  it('keeps the colour with amount 0', () => {
    expect(shade('#4f8ef7', 0)).toBe('#4f8ef7');
  });
});

/** A 2D context that accepts every call and records nothing: enough to run the drawing code in Node. */
function fakeContext(): CanvasRenderingContext2D {
  const gradient = { addColorStop: () => undefined };
  const target: Record<string, unknown> = {};
  return new Proxy(target, {
    get(obj, key) {
      if (key in obj) return obj[key as string];
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient;
      if (key === 'measureText') return () => ({ width: 10 });
      return () => undefined;
    },
    set(obj, key, value) {
      obj[key as string] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

describe('defense avatars, round 4', () => {
  const items = ['worker', 'loadBalancer', 'redis', 'rateLimiter', 'circuitBreaker', 'waf', 'cdn', 'kafka', 'rollback'] as const;

  it('has option A and option B for every defense, each with a name and a real-world note', () => {
    for (const item of items) {
      for (const pick of ['A', 'B'] as const) {
        const opt = DEF_OPTIONS_R4[item][pick];
        expect(opt, `${item} ${pick}`).toBeDefined();
        expect(opt?.name.length).toBeGreaterThan(0);
        expect(opt?.ref.length).toBeGreaterThan(0);
      }
    }
  });

  it('draws every option at rest and in action, as v1 and v2, without errors', () => {
    const g = fakeContext();
    for (const item of items) {
      for (const pick of ['A', 'B'] as const) {
        for (const action of [false, true]) {
          for (const level of [1, 2] as const) {
            for (const t of [0, 0.4, 1.3]) {
              const anim = { t, action, kick: action ? 1 : 0, charge: 0.95, fuse: action ? 0.5 : undefined, hp: 0.3, ready: action ? 0 : 1, busy: action, level };
              expect(() => DEF_OPTIONS_R4[item][pick]?.body(g, anim), `${item} ${pick} action=${action} v${level}`).not.toThrow();
            }
          }
        }
      }
    }
  });
});

describe('threat avatars, round 5', () => {
  const threats = ['normal', 'scraper', 'ddos', 'zeroDay', 'sqli', 'ransomware', 'memoryLeak', 'botnet', 'slowloris', 'blackFriday'] as const;

  it('has option A and option B for every threat, and for the small botnet bot', () => {
    for (const type of threats) {
      expect(THREAT_OPTIONS_R5[type].A.name.length, `${type} A`).toBeGreaterThan(0);
      expect(THREAT_OPTIONS_R5[type].B.name.length, `${type} B`).toBeGreaterThan(0);
    }
    expect(BOTLET_R5.A).toBeTypeOf('function');
    expect(BOTLET_R5.B).toBeTypeOf('function');
  });

  it('draws every option walking and attacking without errors', () => {
    const g = fakeContext();
    for (const type of threats) {
      for (const pick of ['A', 'B'] as const) {
        for (const atk of [0, 0.6]) {
          for (const t of [0, 0.4, 1.3, 2.9]) {
            const anim = { w: 50, h: 60, t, step: atk ? 0 : Math.sin(t * 9), atk };
            expect(() => THREAT_OPTIONS_R5[type][pick].body(g, anim), `${type} ${pick} atk=${atk}`).not.toThrow();
            expect(() => BOTLET_R5[pick](g, anim)).not.toThrow();
          }
        }
      }
    }
  });
});

describe('threat avatars, round 6', () => {
  it('has two new options for Black Friday and SQL Injection, and DDoS with 4 robots, all drawing without errors', () => {
    const g = fakeContext();
    const bodies = [THREAT_R6.blackFriday.A, THREAT_R6.blackFriday.B, THREAT_R6.sqli.A, THREAT_R6.sqli.B, { name: 'DDoS', body: THREAT_R6.ddos4 }];
    for (const o of bodies) {
      expect(o.name.length).toBeGreaterThan(0);
      for (const atk of [0, 0.6]) {
        for (const t of [0, 0.4, 1.3, 2.9]) {
          expect(() => o.body(g, { w: 60, h: 70, t, step: atk ? 0 : Math.sin(t * 9), atk }), `${o.name} atk=${atk}`).not.toThrow();
        }
      }
    }
  });
});

describe('game art (the chosen avatars)', () => {
  it('draws every defense in every state, and the Rollback, without errors', () => {
    const g = fakeContext();
    for (const [type, body] of Object.entries(DEFENSE_ART)) {
      for (const level of [1, 2] as const) {
        for (const t of [0, 0.4, 1.3]) {
          const states = [
            { t, kick: 0, charge: 0.2, hp: 1, ready: 1, busy: false, level },
            { t, kick: 0.8, charge: 0.95, fuse: 0.2, hp: 0.2, ready: 0, busy: true, level },
          ];
          for (const s of states) expect(() => body(g, s), `${type} v${level}`).not.toThrow();
        }
      }
    }
    for (const running of [false, true]) expect(() => rollbackArt(g, running, 0.7)).not.toThrow();
  });

  it('draws every threat walking and attacking without errors', () => {
    const g = fakeContext();
    for (const [type, body] of Object.entries(ENEMY_ART)) {
      for (const atk of [0, 0.7]) {
        for (const t of [0, 0.4, 1.3, 2.9]) {
          expect(() => body(g, { w: 50, h: 60, t, step: atk ? 0 : 0.5, atk }), `${type} atk=${atk}`).not.toThrow();
        }
      }
    }
  });
});
