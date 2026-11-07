import { circ, legs, line, padlock, paint, rr, TAU, txt, type G } from './avatarOptions';
import { antenna, face, wheel, zeroGlitch, type Anim2, type Body2 } from './round2Options';

/*
 * Round 3 avatars: variants of the round 2 picks with a shared trait per family,
 * plus new options for Memory Leak and Slowloris.
 * Families: Tráfico (blue request band), Bots (antenna with red LED, orange),
 * Exploits (small code window "</>"), Fallos internos (purple).
 */

/* ---------------- Family traits ---------------- */

/** Tráfico: blue "request" band with a label. */
export function band(g: G, x: number, y: number, w: number, label: string, size = 7): void {
  rr(g, x, y, w, 11, 5.5);
  paint(g, '#0369a1', '#7dd3fc', 1);
  txt(g, label, x + w / 2, y + 5.8, size, '#ffffff', 800);
}

/** Exploits: small code window with LED eyes and "</>". */
export function codeWin(g: G, x: number, y: number, w: number, h: number, accent: string, led: string, t: number, seed = 0): void {
  rr(g, x, y, w, h, 3);
  paint(g, '#0b1020', accent, 1.2);
  g.fillStyle = accent;
  g.fillRect(x + 1.5, y + 1.5, w - 3, 2.5);
  const blink = (t + seed) % 3.4 < 0.12;
  const eh = blink ? 1.2 : h - 10;
  const ey = y + 5 + (h - 10 - eh) / 2 + 1;
  g.fillStyle = led;
  rr(g, x + 3.5, ey, 3, eh, 1);
  g.fill();
  rr(g, x + 8.5, ey, 3, eh, 1);
  g.fill();
  txt(g, '</>', x + w - 7.5, y + 3.5 + (h - 3.5) / 2, 6, accent, 800);
}

/** Bots: antenna with a red LED. */
export function botAntenna(g: G, x: number, y: number, len: number, t: number): void {
  antenna(g, x, y, len, '#fdba74', '#ef4444', t);
}

/** Mini "Tráfico Normal" (used by the DDoS swarm and the Black Friday cart). */
export function miniReq(g: G, x: number, y: number, s: number, t: number, seed: number): void {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  const st = Math.sin(t * 10 + seed);
  g.fillStyle = '#334155';
  g.fillRect(-7 + st * 2, 5, 4, 6);
  g.fillRect(3 - st * 2, 5, 4, 6);
  rr(g, -10, -12, 20, 18, 4);
  paint(g, '#475569', '#cbd5e1', 1);
  face(g, -8, -10, 14, 7, '#7dd3fc', t, seed);
  rr(g, -10, 0, 20, 5, 2.5);
  paint(g, '#0369a1');
  g.restore();
}

/* ======================= Tráfico Normal ======================= */

function normalBody(g: G, a: Anim2, shape: 'packet' | 'box', withBand: boolean): void {
  const { w, h, t, atk } = a;
  legs(g, a, '#334155', 9, 12, 7);
  rr(g, -w / 2 - 6 - atk * 6, 2, 9, 6, 3);
  paint(g, '#64748b', '#cbd5e1', 1);
  antenna(g, 7, -h / 2, 6, '#94a3b8', '#7dd3fc', t);
  const top = -h / 2;
  const bot = h / 2 - 10;
  const mid = (top + bot) / 2;
  if (shape === 'packet') {
    // arrow-shaped packet: pointed nose in front, notched tail behind
    g.beginPath();
    g.moveTo(-w / 2 - 6, mid);
    g.lineTo(-w / 2 + 6, top);
    g.lineTo(w / 2 + 4, top);
    g.lineTo(w / 2 - 4, mid);
    g.lineTo(w / 2 + 4, bot);
    g.lineTo(-w / 2 + 6, bot);
    g.closePath();
    paint(g, '#475569', '#cbd5e1', 1.5);
  } else {
    rr(g, -w / 2, top, w, h - 10, 9);
    paint(g, '#475569', '#cbd5e1', 1.5);
  }
  face(g, -17, top + 6, 30, 16, '#7dd3fc', t, 0.4);
  if (withBand) band(g, -w / 2, -1, w, 'GET /', 8);
  else {
    rr(g, -16, -1, 32, 12, 6);
    paint(g, '#1e293b');
    txt(g, 'GET /', 0, 5, 8, '#e2e8f0');
  }
}
const normalPacket: Body2 = (g, a) => normalBody(g, a, 'packet', false);
const normalBand: Body2 = (g, a) => normalBody(g, a, 'box', true);

