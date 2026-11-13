import { ENEMY_ORDER, type EnemyType } from '../config';

export interface WavePlan {
  queue: EnemyType[];
  interval: number;
  hpScale: number;
  /** From this queue index on, enemies come in a fast final rush. */
  surgeAt: number;
}

function pick(weights: Partial<Record<EnemyType, number>>): EnemyType {
  let total = 0;
  for (const w of Object.values(weights)) total += w ?? 0;
  let r = Math.random() * total;
  for (const [type, w] of Object.entries(weights) as [EnemyType, number][]) {
    r -= w;
    if (r <= 0) return type;
  }
  return 'normal';
}

/** Waves of the original 10-wave design; a shorter level walks the same curve faster. */
const FULL_LENGTH = 10;

/**
 * Wave n (1-based) of a level with `total` waves. Each wave has more and harder threats.
 * The difficulty curve is the 10-wave one, compressed: every threat type still shows up,
 * and Black Friday is the boss of the last wave (and of the middle one in long levels).
 */
export function buildWave(n: number, total: number): WavePlan {
  // Position on the 10-wave curve: wave 1 -> 1, last wave -> 10.
  const v = total > 1 ? 1 + ((n - 1) * (FULL_LENGTH - 1)) / (total - 1) : FULL_LENGTH;
  const count = Math.round(4 + v * 3);
  const weights: Partial<Record<EnemyType, number>> = {
    normal: Math.max(2, 10 - v),
    scraper: v >= 2 ? 1 + v * 0.5 : 0,
    zeroDay: v >= 3 ? 1 + v * 0.3 : 0,
    sqli: v >= 3 ? 0.8 + v * 0.3 : 0,
    ddos: v >= 4 ? 0.5 + v * 0.3 : 0,
    ransomware: v >= 4 ? 0.6 + v * 0.25 : 0,
    memoryLeak: v >= 5 ? 0.6 + v * 0.2 : 0,
    botnet: v >= 5 ? 0.6 + v * 0.25 : 0,
    slowloris: v >= 6 ? 0.5 + v * 0.15 : 0,
  };
  const queue: EnemyType[] = [];
  // The first few of every wave are easy traffic.
  for (let i = 0; i < count; i++) queue.push(i < 2 ? 'normal' : pick(weights));
  // The last wave has every threat at least once, so a level never misses one by chance.
  if (n === total) {
    const missing = (Object.keys(weights) as EnemyType[]).filter((type) => (weights[type] ?? 0) > 0 && !queue.includes(type));
    // Replace, from the end, threats that appear more than once (never the only one of a type).
    let j = queue.length - 1;
    for (const type of missing) {
      while (j >= 2 && queue.filter((q) => q === queue[j]).length < 2) j--;
      if (j < 2) break;
      queue[j--] = type;
    }
  }

  const surgeAt = Math.floor(count * 0.7);
  if (n === total) {
    queue.splice(surgeAt, 0, 'blackFriday');
    queue.push('blackFriday');
  } else if (total >= 8 && n === Math.ceil(total / 2)) {
    queue.splice(surgeAt, 0, 'blackFriday');
  }

  return {
    queue,
    interval: Math.max(1.3, 6.5 - v * 0.5),
    hpScale: 1 + (v - 1) * 0.06,
    surgeAt,
  };
}

/** Threat counts in display order, for the wave preview. */
export function countByType(queue: readonly EnemyType[]): { type: EnemyType; count: number }[] {
  const counts = new Map<EnemyType, number>();
  for (const t of queue) counts.set(t, (counts.get(t) ?? 0) + 1);
  return ENEMY_ORDER.filter((t) => counts.has(t)).map((type) => ({ type, count: counts.get(type) ?? 0 }));
}
