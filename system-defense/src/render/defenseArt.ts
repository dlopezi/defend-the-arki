import type { DefenseType } from '../config';
import { circ, line, paint, rr, TAU, txt, type G } from './shapes';

/*
 * Defense avatars chosen by the user on the avatar picker page (defense rounds 1–3).
 * Style: like the threats (flat, technological), but no faces. Each one shows a real-world
 * idea of the resource (HIT screen, req/s counter, failure counter, partitions, Ctrl + Z…).
 * Team trait: every defense stands on a dark base with a green "OK" LED.
 * v2 (upgraded) defenses add parts that show the upgrade, plus gold accents.
 *
 * Each body draws centered at (0, 0), about 70×70; the base top is y = 28.
 * The ground shadow and the overlays (½, padlock, flash) are drawn by drawDefense in sprites.ts.
 */

export interface DefenseAnim {
  t: number;
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
  level: 1 | 2;
}
export type DefenseBody = (g: G, a: DefenseAnim) => void;

const GOLD = '#facc15';
const led = (on: boolean): string => (on ? '#4ade80' : '#166534');

/* ---------------- Shared parts ---------------- */

/** Team trait: dark base plate with a green "OK" LED. */
function teamBase(g: G, w: number, t: number): void {
  rr(g, -w / 2, 28, w, 7, 3);
  paint(g, '#0f172a', '#334155', 1);
  circ(g, w / 2 - 6, 31.5, 1.8);
  paint(g, t % 2 < 1.6 ? '#4ade80' : '#166534');
}
function goldBand(g: G, x: number, y: number, w: number, h = 3): void {
  rr(g, x, y, w, h, h / 2);
  paint(g, GOLD);
}
/** Cracks on a wall when it loses hp. */
function cracks(g: G, hp: number, x: number, y: number, h: number, color: string): void {
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
const shake = (a: DefenseAnim): number => (a.kick > 0 ? Math.sin(a.t * 70) * 1.5 * a.kick : 0);

/** Red blink over an armed Circuit Breaker (faster as the fuse runs out). */
function armedBlink(g: G, a: DefenseAnim, x: number, y: number, w: number, h: number, r: number): void {
  if (a.fuse === undefined) return;
  const k = 1 - a.fuse;
  g.globalAlpha = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(a.t * (14 + k * 50)));
  rr(g, x, y, w, h, r);
  paint(g, '#ef4444');
  g.globalAlpha = 1;
}
/** Yellow and black warning stripes. */
function hazard(g: G, x: number, y: number, w: number, h: number, r: number): void {
  rr(g, x, y, w, h, r);
  g.save();
  paint(g, GOLD);
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
/** Nozzles on the right; muzzle around (38, -4). v2 has 2 (fires 2 packets). */
function nozzles(g: G, a: DefenseAnim, fill: string, rim: string): void {
  const v2 = a.level === 2;
  for (const y of v2 ? [-15, -3] : [-10]) {
    rr(g, 22 - a.kick * 4, y, 16, v2 ? 10 : 12, 3);
    paint(g, fill, v2 ? GOLD : rim, 1.5);
  }
}

/* ======================= Worker Node: CPU chip → server (v2) ======================= */

function chip(g: G, a: DefenseAnim): void {
  const cy = -6;
  const h = 22;
  for (let i = 0; i < 5; i++) {
    const o = -16 + i * 8;
    line(g, o, cy - h, o, cy - h - 5, '#94a3b8', 2);
    line(g, o, cy + h, o, cy + h + 5, '#94a3b8', 2);
    line(g, -h, cy + o, -h - 5, cy + o, '#94a3b8', 2);
    line(g, h, cy + o, h + 5, cy + o, '#94a3b8', 2);
  }
  rr(g, -h, cy - h, 2 * h, 2 * h, 5);
  paint(g, '#0f2a3d', '#38bdf8', 1.8);
  circ(g, -h + 5, cy - h + 5, 1.8);
  paint(g, '#38bdf8');
  g.lineWidth = 4;
  g.strokeStyle = '#081521';
  circ(g, 0, cy, 13);
  g.stroke();
  g.strokeStyle = '#fde047';
  g.beginPath();
  g.arc(0, cy, 13, -Math.PI / 2, -Math.PI / 2 + Math.max(0.05, a.charge) * TAU);
  g.stroke();
  txt(g, 'CPU', 0, cy, 8, '#e0f2fe', 800);
  // full charge: a quick flash
  if (a.charge > 0.92) {
    g.globalAlpha = ((a.charge - 0.92) / 0.08) * 0.5;
    rr(g, -h, cy - h, 2 * h, 2 * h, 5);
    paint(g, '#fde047');
    g.globalAlpha = 1;
  }
}

/** v2: a full server (the Worker the game had before), with its "v2" tag. */
function server(g: G, a: DefenseAnim): void {
  rr(g, -28, -36, 56, 70, 7);
  paint(g, '#0f2a3d', '#38bdf8', 2);
  for (let i = 0; i < 4; i++) {
    const sy = -28 + i * 13.5;
    rr(g, -21, sy, 42, 10, 2);
    paint(g, '#081521');
    g.fillStyle = '#1e4a66';
    g.fillRect(-17, sy + 3, 18, 2);
    g.fillRect(-17, sy + 6, 11, 1.5);
    circ(g, 14, sy + 5, 2.4);
    paint(g, Math.sin(a.t * 5 + i * 1.7) > -0.3 ? '#4ade80' : '#14532d');
  }
  rr(g, -21, 26, 42, 4, 2);
  paint(g, '#081521');
  rr(g, -21, 26, 42 * Math.max(0.02, a.charge), 4, 2);
  paint(g, '#fde047');
  rr(g, 12, -46, 22, 14, 4);
  paint(g, '#fde047');
  txt(g, 'v2', 23, -39, 9, '#422006');
}

const worker: DefenseBody = (g, a) => {
  if (a.level === 2) {
    server(g, a);
    return;
  }
  teamBase(g, 56, a.t);
  chip(g, a);
};

/* ======================= Load Balancer: one way in, 3 ways out ======================= */

const loadBalancer: DefenseBody = (g, a) => {
  const { t } = a;
  teamBase(g, 62, t);
  nozzles(g, a, '#1d4ed8', '#93c5fd');
  rr(g, -30, -32, 56, 60, 12);
  paint(g, '#0d2350', '#60a5fa', 2);
  if (a.level === 2) goldBand(g, -20, -29, 36);
  // traffic coming in from the left
  for (let i = 0; i < 3; i++) {
    const p = (t * 1.2 + i / 3) % 1;
    g.fillStyle = '#93c5fd';
    g.fillRect(-27 + p * 12, -6, 3, 3);
  }
  // round-robin: one output at a time
  const turn = Math.floor(t * 2.5) % 3;
  const outs: [number, number][] = [[12, -17], [12, -4], [12, 9]];
  outs.forEach(([x, y], i) => line(g, -12, -4, x, y, i === turn ? '#bfdbfe' : 'rgba(147,197,253,0.45)', i === turn ? 2.4 : 1.6));
  circ(g, -12, -4, 4.5);
  paint(g, '#93c5fd');
  outs.forEach(([x, y], i) => {
    circ(g, x, y, 3.4);
    paint(g, led(i === turn));
  });
  txt(g, 'LB', -2, 19, 10, '#bfdbfe', 900);
};

/* ======================= Redis Cache: disks + HIT screen ======================= */

const redis: DefenseBody = (g, a) => {
  const { t } = a;
  const v2 = a.level === 2;
  teamBase(g, 60, t);
  g.translate(shake(a), 0);
  for (let i = 0; i < 3; i++) {
    const cy = 14 - i * 17;
    g.fillStyle = '#991b1b';
    g.fillRect(-27, cy - 7, 54, 14);
    g.beginPath();
    g.ellipse(0, cy + 7, 27, 7, 0, 0, Math.PI);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.12)';
    g.fillRect(-21, cy - 5, 4, 11);
    if (v2) {
      // steel bands: double hp
      g.strokeStyle = '#cbd5e1';
      g.lineWidth = 2.5;
      g.beginPath();
      g.ellipse(0, cy + 3, 27, 7, 0, 0, Math.PI);
      g.stroke();
      circ(g, 0, cy + 10, 1.8);
      paint(g, GOLD);
    }
    g.beginPath();
    g.ellipse(0, cy - 7, 27, 7, 0, 0, TAU);
    paint(g, '#ef4444', i === 2 && v2 ? GOLD : '#fecaca', i === 2 && v2 ? 2 : 1);
  }
  rr(g, -19, -9, 38, 13, 3);
  paint(g, '#1c0505', '#fca5a5', 1);
  const hit = Math.floor(t * 1.5) % 2 === 1;
  txt(g, hit ? 'HIT ✓' : 'GET k1', 0, -2.5, 7, hit ? '#4ade80' : '#fecaca', 900);
  txt(g, 'redis', 0, 16, 9, '#fff1f2', 900);
  cracks(g, a.hp, -6, -26, 50, '#1f0505');
};

