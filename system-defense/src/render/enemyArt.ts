import { t as tr } from '../i18n';
import type { EnemyType } from '../config';
import { circ, line, paint, rr, TAU, txt, type G } from './shapes';

/*
 * Threat avatars chosen by the user on the avatar picker page (rounds 1–4).
 * Style: simple and technological, not monsters. Flat shapes, a dark screen with LED eyes
 * looking left (toward the base), one clear symbol per threat. Families share a trait:
 * Tráfico = blue "request" band (red = fake traffic), Bots = orange + antenna with red LED,
 * Exploits = float (no legs), Fallos internos = purple.
 *
 * Each body draws the threat centered at (0, 0) with its feet on y = h/2.
 * Shadow, walking bob and attack lean are added by drawEnemy in sprites.ts.
 */

export interface EnemyAnim {
  w: number;
  h: number;
  t: number;
  /** -1..1 walking phase (0 when standing). */
  step: number;
  /** 0 while walking; 0..1 attack pulse while attacking. */
  atk: number;
}
export type EnemyBody = (g: G, a: EnemyAnim) => void;

/* ---------------- Shared parts ---------------- */

/** Two walking legs at the bottom of the box. */
function legs(g: G, a: EnemyAnim, color: string, spread: number, len: number, wd: number): void {
  g.fillStyle = color;
  rr(g, -spread - wd / 2 + a.step * 3, a.h / 2 - len, wd, len, 3);
  g.fill();
  rr(g, spread - wd / 2 - a.step * 3, a.h / 2 - len, wd, len, 3);
  g.fill();
}

/** Dark screen with two LED eyes looking left. Blinks now and then. */
function face(g: G, x: number, y: number, w: number, h: number, led: string, t: number, seed = 0, bg = '#0b1224'): void {
  rr(g, x, y, w, h, Math.min(5, h / 2.5));
  paint(g, bg);
  const blink = (t + seed) % 3.4 < 0.12;
  const ew = Math.max(2.5, w * 0.16);
  const eh = blink ? 1.2 : Math.max(3, h * 0.5);
  const ey = y + h / 2 - eh / 2;
  g.fillStyle = led;
  rr(g, x + w * 0.16, ey, ew, eh, 1.2);
  g.fill();
  rr(g, x + w * 0.16 + ew + w * 0.14, ey, ew, eh, 1.2);
  g.fill();
}

/** Small antenna with a blinking LED. */
function antenna(g: G, x: number, y: number, len: number, stick: string, led: string, t: number): void {
  line(g, x, y, x + 2, y - len, stick, 1.5);
  circ(g, x + 2, y - len - 1.5, 2);
  paint(g, Math.sin(t * 5) > 0 ? led : '#1e293b');
}

/** Wheel with one turning spoke. */
function wheel(g: G, x: number, y: number, r: number, t: number, fill: string, rim: string, speed = 4): void {
  circ(g, x, y, r);
  paint(g, fill, rim, 1.5);
  const a = -t * speed;
  line(g, x - Math.cos(a) * r * 0.7, y - Math.sin(a) * r * 0.7, x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, rim, 1.2);
}

/** Tráfico family: blue "request" band with a label. */
function band(g: G, x: number, y: number, w: number, label: string, size = 7): void {
  rr(g, x, y, w, 11, 5.5);
  paint(g, '#0369a1', '#7dd3fc', 1);
  txt(g, label, x + w / 2, y + 5.8, size, '#ffffff', 800);
}

/** Mini request (DDoS swarm, Black Friday cart). Red = fake traffic; it keeps the blue band. */
function miniReq(g: G, x: number, y: number, s: number, t: number, seed: number, red: boolean): void {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  const st = Math.sin(t * 10 + seed);
  g.fillStyle = red ? '#450a0a' : '#334155';
  g.fillRect(-7 + st * 2, 5, 4, 6);
  g.fillRect(3 - st * 2, 5, 4, 6);
  rr(g, -10, -12, 20, 18, 4);
  paint(g, red ? '#b91c1c' : '#475569', red ? '#fca5a5' : '#cbd5e1', 1);
  face(g, -8, -10, 14, 7, red ? '#fecaca' : '#7dd3fc', t, seed, red ? '#1c0606' : '#0b1224');
  rr(g, -10, 0, 20, 5, 2.5);
  paint(g, '#0369a1');
  g.restore();
}

