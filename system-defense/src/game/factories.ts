import {
  BOSS_SMASH_INTERVAL,
  CANVAS_W,
  colX,
  CU_LIFETIME,
  DEFENSES,
  ENEMIES,
  FUSE_TIME,
  laneY,
  PROJECTILE_SPEED,
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
  world.add(e, 'defense', { type });
  world.add(e, 'health', { hp: spec.hp, max: spec.hp, flash: 0 });

  switch (type) {
    case 'worker':
      world.add(e, 'generator', { interval: WORKER_INTERVAL, timer: WORKER_FIRST, amount: WORKER_AMOUNT });
      break;
    case 'loadBalancer':
      world.add(e, 'shooter', { interval: SHOOT_INTERVAL, timer: 0.4, damage: SHOT_DAMAGE, slow: false });
      break;
    case 'rateLimiter':
      world.add(e, 'shooter', { interval: SHOOT_INTERVAL, timer: 0.4, damage: SHOT_DAMAGE, slow: true });
      break;
    case 'circuitBreaker':
      world.add(e, 'fuse', { timer: FUSE_TIME, total: FUSE_TIME });
      break;
    case 'redis':
      break;
  }
  return e;
}

export function createEnemy(world: World, type: EnemyType, lane: number, hpScale: number): Entity {
  const spec = ENEMIES[type];
  const e = world.create();
  const hp = Math.round(spec.hp * hpScale);
  world.add(e, 'transform', { x: CANVAS_W + spec.width / 2 - 10 + Math.random() * 20, y: laneY(lane) });
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
  return e;
}

export function createProjectile(world: World, x: number, lane: number, damage: number, slow: boolean): Entity {
  const e = world.create();
  world.add(e, 'transform', { x, y: laneY(lane) - 6 });
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
