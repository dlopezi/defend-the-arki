import type { AvatarThreat, G } from './avatarOptions';
import { TAU, txt } from './avatarOptions';
import type { Body2 } from './round2Options';
import { isoBlock, isoBox, onFace, paletteOf, poly, shade, type Look, type Palette } from './isoKit';

/*
 * Threat avatars, round 5: the isometric style of Design the Arki (same kit as the defenses of
 * round 4), keeping the families the user chose:
 * Tráfico = blue "request" band (red = fake traffic), Bots = orange + antenna with red LED and
 * treads or legs, Exploits = float (no legs), Fallos internos = purple.
 * Threats walk left, so their face is on the left face of the block.
 * A = flat faces. B = the same robot with more detail (seams, bolts, vents), still no glow.
 * Each body is centered at (0, 0) with its feet on y = h/2, like the game.
 */

export interface ThreatOptionR5 {
  name: string;
  body: Body2;
}

export const flat = (color: string): Look => ({ rich: false, p: paletteOf(color) });
export const BAND = '#0369a1';
const BOT_LED = '#ef4444';

/** Hover offset for floating threats. */
export const hover = (t: number, amp = 2): number => Math.sin(t * 4) * amp;

/* ======================= shared parts ======================= */

/** Rectangle in face space (see onFace). */
export function rect(g: G, x: number, y: number, w: number, h: number, color: string): void {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}

/** Dark screen with two LED eyes near its left side (looking left). Blinks now and then. Face space. */
function screen(g: G, x: number, y: number, w: number, h: number, led: string, t: number, seed: number, d: boolean): void {
  rect(g, x, y, w, h, '#0b1224');
  if (d) {
    // bezel and bolts
    g.strokeStyle = '#94a3b8';
    g.lineWidth = 0.6;
    g.strokeRect(x - 0.8, y - 0.8, w + 1.6, h + 1.6);
    for (const [bx, by] of [[x - 0.8, y - 0.8], [x + w + 0.8, y - 0.8], [x - 0.8, y + h + 0.8], [x + w + 0.8, y + h + 0.8]]) {
      g.beginPath();
      g.arc(bx, by, 0.7, 0, TAU);
      g.fillStyle = '#cbd5e1';
      g.fill();
    }
  }
  const blink = (t * 0.7 + seed) % 3 < 0.12;
  const eh = blink ? 0.8 : h * 0.45;
  const ew = Math.max(1.6, w * 0.13);
  rect(g, x + w * 0.16, y + (h - eh) / 2, ew, eh, led);
  rect(g, x + w * 0.42, y + (h - eh) / 2, ew, eh, led);
}

/** Tráfico family band with a label. Face space. */
export function band(g: G, x: number, y: number, w: number, h: number, label: string, size: number): void {
  rect(g, x, y, w, h, BAND);
  if (label) txt(g, label, x + w / 2, y + h / 2 + 0.3, size, '#e0f2fe', 800);
}

/** Antenna with a blinking LED, from (x, y) up. */
function antenna(g: G, x: number, y: number, len: number, stick: string, led: string, t: number): void {
  g.strokeStyle = stick;
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x, y - len);
  g.stroke();
  g.beginPath();
  g.arc(x, y - len - 1.5, 2, 0, TAU);
  g.fillStyle = t % 1.2 < 0.8 ? led : shade(led, -0.55);
  g.fill();
}

/** Top centre of an isoBlock. */
const topCenter = (fx: number, fy: number, a: number, b: number, h: number): [number, number] => [fx + (b - a) / 2, fy - (a + b) / 4 - h];

/** Two legs (small blocks) that step; the back one first. */
function legs(g: G, L: Look, fx: number, fy: number, step: number, gap: number, s = 1): void {
  const up1 = Math.max(0, step) * 3 * s;
  const up2 = Math.max(0, -step) * 3 * s;
  isoBlock(g, L, fx + gap, fy - gap / 2 - up2, 4 * s, 4 * s, 9 * s);
  isoBlock(g, L, fx, fy - up1, 4 * s, 4 * s, 9 * s);
}

/** Thin dark seam lines on a face (detail look). Face space. */
function seams(g: G, x: number, ys: number[], w: number, color: string): void {
  g.strokeStyle = color;
  g.lineWidth = 0.6;
  g.beginPath();
  for (const y of ys) {
    g.moveTo(x, y);
    g.lineTo(x + w, y);
  }
  g.stroke();
}

