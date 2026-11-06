import type { System } from '../ecs/System';
import { BreachSystem } from './BreachSystem';
import { CollisionSystem } from './CollisionSystem';
import { EconomySystem } from './EconomySystem';
import { EffectSystem } from './EffectSystem';
import { EnemyAISystem } from './EnemyAISystem';
import { FuseSystem } from './FuseSystem';
import { GridIndexSystem } from './GridIndexSystem';
import { GrowthSystem } from './GrowthSystem';
import { HealthSystem } from './HealthSystem';
import { InputSystem } from './InputSystem';
import { LaneRecoverySystem } from './LaneRecoverySystem';
import { MeleeSystem } from './MeleeSystem';
import { MovementSystem } from './MovementSystem';
import { RollbackSystem } from './RollbackSystem';
import { ShootingSystem } from './ShootingSystem';
import { StatusEffectSystem } from './StatusEffectSystem';
import { TrapSystem } from './TrapSystem';
import { WaveSystem } from './WaveSystem';

/** Fixed-step update pipeline. Order matters. */
export const SYSTEMS: System[] = [
  GridIndexSystem,
  InputSystem,
  EconomySystem,
  LaneRecoverySystem,
  WaveSystem,
  EnemyAISystem,
  TrapSystem,
  MovementSystem,
  MeleeSystem,
  ShootingSystem,
  CollisionSystem,
  FuseSystem,
  GrowthSystem,
  StatusEffectSystem,
  HealthSystem,
  RollbackSystem,
  BreachSystem,
  EffectSystem,
];

export { EffectSystem };
