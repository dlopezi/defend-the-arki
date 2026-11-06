import type { System } from '../ecs/System';
import { BreachSystem } from './BreachSystem';
import { CollisionSystem } from './CollisionSystem';
import { EconomySystem } from './EconomySystem';
import { EffectSystem } from './EffectSystem';
import { EnemyAISystem } from './EnemyAISystem';
import { FuseSystem } from './FuseSystem';
import { GridIndexSystem } from './GridIndexSystem';
import { HealthSystem } from './HealthSystem';
import { InputSystem } from './InputSystem';
import { MeleeSystem } from './MeleeSystem';
import { MovementSystem } from './MovementSystem';
import { ShootingSystem } from './ShootingSystem';
import { StatusEffectSystem } from './StatusEffectSystem';
import { WaveSystem } from './WaveSystem';

/** Fixed-step update pipeline. Order matters. */
export const SYSTEMS: System[] = [
  GridIndexSystem,
  InputSystem,
  EconomySystem,
  WaveSystem,
  EnemyAISystem,
  MovementSystem,
  MeleeSystem,
  ShootingSystem,
  CollisionSystem,
  FuseSystem,
  StatusEffectSystem,
  HealthSystem,
  BreachSystem,
  EffectSystem,
];

export { EffectSystem };
