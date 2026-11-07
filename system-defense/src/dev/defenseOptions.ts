import type { DefenseType } from '../config';
import { circ, line, paint, rr, TAU, txt, type G, type Pick } from './avatarOptions';

/*
 * Defense avatars, round 1: same style as the threats (flat, technological, one symbol each).
 * Team trait: every defense stands on a dark base with a green "OK" LED.
 * Option A of each defense has a screen face with LED eyes looking right (toward the threats);
 * B and C are machines without a face.
 *
 * Each body draws centered at (0, 0), about 70×70 like drawDefense; the base top is y = 28.
 */

export type DefItem = DefenseType | 'rollback';

export interface DefAnim {
  t: number;
  /** true in the "Acción" view. */
  action: boolean;
  /** 0..1 short push: recoil when firing, shake when hit. */
  kick: number;
  /** Worker Node charge 0..1. */
  charge: number;
  /** Circuit Breaker: fuse left 1..0 while armed, undefined when not armed. */
  fuse?: number;
  /** Walls: hp ratio 0..1 (cracks). */
  hp: number;
  /** Kafka: 1 = ready, 0 = just used. */
  ready: number;
  /** Kafka is holding a threat. */
  busy: boolean;
  /** 2 = upgraded version (round 2 bodies show it; round 1 bodies ignore it). */
  level?: 1 | 2;
}
export type DefBody = (g: G, a: DefAnim) => void;

/* ---------------- Shared parts ---------------- */

/** Team trait: dark base plate with a green "OK" LED. */
export function teamBase(g: G, w: number, t: number): void {
  rr(g, -w / 2, 28, w, 7, 3);
  paint(g, '#0f172a', '#334155', 1);
  circ(g, w / 2 - 6, 31.5, 1.8);
  paint(g, t % 2 < 1.6 ? '#4ade80' : '#166534');
}

/** Dark screen with two LED eyes looking right (toward the threats). Blinks now and then. */
function faceR(g: G, x: number, y: number, w: number, h: number, led: string, t: number, seed = 0, bg = '#0b1224'): void {
  rr(g, x, y, w, h, Math.min(5, h / 2.5));
  paint(g, bg);
  const blink = (t + seed) % 3.4 < 0.12;
  const ew = Math.max(2.5, w * 0.16);
  const eh = blink ? 1.2 : Math.max(3, h * 0.5);
  const ey = y + h / 2 - eh / 2;
  const x2 = x + w - w * 0.16 - ew;
  const x1 = x2 - w * 0.14 - ew;
  g.fillStyle = led;
  rr(g, x1, ey, ew, eh, 1.2);
  g.fill();
  rr(g, x2, ey, ew, eh, 1.2);
  g.fill();
}

/** Cracks on a wall when it loses hp. */
export function cracks(g: G, hp: number, x: number, y: number, h: number, color: string): void {
  g.strokeStyle = color;
  g.lineWidth = 2;
  if (hp < 0.66) {
    g.beginPath();
    g.moveTo(x - 10, y);
    g.lineTo(x - 2, y + h * 0.3);
    g.lineTo(x - 8, y + h * 0.55);
    g.lineTo(x, y + h * 0.85);
    g.stroke();
  }
  if (hp < 0.33) {
    g.beginPath();
    g.moveTo(x + 18, y + 4);
    g.lineTo(x + 10, y + h * 0.35);
    g.lineTo(x + 16, y + h * 0.6);
    g.lineTo(x + 8, y + h * 0.9);
    g.stroke();
  }
}

/** Shake for walls being hit. */
export const shake = (a: DefAnim): number => (a.kick > 0 ? Math.sin(a.t * 70) * 1.5 * a.kick : 0);

/** Red blink over an armed Circuit Breaker (faster as the fuse runs out). */
export function armedBlink(g: G, a: DefAnim, x: number, y: number, w: number, h: number, r: number): void {
  if (a.fuse === undefined) return;
  const k = 1 - a.fuse;
  g.globalAlpha = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(a.t * (14 + k * 50)));
  rr(g, x, y, w, h, r);
  paint(g, '#ef4444');
  g.globalAlpha = 1;
}

/* ======================= Worker Node (generates CU) ======================= */

const workerFace: DefBody = (g, a) => {
  const { t, charge } = a;
  teamBase(g, 52, t);
  rr(g, -22, -36, 44, 64, 7);
  paint(g, '#0f2a3d', '#38bdf8', 1.8);
  faceR(g, -16, -30, 32, 16, '#7dd3fc', t, 0.3);
  for (let i = 0; i < 2; i++) {
    const sy = -8 + i * 12;
    rr(g, -16, sy, 32, 8, 2);
    paint(g, '#081521');
    g.fillStyle = '#1e4a66';
    g.fillRect(-12, sy + 3, 14, 2);
    circ(g, 10, sy + 4, 2);
    paint(g, Math.sin(t * 5 + i * 1.7) > -0.3 ? '#4ade80' : '#14532d');
  }
  rr(g, -16, 17, 32, 5, 2.5);
  paint(g, '#081521');
  rr(g, -16, 17, 32 * Math.max(0.06, charge), 5, 2.5);
  paint(g, '#fde047');
};

