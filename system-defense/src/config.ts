/* ---------- Board layout (logical canvas pixels) ---------- */
export const CELL_W = 100;
export const CELL_H = 100;
export const COLS = 9;
export const LANES = 5;
export const BASE_W = 110;
export const GRID_X = BASE_W;
export const GRID_Y = 0;
export const GRID_RIGHT = GRID_X + COLS * CELL_W;
export const CANVAS_W = GRID_RIGHT + 90;
export const CANVAS_H = GRID_Y + LANES * CELL_H;
/** An enemy whose center passes this x has crossed the left limit. */
export const BREACH_X = GRID_X - 18;

export const FIXED_DT = 1 / 60;
export const START_CU = 150;
export const TOTAL_WAVES = 10;

/* ---------- Economy ---------- */
export const SKY_DROP_VALUE = 25;
export const SKY_DROP_MIN = 8;
export const SKY_DROP_MAX = 12;
export const CU_LIFETIME = 10;
export const WORKER_INTERVAL = 12;
export const WORKER_FIRST = 6;
export const WORKER_AMOUNT = 25;

/* ---------- Combat ---------- */
export const SHOOT_INTERVAL = 1.5;
export const SHOT_DAMAGE = 20;
export const PROJECTILE_SPEED = 330;
export const SLOW_FACTOR = 0.5;
export const SLOW_DURATION = 3;
export const FUSE_TIME = 1;
/** Bosses are not erased by a Circuit Breaker; they take this damage instead. */
export const BOSS_BLAST_DAMAGE = 1800;

export type Mode = 'monolith' | 'microservices';
export type DefenseType = 'worker' | 'loadBalancer' | 'redis' | 'rateLimiter' | 'circuitBreaker';
export type EnemyType = 'normal' | 'scraper' | 'ddos' | 'zeroDay' | 'blackFriday';
export type Tool = DefenseType | 'shovel';

export interface DefenseSpec {
  name: string;
  short: string;
  cost: number;
  hp: number;
  /** Card recharge time in seconds after placing. */
  cooldown: number;
  hotkey: string;
  color: string;
  desc: string;
}

export const DEFENSES: Record<DefenseType, DefenseSpec> = {
  worker: {
    name: 'Worker Node',
    short: 'Worker',
    cost: 50,
    hp: 300,
    cooldown: 5,
    hotkey: '1',
    color: '#38bdf8',
    desc: `Genera ${WORKER_AMOUNT} CU cada ${WORKER_INTERVAL} s`,
  },
  loadBalancer: {
    name: 'Load Balancer',
    short: 'Load Bal.',
    cost: 100,
    hp: 300,
    cooldown: 5,
    hotkey: '2',
    color: '#60a5fa',
    desc: `Dispara paquetes HTTP 200 (${SHOT_DAMAGE} daño)`,
  },
  redis: {
    name: 'Redis Cache',
    short: 'Redis',
    cost: 50,
    hp: 4000,
    cooldown: 20,
    hotkey: '3',
    color: '#f87171',
    desc: 'Muro con mucha vida: bloquea el tráfico',
  },
  rateLimiter: {
    name: 'Rate Limiter',
    short: 'Rate Lim.',
    cost: 175,
    hp: 300,
    cooldown: 7,
    hotkey: '4',
    color: '#a78bfa',
    desc: 'Dispara 429: daña y ralentiza un 50%',
  },
  circuitBreaker: {
    name: 'Circuit Breaker',
    short: 'Circuit Br.',
    cost: 150,
    hp: 99999,
    cooldown: 30,
    hotkey: '5',
    color: '#facc15',
    desc: 'Explota tras 1 s: elimina amenazas en 3×3',
  },
};

export const DEFENSE_ORDER: DefenseType[] = ['worker', 'loadBalancer', 'redis', 'rateLimiter', 'circuitBreaker'];

export interface EnemySpec {
  name: string;
  hp: number;
  speed: number;
  dps: number;
  width: number;
  height: number;
  desc: string;
}

export const ENEMIES: Record<EnemyType, EnemySpec> = {
  normal: { name: 'Tráfico Normal', hp: 120, speed: 20, dps: 40, width: 44, height: 56, desc: 'Velocidad media, poca vida' },
  scraper: { name: 'Scraper Bot', hp: 320, speed: 20, dps: 40, width: 50, height: 62, desc: 'Velocidad media, vida media-alta' },
  ddos: { name: 'Ataque DDoS', hp: 1000, speed: 10, dps: 70, width: 74, height: 74, desc: 'Lento, vida muy alta' },
  zeroDay: { name: 'Zero-Day Exploit', hp: 160, speed: 48, dps: 40, width: 42, height: 54, desc: 'Rápido. Salta la primera defensa' },
  blackFriday: { name: 'Black Friday Traffic', hp: 5000, speed: 5, dps: 0, width: 110, height: 120, desc: 'Jefe. Destruye defensas de un golpe' },
};

export const ZERO_DAY_SPEED_AFTER_JUMP = 22;
export const BOSS_SMASH_INTERVAL = 1.6;

export const ENEMY_ORDER: EnemyType[] = ['normal', 'scraper', 'ddos', 'zeroDay', 'blackFriday'];

export const SERVICE_NAMES = ['auth-svc', 'cart-svc', 'pay-svc', 'search-svc', 'user-svc'];

/* ---------- Grid helpers ---------- */
export const laneY = (lane: number): number => GRID_Y + lane * CELL_H + CELL_H / 2;
export const colX = (col: number): number => GRID_X + col * CELL_W + CELL_W / 2;

export function cellAt(x: number, y: number): { lane: number; col: number } | null {
  const col = Math.floor((x - GRID_X) / CELL_W);
  const lane = Math.floor((y - GRID_Y) / CELL_H);
  if (col < 0 || col >= COLS || lane < 0 || lane >= LANES) return null;
  return { lane, col };
}
