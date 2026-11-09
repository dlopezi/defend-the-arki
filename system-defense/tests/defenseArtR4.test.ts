import { describe, expect, it } from 'vitest';
import { shade } from '../src/dev/isoKit';
import { DEF_OPTIONS_R4 } from '../src/dev/defenseOptions4';

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