/** Hover offset for floating threats. */
const hover = (t: number, amp = 2): number => Math.sin(t * 4) * amp;

/** Flat "hover pad" line under a floating threat (no glow). */
function hoverPad(g: G, y: number, w: number, color: string, t: number): void {
  g.globalAlpha = 0.45 + 0.25 * Math.sin(t * 8);
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(0, y, w, 2, 0, 0, TAU);
  g.fill();
  g.globalAlpha = 1;
}

/** Tank treads with moving marks. Center (x, y). */
function treads(g: G, x: number, y: number, w: number, h: number, t: number, rim: string): void {
  rr(g, x - w / 2, y - h / 2, w, h, h / 2);
  paint(g, '#292524', rim, 1.5);
  for (let i = 0; i < 3; i++) {
    circ(g, x - w / 2 + h / 2 + i * ((w - h) / 2), y, h / 2 - 3);
    paint(g, '#44403c', rim, 1);
  }
  g.strokeStyle = rim;
  g.lineWidth = 1.2;
  g.beginPath();
  const step = 5;
  const off = (t * 14) % step;
  for (let px = x - w / 2 + h / 2 - off; px < x + w / 2 - h / 2; px += step) {
    g.moveTo(px, y - h / 2);
    g.lineTo(px, y - h / 2 + 2);
    g.moveTo(px + step / 2, y + h / 2);
    g.lineTo(px + step / 2, y + h / 2 - 2);
  }
  g.stroke();
}

function padlock(g: G, x: number, y: number, s: number): void {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.strokeStyle = '#fecaca';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(0, -6, 7, Math.PI, TAU);
  g.stroke();
  rr(g, -10, -6, 20, 16, 3);
  paint(g, '#dc2626');
  circ(g, 0, 1, 2.5);
  paint(g, '#450a0a');
  g.fillRect(-1, 2, 2, 5);
  g.restore();
}

/* ======================= Tráfico ======================= */

/** Tráfico Normal: a box with LED eyes, a "GET /" tab and a little arm that knocks. */
const normal: EnemyBody = (g, a) => {
  const { w, h, t, atk } = a;
  legs(g, a, '#334155', 9, 12, 7);
  rr(g, -w / 2 - 4 - atk * 6, 2, 9, 6, 3);
  paint(g, '#64748b', '#cbd5e1', 1);
  antenna(g, 7, -h / 2, 6, '#94a3b8', '#7dd3fc', t);
  rr(g, -w / 2, -h / 2, w, h - 10, 9);
  paint(g, '#475569', '#cbd5e1', 1.5);
  face(g, -17, -h / 2 + 6, 30, 16, '#7dd3fc', t, 0.4);
  rr(g, -16, -1, 32, 12, 6);
  paint(g, '#1e293b');
  txt(g, 'GET /', 0, 5, 8, '#e2e8f0');
};

/** DDoS: a swarm of red mini requests (fake traffic). */
const DDOS_SWARM: [number, number, number][] = [
  [30, -16, 0.6], [26, 14, 0.65], [16, -2, 0.75], [2, -22, 0.8], [2, 16, 0.85], [-18, -4, 1.05],
];
const ddos: EnemyBody = (g, a) => {
  const { t, atk } = a;
  DDOS_SWARM.forEach(([x, y, s], i) => {
    miniReq(g, x - atk * (4 + i * 1.5), y + Math.sin(t * 5 + i) * 2, s, t + i * 0.37, i * 0.7 + 0.3, true);
  });
  band(g, -16, 26, 32, 'x10⁶', 7);
};