/* ======================= Rate Limiter: 100 req/s counter ======================= */

const rateLimiter: DefenseBody = (g, a) => {
  const { t, kick } = a;
  teamBase(g, 62, t);
  nozzles(g, a, '#6d28d9', '#c4b5fd');
  rr(g, -30, -32, 56, 60, 10);
  paint(g, '#2a0f5c', '#a78bfa', 2);
  if (a.level === 2) goldBand(g, -20, -29, 36);
  const full = kick > 0;
  rr(g, -14, -27, 26, 12, 3);
  paint(g, '#0b0618');
  txt(g, '429', -1, -21, 9, full ? '#f87171' : '#ddd6fe', 900);
  const n = full ? 100 : 60 + Math.floor((t * 22) % 40);
  rr(g, -24, -10, 44, 18, 3);
  paint(g, '#0b0618', '#a78bfa', 1);
  txt(g, `${n}/100`, -2, -1, 10, n >= 100 ? '#f87171' : '#e9d5ff', 900);
  rr(g, -24, 12, 44, 5, 2.5);
  paint(g, '#1e1b2e');
  rr(g, -24, 12, 44 * (n / 100), 5, 2.5);
  paint(g, n >= 100 ? '#f87171' : '#a78bfa');
  txt(g, 'req/s', -2, 23, 6, '#a78bfa', 800);
};

