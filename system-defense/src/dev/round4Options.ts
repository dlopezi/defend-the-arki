import { circ, line, padlock, paint, rr, TAU, txt, type G } from './avatarOptions';
import { antenna, face, wheel, type Body2 } from './round2Options';
import { band, botAntenna, botnetCloudDraw, chain, filePage, syringeBarrel } from './round3Options';

/*
 * Round 4 avatars, from the user's comments on round 3:
 * - Exploits float (no legs). Bots roll on wheels or treads. Slowloris needs no legs.
 * - DDoS = red mini requests (fake traffic). Black Friday: no head, the cart full of orders is the star.
 */

/* ---------------- Shared ---------------- */

/** Mini request. Red = fake traffic (DDoS); it keeps the blue family band. */
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

/* ======================= DDoS: red swarm ======================= */

const FORMATION: [number, number, number][] = [
  [30, -16, 0.6], [26, 14, 0.65], [16, -2, 0.75], [2, -22, 0.8], [2, 16, 0.85], [-18, -4, 1.05],
];
const ddosRed: Body2 = (g, a) => {
  const { t, atk } = a;
  FORMATION.forEach(([x, y, s], i) => {
    miniReq(g, x - atk * (4 + i * 1.5), y + Math.sin(t * 5 + i) * 2, s, t + i * 0.37, i * 0.7, true);
  });
  band(g, -16, 26, 32, 'x10⁶', 7);
};

/* ======================= Scraper Bot on treads ======================= */

function scraperBeam(g: G, fromX: number, fromY: number, h: number, atk: number): void {
  g.fillStyle = `rgba(253,224,71,${0.2 + 0.15 * atk})`;
  g.beginPath();
  g.moveTo(fromX, fromY);
  g.lineTo(-58, h / 2);
  g.lineTo(-30, h / 2);
  g.closePath();
  g.fill();
}

