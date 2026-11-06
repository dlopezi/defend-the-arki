import {
  BOSS_SMASH_INTERVAL,
  CANVAS_W,
  colX,
  CU_LIFETIME,
  DEFENSES,
  ENEMIES,
  FUSE_TIME,
  KAFKA_HOLD,
  KAFKA_RECHARGE,
  laneY,
  LEAK_CAP,
  LEAK_RATE,
  PROJECTILE_SPEED,
  ROLLBACK_X,
  SHOOT_INTERVAL,
  SHOT_DAMAGE,
  WORKER_AMOUNT,
  WORKER_FIRST,
  WORKER_INTERVAL,
  type DefenseType,
  type EnemyType,
} from '../config';
import type { EffectKind } from '../components';
import type { Entity, World } from '../ecs/World';

/* Factories ("prefabs") assemble entities from components. */

export function createDefense(world: World, type: DefenseType, lane: number, col: number): Entity {
  const spec = DEFENSES[type];
  const e = world.create();
  world.add(e, 'transform', { x: colX(col), y: laneY(lane) });
  world.add(e, 'gridCell', { lane, col });
  world.add(e, 'defense', { type, level: 1 });
  world.add(e, 'health', { hp: spec.hp, max: spec.hp, flash: 0 });
  const shooter = (slow: boolean, spread: boolean) =>
    world.add(e, 'shooter', { interval: SHOOT_INTERVAL, timer: 0.4, damage: SHOT_DAMAGE, slow, shots: 1, spread });

  switch (type) {
    case 'worker':
      world.add(e, 'generator', { interval: WORKER_INTERVAL, timer: WORKER_FIRST, amount: WORKER_AMOUNT });
      break;
    case 'loadBalancer':
      shooter(false, false);
      break;
    case 'rateLimiter':
      shooter(true, false);
      break;
    case 'cdn':
      shooter(false, true);
      break;
    case 'circuitBreaker':
      world.add(e, 'fuse', { timer: FUSE_TIME, total: FUSE_TIME });
      break;
    case 'kafka':
      world.add(e, 'trap', { hold: KAFKA_HOLD, recharge: KAFKA_RECHARGE, timer: 0, captured: null });
      break;
    case 'redis':
    case 'waf':
      break;
  }
  return e;
}

/** Applies the v2 upgrade. Returns false if the defense cannot be upgraded. */
export function upgradeDefense(world: World, e: Entity): boolean {
  const d = world.get(e, 'defense');
  if (!d || d.level >= 2 || DEFENSES[d.type].upgrade === null) return false;
  d.level = 2;
  const h = world.get(e, 'health');
  const shooter = world.get(e, 'shooter');
  switch (d.type) {
    case 'worker': {
      const g = world.get(e, 'generator');
      if (g) g.amount = WORKER_AMOUNT * 2;
      break;
    }
    case 'loadBalancer':
    case 'rateLimiter':
      if (shooter) shooter.shots = 2;
      break;
    case 'cdn':
      if (shooter) shooter.damage = SHOT_DAMAGE * 2;
      break;
    case 'redis':
      if (h) {
        h.max *= 2;
        h.hp = h.max;
      }
      break;
    case 'waf':
      if (h) {
        h.max *= 1.5;
        h.hp = h.max;
      }
      break;
    case 'kafka': {
      const t = world.get(e, 'trap');
      if (t) {
        t.hold = 7;
        t.recharge = 5;
      }
      break;
    }
    case 'circuitBreaker':
      return false;
  }
  return true;
}

export function createEnemy(world: World, type: EnemyType, lane: number, hpScale: number, x?: number): Entity {
  const spec = ENEMIES[type];
  const e = world.create();
  const hp = Math.round(spec.hp * hpScale);
  world.add(e, 'transform', { x: x ?? CANVAS_W + spec.width / 2 - 10 + Math.random() * 20, y: laneY(lane) });
  world.add(e, 'lane', { lane });
  world.add(e, 'enemy', { type, speed: spec.speed, width: spec.width, height: spec.height, state: 'walk' });
  world.add(e, 'health', { hp, max: hp, flash: 0 });
  const boss = type === 'blackFriday';
  world.add(e, 'attacker', {
    dps: spec.dps,
    oneShot: boss,
    interval: BOSS_SMASH_INTERVAL,
    timer: BOSS_SMASH_INTERVAL * 0.6,
    target: null,
  });
  if (type === 'zeroDay') {
    world.add(e, 'jumper', { jumped: false, t: 0, duration: 0.7, fromX: 0, toX: 0 });
  }
  if (type === 'memoryLeak') {
    world.add(e, 'grows', { rate: LEAK_RATE * hpScale, cap: LEAK_CAP * hpScale, baseW: spec.width, baseH: spec.height, startMax: hp });
  }
  return e;
}

export function createRollback(world: World, lane: number): Entity {
  const e = world.create();
  world.add(e, 'transform', { x: ROLLBACK_X, y: laneY(lane) });
  world.add(e, 'rollback', { lane, running: false });
  return e;
}

/** A projectile starts at (x, y) and drifts into `lane` (CDN shots change lane). */
export function createProjectile(world: World, x: number, y: number, lane: number, damage: number, slow: boolean): Entity {
  const e = world.create();
  world.add(e, 'transform', { x, y });
  world.add(e, 'projectile', { damage, slow, lane, speed: PROJECTILE_SPEED, radius: 12 });
  return e;
}

export function createCollectible(world: World, x: number, y: number, targetY: number, value: number, fromSky: boolean): Entity {
  const e = world.create();
  world.add(e, 'transform', { x, y });
  world.add(e, 'collectible', {
    value,
    targetY,
    vy: fromSky ? 55 : -170,
    fromSky,
    life: CU_LIFETIME,
    collected: false,
    flyT: 0,
    fromX: x,
    fromY: y,
  });
  return e;
}

export function spawnEffect(
  world: World,
  kind: EffectKind,
  x: number,
  y: number,
  color: string,
  opts: { size?: number; duration?: number; vx?: number; vy?: number; text?: string } = {},
): Entity {
  const e = world.create();
  world.add(e, 'transform', { x, y });
  world.add(e, 'effect', {
    kind,
    t: 0,
    duration: opts.duration ?? 0.6,
    color,
    size: opts.size ?? 4,
    vx: opts.vx ?? 0,
    vy: opts.vy ?? 0,
    text: opts.text,
  });
  return e;
}

export function spawnText(world: World, x: number, y: number, text: string, color: string, size = 16): void {
  spawnEffect(world, 'text', x, y, color, { text, size, duration: 1.1, vy: -38 });
}

export function spawnSparks(world: World, x: number, y: number, color: string, count = 8, power = 140): void {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = power * (0.4 + Math.random() * 0.8);
    spawnEffect(world, 'spark', x, y, color, {
      size: 2 + Math.random() * 3,
      duration: 0.35 + Math.random() * 0.35,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
    });
  }
}
