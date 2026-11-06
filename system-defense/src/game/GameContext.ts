import { COLS, DEFENSE_ORDER, LANES, START_CU, type DefenseType, type EnemyType, type Mode, type Tool } from '../config';
import type { Entity } from '../ecs/World';
import { buildWave, type WavePlan } from './waves';

export type Status = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory';
export type WavePhase = 'prep' | 'spawning' | 'clearing' | 'break';

export type SoundName =
  | 'shoot'
  | 'place'
  | 'collect'
  | 'explode'
  | 'laneDown'
  | 'laneUp'
  | 'gameOver'
  | 'victory'
  | 'wave'
  | 'upgrade'
  | 'rollback'
  | 'deny'
  | 'smash'
  | 'capture'
  | 'encrypt'
  | 'split';

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
  /** Plan of the next wave, built early so the HUD can preview it. */
  next: WavePlan;
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
  /** Kubernetes: seconds until a fallen lane restarts (0 = not restarting). */
  laneRestart: number[];
  /** Lanes where a Slowloris halves the fire rate. Written by ShootingSystem. */
  laneThrottled: boolean[];
  /** Spatial index: which defense entity sits in each cell. Rebuilt every tick. */
  grid: (Entity | null)[][];
  selected: Tool | null;
  /** Cell whose upgrade panel is open. */
  inspect: { lane: number; col: number } | null;
  cooldowns: Record<DefenseType, number>;
  input: { clicks: Point[]; hover: Point | null };
  wave: WaveState;
  time: number;
  kills: number;
  skyTimer: number;
  banners: Banner[];
  shake: number;
  endReason: string;
  /** Sound events produced by systems this frame. The game drains them. */
  sfx: SoundName[];
}

export function emptyGrid(): (Entity | null)[][] {
  return Array.from({ length: LANES }, () => Array.from({ length: COLS }, () => null));
}

export function createContext(mode: Mode): GameContext {
  const cooldowns = {} as Record<DefenseType, number>;
  for (const d of DEFENSE_ORDER) cooldowns[d] = 0;
  // Strong cards start recharging, as in classic lane defense games.
  cooldowns.redis = 10;
  cooldowns.circuitBreaker = 20;
  cooldowns.rateLimiter = 5;
  cooldowns.waf = 20;
  cooldowns.cdn = 15;
  return {
    mode,
    status: 'menu',
    cu: START_CU,
    lanesAlive: Array.from({ length: LANES }, () => true),
    laneRestart: Array.from({ length: LANES }, () => 0),
    laneThrottled: Array.from({ length: LANES }, () => false),
    grid: emptyGrid(),
    selected: null,
    inspect: null,
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
      next: buildWave(1),
    },
    time: 0,
    kills: 0,
    skyTimer: 4,
    banners: [],
    shake: 0,
    endReason: '',
    sfx: [],
  };
}

export function pushBanner(ctx: GameContext, text: string, color = '#e2e8f0', sub = '', duration = 2.4): void {
  ctx.banners.push({ text, sub, color, t: 0, duration });
}

export function sound(ctx: GameContext, name: SoundName): void {
  ctx.sfx.push(name);
}
