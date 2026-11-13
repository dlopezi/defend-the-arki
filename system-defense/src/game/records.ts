import { t } from '../i18n';
import { MODE_ORDER, type Mode } from '../config';

export interface LevelRecord {
  bestWave: number;
  won: boolean;
  bestKills: number;
}

export type Records = { [M in Mode]: LevelRecord };

const KEY = 'defend-the-arki:records';

function empty(): Records {
  const r = {} as Records;
  for (const m of MODE_ORDER) r[m] = { bestWave: 0, won: false, bestKills: 0 };
  return r;
}

/**
 * Format of the saved records. Version 2 came with the shorter levels (8 and 5 waves):
 * older best waves and kills are not comparable, so only "won" is kept from them.
 */
const VERSION = 2;

/** Reads saved records (null: nothing saved). Broken data gives empty records. */
export function parseRecords(raw: string | null): Records {
  const base = empty();
  if (!raw) return base;
  try {
    const data = JSON.parse(raw) as Partial<Records> & { version?: number };
    const current = data.version === VERSION;
    for (const m of MODE_ORDER) {
      const r = data[m];
      if (!r) continue;
      base[m] = current
        ? { bestWave: Number(r.bestWave) || 0, won: Boolean(r.won), bestKills: Number(r.bestKills) || 0 }
        : { bestWave: 0, won: Boolean(r.won), bestKills: 0 };
    }
  } catch {
    /* corrupt: start empty */
  }
  return base;
}

/** Best results per level, kept in this browser only. */
export function loadRecords(): Records {
  try {
    return parseRecords(localStorage.getItem(KEY));
  } catch {
    return empty(); // storage blocked
  }
}

/** Saves a finished game. Returns true if it beat the previous record. */
export function saveResult(mode: Mode, wave: number, won: boolean, kills: number): boolean {
  const all = loadRecords();
  const prev = all[mode];
  const better = (won && !prev.won) || wave > prev.bestWave || (wave === prev.bestWave && kills > prev.bestKills);
  if (better) {
    all[mode] = { bestWave: Math.max(wave, prev.bestWave), won: won || prev.won, bestKills: Math.max(kills, prev.bestKills) };
    try {
      localStorage.setItem(KEY, JSON.stringify({ version: VERSION, ...all }));
    } catch {
      /* ignore */
    }
  }
  return better;
}

export function describeRecord(r: LevelRecord): string {
  if (r.won) return t(`Record: won · ${r.bestKills} threats`, `Récord: victoria · ${r.bestKills} amenazas`);
  if (r.bestWave === 0) return t('Record: no games yet', 'Récord: sin partidas');
  return t(`Record: wave ${r.bestWave} · ${r.bestKills} threats`, `Récord: ola ${r.bestWave} · ${r.bestKills} amenazas`);
}

export function clearRecords(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