/* ======================= Scraper Bot ======================= */

function spiderLegs(g: G, t: number, atk: number, h: number, n: number, from: number, gap: number, lw: number): void {
  for (let i = 0; i < n; i++) {
    const hx = from + i * gap;
    const k = Math.sin(t * 10 + i * 1.7) * (atk ? 1.5 : 3.5);
    line(g, hx, 8, hx - 5 + k, 20, '#fdba74', lw);
    line(g, hx - 5 + k, 20, hx - 8 + k, h / 2, '#fdba74', lw);
    circ(g, hx - 5 + k, 20, lw * 0.8);
    paint(g, '#9a3412');
  }
}

const scraperLens: Body2 = (g, a) => {
  const { h, t, atk } = a;
  const lx = -36 + Math.sin(t * 2.5) * 3;
  const ly = -12 + Math.cos(t * 2.5) * 2;
  g.fillStyle = `rgba(253,224,71,${0.2 + 0.15 * atk})`;
  g.beginPath();
  g.moveTo(lx, ly);
  g.lineTo(-62, h / 2);
  g.lineTo(-34, h / 2);
  g.closePath();
  g.fill();
  spiderLegs(g, t, atk, h, 4, -15, 10, 2.5);
  botAntenna(g, 8, -h / 2 + 4, 7, t);
  rr(g, -25, -h / 2 + 4, 50, 40, 12);
  paint(g, '#9a3412', '#fdba74', 1.5);
  face(g, -19, -h / 2 + 10, 28, 13, '#fde047', t, 0.2, '#1c1917');
  txt(g, 'BOT', 0, 0, 10, '#ffedd5');
  txt(g, '</>', 0, 9, 7, '#fdba74');
  // arm holding the magnifying glass
  line(g, -22, -2, lx + 6, ly + 6, '#fdba74', 2.5);
  circ(g, lx, ly, 8);
  paint(g, 'rgba(186,230,253,0.3)', '#fdba74', 2.5);
};

const scraperCompact: Body2 = (g, a) => {
  const { h, t, atk } = a;
  const eyeX = -13 + ((Math.sin(t * 3) + 1) / 2) * 16;
  g.fillStyle = `rgba(253,224,71,${0.2 + 0.15 * atk})`;
  g.beginPath();
  g.moveTo(eyeX, -6);
  g.lineTo(-54, h / 2);
  g.lineTo(-28, h / 2);
  g.closePath();
  g.fill();
  spiderLegs(g, t, atk, h, 6, -16, 6.4, 1.6);
  botAntenna(g, 6, -h / 2 + 12, 7, t);
  rr(g, -20, -h / 2 + 12, 40, 30, 10);
  paint(g, '#9a3412', '#fdba74', 1.5);
  rr(g, -16, -h / 2 + 18, 32, 10, 5);
  paint(g, '#1c1917');
  rr(g, eyeX, -h / 2 + 20, 8, 6, 3);
  paint(g, '#fde047');
  txt(g, 'BOT', 0, 5, 8, '#ffedd5');
};

/* ======================= Botnet ======================= */