/** Vent slits (detail look). Face space. */
function vents(g: G, x: number, y: number, n: number, color: string): void {
  for (let i = 0; i < n; i++) rect(g, x + i * 2.4, y, 1.2, 5, color);
}

/** Flat hover pad under a floating threat (no glow). */
export function hoverPad(g: G, y: number, w: number, color: string, t: number): void {
  g.globalAlpha = 0.45 + 0.25 * Math.sin(t * 8);
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(0, y, w, w / 4, 0, 0, TAU);
  g.fill();
  g.globalAlpha = 1;
}

/* ======================= Tráfico ======================= */

/** A request robot with its feet at (0, 0): the Tráfico Normal, and the mini requests of DDoS and Black Friday. */
export function requestBot(g: G, t: number, step: number, atk: number, color: string, led: string, label: string, seed: number, d: boolean): void {
  const L = flat(color);
  const legL = flat(shade(color, -0.45));
  legs(g, legL, -4, 0, step, 9);
  // arm that knocks
  isoBlock(g, flat(shade(color, 0.15)), -20 - atk * 12, -20 - atk * 3, 5 + atk * 6, 3, 4);
  const fx = -1;
  const fy = -8;
  const a = 20;
  const b = 12;
  const h = 30;
  isoBlock(g, L, fx, fy, a, b, h);
  onFace(g, 'left', fx, fy, a, () => {
    screen(g, 2, -27, 16, 11, led, t, seed, d);
    band(g, 1, -11, 18, 6, label, 4.4);
    if (d) seams(g, 0, [-3], a, L.p.dark);
  });
  if (d)
    onFace(g, 'right', fx, fy, b, () => {
      vents(g, 3, -22, 3, shade(color, -0.6));
      seams(g, 0, [-13, -3], b, shade(color, -0.6));
    });
  const [ax, ay] = topCenter(fx, fy, a, b, h);
  antenna(g, ax + 3, ay, 6, shade(color, 0.3), led, t + seed);
}

const normal = (d: boolean): Body2 => (g, a) => {
  g.save();
  g.translate(0, a.h / 2);
  requestBot(g, a.t, a.step, a.atk, '#64748b', '#7dd3fc', 'GET /', 0.4, d);
  g.restore();
};

/** DDoS: a swarm of red mini requests (fake traffic), on a "x10⁶" plate. */
const SWARM: [number, number, number][] = [
  [26, -6, 0.5], [14, 16, 0.55], [-4, -12, 0.6], [30, 22, 0.6], [-8, 14, 0.7], [-26, 24, 0.75],
];
export const ddos = (d: boolean, swarm: [number, number, number][] = SWARM): Body2 => (g, a) => {
  const { t, atk } = a;
  swarm.forEach(([x, y, s], i) => {
    g.save();
    g.translate(x - atk * (4 + i * 1.5), y + Math.sin(t * 5 + i) * 1.5);
    g.scale(s, s);
    requestBot(g, t + i * 0.37, Math.sin(t * 9 + i), atk, '#b91c1c', '#fecaca', d ? 'GET' : '', i * 0.7 + 0.3, d);
    g.restore();
  });
  const L = flat(BAND);
  isoBlock(g, L, -4, a.h / 2 + 2, 26, 8, 4);
  onFace(g, 'left', -4, a.h / 2 + 2, 26, () => txt(g, 'x10⁶', 13, -2, 4, '#e0f2fe', 800));
};