/* ======================= Circuit Breaker: switch panel + failure counter ======================= */

const circuitBreaker: DefenseBody = (g, a) => {
  const armed = a.fuse !== undefined;
  const k = armed ? 1 - (a.fuse ?? 0) : 0;
  teamBase(g, 60, a.t);
  rr(g, -28, -34, 56, 62, 5);
  paint(g, '#334155', GOLD, 2);
  hazard(g, -28, -34, 56, 9, 4);
  ['API', 'DB', 'PAGO'].forEach((lab, i) => {
    const x = -18 + i * 18;
    const tripped = armed && k > i / 3;
    txt(g, lab, x, -20, 5, '#cbd5e1', 800);
    rr(g, x - 6, -16, 12, 24, 2);
    paint(g, '#111827');
    rr(g, x - 5, tripped ? -3 : -15, 10, 10, 2);
    paint(g, tripped ? '#dc2626' : '#22c55e');
  });
  const fails = armed ? Math.min(3, 1 + Math.floor(k * 3)) : Math.floor(a.t * 0.7) % 2;
  rr(g, -22, 12, 44, 12, 3);
  paint(g, '#0b0b0b');
  for (let i = 0; i < 3; i++) txt(g, '✕', -14 + i * 9, 18, 8, i < fails ? '#f87171' : '#374151', 900);
  txt(g, `${fails}/3`, 15, 18, 7, fails >= 3 ? '#f87171' : '#e5e7eb', 900);
  armedBlink(g, a, -28, -34, 56, 62, 5);
};

/* ======================= WAF: filter layers + log ======================= */

const waf: DefenseBody = (g, a) => {
  const { t, kick } = a;
  const v2 = a.level === 2;
  teamBase(g, 60, t);
  g.translate(shake(a), 0);
  const n = v2 ? 4 : 3;
  const x0 = -22 - (n - 1) * 2.5;
  for (let i = 0; i < n; i++) {
    const front = i === n - 1;
    rr(g, x0 + i * 5, -36 + i * 3, 40, 64 - i * 3, 5);
    paint(g, front ? 'rgba(19,78,74,0.92)' : 'rgba(45,212,191,0.16)', front && v2 ? GOLD : '#2dd4bf', 1.5);
  }
  const cx = x0 + (n - 1) * 5 + 20;
  // shield
  const s = 0.7;
  const sy = -32;
  g.beginPath();
  g.moveTo(cx, sy);
  g.lineTo(cx + 12 * s, sy + 5 * s);
  g.lineTo(cx + 10 * s, sy + 20 * s);
  g.lineTo(cx, sy + 28 * s);
  g.lineTo(cx - 10 * s, sy + 20 * s);
  g.lineTo(cx - 12 * s, sy + 5 * s);
  g.closePath();
  paint(g, kick > 0.3 ? '#0f766e' : '#115e59', '#99f6e4', 1.8);
  txt(g, 'WAF', cx, -22, 6, '#f0fdfa', 900);
  // log of what passed and what was blocked
  rr(g, cx - 17, -8, 34, 28, 3);
  paint(g, '#042f2e', '#99f6e4', 1);
  const lines: [string, string][] = [
    ['✓ GET /', '#86efac'],
    ["✕ 'OR 1=1", '#fca5a5'],
    ['✕ <script>', '#fca5a5'],
  ];
  const off = Math.floor(t * 1.2) % 3;
  for (let i = 0; i < 3; i++) {
    const [str, c] = lines[(i + off) % 3];
    txt(g, str, cx, -2 + i * 8, 5.5, i === 2 && kick > 0.3 ? '#fde047' : c, 800);
  }
  cracks(g, a.hp, cx - 8, -30, 52, '#042f2e');
};