export function camera(g: G, x: number, y: number, red: string, withAntenna: boolean, t: number): void {
  if (withAntenna) botAntenna(g, x + 4, y - 6, 6, t);
  rr(g, x - 11, y - 6, 22, 13, 3);
  paint(g, '#e5e7eb', '#94a3b8', 1);
  if (withAntenna) {
    g.fillStyle = '#f59e0b';
    g.fillRect(x - 10, y + 4, 20, 2);
  }
  circ(g, x - 7, y + 0.5, 4.5);
  paint(g, '#111827');
  circ(g, x - 7, y + 0.5, 1.8);
  paint(g, red);
}
export function router(g: G, x: number, y: number, red: string, withAntenna: boolean, t: number): void {
  if (withAntenna) {
    botAntenna(g, x - 7, y - 5, 7, t);
    botAntenna(g, x + 5, y - 5, 7, t + 0.5);
  } else {
    line(g, x - 7, y - 5, x - 10, y - 13, '#64748b', 1.5);
    line(g, x + 7, y - 5, x + 10, y - 13, '#64748b', 1.5);
  }
  rr(g, x - 12, y - 5, 24, 10, 2);
  paint(g, '#1f2937', withAntenna ? '#f59e0b' : '#64748b', 1);
  for (let i = 0; i < 3; i++) {
    circ(g, x - 6 + i * 6, y, 1.5);
    paint(g, red);
  }
}
export function fridge(g: G, a: Anim2, red: string, withAntenna: boolean, t: number, wheels = false): void {
  if (wheels) {
    wheel(g, -5, 25.5, 3.5, t, '#1f2937', '#94a3b8', 6);
    wheel(g, 5, 25.5, 3.5, t, '#1f2937', '#94a3b8', 6);
  } else legs(g, a, '#334155', 5, 6, 4);
  if (withAntenna) botAntenna(g, 4, 0, 6, t + 1);
  rr(g, -9, 0, 18, 23, 3);
  paint(g, '#f1f5f9', '#94a3b8', 1);
  line(g, -9, 9, 9, 9, withAntenna ? '#f59e0b' : '#94a3b8', withAntenna ? 2 : 1);
  line(g, 6, 3, 6, 7, '#64748b', 1.5);
  rr(g, -7, 12, 14, 7, 2);
  paint(g, '#0b1224');
  circ(g, -3.5, 15.5, 1.6);
  paint(g, red);
  circ(g, 1.5, 15.5, 1.6);
  paint(g, red);
}
export function packetsOn(g: G, pts: [number, number][], t: number, speed: number, closed: boolean): void {
  g.strokeStyle = 'rgba(245,158,11,0.45)';
  g.lineWidth = 1.2;
  const links = closed ? pts.length : pts.length - 1;
  g.beginPath();
  for (let i = 0; i < links; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
  }
  g.stroke();
  for (let i = 0; i < links; i++) {
    const p = (t * speed + i / links) % 1;
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    g.fillStyle = '#fbbf24';
    g.fillRect(x1 + (x2 - x1) * p - 1.5, y1 + (y2 - y1) * p - 1.5, 3, 3);
  }
}

/** Devices hanging from a central cloud (the "command server"). */
export function botnetCloudDraw(g: G, a: Anim2, wheels: boolean): void {
  const { t, atk } = a;
  const red = `rgba(239,68,68,${0.75 + 0.25 * Math.sin(t * 5)})`;
  const cy = -24 + Math.sin(t * 2) * 1.5;
  const cam: [number, number] = [-22 - atk * 3, -2 + Math.sin(t * 4) * 1.2];
  const rou: [number, number] = [22 - atk * 3, -3 + Math.sin(t * 4 + 2) * 1.2];
  // links from the cloud to each device
  for (const [x, y] of [cam, rou, [0, 4]] as [number, number][]) packetsOn(g, [[2, cy + 6], [x, y]], t, 0.8 + atk, false);
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
  camera(g, cam[0], cam[1], red, false, t);
  router(g, rou[0], rou[1], red, false, t);
  fridge(g, a, red, false, t, wheels);
}
const botnetCloud: Body2 = (g, a) => botnetCloudDraw(g, a, false);

/** Same group as round 2, but every device has the family antenna and an orange stripe. */
const botnetFamily: Body2 = (g, a) => {
  const { t, atk } = a;
  const red = `rgba(239,68,68,${0.75 + 0.25 * Math.sin(t * 5)})`;
  const cam: [number, number] = [-20 - atk * 3, -14 + Math.sin(t * 4) * 1.5];
  const rou: [number, number] = [19 - atk * 3, -15 + Math.sin(t * 4 + 2) * 1.5];
  packetsOn(g, [cam, rou, [0, 12]], t, 0.7 + atk, true);
  line(g, cam[0] + 1, cam[1] + 6, cam[0] + 1, cam[1] + 14, '#94a3b8', 2);
  camera(g, cam[0], cam[1], red, true, t);
  router(g, rou[0], rou[1], red, true, t);
  fridge(g, a, red, true, t);
};

