import { describe, expect, it } from 'vitest';
import { setLang } from '../src/i18n';
import { guideEntries } from '../src/learn/guide';

describe('Guide entries', () => {
  it('Defenses tab lists the 8 defenses in hotkey order, then Rollback', () => {
    setLang('en');
    const entries = guideEntries('defenses');
    expect(entries.map((e) => e.id)).toEqual([
      'worker',
      'loadBalancer',
      'redis',
      'rateLimiter',
      'circuitBreaker',
      'waf',
      'cdn',
      'kafka',
      'rollback',
    ]);
    expect(entries.slice(0, 8).map((e) => e.hotkey)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
    expect(entries[8].hotkey).toBeUndefined();
  });

  it('Threats tab lists the threats in guide order, without the Botnet bots', () => {
    const ids = guideEntries('threats').map((e) => e.id);
    expect(ids).toEqual(['normal', 'scraper', 'ddos', 'zeroDay', 'sqli', 'ransomware', 'memoryLeak', 'botnet', 'slowloris', 'blackFriday']);
  });

  it('A defense card has its name, cost, what it does in the game and its upgrade', () => {
    setLang('en');
    const redis = guideEntries('defenses').find((e) => e.id === 'redis')!;
    expect(redis).toMatchObject({
      name: 'Redis Cache',
      kind: 'defense',
      sub: '50 CU',
      play: 'Wall with a lot of health: blocks the traffic',
      upgrade: 'Health ×2 and full repair',
    });
  });

  it('A threat card has its name and what it does in the game, with no cost or upgrade', () => {
    setLang('es');
    const sqli = guideEntries('threats').find((e) => e.id === 'sqli')!;
    expect(sqli).toMatchObject({ name: 'SQL Injection', kind: 'threat', play: 'Atraviesa Redis (cache miss). El WAF lo frena' });
    expect(sqli.upgrade).toBeUndefined();
    expect(sqli.sub).toBeUndefined();
  });

  it('Rollback says it is free and in which levels (2 to 4)', () => {
    setLang('en');
    const rollback = guideEntries('defenses').find((e) => e.id === 'rollback')!;
    expect(rollback).toMatchObject({ name: 'Rollback', kind: 'defense', sub: 'Free · levels 2 to 4' });
    setLang('es');
    expect(guideEntries('defenses').find((e) => e.id === 'rollback')!.sub).toBe('Gratis · niveles 2 a 4');
    expect(rollback.play).toBeTruthy();
  });
});
