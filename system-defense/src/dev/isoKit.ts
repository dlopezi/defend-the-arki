import type { G } from './avatarOptions';

/*
 * Isometric drawing kit for the defense avatars of round 4, in the same style as the buildings
 * of Design the Arki (archi-game-rts, src/ui/componentArt.tsx): boxes and cylinders in one colour
 * per building, on a dark diamond pad. Shapes use Arki's 64 × 64 box (pad centre at 32, 50);
 * `inArkiBox` maps that box onto the defense frame of the picker page (centre at 0, 0, base at y ≈ 37).
 *
 * Two looks of the same building:
 * - flat (A): plain faces, like Arki.
 * - rich (B): gradients on the faces, light edges, glowing parts and a lit pad.
 */

export type Pt = [number, number];

/** Mixes a #rrggbb colour toward white (f > 0) or black (f < 0). Same rule as Arki. */
export function shade(hex: string, f: number): string {
  const target = f > 0 ? 255 : 0;
  const k = Math.abs(f);
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).map((v) => Math.round(v + (target - v) * k));
  return `#${channels.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export interface Palette {
  base: string;
  light: string;
  dark: string;
  top: string;
  glow: string;
  window: string;
}
export const WINDOW = '#fde68a';
export const GOLD = '#facc15';

export const paletteOf = (color: string): Palette => ({
  base: color,
  light: shade(color, 0.25),
  dark: shade(color, -0.45),
  top: shade(color, 0.45),
  glow: shade(color, 0.6),
  window: WINDOW,
});

/** How a building is drawn: its palette and the look (flat or rich). */
export interface Look {
  rich: boolean;
  p: Palette;
}

/** Draws `draw` in Arki's 64 × 64 box, placed on the defense frame of the picker page. */
export function inArkiBox(g: G, draw: () => void, scale = 1.4, ground = 37): void {
  g.save();
  // the pad's front corner (box y = 64) lands on `ground`
  g.translate(0, ground - 14 * scale);
  g.scale(scale, scale);
  g.translate(-32, -50);
  draw();
  g.restore();
}

export function poly(g: G, pts: Pt[]): void {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
}

/** Fills the current path with a vertical gradient (rich look) or a flat colour. */
function fillFace(g: G, L: Look, flat: string, top: number, bottom: number, from: string, to: string): void {
  if (L.rich) {
    const gr = g.createLinearGradient(0, top, 0, bottom);
    gr.addColorStop(0, from);
    gr.addColorStop(1, to);
    g.fillStyle = gr;
  } else g.fillStyle = flat;
  g.fill();
}

function edge(g: G, L: Look, color = L.p.dark): void {
  g.lineJoin = 'round';
  g.lineWidth = 0.6;
  g.strokeStyle = color;
  g.stroke();
}

/** An isometric box standing on the ground point (cx, cy): w is half its width, h its height. */
export function isoBox(g: G, L: Look, cx: number, cy: number, w: number, h: number, p: Palette = L.p): void {
  isoBlock(g, L, cx, cy + w / 2, w, w, h, p);
}

/**
 * An isometric block with its front corner on the ground at (fx, fy): `a` is the length of the
 * left face, `b` of the right face (both measured across the screen), `h` its height.
 */
export function isoBlock(g: G, L: Look, fx: number, fy: number, a: number, b: number, h: number, p: Palette = L.p): void {
  const PL = { ...L, p };
  const lx = fx - a;
  const ly = fy - a / 2;
  const rx = fx + b;
  const ry = fy - b / 2;
  const top = Math.min(ly, ry) - h;
  poly(g, [[lx, ly], [fx, fy], [fx, fy - h], [lx, ly - h]]);
  fillFace(g, PL, p.dark, top, fy, shade(p.dark, 0.15), shade(p.dark, -0.35));
  edge(g, PL);
  poly(g, [[fx, fy], [rx, ry], [rx, ry - h], [fx, fy - h]]);
  fillFace(g, PL, p.base, top, fy, p.light, shade(p.base, -0.2));
  edge(g, PL);
  poly(g, [[lx, ly - h], [lx + b, ly - b / 2 - h], [rx, ry - h], [fx, fy - h]]);
  fillFace(g, PL, p.top, ly - b / 2 - h, fy - h, shade(p.top, 0.3), p.top);
  edge(g, PL);
  if (L.rich) {
    // light catches the top edges and the front corner
    g.globalAlpha = 0.85;
    g.beginPath();
    g.moveTo(lx, ly - h);
    g.lineTo(fx, fy - h);
    g.lineTo(rx, ry - h);
    g.moveTo(fx, fy - h);
    g.lineTo(fx, fy);
    g.lineWidth = 0.7;
    g.strokeStyle = shade(p.top, 0.5);
    g.stroke();
    g.globalAlpha = 1;
  }
}

/**
 * Draws on a face of an isoBlock as if it were flat: inside `draw`, x runs along the face
 * (0 = the face's front corner for 'right', its left corner for 'left') and y goes down (y < 0 is up).
 */
export function onFace(g: G, side: 'left' | 'right', fx: number, fy: number, a: number, draw: () => void): void {
  g.save();
  if (side === 'left') g.transform(1, 0.5, 0, 1, fx - a, fy - a / 2);
  else g.transform(1, -0.5, 0, 1, fx, fy);
  draw();
  g.restore();
}

/** A quad on the right (u from the front corner) or left (u from the left corner) face of an isoBox; v is height. */
export function faceQuad(side: 'left' | 'right', cx: number, cy: number, w: number, u1: number, u2: number, v1: number, v2: number): Pt[] {
  const at = (u: number, v: number): Pt => (side === 'right' ? [cx + u * w, cy + w / 2 - (u * w) / 2 - v] : [cx - w + u * w, cy + (u * w) / 2 - v]);
  return [at(u1, v1), at(u2, v1), at(u2, v2), at(u1, v2)];
}

/** Fills a quad of a face (a window, a panel). Rich: lit windows glow. */
export function fillQuad(g: G, L: Look, pts: Pt[], color: string, glow = false): void {
  poly(g, pts);
  if (L.rich && glow) {
    g.save();
    g.shadowColor = color;
    g.shadowBlur = 4;
    g.fillStyle = color;
    g.fill();
    g.restore();
  } else {
    g.fillStyle = color;
    g.fill();
  }
}

/** A vertical cylinder whose bottom centre is (cx, cy). */
export function cylinder(g: G, L: Look, cx: number, cy: number, r: number, h: number, p: Palette = L.p): void {
  const ry = r / 2;
  const top = cy - h;
  g.beginPath();
  g.moveTo(cx - r, top);
  g.lineTo(cx - r, cy);
  g.ellipse(cx, cy, r, ry, 0, Math.PI, 0, true);
  g.lineTo(cx + r, top);
  g.closePath();
  if (L.rich) {
    const gr = g.createLinearGradient(cx - r, 0, cx + r, 0);
    gr.addColorStop(0, p.dark);
    gr.addColorStop(0.55, p.light);
    gr.addColorStop(1, p.base);
    g.fillStyle = gr;
  } else g.fillStyle = p.base;
  g.fill();
  g.lineWidth = 0.6;
  g.strokeStyle = p.dark;
  g.stroke();
  if (!L.rich) {
    // left half in shadow
    g.beginPath();
    g.moveTo(cx - r, top);
    g.lineTo(cx - r, cy);
    g.ellipse(cx, cy, r, ry, 0, Math.PI, Math.PI / 2, true);
    g.lineTo(cx, top + ry);
    g.ellipse(cx, top, r, ry, 0, Math.PI / 2, Math.PI, false);
    g.closePath();
    g.fillStyle = p.dark;
    g.fill();
  }
  g.globalAlpha = 0.5;
  for (const f of [0.33, 0.66]) {
    g.beginPath();
    g.ellipse(cx, top + h * f, r, ry, 0, Math.PI, 0, true);
    g.strokeStyle = p.top;
    g.stroke();
  }
  g.globalAlpha = 1;
  g.beginPath();
  g.ellipse(cx, top, r, ry, 0, 0, Math.PI * 2);
  g.fillStyle = p.top;
  g.fill();
  g.strokeStyle = p.dark;
  g.stroke();
}

/** The ground pad every building stands on. `gold` marks the v2 (upgraded) building. */
export function pad(g: G, L: Look, gold = false): void {
  const pts: Pt[] = [[4, 50], [32, 36], [60, 50], [32, 64]];
  if (L.rich) {
    // light spill of the building on the ground
    const gr = g.createRadialGradient(32, 50, 2, 32, 50, 28);
    gr.addColorStop(0, `${L.p.base}55`);
    gr.addColorStop(1, `${L.p.base}00`);
    g.save();
    g.translate(32, 50);
    g.scale(1, 0.5);
    g.translate(-32, -50);
    g.fillStyle = gr;
    g.beginPath();
    g.arc(32, 50, 30, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  poly(g, pts);
  g.fillStyle = '#111a1e';
  g.fill();
  g.lineWidth = gold ? 1.4 : 1;
  g.strokeStyle = gold ? GOLD : L.p.base;
  g.globalAlpha = gold ? 0.95 : 0.55;
  g.stroke();
  g.globalAlpha = 1;
  if (L.rich) {
    // inner rim
    poly(g, [[10, 50], [32, 39], [54, 50], [32, 61]]);
    g.lineWidth = 0.5;
    g.strokeStyle = `${L.p.light}40`;
    g.stroke();
  }
}

/** A glowing dot (lamp, beacon). Rich: soft halo. */
export function lamp(g: G, L: Look, x: number, y: number, r: number, color: string, on = 1): void {
  g.save();
  g.globalAlpha = 0.3 * on;
  g.beginPath();
  g.arc(x, y, r * 2.3, 0, Math.PI * 2);
  g.fillStyle = color;
  g.fill();
  g.globalAlpha = 0.25 + 0.75 * on;
  if (L.rich) {
    g.shadowColor = color;
    g.shadowBlur = 8 * on;
  }
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** Soft ground shadow under a building that has no pad (Rollback). */
export function groundShadow(g: G, x: number, y: number, rx: number): void {
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath();
  g.ellipse(x, y, rx, rx / 2, 0, 0, Math.PI * 2);
  g.fill();
}