const workerRack: DefBody = (g, a) => {
  const { t, charge, action } = a;
  teamBase(g, 60, t);
  for (let i = 0; i < 3; i++) {
    const y = -32 + i * 18;
    rr(g, -28, y, 56, 16, 3);
    paint(g, '#0c2233', '#38bdf8', 1.5);
    for (let k = 0; k < 4; k++) line(g, -22 + k * 4, y + 4, -22 + k * 4, y + 12, '#1e4a66', 1.5);
    circ(g, 0, y + 8, 2);
    paint(g, Math.sin(t * 6 + i * 2) > -0.2 ? '#4ade80' : '#14532d');
    g.save();
    g.translate(16, y + 8);
    circ(g, 0, 0, 6);
    paint(g, '#081521', '#38bdf8', 1);
    g.rotate(t * (action ? 14 : 6) + i);
    for (let k = 0; k < 3; k++) {
      line(g, 0, 0, 5, 0, '#7dd3fc', 2);
      g.rotate(TAU / 3);
    }
    g.restore();
  }
  rr(g, -28, 22, 56, 4, 2);
  paint(g, '#081521');
  rr(g, -28, 22, 56 * Math.max(0.05, charge), 4, 2);
  paint(g, '#fde047');
};

const workerChip: DefBody = (g, a) => {
  const { t, charge } = a;
  teamBase(g, 56, t);
  for (let i = 0; i < 5; i++) {
    const x = -16 + i * 8;
    line(g, x, -26, x, -31, '#94a3b8', 2);
    line(g, x, 18, x, 23, '#94a3b8', 2);
    const y = -20 + i * 8;
    line(g, -24, y, -29, y, '#94a3b8', 2);
    line(g, 24, y, 29, y, '#94a3b8', 2);
  }
  rr(g, -24, -26, 48, 44, 5);
  paint(g, '#0f2a3d', '#38bdf8', 1.8);
  g.lineWidth = 4;
  g.strokeStyle = '#081521';
  circ(g, 0, -4, 13);
  g.stroke();
  g.strokeStyle = '#fde047';
  g.beginPath();
  g.arc(0, -4, 13, -Math.PI / 2, -Math.PI / 2 + Math.max(0.05, charge) * TAU);
  g.stroke();
  txt(g, 'CPU', 0, -4, 8, '#e0f2fe', 800);
};

/* ======================= Load Balancer (fires HTTP 200) ======================= */

/** One input split into 3 outputs (the LB symbol). */
export function splitter(g: G, x: number, y: number, s: number, t: number, light: string): void {
  const outs = [-8, 0, 8].map((o) => o * s);
  g.strokeStyle = light;
  g.lineWidth = 1.8;
  g.beginPath();
  for (const oy of outs) {
    g.moveTo(x - 10 * s, y);
    g.lineTo(x + 10 * s, y + oy);
  }
  g.stroke();
  circ(g, x - 10 * s, y, 3 * s);
  paint(g, light);
  outs.forEach((oy, i) => {
    circ(g, x + 10 * s, y + oy, 2.6 * s);
    paint(g, Math.sin(t * 6 - i) > 0 ? '#4ade80' : '#166534');
  });
}

const lbFace: DefBody = (g, a) => {
  const { t, kick } = a;
  teamBase(g, 58, t);
  g.translate(-kick * 3, 0);
  rr(g, 22, -10, 14, 12, 3);
  paint(g, '#1d4ed8', '#93c5fd', 1.5);
  rr(g, -26, -32, 52, 58, 11);
  paint(g, '#0d2350', '#60a5fa', 1.8);
  faceR(g, -18, -25, 36, 16, '#93c5fd', t, 0.2);
  splitter(g, 0, 10, 1, t, '#93c5fd');
};

const lbCannon: DefBody = (g, a) => {
  const { t, kick } = a;
  teamBase(g, 60, t);
  rr(g, -36, -8, 10, 8, 2);
  paint(g, '#1d4ed8', '#93c5fd', 1);
  [-18, -4, 10].forEach((oy, i) => {
    const k = i === 1 ? kick * 5 : 0;
    rr(g, 10 - k, oy - 4, 24, 8, 3);
    paint(g, i === 1 ? '#1d4ed8' : '#1e3a8a', '#93c5fd', 1.2);
  });
  rr(g, -28, -26, 40, 50, 8);
  paint(g, '#0d2350', '#60a5fa', 1.8);
  g.strokeStyle = '#93c5fd';
  g.lineWidth = 1.8;
  g.beginPath();
  for (const oy of [-18, -4, 10]) {
    g.moveTo(-18, -4);
    g.lineTo(8, oy);
  }
  g.stroke();
  circ(g, -18, -4, 3);
  paint(g, '#93c5fd');
  txt(g, 'LB', -8, 15, 9, '#bfdbfe', 800);
};

