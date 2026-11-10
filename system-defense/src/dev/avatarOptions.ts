import type { EnemyType } from '../config';

/*
 * Candidate threat avatars (3 per threat) for the avatar picker page.
 * Each "body" draws the threat centered at (0, 0); its feet touch y = h/2.
 * Shadow and walking bob are added by the caller, like drawEnemy in the game.
 * Chosen bodies will later replace the ones in render/sprites.ts.
 */

export type G = CanvasRenderingContext2D;
export interface Anim {
  w: number;
  h: number;
  t: number;
  /** -1..1 walking phase (0 when standing). */
  step: number;
}
export type Body = (g: G, a: Anim) => void;
export type Pick = 'A' | 'B' | 'C';
export type AvatarThreat = Exclude<EnemyType, 'botlet' | 'fakeRequest'>;

export const TAU = Math.PI * 2;
export const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export function rr(g: G, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}
export function circ(g: G, x: number, y: number, r: number): void {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
}
export function paint(g: G, fill: string, stroke?: string, lw = 2): void {
  g.fillStyle = fill;
  g.fill();
  if (stroke) {
    g.lineWidth = lw;
    g.strokeStyle = stroke;
    g.stroke();
  }
}
export function line(g: G, x1: number, y1: number, x2: number, y2: number, color: string, lw = 2): void {
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}
export function txt(g: G, s: string, x: number, y: number, size: number, color: string, weight = 700, align: CanvasTextAlign = 'center'): void {
  g.font = `${weight} ${size}px ${MONO}`;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(s, x, y);
}
/** Cartoon eye looking left (toward the base). */
function eye(g: G, x: number, y: number, r: number, look = -1): void {
  circ(g, x, y, r);
  paint(g, '#f8fafc');
  circ(g, x + look * r * 0.35, y + r * 0.1, r * 0.5);
  paint(g, '#0f172a');
}
export function legs(g: G, a: Anim, color: string, spread = 10, len = 12, wd = 7): void {
  g.fillStyle = color;
  rr(g, -spread - wd / 2 + a.step * 3, a.h / 2 - len, wd, len, 3);
  g.fill();
  rr(g, spread - wd / 2 - a.step * 3, a.h / 2 - len, wd, len, 3);
  g.fill();
}
export function padlock(g: G, x: number, y: number, s: number, body = '#dc2626', shackle = '#fecaca'): void {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.strokeStyle = shackle;
  g.lineWidth = 3;
  g.beginPath();
  g.arc(0, -6, 7, Math.PI, TAU);
  g.stroke();
  rr(g, -10, -6, 20, 16, 3);
  paint(g, body);
  circ(g, 0, 1, 2.5);
  paint(g, '#450a0a');
  g.fillRect(-1, 2, 2, 5);
  g.restore();
}
function hexPath(g: G, x: number, y: number, r: number): void {
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * TAU + Math.PI / 6;
    const px = x + Math.cos(ang) * r;
    const py = y + Math.sin(ang) * r;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
}

/* ======================= Tráfico Normal ======================= */

const normalA: Body = (g, a) => {
  const { w, h, t } = a;
  legs(g, a, '#334155', 9, 12, 8);
  line(g, 2, -h / 2 + 8, 6, -h / 2 - 4, '#cbd5e1');
  rr(g, 6, -h / 2 - 9, 13, 8, 2);
  paint(g, '#38bdf8');
  rr(g, -w / 2, -h / 2 + 4, w, h - 14, 14);
  paint(g, '#64748b', '#e2e8f0');
  g.globalAlpha = 0.55;
  circ(g, -w / 2 + 7, -h / 2 + 25, 3);
  paint(g, '#f9a8d4');
  circ(g, w / 2 - 8, -h / 2 + 25, 3);
  paint(g, '#f9a8d4');
  g.globalAlpha = 1;
  if (Math.sin(t * 1.7) > 0.96) {
    line(g, -11, -h / 2 + 16, -3, -h / 2 + 16, '#0f172a');
    line(g, 3, -h / 2 + 16, 11, -h / 2 + 16, '#0f172a');
  } else {
    eye(g, -7, -h / 2 + 16, 5);
    eye(g, 7, -h / 2 + 16, 5);
  }
  g.strokeStyle = '#0f172a';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(0, -h / 2 + 23, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  g.stroke();
  rr(g, -w / 2 + 6, h / 2 - 27, w - 12, 12, 4);
  paint(g, '#1e293b');
  txt(g, 'GET /', 0, h / 2 - 21, 8, '#e2e8f0');
};

const normalB: Body = (g, a) => {
  const { w, h } = a;
  legs(g, a, '#475569', 8, 10, 6);
  const top = -h / 2;
  const bot = h / 2 - 10;
  const L = -w / 2;
  const R = w / 2;
  const f = 11;
  g.beginPath();
  g.moveTo(L, top);
  g.lineTo(R - f, top);
  g.lineTo(R, top + f);
  g.lineTo(R, bot);
  g.lineTo(L, bot);
  g.closePath();
  paint(g, '#e2e8f0', '#94a3b8');
  g.beginPath();
  g.moveTo(R - f, top);
  g.lineTo(R - f, top + f);
  g.lineTo(R, top + f);
  g.closePath();
  paint(g, '#cbd5e1');
  rr(g, L + 4, top + 5, 24, 12, 3);
  paint(g, '#16a34a');
  txt(g, 'GET', L + 16, top + 11.5, 8, '#f0fdf4');
  g.fillStyle = '#94a3b8';
  for (let i = 0; i < 3; i++) g.fillRect(L + 5, top + 22 + i * 6, i % 2 ? w - 18 : w - 10, 2.5);
  g.fillStyle = '#0f172a';
  circ(g, -6, bot - 7, 2.2);
  g.fill();
  circ(g, 4, bot - 7, 2.2);
  g.fill();
};

const normalC: Body = (g, a) => {
  const { w, h, t } = a;
  legs(g, a, '#0e7490', 9, 12, 5);
  const slices = 6;
  const sh = (h - 12) / slices;
  for (let i = 0; i < slices; i++) {
    const off = Math.sin(t * 23 + i * 7.3) > 0.8 ? (i % 2 ? 4 : -4) : 0;
    g.fillStyle = i % 2 ? '#0b1120' : '#0f172a';
    g.fillRect(-w / 2 + off, -h / 2 + i * sh, w, sh + 0.5);
    g.fillStyle = '#22d3ee';
    g.fillRect(-w / 2 + off, -h / 2 + i * sh, 2, sh);
    g.fillRect(w / 2 - 2 + off, -h / 2 + i * sh, 2, sh);
  }
  g.fillStyle = '#22d3ee';
  g.fillRect(-w / 2, -h / 2, w, 2);
  g.fillRect(-w / 2, -h / 2 + slices * sh - 2, w, 2);
  rr(g, -w / 2 + 5, -h / 2 + 10, w - 10, 8, 4);
  paint(g, '#020617', '#22d3ee', 1);
  g.shadowColor = '#f43f5e';
  g.shadowBlur = 8;
  circ(g, Math.sin(t * 3) * (w / 2 - 10), -h / 2 + 14, 2.5);
  paint(g, '#f43f5e');
  g.shadowBlur = 0;
  txt(g, '200?', 0, 4, 9, '#67e8f9');
};

/* ======================= Scraper Bot ======================= */

const scraperA: Body = (g, a) => {
  const { w, h, t } = a;
  g.lineCap = 'round';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const k = Math.sin(t * 10 + i * 2.1 + (side > 0 ? 1 : 0)) * 4;
      g.strokeStyle = '#7c2d12';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(side * 10, 4 + i * 5);
      g.lineTo(side * (21 + i * 2), -2 + i * 6 + k);
      g.lineTo(side * (25 + i * 2) + k * 0.5, h / 2);
      g.stroke();
    }
  }
  g.lineCap = 'butt';
  line(g, 6, -14, 10, -26, '#fed7aa');
  circ(g, 10, -28, 3);
  paint(g, Math.sin(t * 8) > 0 ? '#ef4444' : '#7f1d1d');
  circ(g, 0, 0, w * 0.36);
  paint(g, '#ea580c', '#fed7aa');
  circ(g, -4, -3, 9);
  paint(g, '#1c1917', '#fdba74');
  circ(g, -6, -4, 4);
  paint(g, '#fde047');
  circ(g, -7.5, -5.5, 1.5);
  paint(g, '#ffffff');
  rr(g, -17, 7, 15, 11, 2);
  paint(g, '#f8fafc');
  g.fillStyle = '#94a3b8';
  g.fillRect(-15, 10, 11, 1.5);
  g.fillRect(-15, 13.5, 7, 1.5);
  txt(g, 'BOT', 8, 12, 8, '#fff7ed');
};

