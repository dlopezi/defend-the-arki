import type { World } from '../ecs/World';
import { EffectSystem, SYSTEMS } from '../systems';
import type { GameContext } from './GameContext';

/**
 * One fixed logic step (1/60 s). Shared by the game loop and the tests,
 * so the tests run exactly the same rules as the game.
 */
export function stepGame(world: World, ctx: GameContext, dt: number): void {
  if (ctx.status === 'playing') {
    for (const system of SYSTEMS) {
      system.update(world, ctx, dt);
      if (ctx.status !== 'playing') break;
    }
    world.flush();
    ctx.time += dt;
  } else if (ctx.status === 'gameover' || ctx.status === 'victory') {
    // Let explosions and particles finish after the end.
    EffectSystem.update(world, ctx, dt);
    world.flush();
  }
}
