import { t } from './i18n';

/* ---------- Board layout (logical canvas pixels) ---------- */
export const CELL_W = 100;
export const CELL_H = 100;
export const COLS = 9;
export const LANES = 5;
/** Base area on the left. It also holds the Rollback column next to the grid. */
export const BASE_W = 140;
export const GRID_X = BASE_W;
/** Empty space above and below the lanes, so the Black Friday boss (taller than a lane) is not cut in the first and last lanes. */
export const BOARD_MARGIN = 24;
export const GRID_Y = BOARD_MARGIN;
export const GRID_RIGHT = GRID_X + COLS * CELL_W;
export const CANVAS_W = GRID_RIGHT + 90;
export const CANVAS_H = GRID_Y + LANES * CELL_H + BOARD_MARGIN;
/** An enemy whose center passes this x has crossed the left limit. */
export const BREACH_X = GRID_X - 18;
/** Where an unused Rollback waits (between the base and the grid). */
export const ROLLBACK_X = GRID_X - 22;
/** A threat is on the board (it can be shot and hit) once its front edge passes the right edge of the grid. */
export const onBoard = (x: number, width: number): boolean => x - width / 2 <= GRID_RIGHT;

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
export const ZERO_DAY_SPEED_AFTER_JUMP = 22;
export const BOSS_SMASH_INTERVAL = 1.6;
export const KAFKA_HOLD = 4;
export const KAFKA_RECHARGE = 8;
export const ENCRYPT_TIME = 5;
/** Shooters in a lane with a Slowloris on the board fire at this rate. */
export const SLOWLORIS_FACTOR = 0.5;
export const LEAK_RATE = 14;
export const LEAK_CAP = 1200;
export const ROLLBACK_SPEED = 650;
export const POD_RESTART_TIME = 30;
/** Multi-region: seconds until a fallen region comes back (without defenses). */
export const REGION_RECOVERY_TIME = 45;

/* ---------- Levels ---------- */
export type Mode = 'monolith' | 'microservices' | 'kubernetes' | 'multiRegion';
export const MODE_ORDER: Mode[] = ['monolith', 'microservices', 'kubernetes', 'multiRegion'];

export interface ModeSpec {
  level: number;
  name: string;
  color: string;
  rule: string;
  /** Lanes have a one-time Rollback. */
  rollback: boolean;
}

// Texts are getters: they read the current language each time (see i18n.ts).
export const MODES: Record<Mode, ModeSpec> = {
  monolith: {
    level: 1,
    get name() {
      return t('Monolith', 'Monolito');
    },
    color: '#38bdf8',
    get rule() {
      return t(
        'A single base. If a threat crosses the limit in any lane, the whole system goes down (Single Point of Failure). No Rollback.',
        'Una sola base. Si una amenaza cruza el límite en cualquier carril, cae todo el sistema (Single Point of Failure). Sin Rollback.',
      );
    },
    rollback: false,
  },
  microservices: {
    level: 2,
    get name() {
      return t('Microservices', 'Microservicios');
    },
    color: '#34d399',
    get rule() {
      return t(
        '5 independent services. If a threat gets through, only that lane and its defenses go down. Game Over when all 5 fall.',
        '5 servicios independientes. Si cruza una amenaza, solo cae ese carril y sus defensas. Game Over cuando caen los 5.',
      );
    },
    rollback: true,
  },
  kubernetes: {
    level: 3,
    name: 'Kubernetes',
    color: '#818cf8',
    get rule() {
      return t(
        `Self-healing: a fallen lane restarts by itself in ${POD_RESTART_TIME} s (without defenses). Game Over if all 5 fall at the same time.`,
        `Self-healing: un carril caído se reinicia solo en ${POD_RESTART_TIME} s (sin defensas). Game Over si los 5 caen a la vez.`,
      );
    },
    rollback: true,
  },
  multiRegion: {
    level: 4,
    get name() {
      return t('Multi-region', 'Multi-región');
    },
    color: '#f472b6',
    get rule() {
      return t(
        `2 regions: eu-west (lanes 1–3) and us-east (4–5). If a threat gets through, its whole region goes down and its traffic moves to the other one (failover). It comes back in ${REGION_RECOVERY_TIME} s, without defenses. Game Over if both fall at the same time.`,
        `2 regiones: eu-west (carriles 1–3) y us-east (4–5). Si cruza una amenaza, cae toda su región y su tráfico pasa a la otra (failover). Vuelve en ${REGION_RECOVERY_TIME} s, sin defensas. Game Over si caen las 2 a la vez.`,
      );
    },
    rollback: true,
  },
};

