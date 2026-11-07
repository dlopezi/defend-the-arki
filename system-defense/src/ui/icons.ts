import { DEFENSE_ORDER, ENEMIES, type DefenseType } from '../config';
import type { ConceptId } from '../learn/concepts';
import { drawDefense, drawEnemy, drawRollback } from '../render/sprites';
import { fitCanvas } from './anim';

export function isDefense(id: ConceptId): id is DefenseType {
  return (DEFENSE_ORDER as string[]).includes(id);
}

/**
 * Draws one frame of an element's sprite in a square of `size` CSS px (guide grid, concept card).
 * `active` (mouse over): threats attack, defenses fire / arm / hold, the Rollback sweeps.
 */
export function drawConceptIcon(canvas: HTMLCanvasElement, id: ConceptId, size: number, time: number, active = false): void {
  const g = fitCanvas(canvas, size, size);
  if (!g) return;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  g.clearRect(0, 0, size, size);
  g.translate(size / 2, size / 2);
  const k = size / 84;
  g.scale(k, k);
  if (id === 'rollback') {
    // drawRollback draws the Ctrl + Z keys at 0.72 (about 35 px wide)
    g.scale(1.6, 1.6);
    drawRollback(g, 0, 0, active, time);
  } else if (isDefense(id)) {
    g.scale(0.85, 0.85);
    // a short "action" pulse every 0.9 s while active
    const p = (time % 0.9) / 0.9;
    const kick = active && p < 0.15 ? 1 - p / 0.15 : 0;
    drawDefense(g, id, 0, 0, time, {
      kick,
      charge: (time * 0.35) % 1,
      fuse: active && id === 'circuitBreaker' ? 1 - ((time * 0.6) % 1) : undefined,
      trapBusy: active && id === 'kafka',
      trapReady: 1,
    });
  } else {
    const spec = ENEMIES[id];
    const s = Math.min(1, 70 / Math.max(spec.width, spec.height));
    g.scale(s, s);
    drawEnemy(g, id, 0, 0, spec.width, spec.height, time, { flash: 0, slowed: false, state: active ? 'attack' : 'walk', jumpHeight: 0 });
  }
}

/** One still frame (t = 1.2: eyes open and the Zero-Day cube fully built). */
export function paintConceptIcon(canvas: HTMLCanvasElement, id: ConceptId, size = 84): void {
  drawConceptIcon(canvas, id, size, 1.2);
}
