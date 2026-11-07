import { CELL_W, ENEMIES } from '../config';
import type { AvatarThreat, Body, G } from './avatarOptions';

/* Small helpers shared by the sections of the avatar picker page. */

/** Sets up a crisp canvas of the given CSS size and returns its 2D context. */
export function setupCanvas(c: HTMLCanvasElement, cssW: number, cssH: number): G {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = cssW * dpr;
  c.height = cssH * dpr;
  const g = c.getContext('2d');
  if (!g) throw new Error('no 2d context');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return g;
}

export function drawLane(g: G, W: number, H: number, t: number): void {
  g.fillStyle = '#070b17';
  g.fillRect(0, 0, W, H);
  const cw = CELL_W * 0.75;
  for (let i = 0; i * cw < W; i++) {
    g.fillStyle = i % 2 ? '#121c39' : '#0f1730';
    g.fillRect(i * cw, 8, cw, H - 16);
  }
  g.strokeStyle = 'rgba(56,189,248,0.12)';
  g.lineWidth = 2;
  g.setLineDash([6, 10]);
  g.lineDashOffset = t * 30;
  g.beginPath();
  g.moveTo(0, H - 22);
  g.lineTo(W, H - 22);
  g.stroke();
  g.setLineDash([]);
}

/** Draws a candidate body like the game does: ground shadow + walking bob. */
export function drawBody(g: G, body: Body, x: number, y: number, w: number, h: number, t: number, scale: number): void {
  const step = Math.sin(t * 9 + x * 0.13);
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath();
  g.ellipse(0, h / 2 + 2, w * 0.45, 6, 0, 0, Math.PI * 2);
  g.fill();
  g.translate(0, step * 2);
  body(g, { w, h, t, step });
  g.restore();
}

/** Memory Leak grows in the game; the preview loops through its sizes. */
export function sizeOf(type: AvatarThreat, t: number): { w: number; h: number } {
  const s = ENEMIES[type];
  if (type !== 'memoryLeak') return { w: s.width, h: s.height };
  const k = 1 + 0.9 * ((Math.sin(t * 0.8) + 1) / 2);
  return { w: s.width * k, h: s.height * k };
}

