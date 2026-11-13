import { DEFENSE_ORDER, ENEMIES, PROVIDER_COLOR, type DefenseType } from '../config';
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
  if (id === 'providerFailure') {
    drawProviderFailure(g, time, active);
  } else if (id === 'rollback') {
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

/**
 * Provider failure: a cloud with a lightning bolt over three servers; one server blinks red.
 * Drawn in a box of about 84 × 84 around (0, 0).
 */
function drawProviderFailure(g: CanvasRenderingContext2D, time: number, active: boolean): void {
  const flash = (Math.sin(time * (active ? 9 : 4)) + 1) / 2;
  // three servers
  for (let i = 0; i < 3; i++) {
    const x = -27 + i * 19;
    const down = i === 1;
    g.fillStyle = down ? `rgba(239, 68, 68, ${0.35 + flash * 0.5})` : '#1e293b';
    g.strokeStyle = down ? '#f87171' : '#475569';
    g.lineWidth = 2;
    g.beginPath();
    g.roundRect(x, 8, 16, 26, 3);
    g.fill();
    g.stroke();
    g.fillStyle = down ? '#fecaca' : '#4ade80';
    g.fillRect(x + 4, 13, 8, 2);
    g.fillRect(x + 4, 19, 8, 2);
  }
  // cloud
  g.fillStyle = '#cbd5e1';
  g.beginPath();
  g.arc(-14, -16, 11, 0, Math.PI * 2);
  g.arc(2, -22, 14, 0, Math.PI * 2);
  g.arc(17, -15, 10, 0, Math.PI * 2);
  g.rect(-14, -16, 31, 11);
  g.fill();
  // lightning bolt
  g.fillStyle = PROVIDER_COLOR;
  g.globalAlpha = 0.6 + flash * 0.4;
  g.beginPath();
  g.moveTo(4, -12);
  g.lineTo(-6, 4);
  g.lineTo(1, 4);
  g.lineTo(-3, 16);
  g.lineTo(10, -2);
  g.lineTo(3, -2);
  g.lineTo(8, -12);
  g.closePath();
  g.fill();
  g.globalAlpha = 1;
}

/** One still frame (t = 1.2: eyes open and the Zero-Day cube fully built). */
export function paintConceptIcon(canvas: HTMLCanvasElement, id: ConceptId, size = 84): void {
  drawConceptIcon(canvas, id, size, 1.2);
}