const scraperB: Body = (g, a) => {
  const { w, h, t } = a;
  legs(g, a, '#7c2d12', 10, 10, 7);
  line(g, 0, -h / 2 + 10, 0, -h / 2 + 1, '#fdba74');
  circ(g, 0, -h / 2, 3);
  paint(g, '#fb923c');
  rr(g, -w / 2 + 4, -h / 2 + 10, w - 8, 22, 6);
  paint(g, '#c2410c', '#fed7aa');
  rr(g, -w / 2 + 9, -h / 2 + 16, w - 18, 9, 4);
  paint(g, '#431407');
  circ(g, -7, -h / 2 + 20.5, 2.5);
  paint(g, '#fde047');
  circ(g, 7, -h / 2 + 20.5, 2.5);
  paint(g, '#fde047');
  rr(g, -w / 2, -h / 2 + 34, w, h - 46, 6);
  paint(g, '#9a3412', '#fed7aa');
  txt(g, '</>', 0, -h / 2 + 34 + (h - 46) / 2, 12, '#ffedd5');
  const dy = (t * 30) % 14;
  g.fillStyle = '#fde68a';
  g.fillRect(w / 2 + 3, -h / 2 + 12 + dy, 3, 3);
  g.fillRect(w / 2 + 8, -h / 2 + 12 + ((dy + 7) % 14), 3, 3);
};

const scraperC: Body = (g, a) => {
  const { w, h, t } = a;
  const spread = 14 * (0.6 + 0.4 * Math.sin(t * 4));
  const grad = g.createLinearGradient(-w / 2 - 42, 0, -w / 2 + 6, 0);
  grad.addColorStop(0, 'rgba(239,68,68,0)');
  grad.addColorStop(1, 'rgba(239,68,68,0.5)');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(-w / 2 + 6, -4);
  g.lineTo(-w / 2 - 42, -4 - spread);
  g.lineTo(-w / 2 - 42, -4 + spread);
  g.closePath();
  g.fill();
  for (let i = 0; i < 6; i++) {
    const x = -w / 2 + 6 + (i * (w - 12)) / 5;
    const k = Math.sin(t * 14 + i) * 3;
    line(g, x, 2, x - 4 + k, h / 2, '#fb923c', 1.3);
  }
  g.beginPath();
  g.ellipse(0, 0, w / 2, h * 0.2, 0, 0, TAU);
  paint(g, '#0c0a09', '#f97316', 1.5);
  g.shadowColor = '#ef4444';
  g.shadowBlur = 10;
  circ(g, -w / 2 + 9, -4, 4);
  paint(g, '#ef4444');
  g.shadowBlur = 0;
  txt(g, 'GET /*', 5, 1, 8, '#fdba74');
};

/* ======================= Ataque DDoS ======================= */

const ddosA: Body = (g, a) => {
  const { t } = a;
  if (Math.sin(t * 7) > 0.2) {
    g.strokeStyle = '#fde047';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-12, 10);
    g.lineTo(-18, 22);
    g.lineTo(-10, 22);
    g.lineTo(-16, 36);
    g.stroke();
  }
  if (Math.sin(t * 7 + 2) > 0.2) {
    g.strokeStyle = '#fde047';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(14, 10);
    g.lineTo(8, 22);
    g.lineTo(16, 22);
    g.lineTo(10, 34);
    g.stroke();
  }
  const puffs: [number, number, number][] = [
    [-22, 0, 15],
    [0, -10, 21],
    [22, 0, 15],
    [-10, 8, 14],
    [12, 8, 14],
  ];
  for (const [x, y, r] of puffs) {
    circ(g, x, y + Math.sin(t * 3 + x) * 1.5, r);
    g.lineWidth = 5;
    g.strokeStyle = '#f87171';
    g.stroke();
  }
  for (const [x, y, r] of puffs) {
    circ(g, x, y + Math.sin(t * 3 + x) * 1.5, r);
    paint(g, '#7f1d1d');
  }
  eye(g, -10, -5, 5.5);
  eye(g, 10, -5, 5.5);
  line(g, -18, -14, -5, -9, '#1c0505', 3);
  line(g, 18, -14, 5, -9, '#1c0505', 3);
  rr(g, -11, 5, 22, 8, 2);
  paint(g, '#1c0505');
  g.fillStyle = '#fef2f2';
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.moveTo(-9 + i * 5, 5);
    g.lineTo(-6.5 + i * 5, 9);
    g.lineTo(-4 + i * 5, 5);
    g.fill();
  }
  txt(g, 'DDoS', 0, -21, 9, '#fecaca');
};