/** Black Friday: a cart full of orders with a "-70%" sign on a pole. No head. */
const BF_PILE: [number, number, number][] = [
  [-36, -26, 0.95], [-16, -26, 0.95], [4, -26, 0.95], [24, -26, 0.95],
  [-26, -44, 0.9], [-6, -44, 0.9], [14, -44, 0.9],
];
const blackFriday: EnemyBody = (g, a) => {
  const { t, atk } = a;
  g.translate(-atk * 8, 0);
  // wheels and handle
  line(g, -32, 30, -32, 46, '#facc15', 3);
  line(g, 24, 30, 24, 46, '#facc15', 3);
  wheel(g, -32, 52, 8, t, '#111827', '#facc15');
  wheel(g, 24, 52, 8, t, '#111827', '#facc15');
  line(g, 40, -20, 52, -40, '#facc15', 3.5);
  line(g, 48, -40, 56, -40, '#facc15', 4);
  // cargo: pile of orders + pole sign
  BF_PILE.forEach(([x, y, s], i) => miniReq(g, x, y - atk * 4 + Math.sin(t * 6 + i) * 0.8, s, t + i * 0.3, i + 0.5, false));
  line(g, 32, -20, 32, -48, '#facc15', 3);
  g.save();
  g.translate(32, -48);
  g.rotate(Math.sin(t * 2.5) * 0.06 - atk * 0.15);
  rr(g, -20, -22, 40, 22, 4);
  paint(g, '#dc2626', '#fecaca', 2);
  txt(g, '-70%', 0, -10.5, 13, '#ffffff', 900);
  g.restore();
  // basket front
  g.beginPath();
  g.moveTo(-50, -20);
  g.lineTo(42, -20);
  g.lineTo(32, 30);
  g.lineTo(-40, 30);
  g.closePath();
  paint(g, '#1f2937', '#facc15', 2.5);
  g.strokeStyle = 'rgba(250,204,21,0.35)';
  g.lineWidth = 1.5;
  g.beginPath();
  for (const x of [-24, 0, 22]) {
    g.moveTo(x, -18);
    g.lineTo(x - 3, 28);
  }
  g.moveTo(-46, -3);
  g.lineTo(38, -3);
  g.stroke();
  band(g, -40, 10, 70, 'BLACK FRIDAY', 7);
};

/** Slowloris: a floating loading bar stuck at 2 %. */
const slowloris: EnemyBody = (g, a) => {
  const { t, atk } = a;
  hoverPad(g, 22, 18, '#38bdf8', t);
  g.translate(-atk * 3, -6 + hover(t, 1.5));
  rr(g, -26, -12, 52, 22, 11);
  paint(g, '#0c4a6e', '#7dd3fc', 1.5);
  face(g, -23, -8, 14, 14, '#bae6fd', t, 0.4);
  rr(g, -6, -5, 28, 8, 4);
  paint(g, '#082f49');
  rr(g, -6, -5, 3 + ((t * 0.04) % 1) * 4, 8, 4);
  paint(g, '#38bdf8');
  txt(g, '2%', 8, -17, 6, '#bae6fd', 800);
  band(g, -18, 11, 36, tr('loading', 'cargando'), 6);
};

/* ======================= Bots ======================= */

/** Scraper Bot on treads, with a scan beam toward the ground ahead. */
const scraper: EnemyBody = (g, a) => {
  const { h, t, atk } = a;
  const eyeX = -15 + ((Math.sin(t * 3) + 1) / 2) * 20;
  g.fillStyle = `rgba(253,224,71,${0.2 + 0.15 * atk})`;
  g.beginPath();
  g.moveTo(eyeX, -h / 2 + 14);
  g.lineTo(-58, h / 2);
  g.lineTo(-30, h / 2);
  g.closePath();
  g.fill();
  treads(g, 0, h / 2 - 7, 46, 14, t, '#fdba74');
  rr(g, -6, 10, 12, 8, 2);
  paint(g, '#78350f');
  antenna(g, 8, -h / 2 + 4, 7, '#fdba74', '#ef4444', t);
  rr(g, -25, -h / 2 + 4, 50, 40, 12);
  paint(g, '#9a3412', '#fdba74', 1.5);
  rr(g, -19, -h / 2 + 11, 38, 12, 6);
  paint(g, '#1c1917');
  rr(g, eyeX, -h / 2 + 14, 9, 6, 3);
  paint(g, '#fde047');
  txt(g, 'BOT', 0, 0, 10, '#ffedd5');
  txt(g, '</>', 0, 9, 7, '#fdba74');
};