/** Same body as round 2, on treads instead of legs. */
const scraperTreads: Body2 = (g, a) => {
  const { h, t, atk } = a;
  const eyeX = -15 + ((Math.sin(t * 3) + 1) / 2) * 20;
  scraperBeam(g, eyeX, -h / 2 + 14, h, atk);
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

/** Taller body on a post, with a turning scanner on top. */
const scraperTall: Body2 = (g, a) => {
  const { h, t, atk } = a;
  const sweep = Math.sin(t * 2.5) * 0.35 - atk * 0.2;
  treads(g, 0, h / 2 - 7, 44, 14, t, '#fdba74');
  rr(g, -3, 4, 6, 18, 2);
  paint(g, '#78350f', '#fdba74', 1);
  rr(g, -19, -16, 38, 24, 8);
  paint(g, '#9a3412', '#fdba74', 1.5);
  face(g, -15, -11, 22, 10, '#fde047', t, 0.3, '#1c1917');
  txt(g, 'BOT', 0, 3, 8, '#ffedd5');
  // scanner on top: a small dish that sweeps; the beam comes from it
  g.save();
  g.translate(2, -20);
  g.rotate(sweep);
  g.fillStyle = `rgba(253,224,71,${0.18 + 0.15 * atk})`;
  g.beginPath();
  g.moveTo(-6, -2);
  g.lineTo(-60, 34);
  g.lineTo(-40, 48);
  g.closePath();
  g.fill();
  rr(g, -8, -6, 14, 7, 3);
  paint(g, '#1c1917', '#fdba74', 1.2);
  circ(g, -5, -2.5, 2);
  paint(g, Math.sin(t * 8) > 0 ? '#fde047' : '#a16207');
  g.restore();
  line(g, 2, -16, 2, -19, '#fdba74', 2);
  botAntenna(g, 12, -16, 6, t);
};

/* ======================= Botnet: cloud, fridge on wheels ======================= */

const botnetWheels: Body2 = (g, a) => botnetCloudDraw(g, a, true);
const botletWheels: Body2 = (g, a) => {
  const { w, h, t } = a;
  wheel(g, -5, h / 2 - 3.5, 3.5, t, '#1f2937', '#94a3b8', 6);
  wheel(g, 5, h / 2 - 3.5, 3.5, t, '#1f2937', '#94a3b8', 6);
  botAntenna(g, 5, -h / 2 + 5, 4, t);
  rr(g, -w / 2, -h / 2 + 5, w, h - 13, 4);
  paint(g, '#e5e7eb', '#94a3b8', 1);
  g.fillStyle = '#f59e0b';
  g.fillRect(-w / 2 + 1, h / 2 - 11, w - 2, 2);
  const cy = -h / 2 + 5 + (h - 13) / 2 - 1;
  circ(g, -w / 2 + 7, cy, 4.5);
  paint(g, '#111827');
  circ(g, -w / 2 + 7, cy, 1.6);
  paint(g, `rgba(239,68,68,${0.6 + 0.4 * Math.sin(t * 5)})`);
};

/* ======================= Ransomware: floating stack ======================= */

const ransomFloat: Body2 = (g, a) => {
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

/* ======================= Black Friday: the cart is the star (no head) ======================= */

/** Cart frame: wheels, handle, basket. Cargo is drawn before the basket front. */
function cartFrame(g: G, t: number, cargo: () => void, label: string, labelSize = 8): void {
  line(g, -32, 30, -32, 46, '#facc15', 3);
  line(g, 24, 30, 24, 46, '#facc15', 3);
  wheel(g, -32, 52, 8, t, '#111827', '#facc15');
  wheel(g, 24, 52, 8, t, '#111827', '#facc15');
  line(g, 40, -20, 52, -40, '#facc15', 3.5);
  line(g, 48, -40, 56, -40, '#facc15', 4);
  cargo();
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
  band(g, -40, 10, 70, label, labelSize);
}

/** Pile of requests (orders): rows from the bottom up. */
const PILE: [number, number, number][] = [
  [-36, -26, 0.95], [-16, -26, 0.95], [4, -26, 0.95], [24, -26, 0.95],
  [-26, -44, 0.9], [-6, -44, 0.9], [14, -44, 0.9],
  [-16, -61, 0.85], [4, -61, 0.85],
];

const bfOverflow: Body2 = (g, a) => {
  const { t, atk } = a;
  g.translate(-atk * 8, 0);
  // headlights on the front corner (they read as the cart's "eyes")
  g.fillStyle = `rgba(250,204,21,${0.14 + 0.12 * atk})`;
  g.beginPath();
  g.moveTo(-48, -4);
  g.lineTo(-80, 26);
  g.lineTo(-58, 30);
  g.closePath();
  g.fill();
  cartFrame(g, t, () => {
    PILE.forEach(([x, y, s], i) => miniReq(g, x, y - atk * 4 * (i > 6 ? 1.5 : 1) + Math.sin(t * 6 + i) * 0.8, s, t + i * 0.3, i, false));
  }, '-70%', 9);
  for (const [x, y] of [[-47, -8], [-44, 4]]) {
    circ(g, x, y, 4);
    paint(g, atk > 0.5 ? '#fef08a' : '#facc15', '#a16207', 1.2);
  }
};

const bfSign: Body2 = (g, a) => {
  const { t, atk } = a;
  g.translate(-atk * 8, 0);
  cartFrame(g, t, () => {
    PILE.slice(0, 7).forEach(([x, y, s], i) => miniReq(g, x, y - atk * 4 + Math.sin(t * 6 + i) * 0.8, s, t + i * 0.3, i, false));
    // pole + sign
    line(g, 32, -20, 32, -48, '#facc15', 3);
    g.save();
    g.translate(32, -48);
    g.rotate(Math.sin(t * 2.5) * 0.06 - atk * 0.15);
    rr(g, -20, -22, 40, 22, 4);
    paint(g, '#dc2626', '#fecaca', 2);
    txt(g, '-70%', 0, -10.5, 13, '#ffffff', 900);
    g.restore();
  }, 'BLACK FRIDAY', 7);
};

const BOXES: [number, number, number, number][] = [
  [-44, -38, 22, 18], [-20, -40, 24, 20], [6, -36, 20, 16], [24, -38, 16, 18],
  [-34, -58, 20, 18], [-12, -60, 22, 20], [10, -54, 18, 16],
  [-22, -76, 18, 16], [-2, -74, 16, 14],
];
const bfBoxes: Body2 = (g, a) => {
  const { t, atk } = a;
  g.translate(-atk * 8, 0);
  cartFrame(g, t, () => {
    BOXES.forEach(([x, y, w, h], i) => {
      const jump = i > 6 ? atk * 5 + Math.max(0, Math.sin(t * 6 + i)) * 1.2 : atk * 2;
      rr(g, x, y + 18 - jump, w, h, 2);
      paint(g, i % 2 ? '#b45309' : '#a16207', '#facc15', 1);
      line(g, x + w / 2, y + 18 - jump, x + w / 2, y + 18 + h - jump, '#fde68a', 1.5);
    });
  }, 'BLACK FRIDAY', 7);
  // "-70%" tag hanging from the handle
  g.save();
  g.translate(54, -40);
  g.rotate(Math.sin(t * 3) * 0.25 + atk * 0.3);
  line(g, 0, 0, 0, 10, '#facc15', 1.5);
  rr(g, -13, 10, 26, 14, 3);
  paint(g, '#dc2626', '#fecaca', 1.5);
  txt(g, '-70%', 0, 17, 8, '#ffffff', 800);
  g.restore();
};

/* ======================= Zero-Day: floating ======================= */

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

const zeroFloat: Body2 = (g, a) => {
  const { t, atk } = a;
  hoverPad(g, 20, 12, '#e879f9', t);
  g.translate(-atk * 5, 0);
  zeroCube(g, t, atk, -4 + hover(t));
};

/** It vanishes into pixels and appears again a bit ahead. */
const zeroTeleport: Body2 = (g, a) => {
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
  } else {
    // fading outline where it came from
    if (p < 0.45) {
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
  }
};

const zeroDiamond: Body2 = (g, a) => {
  const { t, atk } = a;
  hoverPad(g, 22, 10, '#e879f9', t);
  const cy = -6 + hover(t);
  g.save();
  g.translate(-atk * 5, cy);
  g.rotate(atk * 0.5);
  g.beginPath();
  g.moveTo(0, -22);
  g.lineTo(20, 0);
  g.lineTo(0, 22);
  g.lineTo(-20, 0);
  g.closePath();
  paint(g, '#a21caf', '#f5d0fe', 1.8);
  g.beginPath();
  g.moveTo(0, -22);
  g.lineTo(20, 0);
  g.lineTo(0, 0);
  g.closePath();
  paint(g, 'rgba(255,255,255,0.12)');
  face(g, -10, -6, 20, 9, '#f5d0fe', t, 0.4, '#1a0b1f');
  txt(g, '0day', 0, 9, 6, '#fdf4ff', 800);
  g.restore();
  if (Math.floor(t * 6) % 7 === 0 || atk > 0.5) {
    g.fillStyle = 'rgba(34,211,238,0.75)';
    g.fillRect(-14, cy - 6, 32, 3);
    g.fillStyle = 'rgba(244,114,182,0.75)';
    g.fillRect(-20, cy + 6, 28, 3);
  }
};

/* ======================= SQL Injection: floating ======================= */

/** The chosen syringe, floating. */
const sqliFloat: Body2 = (g, a) => {
  const { t } = a;
  hoverPad(g, 18, 14, '#a3e635', t);
  g.translate(0, 2 + hover(t));
  syringeBarrel(g, a);
  face(g, -9, -24, 16, 9, '#d9f99d', t, 0.9, '#1a2e05');
};

/** A capsule full of injected code. */
const sqliCapsule: Body2 = (g, a) => {
  const { t, atk } = a;
  hoverPad(g, 18, 14, '#a3e635', t);
  g.translate(-atk * 6, -6 + hover(t));
  g.rotate(Math.sin(t * 1.5) * 0.06 - atk * 0.15);
  g.save();
  rr(g, -22, -10, 44, 20, 10);
  g.clip();
  g.fillStyle = '#ecfccb';
  g.fillRect(-22, -10, 22, 20);
  g.fillStyle = '#84cc16';
  g.fillRect(0, -10, 22, 20);
  g.restore();
  rr(g, -22, -10, 44, 20, 10);
  g.lineWidth = 1.5;
  g.strokeStyle = '#4d7c0f';
  g.stroke();
  face(g, -17, -5, 14, 10, '#4d7c0f', t, 0.3, '#1a2e05');
  txt(g, "'OR", 11, -3, 6, '#1a2e05', 800);
  txt(g, '1=1', 11, 4, 6, '#1a2e05', 800);
};

/** A giant quote mark (the key character of SQL injection) with a "--" tail. */
const sqliQuote: Body2 = (g, a) => {
  const { t, atk } = a;
  hoverPad(g, 18, 12, '#a3e635', t);
  g.translate(-atk * 6, -6 + hover(t));
  // tail "--" trailing behind
  g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6);
  txt(g, '--', 18, 8, 12, '#a3e635', 900);
  g.globalAlpha = 1;
  g.beginPath();
  g.arc(0, -8, 12, Math.PI * 0.85, Math.PI * 2.35);
  g.quadraticCurveTo(4, 8, -6, 16);
  g.quadraticCurveTo(-4, 6, -11, -3);
  g.closePath();
  paint(g, '#84cc16', '#d9f99d', 1.8);
  face(g, -9, -13, 17, 9, '#d9f99d', t, 0.6, '#1a2e05');
};

/* ======================= Slowloris: no legs ======================= */

const slowUnicycle: Body2 = (g, a) => {
  const { t, atk } = a;
  wheel(g, 0, 25, 7, t, '#1f2937', '#7dd3fc', 0.8);
  line(g, -5, 14, -1, 25, '#7dd3fc', 2);
  line(g, 5, 14, 1, 25, '#7dd3fc', 2);
  g.save();
  g.rotate(Math.sin(t * 1.2) * 0.05);
  rr(g, -3, -33, 6, 5, 1);
  paint(g, '#7dd3fc');
  rr(g, -6, -35, 12, 3, 1);
  paint(g, '#7dd3fc');
  circ(g, 0, -12, 17);
  paint(g, '#0c4a6e', '#7dd3fc', 2);
  circ(g, 0, -12, 13);
  paint(g, '#082f49');
  face(g, -8, -21, 16, 7, '#bae6fd', t, 0.7, '#082f49');
  const ang = t * 0.5 - Math.PI / 2 + atk * 0.4;
  line(g, 0, -12, Math.cos(ang) * 10, -12 + Math.sin(ang) * 10, '#bae6fd', 2);
  circ(g, 0, -12, 1.8);
  paint(g, '#bae6fd');
  band(g, -22, 4, 44, 'keep-alive', 6);
  g.restore();
};

const slowFloatBar: Body2 = (g, a) => {
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
  band(g, -18, 11, 36, 'cargando', 6);
};

const slowStripWheels: Body2 = (g, a) => {
  const { t, atk } = a;
  for (const x of [-14, 0, 14]) wheel(g, x, 26, 6, t, '#1f2937', '#7dd3fc', 0.8);
  for (let i = 0; i < 3; i++) {
    const x = 0 + i * 9;
    const sway = Math.sin(t * 1.5 + i) * 2 + atk * 2;
    g.strokeStyle = '#334155';
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(x, -12);
    g.quadraticCurveTo(x + 4, -24 - i * 3, x + 14 + sway, -26 - i * 2);
    g.stroke();
    rr(g, x + 13 + sway, -29 - i * 2, 5, 5, 1);
    paint(g, '#7dd3fc');
    rr(g, x - 3, -13, 6, 7, 1);
    paint(g, '#cbd5e1');
  }
  rr(g, -24, -6, 48, 26, 5);
  paint(g, '#0c4a6e', '#7dd3fc', 1.5);
  face(g, -21, -3, 17, 9, '#bae6fd', t, 0.3);
  band(g, -22, 7, 44, 'keep-alive', 6);
};

/* ======================= Exports ======================= */

export const R4 = {
  ddosRed,
  scraperTreads,
  scraperTall,
  botnetWheels,
  botletWheels,
  ransomFloat,
  bf: { A: { name: 'Desbordado, con faros', body: bfOverflow }, B: { name: 'Cartel -70% en poste', body: bfSign }, C: { name: 'Montaña de paquetes', body: bfBoxes } },
  zeroDay: { A: { name: 'Cubo glitch flotante', body: zeroFloat }, B: { name: 'Se teletransporta', body: zeroTeleport }, C: { name: 'Rombo glitch', body: zeroDiamond } },
  sqli: { A: { name: 'Tu jeringa, flotando', body: sqliFloat }, B: { name: 'Cápsula de código', body: sqliCapsule }, C: { name: "Comilla ' con cola --", body: sqliQuote } },
  slowloris: { A: { name: 'Cronómetro en una rueda', body: slowUnicycle }, B: { name: 'Barra flotante', body: slowFloatBar }, C: { name: 'Regleta sobre ruedas', body: slowStripWheels } },
} as const;