const ddosB: Body = (g, a) => {
  const { w, h, t } = a;
  const n = 6;
  const cell = w / n;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if ((r - 2.5) ** 2 + (c - 2.5) ** 2 > 9.5) continue;
      const jx = Math.sin(t * 8 + r * 1.3 + c) * 1.5;
      const jy = Math.cos(t * 7 + c * 1.7 + r) * 1.5;
      rr(g, -w / 2 + c * cell + 2 + jx, -h / 2 + r * cell + 2 + jy, cell - 4, cell - 4, 3);
      paint(g, (r + c) % 3 === 0 ? '#ef4444' : '#991b1b');
    }
  }
  rr(g, -25, -10, 50, 20, 5);
  paint(g, '#1c0505', '#fca5a5', 1.5);
  txt(g, 'DDoS', 0, 0, 11, '#fee2e2');
  for (let i = 0; i < 3; i++) {
    const y = -16 + i * 16;
    const x = -w / 2 - 6 - ((t * 40 + i * 9) % 14);
    line(g, x, y, x + 7, y, 'rgba(248,113,113,0.7)', 2);
  }
};

const ddosC: Body = (g, a) => {
  const { w, h, t } = a;
  for (let i = 0; i < 4; i++) {
    g.strokeStyle = `rgba(248,113,113,${0.25 + 0.18 * i})`;
    g.lineWidth = 3;
    const s = t * (2 + i) + i;
    g.beginPath();
    g.arc(0, 0, w / 2 - 4 - i * 8, s, s + Math.PI * 1.3);
    g.stroke();
  }
  for (let k = 0; k < 12; k++) {
    const ang = k * 0.9 + t * 3;
    const r = w / 2 - ((k * 7 + t * 40) % (w / 2 - 8));
    circ(g, Math.cos(ang) * r, Math.sin(ang) * r, 1.8);
    paint(g, '#fecaca');
  }
  g.shadowColor = '#ef4444';
  g.shadowBlur = 16;
  circ(g, 0, 0, 11);
  paint(g, '#000000', '#ef4444');
  g.shadowBlur = 0;
  txt(g, 'DDoS', 0, h / 2 - 3, 9, '#fca5a5');
};

/* ======================= Zero-Day Exploit ======================= */

const zeroDayA: Body = (g, a) => {
  const { w, h, t } = a;
  legs(g, a, '#4a044e', 7, 12, 6);
  g.strokeStyle = '#a21caf';
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(w / 2 - 6, h / 2 - 16);
  g.quadraticCurveTo(w / 2 + 10, h / 2 - 18, w / 2 + 8, -4 + Math.sin(t * 6) * 3);
  g.stroke();
  g.fillStyle = '#a21caf';
  g.beginPath();
  g.moveTo(w / 2 + 3, -4 + Math.sin(t * 6) * 3);
  g.lineTo(w / 2 + 13, -6 + Math.sin(t * 6) * 3);
  g.lineTo(w / 2 + 8, -12 + Math.sin(t * 6) * 3);
  g.fill();
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(s * 9, -h / 2 + 11);
    g.lineTo(s * 15, -h / 2 - 3);
    g.lineTo(s * 3, -h / 2 + 9);
    g.closePath();
    paint(g, '#f0abfc');
  }
  rr(g, -w / 2 + 2, -h / 2 + 8, w - 4, h - 18, 12);
  paint(g, '#86198f', '#f0abfc');
  rr(g, -w / 2 + 2, -h / 2 + 14, w - 4, 10, 3);
  paint(g, '#1e1b4b');
  g.fillStyle = '#fde047';
  g.beginPath();
  g.ellipse(-7, -h / 2 + 19, 3.5, 1.8, 0.2, 0, TAU);
  g.fill();
  g.beginPath();
  g.ellipse(7, -h / 2 + 19, 3.5, 1.8, -0.2, 0, TAU);
  g.fill();
  g.strokeStyle = '#fdf4ff';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(0, -h / 2 + 27, 7, 0.1 * Math.PI, 0.9 * Math.PI);
  g.stroke();
  txt(g, '0day', 0, h / 2 - 18, 8, '#fae8ff');
};

const zeroDayB: Body = (g, a) => {
  const { w, h, t } = a;
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const y = -6 + i * 10;
      const k = Math.sin(t * 12 + i * 2 + (s > 0 ? 1.5 : 0)) * 3;
      line(g, s * 10, y, s * (w / 2 + 3), y + 5 + k, '#c026d3', 2);
    }
  }
  line(g, -4, -h / 2 + 4, -9, -h / 2 - 4, '#f0abfc', 1.5);
  line(g, 4, -h / 2 + 4, 9, -h / 2 - 4, '#f0abfc', 1.5);
  g.beginPath();
  g.ellipse(0, 5, w / 2 - 4, h / 2 - 9, 0, 0, TAU);
  paint(g, '#701a75', '#f0abfc');
  line(g, 0, -h / 2 + 14, 0, h / 2 - 4, '#f0abfc', 1.5);
  circ(g, 0, -h / 2 + 9, 8);
  paint(g, '#4a044e', '#f0abfc');
  circ(g, -3, -h / 2 + 8, 1.6);
  paint(g, '#fde047');
  circ(g, 3, -h / 2 + 8, 1.6);
  paint(g, '#fde047');
  txt(g, '0', -8, 6, 14, '#f5d0fe', 800);
  g.fillStyle = '#f5d0fe';
  for (const [x, y] of [
    [7, 0],
    [10, 8],
    [6, 14],
  ]) {
    circ(g, x, y, 2);
    g.fill();
  }
};

const zeroDayC: Body = (g, a) => {
  const { w, t } = a;
  legs(g, a, '#3b0764', 7, 10, 5);
  g.globalAlpha = Math.sin(t * 31) > 0.9 ? 0.45 : 1;
  const ox = Math.sin(t * 31) > 0.9 ? 3 : 0;
  g.shadowColor = '#e879f9';
  g.shadowBlur = 12;
  g.beginPath();
  g.arc(ox, -6, w / 2 - 2, Math.PI, 0);
  g.lineTo(ox + w / 2 - 2, 6);
  g.lineTo(ox + w / 4, 11);
  g.lineTo(ox + w / 4, 17);
  g.lineTo(ox - w / 4, 17);
  g.lineTo(ox - w / 4, 11);
  g.lineTo(ox - w / 2 + 2, 6);
  g.closePath();
  paint(g, '#1a0420', '#e879f9');
  g.shadowBlur = 0;
  for (const s of [-1, 1]) {
    circ(g, ox + s * 8, -6, 4.5);
    paint(g, '#e879f9');
    g.beginPath();
    g.moveTo(ox + s * 8 - 2.5, -4);
    g.lineTo(ox + s * 8 + 2.5, -4);
    g.lineTo(ox + s * 8, 3);
    g.fill();
  }
  for (let i = -1; i <= 1; i++) line(g, ox + i * 5, 11, ox + i * 5, 17, '#e879f9', 1.5);
  g.globalAlpha = 1;
};