/** Slowloris: a floating loading bar stuck at 2 %. */
const slowloris = (d: boolean): Body2 => (g, a) => {
  const { t, atk } = a;
  hoverPad(g, a.h / 2 - 2, 16, '#38bdf8', t);
  g.save();
  g.translate(-atk * 3, hover(t, 1.5));
  const L = flat('#0c4a6e');
  const fx = 10;
  const fy = 10;
  const len = 40;
  isoBlock(g, L, fx, fy, len, 9, 17);
  onFace(g, 'left', fx, fy, len, () => {
    screen(g, 2, -15, 9, 10, '#bae6fd', t, 0.4, d);
    rect(g, 13, -12, 24, 5, '#082f49');
    rect(g, 13, -12, 1 + ((t * 0.04) % 1) * 2, 5, '#38bdf8');
    if (d) for (let i = 1; i < 6; i++) rect(g, 13 + i * 4, -12, 0.4, 5, '#0c4a6e');
    band(g, 6, -4, 28, 3.6, d ? 'cargando…' : 'cargando', 3);
  });
  const [cx, cy] = topCenter(fx, fy, len, 9, 17);
  txt(g, '2%', cx + 2, cy - 4, 6, '#bae6fd', 800);
  if (d) {
    // spinner dots stuck in place
    for (let i = 0; i < 6; i++) {
      const r = (i / 6) * TAU;
      g.globalAlpha = 0.3 + (i / 6) * 0.7;
      g.beginPath();
      g.arc(cx - 12 + Math.cos(r) * 3, cy - 5 + Math.sin(r) * 3, 0.8, 0, TAU);
      g.fillStyle = '#bae6fd';
      g.fill();
    }
    g.globalAlpha = 1;
  }
  g.restore();
};

/** Black Friday: a cart full of orders with a "-70%" sign on a pole. No head. */
const blackFriday = (d: boolean): Body2 => (g, a) => {
  const { t, atk, h } = a;
  g.save();
  g.translate(-atk * 8, 0);
  const gy = h / 2;
  const fx = -6;
  const fy = gy - 16;
  const A = 46;
  const B = 26;
  const H = 34;
  const yellow = '#facc15';
  // wheels under the basket, on the left face plane
  onFace(g, 'left', fx, fy, A, () => {
    for (const x of [8, 38]) {
      g.strokeStyle = yellow;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 8);
      g.stroke();
      g.beginPath();
      g.arc(x, 10, 6, 0, TAU);
      g.fillStyle = '#111827';
      g.fill();
      g.strokeStyle = yellow;
      g.stroke();
      const r = -t * 4;
      g.beginPath();
      g.moveTo(x, 10);
      g.lineTo(x + Math.cos(r) * 5, 10 + Math.sin(r) * 5);
      g.lineWidth = 1;
      g.stroke();
    }
  });
  const basket: Palette = { base: '#334155', light: '#475569', dark: '#1f2937', top: '#0b1220', glow: yellow, window: yellow };
  isoBlock(g, flat('#334155'), fx, fy, A, B, H, basket);
  // the pile of orders stands in the open basket
  const [tx, ty] = topCenter(fx, fy, A, B, H);
  const pile: [number, number, number][] = [[-18, 4, 0.5], [2, 6, 0.5], [-6, -4, 0.48], [14, -2, 0.48], [-26, -6, 0.45], [6, 12, 0.52]];
  pile.sort((p, q) => p[1] - q[1]).forEach(([x, y, s], i) => {
    g.save();
    g.translate(tx + x, ty + y - atk * 4 + Math.sin(t * 6 + i) * 0.8);
    g.scale(s, s);
    requestBot(g, t + i * 0.3, 0, 0, '#64748b', '#7dd3fc', d ? 'GET' : '', i + 0.5, d);
    g.restore();
  });
  // front wall of the basket again, so the orders sit inside it
  g.globalAlpha = 0.92;
  isoBlock(g, flat('#334155'), fx, fy, A, B, H * 0.55, { ...basket, top: 'rgba(0,0,0,0)' });
  g.globalAlpha = 1;
  onFace(g, 'left', fx, fy, A, () => {
    g.strokeStyle = 'rgba(250,204,21,0.45)';
    g.lineWidth = 1;
    g.beginPath();
    for (const x of d ? [8, 16, 24, 32, 40] : [12, 24, 36]) {
      g.moveTo(x, -1);
      g.lineTo(x, -H * 0.55 + 1);
    }
    g.stroke();
    g.strokeStyle = yellow;
    g.lineWidth = 1.6;
    g.strokeRect(0, -H * 0.55, A, H * 0.55);
    band(g, 4, -12, 38, 7, 'BLACK FRIDAY', 4.8);
  });
  // handle at the back right
  g.strokeStyle = yellow;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(fx + B, fy - B / 2 - H * 0.55);
  g.lineTo(fx + B + 10, fy - B / 2 - H - 8);
  g.lineTo(fx + B + 18, fy - B / 2 - H - 12);
  g.stroke();
  // pole and swinging sign
  const px = fx + B - 4;
  const py = fy - B / 2 - H * 0.55;
  g.lineWidth = 2.6;
  g.beginPath();
  g.moveTo(px, py);
  g.lineTo(px, py - 52);
  g.stroke();
  g.save();
  g.translate(px, py - 52);
  g.rotate(Math.sin(t * 2.5) * 0.06 - atk * 0.15);
  isoBlock(g, flat('#dc2626'), 6, 6, 32, 4, 20);
  onFace(g, 'left', 6, 6, 32, () => {
    txt(g, '-70%', 16, -10, 10, '#ffffff', 900);
    if (d) {
      g.strokeStyle = '#fecaca';
      g.lineWidth = 0.8;
      g.strokeRect(1.5, -18.5, 29, 17);
    }
  });
  g.restore();
  g.restore();
};

