import { DEFENSE_ORDER, ENEMIES, type DefenseType } from '../config';
import type { ConceptId } from '../learn/concepts';
import { drawDefense, drawEnemy, drawRollback } from '../render/sprites';

export function isDefense(id: ConceptId): id is DefenseType {
  return (DEFENSE_ORDER as string[]).includes(id);
}

/** Draws an element's sprite into a small square canvas (concept card, guide grid). */
export function paintConceptIcon(canvas: HTMLCanvasElement, id: ConceptId, size = 84): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  const g = canvas.getContext('2d');
  if (!g) return;
  g.scale(dpr, dpr);
  g.translate(size / 2, size / 2);
  const k = size / 84;
  g.scale(k, k);
  if (id === 'rollback') {
    g.scale(1.8, 1.8);
    drawRollback(g, 0, 0, false, 0);
  } else if (isDefense(id)) {
    g.scale(0.85, 0.85);
    drawDefense(g, id, 0, 0, 1.2);
  } else {
    const spec = ENEMIES[id];
    const s = Math.min(1, 70 / Math.max(spec.width, spec.height));
    g.scale(s, s);
    drawEnemy(g, id, 0, 0, spec.width, spec.height, 0, { flash: 0, slowed: false, state: 'attack', jumpHeight: 0 });
  }
}