/* ======================= SQL Injection ======================= */

const sqliA: Body = (g, a) => {
  const { w, h, t } = a;
  legs(g, a, '#365314', 8, 11, 6);
  rr(g, -12, -h / 2 + 28, 24, h - 38, 8);
  paint(g, '#3f6212', '#bef264');
  eye(g, -5, -h / 2 + 35, 3.5);
  eye(g, 5, -h / 2 + 35, 3.5);
  g.strokeStyle = '#ecfccb';
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(0, -h / 2 + 40, 3.5, 0.15 * Math.PI, 0.85 * Math.PI);
  g.stroke();
  g.save();
  g.translate(0, -h / 2 + 16);
  g.rotate(-0.12);
  rr(g, -w / 2 + 8, -9, w - 12, 18, 4);
  paint(g, 'rgba(236,252,203,0.9)', '#84cc16');
  const lvl = (w - 18) * (0.55 + 0.15 * Math.sin(t * 2));
  rr(g, -w / 2 + 10, -6, lvl, 12, 2);
  paint(g, '#65a30d');
  txt(g, 'SQL', -w / 2 + 10 + lvl / 2, 0, 7, '#f7fee7');
  g.fillStyle = '#d4d4d8';
  g.fillRect(-w / 2 - 9, -1.5, 17, 3);
  g.fillStyle = '#4d7c0f';
  g.fillRect(w / 2 - 4, -6, 7, 12);
  g.fillRect(w / 2 + 3, -9, 3, 18);
  g.restore();
};

const sqliB: Body = (g, a) => {
  const { w, h, t } = a;
  legs(g, a, '#1a2e05', 8, 10, 6);
  const top = -h / 2 + 12;
  const bh = h - 28;
  const rx = w / 2 - 2;
  const ry = 6;
  g.fillStyle = '#14532d';
  g.fillRect(-rx, top, 2 * rx, bh);
  g.beginPath();
  g.ellipse(0, top + bh, rx, ry, 0, 0, Math.PI);
  g.fill();
  line(g, -rx, top, -rx, top + bh, '#84cc16');
  line(g, rx, top, rx, top + bh, '#84cc16');
  for (let i = 1; i <= 2; i++) {
    g.strokeStyle = '#4d7c0f';
    g.lineWidth = 1.5;
    g.beginPath();
    g.ellipse(0, top + (i * bh) / 3, rx, ry, 0, 0, Math.PI);
    g.stroke();
  }
  g.beginPath();
  g.ellipse(0, top, rx, ry, 0, 0, TAU);
  paint(g, '#22c55e', '#bbf7d0');
  const dy = (t * 18) % 14;
  g.fillStyle = '#ef4444';
  g.beginPath();
  g.moveTo(8, top - 16 + dy);
  g.quadraticCurveTo(12, top - 8 + dy, 8, top - 6 + dy);
  g.quadraticCurveTo(4, top - 8 + dy, 8, top - 16 + dy);
  g.fill();
  txt(g, "'OR 1=1", 0, top + bh / 2 + 2, 8, '#d9f99d');
};

const sqliC: Body = (g, a) => {
  const { w, h, t } = a;
  legs(g, a, '#14532d', 8, 10, 5);
  rr(g, -w / 2, -h / 2, w, h - 10, 4);
  paint(g, '#020617', '#84cc16', 1.5);
  g.fillStyle = '#1a2e05';
  g.fillRect(-w / 2 + 1, -h / 2 + 1, w - 2, 7);
  ['#ef4444', '#eab308', '#22c55e'].forEach((c, i) => {
    circ(g, -w / 2 + 5 + i * 5, -h / 2 + 4.5, 1.5);
    paint(g, c);
  });
  const lines = ['DROP', 'TABLE', 'users;', '--', "' OR", '1=1'];
  const off = Math.floor(t * 3);
  for (let i = 0; i < 4; i++) txt(g, lines[(i + off) % lines.length], -w / 2 + 4, -h / 2 + 15 + i * 8, 7, '#a3e635', 600, 'left');
  if (Math.floor(t * 2) % 2) {
    g.fillStyle = '#a3e635';
    g.fillRect(-w / 2 + 4, -h / 2 + 44, 5, 2);
  }
};

/* ======================= Ransomware ======================= */

const ransomwareA: Body = (g, a) => {
  const { w, h } = a;
  legs(g, a, '#1c1917', 8, 12, 7);
  circ(g, w / 2 - 1, 4, 12);
  paint(g, '#78350f', '#fbbf24');
  txt(g, '₿', w / 2 - 1, 5, 12, '#fde68a');
  rr(g, -w / 2 + 2, -h / 2 + 6, w - 8, h - 16, 12);
  paint(g, '#7f1d1d', '#fca5a5');
  rr(g, -w / 2 + 2, -h / 2 + 2, w - 8, 10, 5);
  paint(g, '#111827');
  rr(g, -w / 2 + 2, -h / 2 + 15, w - 8, 9, 4);
  paint(g, '#0a0a0a');
  circ(g, -9, -h / 2 + 19.5, 2.4);
  paint(g, '#f8fafc');
  circ(g, 3, -h / 2 + 19.5, 2.4);
  paint(g, '#f8fafc');
  g.strokeStyle = '#fecaca';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(-3, -h / 2 + 28, 6, 0.15 * Math.PI, 0.85 * Math.PI);
  g.stroke();
  padlock(g, -w / 2 + 6, 10, 0.7);
};

const ransomwareB: Body = (g, a) => {
  const { w, h, t } = a;
  legs(g, a, '#450a0a', 8, 10, 6);
  g.strokeStyle = '#fecaca';
  g.lineWidth = 5;
  g.beginPath();
  g.arc(0, -h / 2 + 17, w / 2 - 10, Math.PI, TAU);
  g.stroke();
  rr(g, -w / 2, -h / 2 + 16, w, h - 28, 8);
  paint(g, '#dc2626', '#fecaca');
  rr(g, -w / 2 + 5, -h / 2 + 21, w - 10, 11, 3);
  paint(g, '#450a0a');
  const sec = 59 - (Math.floor(t) % 60);
  txt(g, `00:${String(sec).padStart(2, '0')}`, 0, -h / 2 + 27, 8, '#fca5a5');
  circ(g, 0, 4, 4);
  paint(g, '#450a0a');
  g.beginPath();
  g.moveTo(-3, 6);
  g.lineTo(3, 6);
  g.lineTo(0, 13);
  g.fill();
};