/* ---------- Defenses ---------- */
export type DefenseType =
  | 'worker'
  | 'loadBalancer'
  | 'redis'
  | 'rateLimiter'
  | 'circuitBreaker'
  | 'waf'
  | 'cdn'
  | 'kafka';
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
  /** What the v2 upgrade does. null = cannot be upgraded. */
  upgrade: string | null;
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
    get desc() {
      return t(`Makes ${WORKER_AMOUNT} CU every ${WORKER_INTERVAL} s`, `Genera ${WORKER_AMOUNT} CU cada ${WORKER_INTERVAL} s`);
    },
    get upgrade() {
      return t(`Makes ${WORKER_AMOUNT * 2} CU`, `Genera ${WORKER_AMOUNT * 2} CU`);
    },
  },
  loadBalancer: {
    name: 'Load Balancer',
    short: 'Load Bal.',
    cost: 100,
    hp: 300,
    cooldown: 5,
    hotkey: '2',
    color: '#60a5fa',
    get desc() {
      return t(`Shoots HTTP 200 packets (${SHOT_DAMAGE} damage)`, `Dispara paquetes HTTP 200 (${SHOT_DAMAGE} daño)`);
    },
    get upgrade() {
      return t('Shoots 2 packets', 'Dispara 2 paquetes');
    },
  },
  redis: {
    name: 'Redis Cache',
    short: 'Redis',
    cost: 50,
    hp: 4000,
    cooldown: 20,
    hotkey: '3',
    color: '#f87171',
    get desc() {
      return t('Wall with a lot of health: blocks the traffic', 'Muro con mucha vida: bloquea el tráfico');
    },
    get upgrade() {
      return t('Health ×2 and full repair', 'Vida ×2 y reparación total');
    },
  },
  rateLimiter: {
    name: 'Rate Limiter',
    short: 'Rate Lim.',
    cost: 175,
    hp: 300,
    cooldown: 7,
    hotkey: '4',
    color: '#a78bfa',
    get desc() {
      return t('Shoots 429: damages and slows by 50%', 'Dispara 429: daña y ralentiza un 50%');
    },
    get upgrade() {
      return t('Shoots 2 packets of 429', 'Dispara 2 paquetes 429');
    },
  },
  circuitBreaker: {
    name: 'Circuit Breaker',
    short: 'Circuit Br.',
    cost: 150,
    hp: 99999,
    cooldown: 30,
    hotkey: '5',
    color: '#facc15',
    get desc() {
      return t('Blows up after 1 s: removes threats in a 3×3 area', 'Explota tras 1 s: elimina amenazas en 3×3');
    },
    upgrade: null,
  },
  waf: {
    name: 'WAF',
    short: 'WAF',
    cost: 125,
    hp: 6000,
    cooldown: 25,
    hotkey: '6',
    color: '#2dd4bf',
    get desc() {
      return t('Tall wall: the Zero-Day cannot jump it and it stops SQL Injection', 'Muro alto: el Zero-Day no lo salta y frena SQL Injection');
    },
    get upgrade() {
      return t('Health ×1.5 and full repair', 'Vida ×1.5 y reparación total');
    },
  },
  cdn: {
    name: 'CDN Edge',
    short: 'CDN Edge',
    cost: 300,
    hp: 300,
    cooldown: 8,
    hotkey: '7',
    color: '#f472b6',
    get desc() {
      return t('Shoots in 3 lanes at once', 'Dispara en 3 carriles a la vez');
    },
    get upgrade() {
      return t('Damage ×2', 'Daño ×2');
    },
  },
  kafka: {
    name: 'Message Queue (Kafka)',
    short: 'Kafka',
    cost: 75,
    hp: 300,
    cooldown: 12,
    hotkey: '8',
    color: '#fb923c',
    get desc() {
      return t(`Holds one threat for ${KAFKA_HOLD} s. Does not block the way`, `Atrapa a una amenaza ${KAFKA_HOLD} s. No bloquea el paso`);
    },
    get upgrade() {
      return t('Holds for 7 s and recharges faster', 'Atrapa 7 s y recarga más rápido');
    },
  },
};