const lbTurret: DefBody = (g, a) => {
  const { t, kick } = a;
  teamBase(g, 56, t);
  rr(g, -16, 6, 32, 22, 4);
  paint(g, '#0d2350', '#60a5fa', 1.5);
  for (let i = 0; i < 3; i++) {
    circ(g, -8 + i * 8, 18, 2);
    paint(g, Math.sin(t * 6 - i) > 0 ? '#4ade80' : '#166534');
  }
  rr(g, 10 - kick * 5, -9, 28, 10, 3);
  paint(g, '#1d4ed8', '#93c5fd', 1.5);
  g.beginPath();
  g.arc(0, 6, 22, Math.PI, TAU);
  g.closePath();
  paint(g, '#1e3a8a', '#60a5fa', 1.8);
  rr(g, 2, -9, 15, 6, 3);
  paint(g, '#0b1224');
  rr(g, 11, -8, 4, 4, 2);
  paint(g, '#93c5fd');
  txt(g, 'LB', -8, -2, 8, '#bfdbfe', 800);
};

/* ======================= Redis Cache (wall) ======================= */

const redisFace: DefBody = (g, a) => {
  const { t, hp } = a;
  teamBase(g, 60, t);
  g.translate(shake(a), 0);
  for (let i = 0; i < 3; i++) {
    const cy = 14 - i * 17;
    g.fillStyle = '#991b1b';
    g.fillRect(-27, cy - 7, 54, 14);
    g.beginPath();
    g.ellipse(0, cy + 7, 27, 7, 0, 0, Math.PI);
    g.fill();
    g.beginPath();
    g.ellipse(0, cy - 7, 27, 7, 0, 0, TAU);
    paint(g, '#ef4444', '#fecaca', 1);
  }
  faceR(g, -16, -9, 32, 11, '#fecaca', t, 0.8, '#450a0a');
  txt(g, 'redis', 0, 15, 9, '#fff1f2', 800);
  cracks(g, hp, -6, -26, 50, '#1f0505');
};

const redisBlock: DefBody = (g, a) => {
  const { t, hp } = a;
  teamBase(g, 60, t);
  g.translate(shake(a), 0);
  g.fillStyle = '#facc15';
  for (let i = 0; i < 8; i++) g.fillRect(-24 + i * 6.3, 22, 3, 6);
  rr(g, -28, -34, 56, 57, 6);
  paint(g, '#7f1d1d', '#fca5a5', 1.8);
  rr(g, -23, -29, 46, 11, 3);
  paint(g, '#ef4444');
  txt(g, 'redis', 0, -23.5, 8, '#fff1f2', 800);
  const hit = Math.floor(t * 3) % 4;
  for (let i = 0; i < 4; i++) {
    const y = -13 + i * 8.5;
    rr(g, -22, y, 44, 7, 2);
    paint(g, '#450a0a');
    g.fillStyle = i === hit ? '#fef2f2' : '#fca5a5';
    g.fillRect(-19, y + 2, 9, 3);
    g.fillStyle = i === hit ? '#fde047' : '#f87171';
    g.fillRect(-6, y + 2, 24, 3);
  }
  cracks(g, hp, -4, -30, 50, '#1f0505');
};

const redisCube: DefBody = (g, a) => {
  const { t, hp } = a;
  teamBase(g, 60, t);
  g.translate(shake(a), 0);
  g.beginPath();
  g.moveTo(-26, -14);
  g.lineTo(-14, -26);
  g.lineTo(26, -26);
  g.lineTo(14, -14);
  g.closePath();
  paint(g, '#ef4444', '#fecaca', 1.2);
  g.beginPath();
  g.moveTo(14, -14);
  g.lineTo(26, -26);
  g.lineTo(26, 16);
  g.lineTo(14, 28);
  g.closePath();
  paint(g, '#7f1d1d', '#fecaca', 1.2);
  rr(g, -26, -14, 40, 42, 2);
  paint(g, '#991b1b', '#fecaca', 1.2);
  g.beginPath();
  g.moveTo(-1, -9);
  g.lineTo(-12, 7);
  g.lineTo(-5, 7);
  g.lineTo(-9, 23);
  g.lineTo(5, 2);
  g.lineTo(-2, 2);
  g.lineTo(3, -9);
  g.closePath();
  paint(g, '#fde047', '#a16207', 1);
  txt(g, 'redis', 0, -20, 7, '#fff1f2', 800);
  cracks(g, hp, -10, -10, 36, '#1f0505');
};

