import { GRID_RIGHT } from '../config';
import type { System } from '../ecs/System';
import type { GameContext } from '../game/GameContext';
import { conceptOf, type ConceptId } from '../learn/concepts';

/** Queues the concept card of `id` the first time it shows up (when cards are on). */
export function discoverConcept(ctx: GameContext, id: ConceptId): void {
  if (!ctx.learnEnabled || ctx.seen.has(id)) return;
  ctx.seen.add(id);
  ctx.conceptQueue.push(id);
}

/**
 * Detects the first appearance of threats (when they enter the board) and of Rollback
 * (when it fires) and queues their concept cards. Defense cards are shown by the game
 * when the player first selects the defense card.
 */
export const LearningSystem: System = {
  name: 'learning',
  update(world, ctx) {
    if (!ctx.learnEnabled) return;
    for (const e of world.query('enemy', 'transform')) {
      if (world.req(e, 'transform').x < GRID_RIGHT) discoverConcept(ctx, conceptOf(world.req(e, 'enemy').type));
    }
    for (const e of world.query('rollback')) {
      if (world.req(e, 'rollback').running) discoverConcept(ctx, 'rollback');
    }
  },
};
