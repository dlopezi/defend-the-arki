import type { System } from '../ecs/System';

/** Rebuilds the cell -> defense index so other systems can look up cells in O(1). */
export const GridIndexSystem: System = {
  name: 'gridIndex',
  update(world, ctx) {
    for (const row of ctx.grid) row.fill(null);
    for (const e of world.query('gridCell', 'defense')) {
      const c = world.req(e, 'gridCell');
      ctx.grid[c.lane][c.col] = e;
    }
  },
};