/* ======================= Rate Limiter (fires 429, slows) ======================= */

function gauge(g: G, x: number, y: number, r: number, t: number, kick: number): void {
  g.lineWidth = 3;
  g.strokeStyle = '#c4b5fd';
  g.beginPath();
  g.arc(x, y, r, Math.PI, TAU);
  g.stroke();
  g.strokeStyle = '#f472b6';
  g.beginPath();
  g.arc(x, y, r, Math.PI * 1.75, TAU);
  g.stroke();
  const ang = Math.PI + (0.5 + 0.3 * Math.sin(t * 2.2) + 0.2 * kick) * Math.PI;
  line(g, x, y, x + Math.cos(ang) * (r - 3), y + Math.sin(ang) * (r - 3), '#f9a8d4', 2.2);
  circ(g, x, y, 2);
  paint(g, '#f9a8d4');
}

const rateFace: DefBody = (g, a) => {
  const { t, kick } = a;
  teamBase(g, 58, t);
  g.translate(-kick * 3, 0);
  rr(g, 22, -10, 14, 12, 3);
  paint(g, '#6d28d9', '#c4b5fd', 1.5);
  rr(g, -26, -32, 52, 58, 10);
  paint(g, '#2a0f5c', '#a78bfa', 1.8);
  faceR(g, -18, -26, 36, 15, '#ddd6fe', t, 0.6, '#140726');
  gauge(g, 0, 16, 13, t, kick);
  txt(g, '429', 0, 21, 7, '#ddd6fe', 800);
};

const rateLight: DefBody = (g, a) => {
  const { t, kick, action } = a;
  teamBase(g, 50, t);
  g.translate(-kick * 3, 0);
  rr(g, 12, -9, 22, 10, 3);
  paint(g, '#6d28d9', '#c4b5fd', 1.5);
  rr(g, -4, 18, 8, 10, 1);
  paint(g, '#334155');
  rr(g, -15, -38, 30, 58, 8);
  paint(g, '#1e1b2e', '#a78bfa', 1.8);
  const lights = [
    ['#ef4444', '#450a0a'],
    ['#facc15', '#422006'],
    ['#4ade80', '#052e16'],
  ];
  // green while waiting, red when it fires a 429, yellow in between
  const on = action && kick > 0 ? 0 : action ? 1 : 2;
  lights.forEach(([lit, off], i) => {
    circ(g, 0, -27 + i * 14, 5.5);
    paint(g, i === on ? lit : off);
  });
  rr(g, -12, 9, 24, 9, 2);
  paint(g, '#6d28d9');
  txt(g, '429', 0, 13.8, 7, '#faf5ff', 800);
};

const rateToll: DefBody = (g, a) => {
  const { t, kick } = a;
  teamBase(g, 60, t);
  // barrier arm (it fires the 429 from its tip)
  g.save();
  g.translate(2, -4);
  g.rotate(kick * 0.15);
  rr(g, 0, -3, 36, 6, 3);
  paint(g, '#f5f3ff', '#a78bfa', 1);
  g.fillStyle = '#7c3aed';
  for (let i = 0; i < 3; i++) g.fillRect(6 + i * 10, -3, 5, 6);
  g.restore();
  rr(g, -28, -30, 30, 58, 4);
  paint(g, '#2a0f5c', '#a78bfa', 1.8);
  rr(g, -31, -36, 36, 8, 3);
  paint(g, '#6d28d9', '#c4b5fd', 1.2);
  rr(g, -23, -22, 20, 16, 3);
  paint(g, '#0b0618');
  txt(g, '429', -13, -14, 8, '#f9a8d4', 800);
  gauge(g, -13, 16, 8, t, kick);
  circ(g, 2, -4, 4);
  paint(g, '#c4b5fd');
};

/* ======================= Circuit Breaker (explodes after 1 s) ======================= */

export function hazard(g: G, x: number, y: number, w: number, h: number, r: number): void {
  rr(g, x, y, w, h, r);
  g.save();
  paint(g, '#facc15');
  g.clip();
  g.fillStyle = '#111827';
  for (let i = -8; i < 8; i++) {
    g.beginPath();
    g.moveTo(x + i * 12, y);
    g.lineTo(x + i * 12 + 6, y);
    g.lineTo(x + i * 12 + 6 + h, y + h);
    g.lineTo(x + i * 12 + h, y + h);
    g.fill();
  }
  g.restore();
  rr(g, x, y, w, h, r);
  g.strokeStyle = '#111827';
  g.lineWidth = 2;
  g.stroke();
}