/* ======================= Bots ======================= */

/** Treads seen from the side, on the left face plane: marks run while it moves. Face space. */
function treadMarks(g: G, len: number, h: number, t: number, d: boolean): void {
  const step = 4;
  const off = (t * 14) % step;
  g.fillStyle = '#57534e';
  for (let x = off; x < len - 1; x += step) g.fillRect(x, -h, 1.4, h);
  if (d)
    for (const x of [3, len / 2, len - 3]) {
      g.beginPath();
      g.arc(x, -h / 2, h / 2 - 1, 0, TAU);
      g.fillStyle = '#44403c';
      g.fill();
      g.strokeStyle = '#fb923c';
      g.lineWidth = 0.6;
      g.stroke();
    }
}

/** Scraper Bot on treads, with a scan beam toward the ground ahead. */
const scraper = (d: boolean): Body2 => (g, a) => {
  const { t, atk, h } = a;
  const gy = h / 2;
  g.save();
  g.translate(-atk * 5, 0);
  const tread = flat('#292524');
  isoBlock(g, tread, -2, gy, 24, 12, 8);
  onFace(g, 'left', -2, gy, 24, () => treadMarks(g, 24, 8, t, d));
  const L = flat('#ea580c');
  const fx = 0;
  const fy = gy - 8;
  const A = 20;
  const B = 12;
  const H = 26;
  isoBlock(g, L, fx, fy, A, B, H);
  let eye: [number, number] = [0, 0];
  onFace(g, 'left', fx, fy, A, () => {
    rect(g, 2, -23, 16, 10, '#0b1224');
    const ex = 3 + ((Math.sin(t * 3) + 1) / 2) * 11;
    rect(g, ex, -20, 2.4, 4, BOT_LED);
    eye = [ex, -18];
    if (d) {
      g.strokeStyle = '#fdba74';
      g.lineWidth = 0.6;
      g.strokeRect(1.2, -23.8, 17.6, 11.6);
      txt(g, 'BOT', 10, -7, 4.2, '#7c2d12', 800);
    }
  });
  if (d)
    onFace(g, 'right', fx, fy, B, () => {
      vents(g, 3, -20, 3, '#7c2d12');
      seams(g, 0, [-10], B, '#7c2d12');
    });
  // scan beam from the eye to the ground ahead
  const ex = fx - A + eye[0];
  const ey = fy - A / 2 + eye[0] * 0.5 + eye[1];
  g.globalAlpha = 0.18 + 0.1 * Math.sin(t * 9);
  poly(g, [[ex, ey], [ex - 22, gy + 2], [ex - 8, gy + 6]]);
  g.fillStyle = BOT_LED;
  g.fill();
  g.globalAlpha = 1;
  const [ax, ay] = topCenter(fx, fy, A, B, H);
  antenna(g, ax + 2, ay, 7, '#fdba74', BOT_LED, t);
  g.restore();
};

