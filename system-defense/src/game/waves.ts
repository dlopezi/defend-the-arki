import type { EnemyType } from '../config';

export interface WavePlan {
  queue: EnemyType[];
  interval: number;
  hpScale: number;
  /** From this queue index on, enemies come in a fast final rush. */
  surgeAt: number;
}

function pick(weights: Record<EnemyType, number>): EnemyType {
  let total = 0;
  for (const w of Object.values(weights)) total += w;
  let r = Math.random() * total;
  for (const [type, w] of Object.entries(weights) as [EnemyType, number][]) {
    r -= w;
    if (r <= 0) return type;
  }
  return 'normal';
}

/** Wave n (1-based). Each wave has more and harder threats. */
export function buildWave(n: number): WavePlan {
  const count = 4 + n * 3;
  const weights: Record<EnemyType, number> = {
    normal: Math.max(2, 10 - n),
    scraper: n >= 2 ? 1 + n * 0.6 : 0,
    zeroDay: n >= 3 ? 1 + n * 0.4 : 0,
    ddos: n >= 4 ? 0.5 + n * 0.35 : 0,
    blackFriday: 0,
  };
  const queue: EnemyType[] = [];
  // The first few of every wave are easy traffic.
  for (let i = 0; i < count; i++) queue.push(i < 2 ? 'normal' : pick(weights));

  const surgeAt = Math.floor(count * 0.7);
  if (n === 5) queue.splice(surgeAt, 0, 'blackFriday');
  if (n === 8) queue.splice(surgeAt, 0, 'blackFriday');
  if (n === 10) {
    queue.splice(surgeAt, 0, 'blackFriday');
    queue.push('blackFriday');
  }

  return {
    queue,
    interval: Math.max(1.3, 6.5 - n * 0.5),
    hpScale: 1 + (n - 1) * 0.06,
    surgeAt,
  };
}