const cbFace: DefBody = (g, a) => {
  const { t } = a;
  const armed = a.fuse !== undefined;
  teamBase(g, 58, t);
  if (armed) g.translate(Math.sin(t * 60) * 1.2, 0);
  rr(g, -26, -34, 52, 62, 7);
  paint(g, '#facc15', '#111827', 2);
  rr(g, -20, -28, 40, 50, 5);
  paint(g, '#1c1917');
  faceR(g, -15, -24, 30, 13, armed ? '#f87171' : '#86efac', t, 0.5);
  rr(g, -4, -6, 8, 24, 3);
  paint(g, '#0b0b0b');
  rr(g, -7, armed ? 9 : -6, 14, 8, 3);
  paint(g, armed ? '#dc2626' : '#22c55e');
  armedBlink(g, a, -26, -34, 52, 62, 7);
};

const cbLever: DefBody = (g, a) => {
  const { t } = a;
  const armed = a.fuse !== undefined;
  teamBase(g, 60, t);
  hazard(g, -28, -30, 56, 58, 6);
  rr(g, -18, -20, 36, 38, 5);
  paint(g, '#1c1917');
  g.save();
  g.translate(0, 0);
  g.rotate(armed ? 0.9 : -0.9);
  rr(g, -2.5, -22, 5, 22, 2);
  paint(g, '#cbd5e1');
  circ(g, 0, -22, 5);
  paint(g, armed ? '#dc2626' : '#22c55e');
  g.restore();
  circ(g, 0, 0, 4);
  paint(g, '#64748b');
  txt(g, armed ? 'OPEN' : 'ON', 0, 12, 7, armed ? '#fca5a5' : '#86efac', 800);
  armedBlink(g, a, -28, -30, 56, 58, 6);
};

const cbFuse: DefBody = (g, a) => {
  const { t } = a;
  const armed = a.fuse !== undefined;
  teamBase(g, 60, t);
  // clips
  for (const x of [-20, 20]) {
    rr(g, x - 4, -4, 8, 32, 2);
    paint(g, '#475569', '#94a3b8', 1);
  }
  // end caps + glass
  rr(g, -30, -14, 12, 20, 3);
  paint(g, '#cbd5e1', '#64748b', 1);
  rr(g, 18, -14, 12, 20, 3);
  paint(g, '#cbd5e1', '#64748b', 1);
  rr(g, -18, -12, 36, 16, 3);
  paint(g, 'rgba(186,230,253,0.25)', '#e2e8f0', 1.2);
  // wire: burns from right to left while armed
  const k = armed ? 1 - (a.fuse ?? 0) : 0;
  const burnX = 18 - k * 36;
  line(g, -18, -4, burnX, -4, '#facc15', 2);
  if (armed) {
    line(g, burnX, -4, 18, -4, '#7f1d1d', 2);
    circ(g, burnX, -4, 3 + Math.sin(t * 50));
    paint(g, '#fde047');
  }
  hazard(g, -16, -32, 32, 12, 3);
  txt(g, '3×3', 0, -26, 8, '#111827', 900);
  armedBlink(g, a, -30, -32, 60, 40, 6);
};

/* ======================= WAF (tall wall, filters attacks) ======================= */

const wafFace: DefBody = (g, a) => {
  const { t, hp } = a;
  teamBase(g, 54, t);
  g.translate(shake(a), 0);
  rr(g, -9, 16, 18, 12, 2);
  paint(g, '#134e4a', '#2dd4bf', 1);
  g.beginPath();
  g.moveTo(0, -44);
  g.lineTo(25, -36);
  g.lineTo(25, 0);
  g.quadraticCurveTo(22, 14, 0, 22);
  g.quadraticCurveTo(-22, 14, -25, 0);
  g.lineTo(-25, -36);
  g.closePath();
  paint(g, '#134e4a', '#2dd4bf', 2);
  faceR(g, -15, -32, 30, 14, '#99f6e4', t, 0.6, '#042f2e');
  txt(g, 'WAF', 0, -6, 11, '#f0fdfa', 900);
  cracks(g, hp, -6, -40, 56, '#042f2e');
};