const ransomwareC: Body = (g, a) => {
  const { w, h, t } = a;
  legs(g, a, '#0a0a0a', 8, 10, 5);
  rr(g, -w / 2, -h / 2, w, h - 10, 4);
  paint(g, '#450a0a', '#ef4444', 1.5);
  g.font = `600 6px ${MONO}`;
  g.fillStyle = 'rgba(248,113,113,0.5)';
  g.textAlign = 'center';
  for (let c = 0; c < 5; c++) {
    for (let r = 0; r < 6; r++) g.fillText(((c * 7 + r * 3 + Math.floor(t * 6)) % 16).toString(16), -w / 2 + 5 + c * 9, -h / 2 + 6 + r * 8);
  }
  circ(g, 0, -7, 10);
  paint(g, '#fef2f2');
  g.fillStyle = '#fef2f2';
  g.fillRect(-6, 1, 12, 6);
  circ(g, -4, -8, 3);
  paint(g, '#0a0a0a');
  circ(g, 4, -8, 3);
  paint(g, '#0a0a0a');
  txt(g, 'ENCRYPTED', 0, h / 2 - 16, 6, '#fecaca');
};

/* ======================= Memory Leak (grows) ======================= */

const memoryLeakA: Body = (g, a) => {
  const { w, h, t } = a;
  const k = w / 40;
  g.fillStyle = 'rgba(168,85,247,0.35)';
  g.beginPath();
  g.ellipse(4 * k, h / 2, w * 0.62, 4 * k, 0, 0, TAU);
  g.fill();
  const wob = Math.sin(t * 4) * 3 * k;
  g.beginPath();
  g.moveTo(-w / 2, h / 2 - 3);
  g.bezierCurveTo(-w / 2 - 2, -h / 2 + wob, w / 2 + 2, -h / 2 - wob, w / 2, h / 2 - 3);
  g.closePath();
  paint(g, '#7e22ce', '#d8b4fe');
  g.globalAlpha = 0.35;
  g.beginPath();
  g.ellipse(-w / 5, -h / 6, w / 8, h / 10, -0.5, 0, TAU);
  paint(g, '#ffffff');
  g.globalAlpha = 1;
  eye(g, -6 * k, -1 * k, 4.5 * k);
  eye(g, 6 * k, -1 * k, 4.5 * k);
  circ(g, 0, 8 * k, 2.5 * k);
  paint(g, '#3b0764');
  const dy = (t * 14) % 10;
  circ(g, -w / 4, h / 2 - 2 + dy * k, 2.4 * k);
  paint(g, '#c084fc');
};

const memoryLeakB: Body = (g, a) => {
  const { w, h, t } = a;
  const k = w / 40;
  rr(g, -w / 2 + 4, -h / 2, w - 8, h - 8, 3);
  paint(g, '#14532d', '#86efac', 1.5);
  const chipH = (h - 16) / 3;
  for (let i = 0; i < 3; i++) {
    rr(g, -w / 2 + 8, -h / 2 + 4 + i * chipH, w - 16, chipH - 3, 2);
    paint(g, '#111827');
  }
  g.globalAlpha = 0.65;
  rr(g, -w / 2 + 8, -h / 2 + 4, (w - 16) * (0.6 + 0.4 * Math.abs(Math.sin(t))), h - 19, 2);
  paint(g, '#a855f7');
  g.globalAlpha = 1;
  g.fillStyle = '#fbbf24';
  for (let i = 0; i < Math.floor((w - 12) / 4); i++) g.fillRect(-w / 2 + 6 + i * 4, h / 2 - 8, 2, 4);
  for (let d = 0; d < 3; d++) {
    const y = (t * 20 + d * 12) % 26;
    circ(g, w / 2 - 1, -h / 2 + 8 + y, 2.2 * k);
    paint(g, '#c084fc');
  }
  txt(g, 'RAM', 0, -2, 8 * k, '#f3e8ff');
};

const memoryLeakC: Body = (g, a) => {
  const { w, t } = a;
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * TAU + Math.sin(t + i) * 0.2;
    const r = w / 2 + 6;
    g.strokeStyle = '#a855f7';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(Math.cos(ang + 0.6) * r * 0.6, Math.sin(ang + 0.6) * r * 0.6, Math.cos(ang) * r, Math.sin(ang) * r);
    g.stroke();
    circ(g, Math.cos(ang) * r, Math.sin(ang) * r, 2);
    paint(g, '#e9d5ff');
  }
  g.shadowColor = '#a855f7';
  g.shadowBlur = 12;
  circ(g, 0, 0, w * 0.33);
  paint(g, '#2e1065', '#c084fc');
  g.shadowBlur = 0;
  txt(g, Math.floor(t * 4) % 2 ? '0xFF' : '0x00', 0, 0, Math.max(7, w / 6), '#f5d0fe');
};

/* ======================= Botnet (+ botlet) ======================= */

const botnetA: Body = (g, a) => {
  const { t } = a;
  g.strokeStyle = `rgba(239,68,68,${0.45 + 0.4 * Math.sin(t * 6)})`;
  g.lineWidth = 1.5;
  g.setLineDash([3, 3]);
  g.lineDashOffset = -t * 20;
  g.beginPath();
  g.moveTo(-19, -12);
  g.lineTo(19, -12);
  g.lineTo(0, 12);
  g.closePath();
  g.stroke();
  g.setLineDash([]);
  // camera
  line(g, -19, -6, -19, 2, '#94a3b8', 2);
  rr(g, -30, -20, 22, 13, 3);
  paint(g, '#e5e7eb', '#94a3b8', 1);
  circ(g, -27, -13.5, 4.5);
  paint(g, '#111827');
  circ(g, -27, -13.5, 1.6);
  paint(g, '#ef4444');
  // router
  line(g, 12, -16, 9, -26, '#64748b', 1.5);
  line(g, 26, -16, 29, -26, '#64748b', 1.5);
  rr(g, 8, -17, 24, 10, 2);
  paint(g, '#1f2937', '#64748b', 1);
  for (let i = 0; i < 4; i++) {
    circ(g, 13 + i * 5, -12, 1.4);
    paint(g, Math.floor(t * 8 + i) % 2 ? '#ef4444' : '#450a0a');
  }
  // fridge (walks)
  legs(g, a, '#334155', 5, 6, 4);
  rr(g, -9, 0, 18, 24, 3);
  paint(g, '#f1f5f9', '#94a3b8', 1);
  line(g, -9, 9, 9, 9, '#94a3b8', 1);
  line(g, 6, 3, 6, 7, '#64748b', 1.5);
  circ(g, -3, 15, 1.8);
  paint(g, '#ef4444');
  circ(g, 3, 15, 1.8);
  paint(g, '#ef4444');
};