const botletFamily: Body2 = (g, a) => {
  const { w, h, t } = a;
  legs(g, a, '#334155', 5, 7, 4);
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

/* ======================= Black Friday ======================= */

function cart(g: G, a: Anim2, opts: { cargo: 'requests' | 'boxes'; bigMonitor: boolean }): void {
  const { t, atk } = a;
  g.translate(-atk * 8, 0);
  line(g, -32, 30, -32, 46, '#facc15', 3);
  line(g, 24, 30, 24, 46, '#facc15', 3);
  wheel(g, -32, 52, 8, t, '#111827', '#facc15');
  wheel(g, 24, 52, 8, t, '#111827', '#facc15');
  line(g, 40, -20, 52, -40, '#facc15', 3.5);
  line(g, 48, -40, 56, -40, '#facc15', 4);
  const angry = atk > 0.5 ? '#ef4444' : '#facc15';
  if (opts.bigMonitor) {
    rr(g, -42, -66, 60, 46, 7);
    paint(g, '#374151', '#facc15', 2);
    face(g, -36, -60, 48, 20, angry, t, 0.7);
    rr(g, -36, -37, 48, 13, 3);
    paint(g, '#dc2626');
    txt(g, '-70%', -12, -30, 10, '#ffffff', 900);
  } else {
    rr(g, -32, -56, 46, 32, 6);
    paint(g, '#374151', '#facc15', 2);
    face(g, -27, -51, 36, 22, angry, t, 0.7);
  }
  if (opts.cargo === 'requests') {
    miniReq(g, -40, -27 + Math.sin(t * 6) * 1, 0.95, t, 0.3);
    miniReq(g, 25, -29 + Math.sin(t * 6 + 1) * 1, 0.95, t, 1.1);
    miniReq(g, 33, -44 + Math.sin(t * 6 + 2) * 1, 0.85, t, 2.2);
  } else {
    rr(g, 20, -38, 18, 18, 2);
    paint(g, '#a16207', '#facc15', 1);
    line(g, 29, -38, 29, -20, '#fde68a', 1.5);
  }
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
  // family band on the basket
  if (opts.bigMonitor) band(g, -40, 10, 70, 'BLACK FRIDAY', 7);
  else band(g, -38, 10, 66, '-70%', 8);
}
const bfRequests: Body2 = (g, a) => cart(g, a, { cargo: 'requests', bigMonitor: false });
const bfBigScreen: Body2 = (g, a) => cart(g, a, { cargo: 'boxes', bigMonitor: true });

/* ======================= DDoS ======================= */

const FORMATION: [number, number, number][] = [
  [30, -16, 0.6], [26, 14, 0.65], [16, -2, 0.75], [2, -22, 0.8], [2, 16, 0.85], [-18, -4, 1.05],
];

/** A swarm of mini "Tráfico Normal": DDoS is "a lot of normal traffic at once". */
const ddosMinis: Body2 = (g, a) => {
  const { t, atk } = a;
  FORMATION.forEach(([x, y, s], i) => {
    miniReq(g, x - atk * (4 + i * 1.5), y + Math.sin(t * 5 + i) * 2, s, t + i * 0.37, i * 0.7);
  });
  band(g, -16, 26, 32, 'x10⁶', 7);
};

/** Arrows with a bigger leader that has a face. */
const ddosLeader: Body2 = (g, a) => {
  const { t, atk } = a;
  const arrows: [number, number, number][] = [[34, -16, 6], [28, 14, 7], [22, -28, 6], [16, -4, 9], [6, 12, 9], [4, -20, 9]];
  const arrow = (x: number, y: number, s: number, fill: string): void => {
    g.beginPath();
    g.moveTo(x - s, y);
    g.lineTo(x + s * 0.7, y - s * 0.75);
    g.lineTo(x + s * 0.25, y);
    g.lineTo(x + s * 0.7, y + s * 0.75);
    g.closePath();
    paint(g, fill, '#450a0a', 1.2);
  };
  arrows.forEach(([x, y, s], i) => arrow(x - atk * (4 + i * 1.2), y + Math.sin(t * 5 + i) * 2, s, i % 2 ? '#dc2626' : '#b91c1c'));
  const lx = -18 - atk * 12;
  const ly = -2 + Math.sin(t * 5 + 6) * 2;
  arrow(lx, ly, 21, '#ef4444');
  face(g, lx - 6, ly - 5, 14, 10, '#fecaca', t, 0.5, '#1c0606');
  band(g, -16, 26, 32, 'x10⁶', 7);
};

/* ======================= Zero-Day ======================= */

const zeroCode: Body2 = (g, a) => {
  const { h, t, atk } = a;
  legs(g, a, '#701a75', 8, 11, 6);
  rr(g, -19, -h / 2 + 2, 38, 40, 6);
  paint(g, '#a21caf', '#f5d0fe', 1.5);
  codeWin(g, -15, -h / 2 + 6, 30, 17, '#f0abfc', '#f5d0fe', t, 0.2);
  txt(g, '0day', 0, 6, 8, '#fdf4ff', 800);
  if (Math.floor(t * 6) % 7 === 0 || atk > 0.5) {
    g.fillStyle = 'rgba(34,211,238,0.75)';
    g.fillRect(-16, -2, 38, 3.5);
    g.fillStyle = 'rgba(244,114,182,0.75)';
    g.fillRect(-24, 10, 36, 3);
  }
};

/** The glitch cube hops: it jumps over the first defense in the game. */
const zeroJump: Body2 = (g, a) => {
  const { h, t, atk } = a;
  const k = (t * 1.3) % 1;
  const hop = atk ? 0 : Math.sin(k * Math.PI) * 16;
  const land = atk ? 0 : Math.max(0, 1 - k / 0.12) * 0.12;
  // a short dotted trail of the jump arc
  if (!atk) {
    for (let i = 1; i <= 3; i++) {
      const kk = k - i * 0.07;
      if (kk < 0) continue;
      g.fillStyle = `rgba(232,121,249,${0.5 - i * 0.12})`;
      g.fillRect(8 + i * 6, -Math.sin(kk * Math.PI) * 16 - 4, 3, 3);
    }
  }
  g.translate(0, -hop);
  g.translate(0, h / 2);
  g.scale(1 + land, 1 - land);
  g.translate(0, -h / 2);
  zeroGlitch(g, { ...a, step: hop > 1 ? 0 : a.step });
};

/* ======================= SQL Injection ======================= */

export function syringeBarrel(g: G, a: Anim2): void {
  const { atk } = a;
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
}

const sqliCode: Body2 = (g, a) => {
  legs(g, a, '#3f6212', 7, 14, 6);
  syringeBarrel(g, a);
  codeWin(g, -12, -31, 26, 16, '#a3e635', '#d9f99d', a.t, 0.9);
};

/** Upright syringe that walks; the needle points forward like a lance. */
const sqliUpright: Body2 = (g, a) => {
  const { t, atk } = a;
  legs(g, a, '#3f6212', 6, 12, 6);
  const push = atk * 6;
  // plunger on top
  line(g, 0, -20, 0, -27 + push, '#94a3b8', 3);
  rr(g, -8, -30 + push, 16, 3, 1);
  paint(g, '#94a3b8');
  // needle forward
  line(g, -12, 4, -27 - atk * 7, 4, '#cbd5e1', 2);
  rr(g, -13, 1, 3, 6, 1);
  paint(g, '#94a3b8');
  rr(g, -10, -20, 20, 36, 4);
  paint(g, 'rgba(236,252,203,0.95)', '#4d7c0f', 1.5);
  rr(g, -9, -4 + push, 18, 19 - push, 3);
  paint(g, '#84cc16');
  face(g, -7, -16, 14, 8, '#d9f99d', t, 0.6, '#1a2e05');
  txt(g, 'OR', 0, 3 + push / 2, 6, '#1a2e05', 800);
  txt(g, '1=1', 0, 10 + push / 4, 6, '#1a2e05', 800);
  for (const y of [-6, 0, 6]) line(g, 7, y, 10, y, '#4d7c0f', 1);
};

/* ======================= Ransomware ======================= */

export function filePage(g: G, x: number, y: number, fill: string): void {
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
export function chain(g: G, x1: number, y1: number, x2: number, y2: number, links: number): void {
  for (let i = 0; i < links; i++) {
    const k = i / (links - 1);
    g.strokeStyle = '#64748b';
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, i % 2 ? 2.2 : 4, i % 2 ? 4 : 2.2, 0.5, 0, TAU);
    g.stroke();
  }
}

const ransomCode: Body2 = (g, a) => {
  const { t } = a;
  legs(g, a, '#334155', 8, 12, 6);
  filePage(g, 0, 0, '#f1f5f9');
  codeWin(g, -13, -23, 22, 14, '#f87171', '#fecaca', t, 0.5);
  for (const y of [-4, 2, 8]) line(g, -11, y, 10, y, '#cbd5e1', 1.5);
  chain(g, -20, -8, 20, 14, 6);
  padlock(g, 2, 3, 0.55);
};

export const ransomStack: Body2 = (g, a) => {
  const { t } = a;
  legs(g, a, '#334155', 8, 12, 6);
  filePage(g, 8, -6, '#94a3b8');
  filePage(g, 4, -3, '#cbd5e1');
  filePage(g, 0, 0, '#f1f5f9');
  face(g, -12, -22, 18, 9, '#f87171', t, 0.5, '#1c0606');
  for (const y of [-8, -2, 4, 10]) line(g, -11, y, 10, y, '#cbd5e1', 1.5);
  chain(g, -22, -14, 26, 10, 8);
  padlock(g, 2, -1, 0.6);
};

/* ======================= Memory Leak (40×44 box, scaled while it grows) ======================= */

function leakBox(g: G, a: Anim2): Anim2 {
  g.scale(a.w / 40, a.h / 44);
  return { ...a, w: 40, h: 44 };
}

/** A memory chip that heats up. */
const leakChip: Body2 = (g, a0) => {
  const a = leakBox(g, a0);
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

/** A RAM gauge with the needle in the red. */
const leakGauge: Body2 = (g, a0) => {
  const a = leakBox(g, a0);
  const { t } = a;
  legs(g, a, '#3b0764', 8, 8, 5);
  g.beginPath();
  g.arc(0, -4, 17, Math.PI, TAU);
  g.closePath();
  paint(g, '#1e1b2e', '#d8b4fe', 1.5);
  g.strokeStyle = '#ef4444';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(0, -4, 14, Math.PI * 1.7, TAU);
  g.stroke();
  const v = 0.82 + 0.13 * Math.sin(t * 2.5);
  const ang = Math.PI + v * Math.PI;
  line(g, 0, -4, Math.cos(ang) * 12, -4 + Math.sin(ang) * 12, '#fecaca', 2);
  circ(g, 0, -4, 2);
  paint(g, '#fecaca');
  txt(g, 'RAM', 0, -12, 5, '#d8b4fe', 800);
  rr(g, -17, -4, 34, 18, 4);
  paint(g, '#6b21a8', '#d8b4fe', 1.5);
  face(g, -12, 0, 24, 9, '#e9d5ff', t, 0.8, '#1e1b2e');
};

/** A pile of memory blocks that keeps getting taller. */
const leakStack: Body2 = (g, a0) => {
  const a = leakBox(g, a0);
  const { t } = a;
  legs(g, a, '#3b0764', 8, 9, 5);
  const p = (t * 0.4) % 1;
  const n = 1 + Math.floor(p * 3);
  for (let i = 0; i < n; i++) {
    const y = 13 - (i + 1) * 8;
    const pop = i === n - 1 ? Math.min(1, ((p * 3) % 1) * 4) : 1;
    g.save();
    g.translate(0, y + 4);
    g.scale(pop, pop);
    rr(g, -15, -4, 30, 7.5, 2);
    paint(g, i % 2 ? '#7e22ce' : '#6b21a8', '#d8b4fe', 1.2);
    for (let j = 0; j < 4; j++) {
      g.fillStyle = '#1e1b2e';
      g.fillRect(-12 + j * 7, -2.2, 5, 4);
    }
    g.restore();
  }
  const top = 13 - n * 8 - 12;
  rr(g, -15, top, 30, 11, 3);
  paint(g, '#1e1b2e', '#d8b4fe', 1.2);
  face(g, -12, top + 2, 24, 7, '#e9d5ff', t, 0.1, '#1e1b2e');
};

/* ======================= Slowloris (Tráfico family: blue band) ======================= */

/** A power strip with every socket taken: it holds the connections open. */
const slowStrip: Body2 = (g, a) => {
  const { t, atk } = a;
  legs(g, { ...a, step: Math.sin(t * 3) }, '#0c4a6e', 10, 12, 6);
  // cables held open, swaying slowly backward
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

/** A progress bar on legs that barely moves. */
const slowBar: Body2 = (g, a) => {
  const { t } = a;
  legs(g, { ...a, step: Math.sin(t * 3) }, '#0c4a6e', 12, 12, 6);
  rr(g, -26, -12, 52, 22, 11);
  paint(g, '#0c4a6e', '#7dd3fc', 1.5);
  face(g, -23, -8, 14, 14, '#bae6fd', t, 0.4);
  rr(g, -6, -5, 28, 8, 4);
  paint(g, '#082f49');
  rr(g, -6, -5, 3 + ((t * 0.04) % 1) * 4, 8, 4);
  paint(g, '#38bdf8');
  txt(g, '2%', 8, -16, 6, '#bae6fd', 800);
  band(g, -18, 9, 36, 'cargando', 6);
};

/** A stopwatch: "keep-alive" forever. */
const slowWatch: Body2 = (g, a) => {
  const { t, atk } = a;
  legs(g, { ...a, step: Math.sin(t * 3) }, '#0c4a6e', 8, 10, 6);
  rr(g, -3, -29, 6, 5, 1);
  paint(g, '#7dd3fc');
  rr(g, -6, -31, 12, 3, 1);
  paint(g, '#7dd3fc');
  circ(g, 0, -6, 18);
  paint(g, '#0c4a6e', '#7dd3fc', 2);
  circ(g, 0, -6, 14);
  paint(g, '#082f49');
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * TAU;
    line(g, Math.cos(ang) * 11, -6 + Math.sin(ang) * 11, Math.cos(ang) * 13, -6 + Math.sin(ang) * 13, '#7dd3fc', 1.5);
  }
  face(g, -8, -15, 16, 7, '#bae6fd', t, 0.7, '#082f49');
  const ang = t * 0.5 - Math.PI / 2 + atk * 0.4;
  line(g, 0, -6, Math.cos(ang) * 10, -6 + Math.sin(ang) * 10, '#bae6fd', 2);
  circ(g, 0, -6, 1.8);
  paint(g, '#bae6fd');
  band(g, -22, 12, 44, 'keep-alive', 6);
};

/* ======================= Exports ======================= */

/** Variants of the round 2 picks (v1, v2). */
export const VARIANTS = {
  normal: { v1: { name: 'Paquete con flecha', body: normalPacket }, v2: { name: 'Con banda de la familia', body: normalBand } },
  scraper: { v1: { name: 'Con lupa', body: scraperLens }, v2: { name: 'Compacto, 6 patas', body: scraperCompact } },
  botnet: { v1: { name: 'Nube central', body: botnetCloud }, v2: { name: 'Antenas de la familia', body: botnetFamily } },
  blackFriday: { v1: { name: 'Lleno de peticiones', body: bfRequests }, v2: { name: 'Monitor grande -70%', body: bfBigScreen } },
  ddos: { v1: { name: 'Enjambre de mini peticiones', body: ddosMinis }, v2: { name: 'Flecha líder con cara', body: ddosLeader } },
  zeroDay: { v1: { name: 'Con ventana </>', body: zeroCode }, v2: { name: 'Cubo que salta', body: zeroJump } },
  sqli: { v1: { name: 'Con ventana </>', body: sqliCode }, v2: { name: 'Jeringa de pie', body: sqliUpright } },
  ransomware: { v1: { name: 'Con ventana </>', body: ransomCode }, v2: { name: 'Archivos apilados', body: ransomStack } },
} as const;
export const BOTLET_FAMILY: Body2 = botletFamily;

/** New options for the threats with no pick in round 2. */
export const NEW_R3 = {
  memoryLeak: {
    A: { name: 'Chip que se calienta', body: leakChip },
    B: { name: 'Medidor de RAM', body: leakGauge },
    C: { name: 'Pila de bloques', body: leakStack },
  },
  slowloris: {
    A: { name: 'Regleta llena', body: slowStrip },
    B: { name: 'Barra de progreso', body: slowBar },
    C: { name: 'Cronómetro keep-alive', body: slowWatch },
  },
} as const;