const wafWall: DefBody = (g, a) => {
  const { t, hp, kick } = a;
  teamBase(g, 56, t);
  g.translate(shake(a), 0);
  rr(g, -25, -44, 50, 72, 6);
  paint(g, '#134e4a', '#2dd4bf', 1.8);
  g.save();
  rr(g, -25, -44, 50, 72, 6);
  g.clip();
  g.strokeStyle = 'rgba(45,212,191,0.3)';
  g.lineWidth = 1.2;
  for (let r = 0; r < 7; r++) {
    const by = -44 + r * 11;
    line(g, -25, by, 25, by, 'rgba(45,212,191,0.3)', 1.2);
    const off = r % 2 === 0 ? -8 : 8;
    line(g, off, by, off, by + 11, 'rgba(45,212,191,0.3)', 1.2);
  }
  g.restore();
  rr(g, -18, -34, 36, 32, 3);
  paint(g, '#042f2e', '#99f6e4', 1);
  txt(g, '✓ GET', 0, -26, 7, '#86efac', 800);
  txt(g, "✕ 'OR", 0, -18, 7, kick > 0.3 ? '#fde047' : '#fca5a5', 800);
  txt(g, '✕ ../', 0, -10, 7, '#fca5a5', 800);
  txt(g, 'WAF', 0, 12, 11, '#f0fdfa', 900);
  cracks(g, hp, -6, -40, 60, '#042f2e');
};

const wafArch: DefBody = (g, a) => {
  const { t, hp, kick } = a;
  teamBase(g, 60, t);
  g.translate(shake(a), 0);
  // laser grid between the pillars
  g.strokeStyle = kick > 0.3 ? 'rgba(248,113,113,0.6)' : 'rgba(45,212,191,0.3)';
  g.lineWidth = 1;
  g.beginPath();
  for (let i = 0; i < 4; i++) {
    g.moveTo(-10 + i * 7, -32);
    g.lineTo(-10 + i * 7, 28);
  }
  g.stroke();
  const sy = -30 + ((t * 0.9) % 1) * 56;
  line(g, -14, sy, 14, sy, '#5eead4', 2);
  for (const x of [-27, 15]) {
    rr(g, x, -36, 12, 64, 4);
    paint(g, '#134e4a', '#2dd4bf', 1.5);
    for (let i = 0; i < 3; i++) {
      circ(g, x + 6, -24 + i * 14, 2);
      paint(g, Math.sin(t * 4 + i + x) > 0 ? '#5eead4' : '#115e59');
    }
  }
  rr(g, -29, -46, 58, 14, 4);
  paint(g, '#0f766e', '#99f6e4', 1.5);
  txt(g, 'WAF', 0, -38.5, 9, '#f0fdfa', 900);
  cracks(g, hp, -16, -30, 56, '#042f2e');
};

/* ======================= CDN Edge (fires in 3 lanes) ======================= */

function threeNozzles(g: G, x: number, len: number, kick: number): void {
  for (const ang of [-0.55, 0, 0.55]) {
    g.save();
    g.rotate(ang);
    rr(g, x - kick * 3, -5, len, 10, 3);
    paint(g, '#be185d', '#fbcfe8', 1.5);
    g.restore();
  }
}

const cdnFace: DefBody = (g, a) => {
  const { t, kick } = a;
  teamBase(g, 56, t);
  rr(g, -8, 18, 16, 10, 2);
  paint(g, '#500724', '#f472b6', 1);
  g.save();
  g.translate(0, -6);
  threeNozzles(g, 18, 18, kick);
  circ(g, 0, 0, 24);
  paint(g, '#500724', '#f472b6', 2);
  g.strokeStyle = 'rgba(244,114,182,0.45)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.ellipse(0, 0, Math.abs(Math.sin(t * 1.5) * 8) + 4, 24, 0, 0, TAU);
  g.stroke();
  faceR(g, -15, -8, 30, 13, '#fbcfe8', t, 0.1, '#2a0414');
  txt(g, 'CDN', 0, 14, 7, '#fce7f3', 800);
  g.restore();
};

const cdnDish: DefBody = (g, a) => {
  const { t, kick, action } = a;
  teamBase(g, 58, t);
  line(g, -6, 2, -18, 28, '#94a3b8', 2.5);
  line(g, -6, 2, 6, 28, '#94a3b8', 2.5);
  g.save();
  g.translate(-8, -10);
  g.rotate(-0.15 - kick * 0.1);
  line(g, 0, 0, 20, 0, '#fbcfe8', 2);
  circ(g, 21, 0, 3.5);
  paint(g, '#f472b6');
  g.beginPath();
  g.ellipse(0, 0, 11, 26, 0, -Math.PI / 2, Math.PI / 2);
  g.closePath();
  paint(g, '#500724', '#f472b6', 2);
  txt(g, 'CDN', 4, 0, 6, '#fce7f3', 800);
  // waves to 3 lanes
  for (let k = 0; k < 3; k++) {
    const p = ((t * (action ? 1.6 : 0.8) + k / 3) % 1);
    g.globalAlpha = 1 - p;
    g.strokeStyle = '#f9a8d4';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(22, 0, 6 + p * 16, -0.7, 0.7);
    g.stroke();
  }
  g.globalAlpha = 1;
  g.restore();
};