const botletA: Body = (g, a) => {
  const { w, h } = a;
  legs(g, a, '#334155', 5, 6, 4);
  rr(g, -w / 2, -h / 2 + 4, w, h - 12, 3);
  paint(g, '#e5e7eb', '#94a3b8', 1);
  circ(g, -w / 2 + 6, -h / 2 + 4 + (h - 12) / 2, 4);
  paint(g, '#111827');
  circ(g, -w / 2 + 6, -h / 2 + 4 + (h - 12) / 2, 1.5);
  paint(g, '#ef4444');
};

const botnetB: Body = (g, a) => {
  const { t } = a;
  const nodes: [number, number][] = [
    [-22, -14],
    [22, -14],
    [-22, 14],
    [22, 14],
  ];
  g.setLineDash([4, 4]);
  g.lineDashOffset = -t * 20;
  for (const [x, y] of nodes) line(g, 0, 0, x, y, '#f59e0b', 1.5);
  g.setLineDash([]);
  nodes.forEach(([x, y], i) => {
    circ(g, x, y + Math.sin(t * 5 + i) * 1.5, 7);
    paint(g, '#78350f', '#fbbf24', 1.5);
    circ(g, x, y + Math.sin(t * 5 + i) * 1.5, 2);
    paint(g, '#ef4444');
  });
  circ(g, 0, 0, 12);
  paint(g, '#1c1917', '#ef4444');
  txt(g, 'C2', 0, 0.5, 9, '#fecaca');
};

const botletB: Body = (g, a) => {
  const { h, t } = a;
  legs(g, a, '#78350f', 4, 6, 3);
  line(g, 0, -h / 2 + 6, 0, -h / 2, '#fbbf24', 1.5);
  circ(g, 0, -h / 2 + 15, 9);
  paint(g, '#78350f', '#fbbf24', 1.5);
  circ(g, 0, -h / 2 + 15, 2.5);
  paint(g, Math.sin(t * 8) > 0 ? '#ef4444' : '#7f1d1d');
};

const botnetC: Body = (g, a) => {
  const { t } = a;
  const r = 10;
  const cells: [number, number][] = [
    [0, 0],
    [17.3, 0],
    [-17.3, 0],
    [8.7, -15],
    [-8.7, -15],
    [8.7, 15],
    [-8.7, 15],
  ];
  cells.forEach(([x, y], i) => {
    hexPath(g, x, y, r);
    paint(g, '#451a03', '#f59e0b', 1.5);
    if (Math.sin(t * 3 + i * 1.7) > -0.2) {
      g.shadowColor = '#ef4444';
      g.shadowBlur = 8;
      circ(g, x - 2.5, y, 1.8);
      paint(g, '#ef4444');
      circ(g, x + 2.5, y, 1.8);
      paint(g, '#ef4444');
      g.shadowBlur = 0;
    }
  });
};

const botletC: Body = (g, a) => {
  const { t } = a;
  const flap = Math.abs(Math.sin(t * 30));
  g.globalAlpha = 0.5;
  g.beginPath();
  g.ellipse(-7, -8, 7, 3 + 3 * flap, -0.4, 0, TAU);
  paint(g, '#fde68a');
  g.beginPath();
  g.ellipse(7, -8, 7, 3 + 3 * flap, 0.4, 0, TAU);
  paint(g, '#fde68a');
  g.globalAlpha = 1;
  hexPath(g, 0, 0, 9);
  paint(g, '#451a03', '#f59e0b', 1.5);
  circ(g, -2.5, 0, 1.6);
  paint(g, '#ef4444');
  circ(g, 2.5, 0, 1.6);
  paint(g, '#ef4444');
};

/* ======================= Slowloris ======================= */

function cables(g: G, a: Anim, color: string, plugs: boolean): void {
  const { w, h, t } = a;
  for (let i = 0; i < 4; i++) {
    const y = -h / 2 + 14 + i * 11;
    g.strokeStyle = color;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(w / 2 - 4, y);
    for (let k = 1; k <= 6; k++) g.lineTo(w / 2 + k * 8, y + Math.sin(t * 1.5 + k + i) * 3);
    g.stroke();
    if (plugs) {
      rr(g, w / 2 + 46, y - 3 + Math.sin(t * 1.5 + 6 + i) * 3, 6, 6, 1);
      paint(g, color);
    }
  }
}

const slowlorisA: Body = (g, a) => {
  const { w, h, t } = a;
  const slow: Anim = { ...a, step: a.step * 0.5 };
  cables(g, a, '#a8a29e', true);
  legs(g, slow, '#57534e', 10, 12, 9);
  rr(g, -w / 2, -h / 2 + 6, w, h - 16, 18);
  paint(g, '#78716c', '#d6d3d1');
  g.beginPath();
  g.ellipse(0, -h / 2 + 23, 16, 12, 0, 0, TAU);
  paint(g, '#e7e5e4');
  g.fillStyle = '#44403c';
  g.beginPath();
  g.ellipse(-7, -h / 2 + 22, 6, 3.5, -0.4, 0, TAU);
  g.fill();
  g.beginPath();
  g.ellipse(7, -h / 2 + 22, 6, 3.5, 0.4, 0, TAU);
  g.fill();
  const sleepy = Math.sin(t * 0.8) > 0.4;
  if (sleepy) {
    line(g, -10, -h / 2 + 22, -4, -h / 2 + 22, '#fafaf9', 1.5);
    line(g, 4, -h / 2 + 22, 10, -h / 2 + 22, '#fafaf9', 1.5);
    txt(g, 'z', w / 2 - 2, -h / 2 + 2 - ((t * 6) % 6), 9, '#e7e5e4');
  } else {
    circ(g, -7, -h / 2 + 22, 2);
    paint(g, '#fafaf9');
    circ(g, 7, -h / 2 + 22, 2);
    paint(g, '#fafaf9');
  }
  g.beginPath();
  g.ellipse(0, -h / 2 + 27, 3, 2, 0, 0, TAU);
  paint(g, '#292524');
  txt(g, 'keep-alive', 0, h / 2 - 19, 7, '#fafaf9');
};

