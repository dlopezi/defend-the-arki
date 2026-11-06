import type { GameContext } from '../game/GameContext';
import type { World } from './World';

/** A system holds logic only. It reads and writes components and the shared game context. */
export interface System {
  readonly name: string;
  update(world: World, ctx: GameContext, dt: number): void;
}