export const DEFENSE_ORDER: DefenseType[] = [
  'worker',
  'loadBalancer',
  'redis',
  'rateLimiter',
  'circuitBreaker',
  'waf',
  'cdn',
  'kafka',
];

/* ---------- Threats ---------- */
export type EnemyType =
  | 'normal'
  | 'scraper'
  | 'ddos'
  | 'zeroDay'
  | 'blackFriday'
  | 'sqli'
  | 'botnet'
  | 'botlet'
  | 'fakeRequest'
  | 'slowloris'
  | 'ransomware'
  | 'memoryLeak';

export interface EnemySpec {
  name: string;
  /** Short label for the wave preview. */
  tag: string;
  color: string;
  hp: number;
  speed: number;
  dps: number;
  width: number;
  height: number;
  desc: string;
}

export const ENEMIES: Record<EnemyType, EnemySpec> = {
  normal: { get name() { return t('Normal Traffic', 'Tráfico Normal'); }, tag: 'GET', color: '#94a3b8', hp: 120, speed: 20, dps: 40, width: 44, height: 56, get desc() { return t('Medium speed, low health', 'Velocidad media, poca vida'); } },
  scraper: { name: 'Scraper Bot', tag: 'BOT', color: '#fb923c', hp: 320, speed: 20, dps: 40, width: 50, height: 62, get desc() { return t('Medium speed, medium-high health', 'Velocidad media, vida media-alta'); } },
  ddos: { get name() { return t('DDoS Attack', 'Ataque DDoS'); }, tag: 'DDoS', color: '#ef4444', hp: 1000, speed: 10, dps: 70, width: 74, height: 74, get desc() { return t('Slow, very high health. Splits into 4 fake requests when it dies', 'Lento, vida muy alta. Al morir se divide en 4 peticiones falsas'); } },
  zeroDay: { name: 'Zero-Day Exploit', tag: '0day', color: '#e879f9', hp: 160, speed: 48, dps: 40, width: 42, height: 54, get desc() { return t('Fast. Jumps over the first defense (not the WAF)', 'Rápido. Salta la primera defensa (no el WAF)'); } },
  blackFriday: { name: 'Black Friday Traffic', tag: 'BF', color: '#facc15', hp: 5000, speed: 5, dps: 0, width: 110, height: 120, get desc() { return t('Boss. Destroys defenses in one hit. Splits into 6 Normal Traffic when it dies', 'Jefe. Destruye defensas de un golpe. Al morir se divide en 6 Tráfico Normal'); } },
  sqli: { name: 'SQL Injection', tag: 'SQLi', color: '#84cc16', hp: 200, speed: 24, dps: 40, width: 44, height: 54, get desc() { return t('Goes through Redis (cache miss). The WAF stops it', 'Atraviesa Redis (cache miss). El WAF lo frena'); } },
  botnet: { name: 'Botnet', tag: 'Botnet', color: '#f59e0b', hp: 420, speed: 18, dps: 40, width: 62, height: 58, get desc() { return t('Splits into 3 bots when it dies', 'Al morir se divide en 3 bots'); } },
  botlet: { get name() { return t('Botnet bot', 'Bot de botnet'); }, tag: 'bot', color: '#fbbf24', hp: 60, speed: 32, dps: 20, width: 26, height: 30, get desc() { return t('Small, fast bot', 'Bot pequeño y rápido'); } },
  fakeRequest: { get name() { return t('Fake request', 'Petición falsa'); }, tag: 'fake', color: '#ef4444', hp: 60, speed: 32, dps: 20, width: 28, height: 32, get desc() { return t('Small, fast fake traffic left by a DDoS', 'Tráfico falso pequeño y rápido que deja un DDoS'); } },
  slowloris: { name: 'Slowloris', tag: 'Slowloris', color: '#38bdf8', hp: 520, speed: 8, dps: 30, width: 52, height: 64, get desc() { return t('Very slow. In its lane, defenses shoot half as often', 'Muy lento. En su carril, las defensas disparan la mitad'); } },
  ransomware: { name: 'Ransomware', tag: 'Ransom', color: '#dc2626', hp: 260, speed: 24, dps: 30, width: 46, height: 56, get desc() { return t(`Encrypts the defense it attacks: off for ${ENCRYPT_TIME} s`, `Cifra la defensa que ataca: inactiva ${ENCRYPT_TIME} s`); } },
  memoryLeak: { name: 'Memory Leak', tag: 'Leak', color: '#a855f7', hp: 150, speed: 16, dps: 40, width: 40, height: 44, get desc() { return t('Grows and gains health over time', 'Crece y gana vida con el tiempo'); } },
};

