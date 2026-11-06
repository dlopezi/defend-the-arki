import { COLS, DEFENSE_ORDER, LANES, START_CU, type DefenseType, type EnemyType, type Mode, type Tool } from '../config';
import type { Entity } from '../ecs/World';

export type Status = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory';
export type WavePhase = 'prep' | 'spawning' | 'clearing' | 'break';

export interface Point {
  x: number;
  y: number;
}

export interface WaveState {
  number: number;
  phase: WavePhase;
  /** Countdown for prep / break / clearing timeout. */
  timer: number;
  queue: EnemyType[];
  spawnTimer: number;
  interval: number;
  total: number;
  spawned: number;
  /** Index in the queue where the final rush starts. */
  surgeAt: number;
  hpScale: number;
}

export interface Banner {
  text: string;
  sub: string;
  color: string;
  t: number;
  duration: number;
}

/** Shared state ("resources" in ECS terms) that is not tied to one entity. */
export interface GameContext {
  mode: Mode;
  status: Status;
  cu: number;
  lanesAlive: boolean[];
  /** Spatial index: which defense entity sits in each cell. Rebuilt every tick. */
  grid: (Entity | null)[][];
  selected: Tool | null;
  cooldowns: Record<DefenseType, number>;
  input: { clicks: Point[]; hover: Point | null };
  wave: WaveState;
  time: number;
  kills: number;
  skyTimer: number;
  banners: Banner[];
  shake: number;
  endReason: string;
}

export function emptyGrid(): (Entity | null)[][] {
  return Array.from({ length: LANES }, () => Array.from({ length: COLS }, () => null));
}

export function createContext(mode: Mode): GameContext {
  const cooldowns = {} as Record<DefenseType, number>;
  for (const d of DEFENSE_ORDER) cooldowns[d] = 0;
  // Expensive or strong cards start recharging, as in classic lane defense games.
  cooldowns.redis = 10;
  cooldowns.circuitBreaker = 20;
  cooldowns.rateLimiter = 5;
  return {
    mode,
    status: 'menu',
    cu: START_CU,
    lanesAlive: Array.from({ length: LANES }, () => true),
    grid: emptyGrid(),
    selected: null,
    cooldowns,
    input: { clicks: [], hover: null },
    wave: {
      number: 0,
      phase: 'prep',
      timer: 20,
      queue: [],
      spawnTimer: 0,
      interval: 6,
      total: 0,
      spawned: 0,
      surgeAt: 0,
      hpScale: 1,
    },
    time: 0,
    kills: 0,
    skyTimer: 4,
    banners: [],
    shake: 0,
    endReason: '',
  };
}

export function pushBanner(ctx: GameContext, text: string, color = '#e2e8f0', sub = '', duration = 2.4): void {
  ctx.banners.push({ text, sub, color, t: 0, duration });
}