const cdnNodes: DefBody = (g, a) => {
  const { t, kick } = a;
  teamBase(g, 60, t);
  const nodes: [number, number][] = [[14, -26], [16, -4], [14, 18]];
  g.strokeStyle = 'rgba(244,114,182,0.6)';
  g.lineWidth = 1.5;
  g.beginPath();
  for (const [x, y] of nodes) {
    g.moveTo(-12, -4);
    g.lineTo(x, y);
  }
  g.stroke();
  nodes.forEach(([x, y], i) => {
    rr(g, x - 8 - kick * 2, y - 6, 20, 12, 3);
    paint(g, '#be185d', '#fbcfe8', 1.2);
    circ(g, x + 7 - kick * 2, y, 2);
    paint(g, Math.sin(t * 6 - i) > 0 ? '#4ade80' : '#166534');
  });
  circ(g, -12, -4, 14);
  paint(g, '#500724', '#f472b6', 2);
  g.strokeStyle = 'rgba(244,114,182,0.45)';
  g.lineWidth = 1;
  g.beginPath();
  g.ellipse(-12, -4, 6, 14, 0, 0, TAU);
  g.moveTo(-26, -4);
  g.lineTo(2, -4);
  g.stroke();
  txt(g, 'CDN', -12, 15, 7, '#fce7f3', 800);
};

/* ======================= Kafka (catches a threat) ======================= */

function segments(g: G, x: number, y: number, n: number, w: number, h: number, a: DefAnim, lit: string, off: string): void {
  for (let i = 0; i < n; i++) {
    const on = a.busy ? Math.floor(a.t * 8) % n === i : i / n < a.ready;
    rr(g, x + i * (w + 2), y, w, h, 2);
    paint(g, on ? lit : off);
  }
}

const kafkaFace: DefBody = (g, a) => {
  const { t } = a;
  teamBase(g, 74, t);
  rr(g, -36, 0, 72, 28, 6);
  paint(g, '#431407', '#fb923c', 1.8);
  segments(g, -31, 6, 6, 9.3, 16, a, '#fdba74', '#7c2d12');
  rr(g, -20, -26, 40, 24, 6);
  paint(g, '#7c2d12', '#fb923c', 1.5);
  faceR(g, -15, -22, 30, 12, a.busy ? '#fde047' : '#ffedd5', t, 0.7, '#1c0a03');
  txt(g, 'kafka', 0, -6.5, 6, '#ffedd5', 800);
};

const kafkaBelt: DefBody = (g, a) => {
  const { t, busy } = a;
  teamBase(g, 76, t);
  rr(g, -36, 8, 72, 14, 7);
  paint(g, '#292524', '#fb923c', 1.5);
  for (let i = 0; i < 5; i++) {
    circ(g, -28 + i * 14, 15, 4);
    paint(g, '#44403c', '#fdba74', 1);
  }
  line(g, -20, 22, -20, 28, '#78716c', 3);
  line(g, 20, 22, 20, 28, '#78716c', 3);
  // messages (envelopes) moving on the belt; they stop while busy
  const off = busy ? 0 : (t * 12) % 18;
  g.save();
  rr(g, -36, -10, 72, 18, 0);
  g.clip();
  for (let i = -1; i < 5; i++) {
    const x = -34 + i * 18 + off;
    rr(g, x, -2, 14, 10, 1.5);
    paint(g, i % 2 ? '#ffedd5' : '#fed7aa', '#c2410c', 1);
    g.strokeStyle = '#c2410c';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x, -2);
    g.lineTo(x + 7, 3);
    g.lineTo(x + 14, -2);
    g.stroke();
  }
  g.restore();
  rr(g, -16, -30, 32, 13, 4);
  paint(g, '#7c2d12', '#fb923c', 1.2);
  txt(g, 'kafka', 0, -23.5, 7, '#ffedd5', 800);
  line(g, 0, -17, 0, -10, '#fb923c', 2);
  rr(g, -30, 24, 60 * Math.max(0.05, a.ready), 3, 1.5);
  paint(g, '#fdba74');
};

const kafkaPipe: DefBody = (g, a) => {
  const { t } = a;
  teamBase(g, 76, t);
  for (const x of [-24, 24]) {
    line(g, x, 12, x, 28, '#78716c', 3);
  }
  rr(g, -40, -8, 8, 24, 3);
  paint(g, '#c2410c', '#fdba74', 1);
  rr(g, 32, -8, 8, 24, 3);
  paint(g, '#c2410c', '#fdba74', 1);
  rr(g, -32, -5, 64, 18, 4);
  paint(g, 'rgba(254,215,170,0.12)', '#fdba74', 1.5);
  for (let i = 0; i < 6; i++) {
    const on = a.busy ? Math.floor(t * 8) % 6 === i : i / 6 < a.ready;
    const x = -29 + i * 10;
    rr(g, x, -2, 8, 12, 2);
    paint(g, on ? '#fb923c' : '#431407');
    txt(g, String(i), x + 4, 4.5, 6, on ? '#1c0a03' : '#9a3412', 800);
  }
  txt(g, 'kafka', 0, -14, 8, '#fdba74', 800);
};