const slowlorisB: Body = (g, a) => {
  const { w, h, t } = a;
  cables(g, a, '#38bdf8', true);
  legs(g, a, '#082f49', 10, 10, 8);
  rr(g, -w / 2, -h / 2, w, h - 10, 10);
  paint(g, '#0c4a6e', '#38bdf8');
  rr(g, -14, -h / 2 + 8, 28, 26, 13);
  paint(g, '#e0f2fe');
  g.fillStyle = '#0c4a6e';
  g.fillRect(-7, -h / 2 + 14, 3, 9);
  g.fillRect(4, -h / 2 + 14, 3, 9);
  circ(g, 0, -h / 2 + 28, 2.5);
  g.fill();
  txt(g, 'z', w / 2 - 4, -h / 2 - 2 - ((t * 5) % 8), 10, '#bae6fd');
  txt(g, '…', 0, h / 2 - 20, 12, '#bae6fd');
};

const slowlorisC: Body = (g, a) => {
  const { w, h, t } = a;
  g.strokeStyle = 'rgba(56,189,248,0.55)';
  g.lineWidth = 3;
  g.setLineDash([6, 5]);
  g.lineDashOffset = t * 4;
  g.beginPath();
  g.moveTo(w / 2 - 6, h / 2 - 4);
  g.lineTo(w / 2 + 50, h / 2 - 4);
  g.stroke();
  g.setLineDash([]);
  g.beginPath();
  g.ellipse(-2, h / 2 - 7, w / 2, 7, 0, 0, TAU);
  paint(g, '#0c4a6e', '#7dd3fc');
  line(g, -w / 2 + 8, h / 2 - 12, -w / 2 + 2, h / 2 - 30, '#7dd3fc', 2);
  line(g, -w / 2 + 13, h / 2 - 12, -w / 2 + 11, h / 2 - 31, '#7dd3fc', 2);
  circ(g, -w / 2 + 2, h / 2 - 31, 3);
  paint(g, '#e0f2fe');
  circ(g, -w / 2 + 11, h / 2 - 32, 3);
  paint(g, '#e0f2fe');
  const cx = 6;
  const cy = h / 2 - 27;
  g.shadowColor = '#38bdf8';
  g.shadowBlur = 10;
  circ(g, cx, cy, 17);
  paint(g, '#082f49', '#38bdf8');
  g.shadowBlur = 0;
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * TAU + t * 1.2;
    g.globalAlpha = 0.2 + (i / 8) * 0.8;
    circ(g, cx + Math.cos(ang) * 10, cy + Math.sin(ang) * 10, 2.4);
    paint(g, '#bae6fd');
  }
  g.globalAlpha = 1;
};

/* ======================= Black Friday Traffic (boss) ======================= */

const blackFridayA: Body = (g, a) => {
  const { w, h, t } = a;
  const wheelY = h / 2 - 10;
  // flying price tag
  const tagY = -h / 2 - 6 - ((t * 20) % 18);
  g.save();
  g.translate(30, tagY);
  g.rotate(Math.sin(t * 3) * 0.3);
  rr(g, -14, -6, 28, 12, 3);
  paint(g, '#dc2626', '#fecaca', 1);
  txt(g, '-70%', 0, 0.5, 8, '#ffffff');
  g.restore();
  // boxes piled inside the cart
  const boxes: [number, number, number, number, string][] = [
    [-40, -46, 28, 24, '#b45309'],
    [-10, -56, 32, 30, '#92400e'],
    [18, -44, 26, 20, '#a16207'],
    [-26, -30, 26, 12, '#78350f'],
  ];
  for (const [x, y, bw, bh, c] of boxes) {
    rr(g, x, y, bw, bh, 2);
    paint(g, c, '#fde68a', 1);
    line(g, x + bw / 2, y, x + bw / 2, y + bh, 'rgba(253,230,138,0.6)', 1.5);
  }
  // basket
  const top = -22;
  const bot = wheelY - 16;
  g.beginPath();
  g.moveTo(-w / 2, top);
  g.lineTo(w / 2, top);
  g.lineTo(w / 2 - 10, bot);
  g.lineTo(-w / 2 + 14, bot);
  g.closePath();
  paint(g, 'rgba(10,10,10,0.92)', '#facc15', 3);
  g.save();
  g.clip();
  for (let x = -w / 2; x < w / 2; x += 11) line(g, x, top, x - 4, bot, 'rgba(161,98,7,0.55)', 1.5);
  for (let y = top + 10; y < bot; y += 10) line(g, -w / 2, y, w / 2, y, 'rgba(161,98,7,0.55)', 1.5);
  g.restore();
  // handle
  line(g, w / 2, top, w / 2 + 10, top - 16, '#facc15', 3);
  rr(g, w / 2 + 4, top - 22, 14, 7, 3);
  paint(g, '#dc2626');
  // angry face
  for (const ex of [-22, 8]) {
    g.beginPath();
    g.ellipse(ex, -4, 9, 7, 0, 0, TAU);
    paint(g, '#fef9c3');
    circ(g, ex - 3, -3, 3.5);
    paint(g, '#dc2626');
  }
  line(g, -32, -15, -14, -10, '#facc15', 3.5);
  line(g, 18, -15, 0, -10, '#facc15', 3.5);
  rr(g, -30, 8, 46, 13, 4);
  paint(g, '#000000');
  g.fillStyle = '#f8fafc';
  for (let i = 0; i < 7; i++) {
    g.beginPath();
    g.moveTo(-28 + i * 6.3, 8);
    g.lineTo(-25 + i * 6.3, 13);
    g.lineTo(-22 + i * 6.3, 8);
    g.fill();
  }
  // wheels
  for (const wx of [-w / 2 + 24, w / 2 - 20]) {
    circ(g, wx, wheelY, 10);
    paint(g, '#262626', '#facc15', 2.5);
    for (let s = 0; s < 3; s++) {
      const ang = -t * 6 + (s * TAU) / 3;
      line(g, wx, wheelY, wx + Math.cos(ang) * 8, wheelY + Math.sin(ang) * 8, '#facc15', 1.5);
    }
  }
  rr(g, -46, -h / 2 - 2, 92, 15, 4);
  paint(g, '#dc2626');
  txt(g, 'BLACK FRIDAY', 0, -h / 2 + 6, 10, '#ffffff', 800);
};

