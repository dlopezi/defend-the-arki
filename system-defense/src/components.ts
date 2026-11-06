import type { DefenseType, EnemyType } from './config';
import type { Entity } from './ecs/World';

/* Components are pure data. No methods, no logic. */

export interface Transform {
  x: number;
  y: number;
}

export interface Health {
  hp: number;
  max: number;
  /** Seconds left of the white "hit" flash. */
  flash: number;
}

/** Lane an entity moves in (enemies, projectiles). */
export interface Lane {
  lane: number;
}

/** Fixed cell on the board (defenses). */
export interface GridCell {
  lane: number;
  col: number;
}

export interface Defense {
  type: DefenseType;
}

export type EnemyState = 'walk' | 'attack' | 'jump';

export interface Enemy {
  type: EnemyType;
  speed: number;
  width: number;
  height: number;
  state: EnemyState;
}

/** Melee damage against defenses. */
export interface Attacker {
  dps: number;
  /** If true, every hit destroys the target (Black Friday). */
  oneShot: boolean;
  interval: number;
  timer: number;
  target: Entity | null;
}

export interface Shooter {
  interval: number;
  timer: number;
  damage: number;
  slow: boolean;
}

export interface Projectile {
  damage: number;
  slow: boolean;
  lane: number;
  speed: number;
  radius: number;
}

/** Produces Compute Units over time (Worker Node). */
export interface Generator {
  interval: number;
  timer: number;
  amount: number;
}

/** Delayed explosion (Circuit Breaker). */
export interface Fuse {
  timer: number;
  total: number;
}

export interface Slowed {
  timer: number;
  factor: number;
}

/** Jumps over the first defense it meets (Zero-Day Exploit). */
export interface Jumper {
  jumped: boolean;
  t: number;
  duration: number;
  fromX: number;
  toX: number;
}

export interface Collectible {
  value: number;
  targetY: number;
  vy: number;
  /** Sky drops fall slowly; generated ones pop up and fall with gravity. */
  fromSky: boolean;
  life: number;
  collected: boolean;
  flyT: number;
  fromX: number;
  fromY: number;
}

export type EffectKind = 'text' | 'spark' | 'ring' | 'explosion';

export interface Effect {
  kind: EffectKind;
  t: number;
  duration: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
  text?: string;
}

/** Registry: component key -> component data type. */
export interface ComponentMap {
  transform: Transform;
  health: Health;
  lane: Lane;
  gridCell: GridCell;
  defense: Defense;
  enemy: Enemy;
  attacker: Attacker;
  shooter: Shooter;
  projectile: Projectile;
  generator: Generator;
  fuse: Fuse;
  slowed: Slowed;
  jumper: Jumper;
  collectible: Collectible;
  effect: Effect;
}