/** A small iso device with an optional antenna: the botnet's camera, router and fridge. */
function device(g: G, kind: 'camera' | 'router' | 'fridge', x: number, y: number, t: number, d: boolean): void {
  const L = flat('#f59e0b');
  if (kind === 'camera') {
    isoBlock(g, L, x, y, 9, 6, 8);
    onFace(g, 'left', x, y, 9, () => {
      g.beginPath();
      g.arc(4.5, -4, 2.8, 0, TAU);
      g.fillStyle = '#0b1224';
      g.fill();
      g.beginPath();
      g.arc(4.5, -4, 1.1, 0, TAU);
      g.fillStyle = BOT_LED;
      g.fill();
    });
  } else if (kind === 'router') {
    isoBlock(g, L, x, y, 12, 7, 4);
    onFace(g, 'left', x, y, 12, () => {
      for (let i = 0; i < 3; i++) rect(g, 2 + i * 3, -2.6, 1.4, 1.4, (t * 3 + i) % 2 < 1 ? '#4ade80' : '#166534');
    });
    const [cx, cy] = topCenter(x, y, 12, 7, 4);
    antenna(g, cx - 3, cy, 5, '#fdba74', BOT_LED, t);
    if (d) antenna(g, cx + 3, cy + 1, 4, '#fdba74', BOT_LED, t + 0.5);
  } else {
    isoBlock(g, L, x, y, 8, 7, 15);
    onFace(g, 'left', x, y, 8, () => {
      rect(g, 0, -10, 8, 0.6, shade('#f59e0b', -0.6));
      rect(g, 6, -14, 0.9, 3, '#e5e7eb');
      rect(g, 6, -8, 0.9, 4, '#e5e7eb');
    });
  }
}

/** Packets running along links. */
function packets(g: G, from: [number, number], to: [number, number], t: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const k = (t * 0.8 + i / n) % 1;
    g.beginPath();
    g.arc(from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k, 1.1, 0, TAU);
    g.fillStyle = '#fde68a';
    g.fill();
  }
}

/** Botnet: a camera, a router and a fridge hanging from a central cloud (the command server). */
const botnet = (d: boolean): Body2 => (g, a) => {
  const { t, atk, h } = a;
  const gy = h / 2;
  g.save();
  g.translate(-atk * 4, 0);
  const cloud: [number, number] = [2, -16 + hover(t, 1.5)];
  const devs: { kind: 'camera' | 'router' | 'fridge'; at: [number, number] }[] = [
    { kind: 'camera', at: [-14, gy - 10] },
    { kind: 'fridge', at: [6, gy] },
    { kind: 'router', at: [24, gy - 6] },
  ];
  // links first
  g.strokeStyle = 'rgba(253,186,116,0.6)';
  g.lineWidth = 0.8;
  for (const dv of devs) {
    g.beginPath();
    g.moveTo(cloud[0], cloud[1] + 6);
    g.lineTo(dv.at[0], dv.at[1] - 12);
    g.stroke();
    packets(g, [cloud[0], cloud[1] + 6], [dv.at[0], dv.at[1] - 12], t, d ? 3 : 2);
  }
  for (const dv of devs) device(g, dv.kind, dv.at[0], dv.at[1] + Math.sin(t * 4 + dv.at[0]) * 0.8, t, d);
  // cloud: puffs in two tones, flat
  const puffs: [number, number, number][] = [[-12, 2, 7], [-3, -3, 9], [9, -1, 8], [16, 3, 6], [2, 4, 8]];
  for (const [x, y, r] of puffs) {
    g.beginPath();
    g.arc(cloud[0] + x, cloud[1] + y + 1.5, r, 0, TAU);
    g.fillStyle = '#b45309';
    g.fill();
  }
  for (const [x, y, r] of puffs) {
    g.beginPath();
    g.arc(cloud[0] + x, cloud[1] + y, r - 1, 0, TAU);
    g.fillStyle = '#f59e0b';
    g.fill();
  }
  if (d)
    for (const [x, y, r] of puffs.slice(0, 3)) {
      g.beginPath();
      g.arc(cloud[0] + x - 1.5, cloud[1] + y - 2, r * 0.45, 0, TAU);
      g.fillStyle = '#fcd34d';
      g.fill();
    }
  txt(g, 'C2', cloud[0] + 1, cloud[1] + 2, 7, '#451a03', 900);
  antenna(g, cloud[0] + 10, cloud[1] - 7, 5, '#fdba74', BOT_LED, t);
  g.restore();
};