/* ======================= CDN Edge: globe + cache HIT ======================= */

const cdn: DefenseBody = (g, a) => {
  const { t, kick } = a;
  const v2 = a.level === 2;
  teamBase(g, 56, t);
  rr(g, -8, 18, 16, 10, 2);
  paint(g, '#500724', v2 ? GOLD : '#f472b6', 1);
  g.save();
  g.translate(0, -6);
  const [len, th] = v2 ? [22, 13] : [18, 10];
  for (const ang of [-0.55, 0, 0.55]) {
    g.save();
    g.rotate(ang);
    rr(g, 19 - kick * 3, -th / 2, len, th, 3);
    paint(g, '#be185d', v2 ? GOLD : '#fbcfe8', 1.5);
    g.restore();
  }
  circ(g, 0, 0, 24);
  paint(g, '#500724', '#f472b6', 2);
  g.strokeStyle = 'rgba(244,114,182,0.5)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.ellipse(0, 0, Math.abs(Math.sin(t * 1.5) * 8) + 4, 24, 0, 0, TAU);
  g.moveTo(-24, 0);
  g.lineTo(24, 0);
  g.stroke();
  g.restore();
  txt(g, 'CDN', 0, -6, 9, '#fce7f3', 900);
  const hit = Math.floor(t * 1.3) % 3 !== 2;
  rr(g, -26, 15, 20, 10, 2);
  paint(g, hit ? '#14532d' : '#7f1d1d', hit ? '#4ade80' : '#f87171', 1);
  txt(g, hit ? 'HIT' : 'MISS', -16, 20, 5.5, '#f0fdf4', 900);
};

/* ======================= Kafka: topic with partitions ======================= */

const kafka: DefenseBody = (g, a) => {
  const v2 = a.level === 2;
  teamBase(g, 78, a.t);
  const n = v2 ? 3 : 2;
  const h = 13;
  const top = 26 - n * (h + 2);
  for (let p = 0; p < n; p++) {
    const y = top + p * (h + 2);
    rr(g, -38, y, 76, h, 4);
    paint(g, '#431407', '#fb923c', 1.2);
    txt(g, `P${p}`, -32, y + h / 2, 6, '#fdba74', 900);
    // message slots: lit = ready; a light runs along them while holding a threat
    const segs = 6;
    const sw = (66 - 8 - (segs - 1) * 2) / segs;
    for (let i = 0; i < segs; i++) {
      const on = a.busy ? Math.floor(a.t * 8) % segs === i : i / segs < a.ready;
      rr(g, -24 + i * (sw + 2), y + 2, sw, h - 4, 2);
      paint(g, on ? '#fdba74' : '#7c2d12');
    }
  }
  const ty = top - 19;
  rr(g, -24, ty, 48, 14, 4);
  paint(g, '#7c2d12', v2 ? GOLD : '#fb923c', 1.2);
  txt(g, 'kafka', 0, ty + 7, 7, '#ffedd5', 900);
  if (v2) goldBand(g, -38, top - 4, 76);
};

export const DEFENSE_ART: Record<DefenseType, DefenseBody> = {
  worker,
  loadBalancer,
  redis,
  rateLimiter,
  circuitBreaker,
  waf,
  cdn,
  kafka,
};

/* ======================= Rollback: Ctrl + Z ======================= */

function keycap(g: G, x: number, y: number, w: number, h: number, label: string, size: number, pressed: number): void {
  rr(g, x, y + 3, w, h, 4);
  paint(g, '#03141a');
  rr(g, x, y + pressed, w, h, 4);
  paint(g, '#0e4f63', '#22d3ee', 1.5);
  rr(g, x + 3, y + 2 + pressed, w - 6, h - 7, 3);
  paint(g, '#13657d');
  txt(g, label, x + w / 2, y + h / 2 - 1.5 + pressed, size, '#a5f3fc', 900);
}

/** The Ctrl + Z keys; while sweeping they press down in turn and an "undo" arrow blinks. */
export function rollbackArt(g: G, running: boolean, t: number): void {
  const press = (i: number): number => (running ? Math.max(0, Math.sin(t * 14 + i * Math.PI)) * 2.5 : 0);
  keycap(g, -24, -11, 23, 21, 'Ctrl', 6, press(0));
  keycap(g, 1, -11, 23, 21, 'Z', 11, press(1));
  if (running) {
    g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 8);
    txt(g, '↶', 0, -20, 12, '#22d3ee', 900);
    g.globalAlpha = 1;
  }
}