/** Packets running along links (botnet). */
function packetsOn(g: G, pts: [number, number][], t: number, speed: number): void {
  g.strokeStyle = 'rgba(245,158,11,0.45)';
  g.lineWidth = 1.2;
  g.beginPath();
  for (let i = 0; i < pts.length - 1; i++) {
    g.moveTo(pts[i][0], pts[i][1]);
    g.lineTo(pts[i + 1][0], pts[i + 1][1]);
  }
  g.stroke();
  for (let i = 0; i < pts.length - 1; i++) {
    const p = (t * speed + i / (pts.length - 1)) % 1;
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    g.fillStyle = '#fbbf24';
    g.fillRect(x1 + (x2 - x1) * p - 1.5, y1 + (y2 - y1) * p - 1.5, 3, 3);
  }
}

/** Botnet: a camera, a router and a fridge hanging from a central cloud (the command server). */
const botnet: EnemyBody = (g, a) => {
  const { t, atk } = a;
  const red = `rgba(239,68,68,${0.75 + 0.25 * Math.sin(t * 5)})`;
  const cy = -24 + Math.sin(t * 2) * 1.5;
  const cam: [number, number] = [-22 - atk * 3, -2 + Math.sin(t * 4) * 1.2];
  const rou: [number, number] = [22 - atk * 3, -3 + Math.sin(t * 4 + 2) * 1.2];
  for (const [x, y] of [cam, rou, [0, 4]] as [number, number][]) packetsOn(g, [[2, cy + 6], [x, y]], t, 0.8 + atk);
  // cloud
  g.fillStyle = '#1f2937';
  g.strokeStyle = '#f59e0b';
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(-6, cy, 6, Math.PI * 0.5, Math.PI * 1.5);
  g.arc(3, cy - 4, 8, Math.PI, 0);
  g.arc(12, cy, 6, Math.PI * 1.5, Math.PI * 0.5);
  g.closePath();
  g.fill();
  g.stroke();
  circ(g, 1, cy, 2.2);
  paint(g, red);
  circ(g, 7, cy, 2.2);
  paint(g, red);
  // camera
  const [cx, cyc] = cam;
  rr(g, cx - 11, cyc - 6, 22, 13, 3);
  paint(g, '#e5e7eb', '#94a3b8', 1);
  circ(g, cx - 7, cyc + 0.5, 4.5);
  paint(g, '#111827');
  circ(g, cx - 7, cyc + 0.5, 1.8);
  paint(g, red);
  // router
  const [rx, ry] = rou;
  line(g, rx - 7, ry - 5, rx - 10, ry - 13, '#64748b', 1.5);
  line(g, rx + 7, ry - 5, rx + 10, ry - 13, '#64748b', 1.5);
  rr(g, rx - 12, ry - 5, 24, 10, 2);
  paint(g, '#1f2937', '#64748b', 1);
  for (let i = 0; i < 3; i++) {
    circ(g, rx - 6 + i * 6, ry, 1.5);
    paint(g, red);
  }
  // fridge on legs
  legs(g, a, '#334155', 5, 6, 4);
  rr(g, -9, 0, 18, 23, 3);
  paint(g, '#f1f5f9', '#94a3b8', 1);
  line(g, -9, 9, 9, 9, '#94a3b8', 1);
  line(g, 6, 3, 6, 7, '#64748b', 1.5);
  rr(g, -7, 12, 14, 7, 2);
  paint(g, '#0b1224');
  circ(g, -3.5, 15.5, 1.6);
  paint(g, red);
  circ(g, 1.5, 15.5, 1.6);
  paint(g, red);
};