/** Small bot left when a botnet dies: a mini camera on legs. */
const botlet = (d: boolean): Body2 => (g, a) => {
  const { t, step, atk, h } = a;
  g.save();
  g.translate(-atk * 4, h / 2);
  legs(g, flat('#92400e'), -2, 0, step, 6, 0.6);
  const L = flat('#fbbf24');
  isoBlock(g, L, 0, -5, 11, 7, 11);
  onFace(g, 'left', 0, -5, 11, () => {
    g.beginPath();
    g.arc(5, -6, 3.4, 0, TAU);
    g.fillStyle = '#0b1224';
    g.fill();
    g.beginPath();
    g.arc(5, -6, 1.3, 0, TAU);
    g.fillStyle = BOT_LED;
    g.fill();
    if (d) {
      g.strokeStyle = '#92400e';
      g.lineWidth = 0.6;
      g.beginPath();
      g.arc(5, -6, 4.2, 0, TAU);
      g.stroke();
    }
  });
  const [ax, ay] = topCenter(0, -5, 11, 7, 11);
  antenna(g, ax + 1, ay, 4, '#fdba74', BOT_LED, t);
  g.restore();
};

/* ======================= Exploits (they float) ======================= */

/** Zero-Day: a glitch cube that breaks into pixels and appears again a bit ahead. */
const zeroDay = (d: boolean): Body2 => (g, a) => {
  const { t, atk, h } = a;
  hoverPad(g, h / 2 - 2, 13, '#e879f9', t);
  const p = (t * 0.7) % 1;
  const L = flat('#c026d3');
  g.save();
  g.translate(-atk * 6 + (atk ? Math.sin(t * 50) * 1 : 0), hover(t) + 6);
  if (p < 0.82) {
    // appears a bit ahead after each glitch
    const a0 = Math.min(1, p / 0.1);
    g.globalAlpha = a0;
    isoBox(g, L, 0, 4, 13, 22);
    onFace(g, 'left', 0, 4 + 6.5, 13, () => {
      screen(g, 1.5, -18, 10, 8, '#f5d0fe', t, 0.2, d);
      txt(g, '0day', 6.5, -5, 3.6, '#fdf4ff', 800);
    });
    if (d)
      onFace(g, 'right', 0, 4 + 6.5, 13, () => {
        g.strokeStyle = '#f0abfc';
        g.lineWidth = 0.6;
        g.beginPath();
        g.moveTo(2, -4);
        g.lineTo(5, -4);
        g.lineTo(5, -12);
        g.lineTo(9, -12);
        g.lineTo(9, -18);
        g.stroke();
      });
    g.globalAlpha = 1;
  } else {
    // breaks into pixels
    const k = (p - 0.82) / 0.18;
    const pix: [number, number][] = [[-8, -14], [4, -18], [-2, -6], [8, -8], [-10, 2], [2, 4], [10, 0], [-4, -22]];
    pix.forEach(([x, y], i) => {
      g.globalAlpha = 1 - k;
      isoBox(g, L, x * (1 + k * 1.5) - k * 10, y * (1 + k) + 4, 2.6, 4, i % 2 ? L.p : paletteOf('#f0abfc'));
    });
    g.globalAlpha = 1;
  }
  g.restore();
};

/** SQL Injection: a floating syringe full of "OR 1=1". */
const sqli = (d: boolean): Body2 => (g, a) => {
  const { t, atk, h } = a;
  hoverPad(g, h / 2 - 2, 16, '#84cc16', t);
  g.save();
  g.translate(-atk * 4, hover(t) - 4);
  const fx = 8;
  const fy = 8;
  const A = 30;
  const B = 9;
  const H = 10;
  const push = atk * 8;
  // plunger behind the barrel (toward the back right)
  const rx = fx + B / 2;
  const ry = fy - B / 4 - H / 2;
  g.strokeStyle = '#e5e7eb';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(rx, ry);
  g.lineTo(rx + 12 - push, ry + 6 - push / 2);
  g.stroke();
  isoBlock(g, flat('#d4d4d8'), rx + 12 - push + 3, ry + 6 - push / 2 + 5, 3, 8, 8);
  // needle out of the left end
  const nx = fx - A + B / 2;
  const ny = fy - A / 2 - B / 4 - H / 2;
  g.strokeStyle = '#cbd5e1';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(nx, ny);
  g.lineTo(nx - 12, ny - 6);
  g.stroke();
  if (d) {
    const drop = (t * 1.2) % 1;
    g.globalAlpha = 1 - drop;
    g.beginPath();
    g.arc(nx - 13, ny - 6 + drop * 10, 1.2, 0, TAU);
    g.fillStyle = '#84cc16';
    g.fill();
    g.globalAlpha = 1;
  }
  const glass: Palette = { base: '#d9f99d', light: '#ecfccb', dark: '#a3e635', top: '#f7fee7', glow: '#84cc16', window: '#84cc16' };
  isoBlock(g, flat('#d9f99d'), fx, fy, A, B, H, glass);
  onFace(g, 'left', fx, fy, A, () => {
    const fill = 22 - push * 1.5;
    rect(g, A - fill - 1, -8.5, fill, 7, '#4d7c0f');
    txt(g, 'OR 1=1', A - 12, -5, 3.8, '#f7fee7', 800);
    if (d) for (let i = 1; i < 7; i++) rect(g, i * 4, -10, 0.5, 2.5, '#365314');
  });
  if (d) isoBlock(g, flat('#a3a3a3'), fx + 2, fy + 1, 2, 12, 1.5);
  g.restore();
};

