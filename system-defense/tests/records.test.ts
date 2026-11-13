import { describe, expect, it } from 'vitest';
import { parseRecords } from '../src/game/records';

describe('records', () => {
  it('from before the shorter levels, keep only "won": old waves and kills are not comparable', () => {
    const old = JSON.stringify({
      monolith: { bestWave: 10, won: true, bestKills: 300 },
      microservices: { bestWave: 7, won: false, bestKills: 150 },
    });
    const r = parseRecords(old);
    expect(r.monolith).toEqual({ bestWave: 0, won: true, bestKills: 0 });
    expect(r.microservices).toEqual({ bestWave: 0, won: false, bestKills: 0 });
    expect(r.multiRegion).toEqual({ bestWave: 0, won: false, bestKills: 0 });
  });

  it('records saved with the shorter levels are read as they are', () => {
    const now = JSON.stringify({ version: 2, kubernetes: { bestWave: 4, won: false, bestKills: 80 } });
    expect(parseRecords(now).kubernetes).toEqual({ bestWave: 4, won: false, bestKills: 80 });
  });

  it('nothing saved, or broken data, gives empty records', () => {
    expect(parseRecords(null).monolith).toEqual({ bestWave: 0, won: false, bestKills: 0 });
    expect(parseRecords('{not json').monolith).toEqual({ bestWave: 0, won: false, bestKills: 0 });
  });
});