/** Small bot left when a botnet dies: a mini camera on legs. */
const botlet: EnemyBody = (g, a) => {
  const { w, h, t } = a;
  legs(g, a, '#334155', 5, 7, 4);
  antenna(g, 5, -h / 2 + 5, 4, '#94a3b8', '#ef4444', t);
  rr(g, -w / 2, -h / 2 + 5, w, h - 13, 4);
  paint(g, '#e5e7eb', '#94a3b8', 1);
  const cy = -h / 2 + 5 + (h - 13) / 2;
  circ(g, -w / 2 + 7, cy, 4.5);
  paint(g, '#111827');
  circ(g, -w / 2 + 7, cy, 1.6);
  paint(g, `rgba(239,68,68,${0.6 + 0.4 * Math.sin(t * 5)})`);
};

/* ======================= Exploits (they float) ======================= */

/** Zero-Day: a glitch cube that breaks into pixels and appears again a bit ahead. */
function zeroCube(g: G, t: number, atk: number, cy: number): void {
  rr(g, -18, cy - 18, 36, 36, 6);
  paint(g, '#a21caf', '#f5d0fe', 1.5);
  face(g, -13, cy - 13, 26, 12, '#f5d0fe', t, 0.2, '#1a0b1f');
  txt(g, '0day', 0, cy + 8, 8, '#fdf4ff', 800);
  if (Math.floor(t * 6) % 7 === 0 || atk > 0.5) {
    g.fillStyle = 'rgba(34,211,238,0.75)';
    g.fillRect(-15, cy - 4, 36, 3.5);
    g.fillStyle = 'rgba(244,114,182,0.75)';
    g.fillRect(-23, cy + 10, 34, 3);
  }
}
const zeroDay: EnemyBody = (g, a) => {
  const { t, atk } = a;
  const P = 1.6;
  const p = (t % P) / P;
  const cy = -4 + hover(t);
  hoverPad(g, 20, 12, '#e879f9', t);
  if (p < 0.2) {
    // reassembling from scattered pixels
    const k = p / 0.2;
    for (let i = 0; i < 16; i++) {
      const gx = (i % 4) * 9 - 13.5;
      const gy = Math.floor(i / 4) * 9 - 13.5;
      const sx = Math.sin(i * 12.9898) * 22 * (1 - k) + 14 * (1 - k);
      const sy = Math.cos(i * 78.233) * 16 * (1 - k);
      g.globalAlpha = 0.4 + 0.6 * k;
      g.fillStyle = i % 3 ? '#a21caf' : '#e879f9';
      g.fillRect(gx + sx - 4, cy + gy + sy - 4, 8, 8);
    }
    g.globalAlpha = 1;
    return;
  }
  if (p < 0.45) {
    // fading outline where it came from
    g.globalAlpha = 1 - (p - 0.2) / 0.25;
    g.setLineDash([3, 3]);
    g.strokeStyle = '#e879f9';
    g.lineWidth = 1.5;
    rr(g, -4, cy - 18, 36, 36, 6);
    g.stroke();
    g.setLineDash([]);
    g.globalAlpha = 1;
  }
  g.translate(-atk * 5, 0);
  zeroCube(g, t, atk, cy);
};

/** SQL Injection: a floating syringe full of "OR 1=1". */
const sqli: EnemyBody = (g, a) => {
  const { t, atk } = a;
  hoverPad(g, 18, 14, '#a3e635', t);
  g.translate(0, 2 + hover(t));
  line(g, -16, -6, -28 - atk * 6, -6, '#cbd5e1', 2);
  rr(g, -18, -9, 4, 6, 1);
  paint(g, '#94a3b8');
  const push = atk * 7;
  line(g, 16, -6, 26 - push, -6, '#94a3b8', 3);
  rr(g, 25 - push, -14, 3, 16, 1);
  paint(g, '#94a3b8');
  rr(g, -14, -14, 30, 16, 3);
  paint(g, 'rgba(236,252,203,0.95)', '#4d7c0f', 1.5);
  rr(g, -13, -13, 22 - push, 14, 2);
  paint(g, '#84cc16');
  txt(g, 'OR 1=1', -2, -6, 6, '#1a2e05', 800);
  face(g, -9, -24, 16, 9, '#d9f99d', t, 0.9, '#1a2e05');
};