/** Ransomware: a floating stack of files, chained and locked. */
const ransomware = (d: boolean): Body2 => (g, a) => {
  const { t, atk, h } = a;
  hoverPad(g, h / 2 - 2, 15, '#dc2626', t);
  g.save();
  g.translate(-atk * 5, hover(t) - 2);
  const paper = flat('#e2e8f0');
  const fx = 2;
  for (let i = 0; i < 3; i++) {
    const fy = 12 - i * 7;
    isoBlock(g, paper, fx, fy, 18, 14, 5);
    onFace(g, 'left', fx, fy, 18, () => {
      rect(g, 0, -5, 18, 1.6, '#dc2626');
      if (d) for (let k = 0; k < 2; k++) rect(g, 3, -3 + k * 1.3, 10 - k * 3, 0.5, '#64748b');
    });
  }
  // chain across the stack (on the left face plane)
  onFace(g, 'left', fx, 12, 18, () => {
    g.strokeStyle = '#94a3b8';
    g.lineWidth = 1.2;
    for (let k = 0; k < 6; k++) {
      g.beginPath();
      g.ellipse(1 + k * 3.2, -2 - k * 3, 1.8, 1.1, -0.75, 0, TAU);
      g.stroke();
    }
  });
  // padlock in front
  const sh = atk ? Math.sin(t * 40) * 2.5 : 0;
  g.strokeStyle = '#fecaca';
  g.lineWidth = 1.8;
  g.beginPath();
  g.arc(-9 + sh, 4, 3.4, Math.PI, 0);
  g.stroke();
  isoBlock(g, flat('#dc2626'), -9 + sh, 14, 6, 4, 9);
  onFace(g, 'left', -9 + sh, 14, 6, () => {
    g.beginPath();
    g.arc(3, -5.5, 1, 0, TAU);
    g.fillStyle = '#450a0a';
    g.fill();
    if (d) rect(g, 2.6, -5, 0.8, 2.4, '#450a0a');
  });
  g.restore();
};

/* ======================= Fallos internos ======================= */

/** Memory Leak: a memory chip that heats up, walking on its pins. Drawn in a 40×44 box, scaled as it grows. */
const memoryLeak = (d: boolean): Body2 => (g, a0) => {
  const k = a0.w / 40;
  const { t, step, atk } = a0;
  g.save();
  g.scale(k, k);
  g.translate(-atk * 4, 22);
  const heat = 0.5 + 0.5 * Math.sin(t * 1.3);
  const fx = 0;
  const fy = -6;
  const A = 18;
  const B = 16;
  const H = 6;
  // pins as feet (they step)
  onFace(g, 'left', fx, fy, A, () => {
    for (let i = 0; i < 4; i++) rect(g, 2 + i * 4.4, 0, 1.6, 4 - (i % 2 ? Math.max(0, step) : Math.max(0, -step)) * 2, '#d4d4d8');
  });
  onFace(g, 'right', fx, fy, B, () => {
    for (let i = 0; i < 3; i++) rect(g, 2 + i * 4.6, 0, 1.6, 4, '#a1a1aa');
  });
  const chip = paletteOf('#7e22ce');
  const hot = shade('#ef4444', -0.1);
  const L: Look = { rich: false, p: { ...chip, top: mix(chip.top, hot, heat * 0.6) } };
  isoBlock(g, L, fx, fy, A, B, H);
  onFace(g, 'left', fx, fy, A, () => {
    screen(g, 2, -5.2, 10, 4.4, '#e9d5ff', t, 0.7, false);
    txt(g, 'RAM', 15, -3, 3, '#f3e8ff', 800);
  });
  const [cx, cy] = topCenter(fx, fy, A, B, H);
  if (d) {
    // die and traces on the top
    poly(g, [[cx - 6, cy], [cx, cy - 3], [cx + 6, cy], [cx, cy + 3]]);
    g.fillStyle = shade('#7e22ce', -0.5);
    g.fill();
    g.strokeStyle = '#d8b4fe';
    g.lineWidth = 0.5;
    g.beginPath();
    g.moveTo(cx - 6, cy);
    g.lineTo(cx - 11, cy + 2.5);
    g.moveTo(cx + 6, cy);
    g.lineTo(cx + 11, cy + 2.5);
    g.stroke();
  }
  // heat waves
  g.strokeStyle = '#fb923c';
  g.lineWidth = 1;
  g.globalAlpha = 0.25 + heat * 0.6;
  for (let i = -1; i <= 1; i++) {
    const x = cx + i * 6;
    const rise = (t * 8 + i * 3) % 6;
    g.beginPath();
    g.moveTo(x, cy - 3 - rise);
    g.quadraticCurveTo(x + 2, cy - 6 - rise, x, cy - 9 - rise);
    g.quadraticCurveTo(x - 2, cy - 12 - rise, x, cy - 15 - rise);
    g.stroke();
  }
  g.globalAlpha = 1;
  g.restore();
};