/* ======================= Rollback (sweeps the lane once) ======================= */

export function undoArrow(g: G, x: number, y: number, r: number, color: string, rot: number): void {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.strokeStyle = color;
  g.lineWidth = 2;
  g.beginPath();
  g.arc(0, 0, r, Math.PI * 0.35, Math.PI * 1.9);
  g.stroke();
  const ax = Math.cos(Math.PI * 0.35) * r;
  const ay = Math.sin(Math.PI * 0.35) * r;
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(ax + 4, ay - 4);
  g.lineTo(ax - 4, ay + 1);
  g.lineTo(ax + 3, ay + 5);
  g.closePath();
  g.fill();
  g.restore();
}

const rollbackFace: DefBody = (g, a) => {
  const { t, action } = a;
  rr(g, -16, -18, 32, 34, 7);
  paint(g, '#083344', '#22d3ee', 2);
  faceR(g, -11, -13, 22, 10, '#a5f3fc', t, 0.2, '#03141a');
  undoArrow(g, 0, 7, 5, '#22d3ee', action ? t * 12 : 0);
};

const rollbackDisc: DefBody = (g, a) => {
  const { t, action } = a;
  circ(g, 0, 0, 16);
  paint(g, '#083344', '#22d3ee', 2);
  circ(g, 0, 0, 11);
  paint(g, '#0e4f63');
  undoArrow(g, 0, 0, 7, '#a5f3fc', action ? t * 14 : Math.sin(t * 2) * 0.3);
  circ(g, 12, -10, 2);
  paint(g, '#4ade80');
};

const rollbackTape: DefBody = (g, a) => {
  const { t, action } = a;
  rr(g, -19, -13, 38, 26, 4);
  paint(g, '#083344', '#22d3ee', 2);
  rr(g, -13, -7, 26, 10, 3);
  paint(g, '#03141a');
  for (const x of [-7, 7]) {
    g.save();
    g.translate(x, -2);
    g.rotate(-(action ? t * 16 : t * 1.5));
    circ(g, 0, 0, 3.5);
    paint(g, '#a5f3fc');
    g.fillStyle = '#03141a';
    for (let k = 0; k < 3; k++) {
      g.fillRect(-0.7, -3.5, 1.4, 2);
      g.rotate(TAU / 3);
    }
    g.restore();
  }
  txt(g, '◀◀', 0, 8, 7, '#22d3ee', 900);
};

/* ======================= Exports ======================= */

export const DEF_OPTIONS: Record<DefItem, Record<Pick, { name: string; body: DefBody }>> = {
  worker: {
    A: { name: 'Servidor con cara', body: workerFace },
    B: { name: 'Rack con ventiladores', body: workerRack },
    C: { name: 'Chip CPU que se carga', body: workerChip },
  },
  loadBalancer: {
    A: { name: 'Distribuidor con cara', body: lbFace },
    B: { name: 'Cañón de 3 salidas', body: lbCannon },
    C: { name: 'Torreta', body: lbTurret },
  },
  redis: {
    A: { name: 'Cilindros con cara', body: redisFace },
    B: { name: 'Bloque de memoria', body: redisBlock },
    C: { name: 'Cubo con rayo', body: redisCube },
  },
  rateLimiter: {
    A: { name: 'Medidor con cara', body: rateFace },
    B: { name: 'Semáforo 429', body: rateLight },
    C: { name: 'Barrera de peaje', body: rateToll },
  },
  circuitBreaker: {
    A: { name: 'Interruptor con cara', body: cbFace },
    B: { name: 'Palanca de seguridad', body: cbLever },
    C: { name: 'Fusible que se quema', body: cbFuse },
  },
  waf: {
    A: { name: 'Escudo con cara', body: wafFace },
    B: { name: 'Muro con reglas', body: wafWall },
    C: { name: 'Arco escáner', body: wafArch },
  },
  cdn: {
    A: { name: 'Globo con cara', body: cdnFace },
    B: { name: 'Antena parabólica', body: cdnDish },
    C: { name: 'Nodos en 3 carriles', body: cdnNodes },
  },
  kafka: {
    A: { name: 'Cola con cara', body: kafkaFace },
    B: { name: 'Cinta transportadora', body: kafkaBelt },
    C: { name: 'Tubo de mensajes', body: kafkaPipe },
  },
  rollback: {
    A: { name: 'Botón deshacer con cara', body: rollbackFace },
    B: { name: 'Disco que gira', body: rollbackDisc },
    C: { name: 'Cinta que rebobina', body: rollbackTape },
  },
};