function filePage(g: G, x: number, y: number, fill: string): void {
  g.beginPath();
  g.moveTo(x - 16, y - 26);
  g.lineTo(x + 8, y - 26);
  g.lineTo(x + 16, y - 18);
  g.lineTo(x + 16, y + 17);
  g.lineTo(x - 16, y + 17);
  g.closePath();
  paint(g, fill, '#94a3b8', 1.5);
  g.beginPath();
  g.moveTo(x + 8, y - 26);
  g.lineTo(x + 8, y - 18);
  g.lineTo(x + 16, y - 18);
  paint(g, '#cbd5e1');
}
function chain(g: G, x1: number, y1: number, x2: number, y2: number, links: number): void {
  g.strokeStyle = '#64748b';
  g.lineWidth = 2;
  for (let i = 0; i < links; i++) {
    const k = i / (links - 1);
    g.beginPath();
    g.ellipse(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, i % 2 ? 2.2 : 4, i % 2 ? 4 : 2.2, 0.5, 0, TAU);
    g.stroke();
  }
}

/** Ransomware: a floating stack of files, chained and locked. */
const ransomware: EnemyBody = (g, a) => {
  const { t, atk } = a;
  hoverPad(g, 24, 14, '#f87171', t);
  g.translate(-atk * 4, -4 + hover(t));
  filePage(g, 8, -6, '#94a3b8');
  filePage(g, 4, -3, '#cbd5e1');
  filePage(g, 0, 0, '#f1f5f9');
  face(g, -12, -22, 18, 9, '#f87171', t, 0.5, '#1c0606');
  for (const y of [-8, -2, 4, 10]) line(g, -11, y, 10, y, '#cbd5e1', 1.5);
  chain(g, -22, -14, 26, 10, 8);
  padlock(g, 2, -1, 0.6);
};

/* ======================= Fallos internos ======================= */

/** Memory Leak: a memory chip that heats up. Drawn in a 40×44 box, scaled as it grows. */
const memoryLeak: EnemyBody = (g, a0) => {
  g.scale(a0.w / 40, a0.h / 44);
  const a = { ...a0, w: 40, h: 44 };
  const { t } = a;
  const heat = (Math.sin(t * 2) + 1) / 2;
  legs(g, a, '#3b0764', 7, 9, 5);
  // heat waves
  g.strokeStyle = `rgba(248,113,113,${0.2 + 0.6 * heat})`;
  g.lineWidth = 1.5;
  for (const x of [-6, 4]) {
    g.beginPath();
    g.moveTo(x, -20);
    g.quadraticCurveTo(x + 3, -23, x, -26);
    g.quadraticCurveTo(x - 3, -29, x, -32);
    g.stroke();
  }
  const rim = heat > 0.6 ? '#f87171' : '#c084fc';
  for (let i = 0; i < 4; i++) {
    line(g, -19, -12 + i * 6, -15, -12 + i * 6, rim, 2);
    line(g, 15, -12 + i * 6, 19, -12 + i * 6, rim, 2);
  }
  rr(g, -15, -17, 30, 28, 3);
  paint(g, '#1e1b2e', rim, 1.8);
  face(g, -11, -13, 22, 9, '#e9d5ff', t, 0.4, '#3b0764');
  txt(g, 'MEM', 0, 3, 7, rim, 800);
};

export const ENEMY_ART: Record<EnemyType, EnemyBody> = {
  normal,
  scraper,
  ddos,
  zeroDay,
  blackFriday,
  sqli,
  botnet,
  botlet,
  slowloris,
  ransomware,
  memoryLeak,
};

/** Attack pulse: quick push (0 → 1), slower return. */
export function attackPulse(t: number): number {
  const p = (((t % 0.9) + 0.9) % 0.9) / 0.9;
  return p < 0.25 ? p / 0.25 : Math.max(0, 1 - (p - 0.25) / 0.5);
}