/** Mixes two #rrggbb colours (k = 0 → a, 1 → b). */
function mix(a: string, b: string, k: number): string {
  const ch = (hex: string, i: number): number => parseInt(hex.slice(i, i + 2), 16);
  return `#${[1, 3, 5].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * k).toString(16).padStart(2, '0')).join('')}`;
}

/* ======================= attack ======================= */

/** Flat impact star (no glow) where the threat hits the defense. */
function impact(g: G, x: number, y: number, k: number): void {
  g.save();
  g.translate(x, y);
  g.scale(0.6 + k * 0.6, 0.6 + k * 0.6);
  g.globalAlpha = Math.min(1, k * 1.6);
  const star: [number, number][] = [];
  for (let i = 0; i < 16; i++) {
    const r = i % 2 ? 3.5 : 9;
    const ang = (i / 16) * TAU;
    star.push([Math.cos(ang) * r, Math.sin(ang) * r]);
  }
  poly(g, star);
  g.fillStyle = '#fde047';
  g.fill();
  g.lineWidth = 1;
  g.strokeStyle = '#a16207';
  g.stroke();
  g.beginPath();
  g.arc(0, 0, 3, 0, TAU);
  g.fillStyle = '#ffffff';
  g.fill();
  g.restore();
}

/**
 * Attack, the same for every threat: it rams toward the defense on its left (with a small
 * squash) and a flat impact star shows the hit. Own moves (arm, plunger, lock…) come on top.
 */
export const withAttack = (body: Body2): Body2 => (g, a) => {
  const lunge = a.atk * 12;
  g.save();
  g.translate(-lunge, 0);
  g.translate(0, a.h / 2);
  g.scale(1 + a.atk * 0.08, 1 - a.atk * 0.08);
  g.translate(0, -a.h / 2);
  body(g, a);
  g.restore();
  if (a.atk > 0.35) impact(g, -a.w / 2 - lunge - 6, -a.h * 0.1, (a.atk - 0.35) / 0.65);
};

/* ======================= options table ======================= */

type R5Threat = AvatarThreat;
const MAKERS: Record<R5Threat, (d: boolean) => Body2> = {
  normal,
  scraper,
  ddos,
  zeroDay,
  sqli,
  ransomware,
  memoryLeak,
  botnet,
  slowloris,
  blackFriday,
};

export const THREAT_OPTIONS_R5 = Object.fromEntries(
  (Object.keys(MAKERS) as R5Threat[]).map((type) => [type, { A: { name: 'Plano', body: withAttack(MAKERS[type](false)) }, B: { name: 'Con más detalle', body: withAttack(MAKERS[type](true)) } }]),
) as Record<R5Threat, { A: ThreatOptionR5; B: ThreatOptionR5 }>;

export const BOTLET_R5: { A: Body2; B: Body2 } = { A: withAttack(botlet(false)), B: withAttack(botlet(true)) };
