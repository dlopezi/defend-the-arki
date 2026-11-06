import { GRID_RIGHT } from '../config';
import type { System } from '../ecs/System';
import type { GameContext } from '../game/GameContext';
import { conceptOf, type ConceptId } from '../learn/concepts';

function discover(ctx: GameContext, id: ConceptId): void {
  if (ctx.seen.has(id)) return;
  ctx.seen.add(id);
  ctx.conceptQueue.push(id);
}

/**
 * Detects the first appearance of each element and queues its concept card:
 * threats when they enter the board, defenses when placed, Rollback when it fires.
 */
export const LearningSystem: System = {
  name: 'learning',
  update(world, ctx) {
    if (!ctx.learnEnabled) return;
    for (const e of world.query('enemy', 'transform')) {
      if (world.req(e, 'transform').x < GRID_RIGHT) discover(ctx, conceptOf(world.req(e, 'enemy').type));
    }
    for (const e of world.query('defense')) discover(ctx, world.req(e, 'defense').type);
    for (const e of world.query('rollback')) {
      if (world.req(e, 'rollback').running) discover(ctx, 'rollback');
    }
  },
};