const blackFridayB: Body = (g, a) => {
  const { w, h, t } = a;
  for (const s of [-1, 1]) {
    const lift = Math.max(0, s * a.step) * 4;
    rr(g, s * 28 - 14, h / 2 - 14 - lift, 28, 14, 3);
    paint(g, '#18181b', '#facc15', 1.5);
    circ(g, s * 28 + 8, h / 2 - 7 - lift, 1.8);
    paint(g, Math.floor(t * 6) % 2 ? '#22c55e' : '#ef4444');
  }
  rr(g, -w / 2, -h / 2, w, h - 14, 10);
  paint(g, '#09090b', '#facc15', 3);
  rr(g, -w / 2 + 6, -h / 2 + 6, w - 12, 16, 4);
  paint(g, '#facc15');
  txt(g, 'BLACK FRIDAY', 0, -h / 2 + 14.5, 11, '#09090b', 900);
  // eyes
  for (const ex of [-22, 22]) {
    g.shadowColor = '#ef4444';
    g.shadowBlur = 12;
    rr(g, ex - 9, -h / 2 + 28, 18, 6, 3);
    paint(g, '#ef4444');
    g.shadowBlur = 0;
  }
  // graph
  const gx0 = -w / 2 + 10;
  const gx1 = w / 2 - 10;
  const base = h / 2 - 34;
  g.strokeStyle = 'rgba(250,204,21,0.15)';
  g.lineWidth = 1;
  for (let y = base; y > -h / 2 + 40; y -= 10) {
    g.beginPath();
    g.moveTo(gx0, y);
    g.lineTo(gx1, y);
    g.stroke();
  }
  const n = 18;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = gx0 + ((gx1 - gx0) * i) / n;
    const spike = i > n * 0.62 ? ((i - n * 0.62) / (n * 0.38)) ** 2 * (h - 40) : 0;
    const noise = Math.sin(t * 6 + i * 1.7) * 3;
    pts.push([x, base - 6 - spike - noise]);
  }
  g.beginPath();
  g.moveTo(pts[0][0], base);
  for (const [x, y] of pts) g.lineTo(x, y);
  g.lineTo(gx1, base);
  g.closePath();
  g.fillStyle = 'rgba(239,68,68,0.25)';
  g.fill();
  g.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
  g.strokeStyle = '#ef4444';
  g.lineWidth = 3;
  g.stroke();
  const [lx, ly] = pts[pts.length - 1];
  g.beginPath();
  g.moveTo(lx - 6, ly + 6);
  g.lineTo(lx + 2, ly - 4);
  g.lineTo(lx + 4, ly + 8);
  g.closePath();
  paint(g, '#ef4444');
  const rps = 1000 + Math.floor((t * 997) % 9000);
  txt(g, `${rps} req/s`, 0, h / 2 - 25, 10, '#fca5a5');
};

const blackFridayC: Body = (g, a) => {
  const { w, h, t } = a;
  for (const s of [-1, 1]) {
    const lift = Math.max(0, s * a.step) * 7;
    rr(g, s * 26 - 8, h / 2 - 30 - lift, 16, 26, 4);
    paint(g, '#27272a', '#52525b', 1.5);
    rr(g, s * 26 - 13, h / 2 - 8 - lift, 26, 8, 3);
    paint(g, '#facc15');
  }
  const bh = h - 30;
  rr(g, -w / 2, -h / 2, w, bh, 8);
  paint(g, '#0a0a0a', '#3f3f46', 4);
  // bulbs around the border
  const bulbs: [number, number][] = [];
  for (let i = 0; i <= 8; i++) bulbs.push([-w / 2 + 6 + (i * (w - 12)) / 8, -h / 2 + 5]);
  for (let i = 1; i <= 5; i++) bulbs.push([w / 2 - 5, -h / 2 + 5 + (i * (bh - 10)) / 6]);
  for (let i = 8; i >= 0; i--) bulbs.push([-w / 2 + 6 + (i * (w - 12)) / 8, -h / 2 + bh - 5]);
  for (let i = 5; i >= 1; i--) bulbs.push([-w / 2 + 5, -h / 2 + 5 + (i * (bh - 10)) / 6]);
  bulbs.forEach(([x, y], i) => {
    const lit = (i + Math.floor(t * 8)) % 3 === 0;
    if (lit) {
      g.shadowColor = '#fde047';
      g.shadowBlur = 8;
    }
    circ(g, x, y, 2.6);
    paint(g, lit ? '#fde047' : '#713f12');
    g.shadowBlur = 0;
  });
  g.globalAlpha = Math.sin(t * 23) > 0.94 ? 0.3 : 1;
  g.shadowColor = '#f472b6';
  g.shadowBlur = 14;
  txt(g, 'BLACK', 0, -h / 2 + 24, 20, '#f9a8d4', 900);
  g.shadowColor = '#facc15';
  txt(g, 'FRIDAY', 0, -h / 2 + 45, 18, '#fde047', 900);
  g.shadowBlur = 0;
  g.globalAlpha = 1;
  g.shadowColor = '#ef4444';
  g.shadowBlur = 10;
  txt(g, '%', -20, -h / 2 + 66, 18, '#ef4444', 900);
  txt(g, '%', 20, -h / 2 + 66, 18, '#ef4444', 900);
  g.shadowBlur = 0;
  rr(g, -18, -h / 2 + 76, 36, 10, 3);
  paint(g, '#dc2626');
  txt(g, '-70', 0, -h / 2 + 81.5, 8, '#ffffff', 800);
};

/* ======================= Registry ======================= */

export const STYLE_NAMES: Record<Pick, string> = {
  A: 'Personaje',
  B: 'Icono técnico',
  C: 'Glitch / neón',
};

export const AVATAR_OPTIONS: Record<AvatarThreat, Record<Pick, Body>> = {
  blackFriday: { A: blackFridayA, B: blackFridayB, C: blackFridayC },
  normal: { A: normalA, B: normalB, C: normalC },
  scraper: { A: scraperA, B: scraperB, C: scraperC },
  ddos: { A: ddosA, B: ddosB, C: ddosC },
  zeroDay: { A: zeroDayA, B: zeroDayB, C: zeroDayC },
  sqli: { A: sqliA, B: sqliB, C: sqliC },
  ransomware: { A: ransomwareA, B: ransomwareB, C: ransomwareC },
  memoryLeak: { A: memoryLeakA, B: memoryLeakB, C: memoryLeakC },
  botnet: { A: botnetA, B: botnetB, C: botnetC },
  slowloris: { A: slowlorisA, B: slowlorisB, C: slowlorisC },
};

/** Botlets come from botnets, so they follow the botnet's style. */
export const BOTLET_OPTIONS: Record<Pick, Body> = { A: botletA, B: botletB, C: botletC };