/** Order used in the menu guide and wave preview (botlets come from botnets, fake requests from DDoS). */
export const ENEMY_ORDER: EnemyType[] = [
  'normal',
  'scraper',
  'ddos',
  'zeroDay',
  'sqli',
  'ransomware',
  'memoryLeak',
  'botnet',
  'slowloris',
  'blackFriday',
];

export const SERVICE_NAMES = ['auth-svc', 'cart-svc', 'pay-svc', 'search-svc', 'user-svc'];

/* ---------- Multi-region level ---------- */
export interface RegionSpec {
  name: string;
  lanes: number[];
}

/** Level 4: the larger region takes lanes 1–3, the smaller one lanes 4–5. Both take traffic. */
export const REGIONS: RegionSpec[] = [
  { name: 'eu-west', lanes: [0, 1, 2] },
  { name: 'us-east', lanes: [3, 4] },
];

export function regionOf(lane: number): RegionSpec {
  return REGIONS.find((r) => r.lanes.includes(lane)) ?? REGIONS[0];
}

/** Name shown for a lane: its region in Multi-region, its service in the other levels. */
export function laneName(mode: Mode, lane: number): string {
  return mode === 'multiRegion' ? regionOf(lane).name : SERVICE_NAMES[lane];
}

/* ---------- Grid helpers ---------- */
export const laneY = (lane: number): number => GRID_Y + lane * CELL_H + CELL_H / 2;
export const colX = (col: number): number => GRID_X + col * CELL_W + CELL_W / 2;

export function cellAt(x: number, y: number): { lane: number; col: number } | null {
  const col = Math.floor((x - GRID_X) / CELL_W);
  const lane = Math.floor((y - GRID_Y) / CELL_H);
  if (col < 0 || col >= COLS || lane < 0 || lane >= LANES) return null;
  return { lane, col };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Upgrade panel shown next to a clicked defense. Shared by input and render. */
export function upgradePanelRect(lane: number, col: number): Rect {
  const w = 170;
  const h = 50;
  const x = Math.min(Math.max(colX(col) - w / 2, GRID_X + 2), CANVAS_W - w - 2);
  const y = lane === 0 ? GRID_Y + CELL_H + 2 : GRID_Y + lane * CELL_H - h - 2;
  return { x, y, w, h };
}

export function inRect(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
