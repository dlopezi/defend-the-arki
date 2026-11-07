import { drawDefense } from '../render/sprites';
import { circ, line, paint, rr, TAU, txt, type G, type Pick } from './avatarOptions';
import { armedBlink, cracks, hazard, shake, teamBase, type DefAnim, type DefBody, type DefItem } from './defenseOptions';
import { GOLD, goldBand, isV2, led } from './defenseOptions2';

/*
 * Defense avatars, round 3 (from the comments on round 2):
 * - Each defense grows from the design the user liked (its "base"):
 *   Worker = round 1 C (CPU chip); LB, Redis, Rate Limiter, CDN, Kafka = the current game avatar;
 *   Circuit Breaker = round 2 A (switch panel); WAF = round 2 B (filter layers); Rollback = Ctrl + Z.
 * - No faces. Each option has a v2 (upgrade) look, and a real-world reference ("ref").
 * Same frame: centered at (0, 0), base top at y = 28.
 */

export interface DefOption {
  name: string;
  /** Real-world idea behind the drawing (shown on the card). */
  ref: string;
  body: DefBody;
}

/* ======================= Worker Node: CPU chip ======================= */

function chip(g: G, a: DefAnim, cores: 1 | 2, goldPins: boolean, topPins = true): void {
  const { charge } = a;
  const cy = -6;
  const h = 22;
  const pin = goldPins ? GOLD : '#94a3b8';
  for (let i = 0; i < 5; i++) {
    const o = -16 + i * 8;
    if (topPins) line(g, o, cy - h, o, cy - h - 5, pin, 2);
    line(g, o, cy + h, o, cy + h + 5, pin, 2);
    line(g, -h, cy + o, -h - 5, cy + o, pin, 2);
    line(g, h, cy + o, h + 5, cy + o, pin, 2);
  }
  rr(g, -h, cy - h, 2 * h, 2 * h, 5);
  paint(g, '#0f2a3d', '#38bdf8', 1.8);
  circ(g, -h + 5, cy - h + 5, 1.8);
  paint(g, '#38bdf8');
  const c = Math.max(0.05, charge);
  const rings: [number, number][] = cores === 1 ? [[0, 13]] : [[-9, 8], [9, 8]];
  rings.forEach(([x, r], i) => {
    g.lineWidth = cores === 1 ? 4 : 3;
    g.strokeStyle = '#081521';
    circ(g, x, cy, r);
    g.stroke();
    g.strokeStyle = '#fde047';
    g.beginPath();
    g.arc(x, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.min(1, c + i * 0.03) * TAU);
    g.stroke();
  });
  if (cores === 1) txt(g, 'CPU', 0, cy, 8, '#e0f2fe', 800);
  else {
    txt(g, 'C0', -9, cy, 6, '#e0f2fe', 800);
    txt(g, 'C1', 9, cy, 6, '#e0f2fe', 800);
    txt(g, 'CPU ×2', 0, cy + 15, 6, '#7dd3fc', 800);
  }
  // full charge: a quick flash
  if (charge > 0.92) {
    g.globalAlpha = (charge - 0.92) / 0.08 * 0.5;
    rr(g, -h, cy - h, 2 * h, 2 * h, 5);
    paint(g, '#fde047');
    g.globalAlpha = 1;
  }
}

const workerCores: DefBody = (g, a) => {
  teamBase(g, 56, a.t);
  chip(g, a, isV2(a) ? 2 : 1, isV2(a));
};

const workerHeatsink: DefBody = (g, a) => {
  const { t, action } = a;
  const v2 = isV2(a);
  teamBase(g, 56, t);
  if (v2) {
    // heat sink fins + small fan on top
    for (let i = 0; i < 6; i++) {
      rr(g, -18 + i * 7, -42, 4, 14, 1);
      paint(g, '#94a3b8', '#cbd5e1', 0.8);
    }
    g.save();
    g.translate(0, -35);
    circ(g, 0, 0, 7);
    paint(g, '#081521', '#38bdf8', 1);
    g.rotate(t * (action ? 18 : 8));
    for (let k = 0; k < 3; k++) {
      line(g, 0, 0, 5.5, 0, '#7dd3fc', 2);
      g.rotate(TAU / 3);
    }
    g.restore();
  }
  chip(g, a, 1, false, !v2);
  if (v2) goldBand(g, -22, 13, 44);
};

const workerToServer: DefBody = (g, a) => {
  if (isV2(a)) {
    // v2 = today's Worker: from a chip to a full server
    drawDefense(g, 'worker', 0, 0, a.t, { charge: a.charge, level: 2 });
    return;
  }
  teamBase(g, 56, a.t);
  chip(g, a, 1, false);
};

/* ======================= Load Balancer: today's box, improved ======================= */

function lbBox(g: G, a: DefAnim): void {
  const { t, kick } = a;
  const v2 = isV2(a);
  teamBase(g, 62, t);
  const ys = v2 ? [-15, -3] : [-10];
  for (const y of ys) {
    rr(g, 22 - kick * 4, y, 16, v2 ? 10 : 12, 3);
    paint(g, '#1d4ed8', v2 ? GOLD : '#93c5fd', 1.5);
  }
  rr(g, -30, -32, 56, 60, 12);
  paint(g, '#0d2350', '#60a5fa', 2);
  if (v2) goldBand(g, -20, -29, 36);
}
/** Which output is active now (round-robin). */
const rrTurn = (a: DefAnim): number => Math.floor(a.t * (a.action ? 6 : 2.5)) % 3;

function fanOut(g: G, x0: number, y0: number, outs: [number, number][], turn: number): void {
  outs.forEach(([x, y], i) => line(g, x0, y0, x, y, i === turn ? '#bfdbfe' : 'rgba(147,197,253,0.45)', i === turn ? 2.4 : 1.6));
  circ(g, x0, y0, 4.5);
  paint(g, '#93c5fd');
  outs.forEach(([x, y], i) => {
    circ(g, x, y, 3.4);
    paint(g, led(i === turn));
  });
}

const lbIncoming: DefBody = (g, a) => {
  const { t } = a;
  lbBox(g, a);
  // traffic coming in from the left
  for (let i = 0; i < 3; i++) {
    const p = (t * 1.2 + i / 3) % 1;
    g.fillStyle = '#93c5fd';
    g.fillRect(-27 + p * 12, -6, 3, 3);
  }
  fanOut(g, -12, -4, [[12, -17], [12, -4], [12, 9]], rrTurn(a));
  txt(g, 'LB', -2, 19, 10, '#bfdbfe', 900);
};

const lbServers: DefBody = (g, a) => {
  lbBox(g, a);
  const turn = rrTurn(a);
  const ys = [-22, -8, 6];
  fanOut(g, -17, -4, ys.map((y) => [1, y + 4] as [number, number]), turn);
  ys.forEach((y, i) => {
    rr(g, 3, y, 18, 9, 2);
    paint(g, i === turn ? '#1e40af' : '#172554', '#93c5fd', 1);
    g.fillStyle = '#93c5fd';
    g.fillRect(6, y + 3.5, 7, 2);
  });
  txt(g, 'LB', -17, 16, 9, '#bfdbfe', 900);
};

const lbRoundRobin: DefBody = (g, a) => {
  lbBox(g, a);
  const turn = rrTurn(a);
  fanOut(g, -12, -10, [[12, -21], [12, -10], [12, 1]], turn);
  rr(g, -22, 8, 40, 14, 3);
  paint(g, '#081521');
  for (let i = 0; i < 3; i++) {
    txt(g, String(i + 1), -12 + i * 10, 15, 9, i === turn ? '#4ade80' : '#1e3a8a', 900);
  }
  line(g, -7, 15, -5, 15, '#1e3a8a', 1);
  line(g, 3, 15, 5, 15, '#1e3a8a', 1);
};

/* ======================= Redis: today's cylinders, improved ======================= */

function disks(g: G, a: DefAnim): void {
  const v2 = isV2(a);
  teamBase(g, 60, a.t);
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
}

const redisKey: DefBody = (g, a) => {
  disks(g, a);
  // key icon (key → value)
  circ(g, -9, -3, 5);
  g.strokeStyle = '#fde047';
  g.lineWidth = 2.5;
  g.stroke();
  line(g, -4, -3, 10, -3, '#fde047', 2.5);
  line(g, 7, -3, 7, 1, '#fde047', 2);
  line(g, 10, -3, 10, 2, '#fde047', 2);
  txt(g, 'redis', 0, 16, 9, '#fff1f2', 900);
  cracks(g, a.hp, -6, -26, 50, '#1f0505');
};

const redisBolt: DefBody = (g, a) => {
  disks(g, a);
  g.beginPath();
  g.moveTo(3, -15);
  g.lineTo(-7, 0);
  g.lineTo(-1, 0);
  g.lineTo(-5, 12);
  g.lineTo(7, -4);
  g.lineTo(1, -4);
  g.lineTo(5, -15);
  g.closePath();
  paint(g, '#fde047', '#a16207', 1);
  txt(g, '<1 ms', 0, -19, 7, '#fff1f2', 900);
  txt(g, 'redis', 0, 16, 9, '#fff1f2', 900);
  cracks(g, a.hp, -6, -26, 50, '#1f0505');
};

const redisScreen: DefBody = (g, a) => {
  const { t } = a;
  disks(g, a);
  rr(g, -19, -9, 38, 13, 3);
  paint(g, '#1c0505', '#fca5a5', 1);
  const hit = Math.floor(t * 1.5) % 2 === 1;
  txt(g, hit ? 'HIT ✓' : 'GET k1', 0, -2.5, 7, hit ? '#4ade80' : '#fecaca', 900);
  txt(g, 'redis', 0, 16, 9, '#fff1f2', 900);
  cracks(g, a.hp, -6, -26, 50, '#1f0505');
};

/* ======================= Rate Limiter: today's gauge box, improved ======================= */

function rateBox(g: G, a: DefAnim): void {
  const { t, kick } = a;
  const v2 = isV2(a);
  teamBase(g, 62, t);
  const ys = v2 ? [-15, -3] : [-10];
  for (const y of ys) {
    rr(g, 22 - kick * 4, y, 16, v2 ? 10 : 12, 3);
    paint(g, '#6d28d9', v2 ? GOLD : '#c4b5fd', 1.5);
  }
  rr(g, -30, -32, 56, 60, 10);
  paint(g, '#2a0f5c', '#a78bfa', 2);
  if (v2) goldBand(g, -20, -29, 36);
}
function screen429(g: G, y: number, red: boolean): void {
  rr(g, -14, y, 26, 12, 3);
  paint(g, '#0b0618');
  txt(g, '429', -1, y + 6, 9, red ? '#f87171' : '#ddd6fe', 900);
}

const rateZones: DefBody = (g, a) => {
  const { t, kick } = a;
  rateBox(g, a);
  screen429(g, -26, kick > 0);
  const cx = -2;
  const cy = 12;
  const zones: [number, number, string][] = [
    [Math.PI, Math.PI * 1.45, '#4ade80'],
    [Math.PI * 1.45, Math.PI * 1.75, '#facc15'],
    [Math.PI * 1.75, TAU, '#f87171'],
  ];
  for (const [s0, s1, c] of zones) {
    g.strokeStyle = c;
    g.lineWidth = 4;
    g.beginPath();
    g.arc(cx, cy, 17, s0, s1);
    g.stroke();
  }
  const ang = Math.PI + (kick > 0 ? 0.92 : 0.45 + 0.3 * Math.sin(t * 2.2)) * Math.PI;
  line(g, cx, cy, cx + Math.cos(ang) * 14, cy + Math.sin(ang) * 14, '#f9a8d4', 2.5);
  circ(g, cx, cy, 2.2);
  paint(g, '#f9a8d4');
  txt(g, 'req/s', cx, 22, 7, '#a78bfa', 800);
};

const rateBucket: DefBody = (g, a) => {
  const { t, kick } = a;
  rateBox(g, a);
  screen429(g, -27, kick > 0);
  // token bucket: tokens drip in; each request spends one
  const tokens = kick > 0 ? 0 : 1 + (Math.floor(t * 2) % 5);
  g.beginPath();
  g.moveTo(-18, -6);
  g.lineTo(14, -6);
  g.lineTo(9, 22);
  g.lineTo(-13, 22);
  g.closePath();
  paint(g, '#1e1b2e', '#c4b5fd', 1.5);
  for (let i = 0; i < tokens; i++) {
    circ(g, -8 + (i % 3) * 7, 17 - Math.floor(i / 3) * 7, 3);
    paint(g, '#fde047', '#a16207', 0.8);
  }
  const p = (t * 2) % 1;
  circ(g, -2, -14 + p * 10, 2.4);
  paint(g, `rgba(253,224,71,${1 - p})`);
  txt(g, 'tokens', 20, 25, 5, '#a78bfa', 800);
};

const rateCounter: DefBody = (g, a) => {
  const { t, kick } = a;
  rateBox(g, a);
  screen429(g, -27, kick > 0);
  const n = kick > 0 ? 100 : 60 + Math.floor((t * 22) % 40);
  rr(g, -24, -10, 44, 18, 3);
  paint(g, '#0b0618', '#a78bfa', 1);
  txt(g, `${n}/100`, -2, -1, 10, n >= 100 ? '#f87171' : '#e9d5ff', 900);
  rr(g, -24, 12, 44, 5, 2.5);
  paint(g, '#1e1b2e');
  rr(g, -24, 12, 44 * (n / 100), 5, 2.5);
  paint(g, n >= 100 ? '#f87171' : '#a78bfa');
  txt(g, 'req/s', -2, 23, 6, '#a78bfa', 800);
};

/* ======================= Circuit Breaker: switch panel (round 2 A), improved ======================= */

function panel(g: G, a: DefAnim, labels: string[]): number {
  const armed = a.fuse !== undefined;
  const k = armed ? 1 - (a.fuse ?? 0) : 0;
  teamBase(g, 60, a.t);
  rr(g, -28, -34, 56, 62, 5);
  paint(g, '#334155', '#facc15', 2);
  hazard(g, -28, -34, 56, 9, 4);
  labels.forEach((lab, i) => {
    const x = -18 + i * 18;
    const tripped = armed && k > i / 3;
    txt(g, lab, x, -20, 5, '#cbd5e1', 800);
    rr(g, x - 6, -16, 12, 24, 2);
    paint(g, '#111827');
    rr(g, x - 5, tripped ? -3 : -15, 10, 10, 2);
    paint(g, tripped ? '#dc2626' : '#22c55e');
  });
  return k;
}

const cbStates: DefBody = (g, a) => {
  const armed = a.fuse !== undefined;
  panel(g, a, ['API', 'DB', 'PAGO']);
  rr(g, -22, 12, 44, 12, 3);
  paint(g, '#0b0b0b');
  txt(g, armed ? 'OPEN' : 'CLOSED', 0, 18, 8, armed ? '#f87171' : '#4ade80', 900);
  armedBlink(g, a, -28, -34, 56, 62, 5);
};

const cbFailures: DefBody = (g, a) => {
  const armed = a.fuse !== undefined;
  const k = panel(g, a, ['API', 'DB', 'PAGO']);
  const fails = armed ? Math.min(3, 1 + Math.floor(k * 3)) : Math.floor(a.t * 0.7) % 2;
  rr(g, -22, 12, 44, 12, 3);
  paint(g, '#0b0b0b');
  for (let i = 0; i < 3; i++) {
    txt(g, '✕', -14 + i * 9, 18, 8, i < fails ? '#f87171' : '#374151', 900);
  }
  txt(g, `${fails}/3`, 15, 18, 7, fails >= 3 ? '#f87171' : '#e5e7eb', 900);
  armedBlink(g, a, -28, -34, 56, 62, 5);
};

const cbCountdown: DefBody = (g, a) => {
  const armed = a.fuse !== undefined;
  panel(g, a, ['API', 'DB', 'PAGO']);
  rr(g, -22, 12, 44, 12, 3);
  paint(g, '#0b0b0b');
  txt(g, armed ? `${(a.fuse ?? 0).toFixed(1)}s` : 'LISTO', 0, 18, 8, armed ? '#f87171' : '#86efac', 900);
  armedBlink(g, a, -28, -34, 56, 62, 5);
};

/* ======================= WAF: filter layers (round 2 B), improved ======================= */

/** Draws the layers; returns the front layer's center x. */
function layers(g: G, a: DefAnim, tabs: string[] | null): number {
  const v2 = isV2(a);
  const n = v2 ? 4 : 3;
  const x0 = -22 - (n - 1) * 2.5;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * 5;
    const y = -36 + i * 3;
    if (tabs) {
      rr(g, x + 1 + i * 9, y - 8, 15, 9, 2);
      paint(g, '#115e59', '#5eead4', 1);
      txt(g, tabs[i], x + 8.5 + i * 9, y - 3.5, 5, '#ccfbf1', 900);
    }
    const front = i === n - 1;
    rr(g, x, y, 40, 64 - i * 3, 5);
    paint(g, front ? 'rgba(19,78,74,0.92)' : 'rgba(45,212,191,0.16)', front && v2 ? GOLD : '#2dd4bf', 1.5);
  }
  return x0 + (n - 1) * 5 + 20;
}
function shield(g: G, cx: number, y: number, s: number, hot: boolean): void {
  g.beginPath();
  g.moveTo(cx, y);
  g.lineTo(cx + 12 * s, y + 5 * s);
  g.lineTo(cx + 10 * s, y + 20 * s);
  g.lineTo(cx, y + 28 * s);
  g.lineTo(cx - 10 * s, y + 20 * s);
  g.lineTo(cx - 12 * s, y + 5 * s);
  g.closePath();
  paint(g, hot ? '#0f766e' : '#115e59', '#99f6e4', 1.8);
}

const wafRules: DefBody = (g, a) => {
  const { t, kick, hp } = a;
  teamBase(g, 60, t);
  g.translate(shake(a), 0);
  const cx = layers(g, a, ['SQLi', 'XSS', 'Bot', 'DDoS']);
  shield(g, cx, -20, 1, kick > 0.3);
  txt(g, 'WAF', cx, -7, 8, '#f0fdfa', 900);
  txt(g, isV2(a) ? '4 reglas' : '3 reglas', cx, 16, 6, '#99f6e4', 800);
  cracks(g, hp, cx - 8, -30, 52, '#042f2e');
};

const wafCatch: DefBody = (g, a) => {
  const { t, kick, hp } = a;
  teamBase(g, 60, t);
  g.translate(shake(a), 0);
  const cx = layers(g, a, null);
  // requests from the right: green ones pass, red ones get stuck in the layers
  for (let i = 0; i < 4; i++) {
    const p = (t * 0.5 + i / 4) % 1;
    const bad = i % 2 === 1;
    const x = 30 - p * 60;
    const y = -24 + i * 12;
    const stuck = bad && x < cx + 4;
    rr(g, (stuck ? cx + 4 : x) - 3, y - 3, 6, 6, 1.5);
    paint(g, bad ? '#f87171' : '#4ade80');
    if (stuck) txt(g, '✕', cx + 1, y, 6, '#fecaca', 900);
  }
  txt(g, 'WAF', cx, 18, 9, kick > 0.3 ? '#fde047' : '#f0fdfa', 900);
  cracks(g, hp, cx - 8, -30, 52, '#042f2e');
};

const wafLog: DefBody = (g, a) => {
  const { t, kick, hp } = a;
  teamBase(g, 60, t);
  g.translate(shake(a), 0);
  const cx = layers(g, a, null);
  shield(g, cx, -32, 0.7, kick > 0.3);
  txt(g, 'WAF', cx, -22, 6, '#f0fdfa', 900);
  rr(g, cx - 17, -8, 34, 28, 3);
  paint(g, '#042f2e', '#99f6e4', 1);
  const lines: [string, string][] = [
    ['✓ GET /', '#86efac'],
    ["✕ 'OR 1=1", '#fca5a5'],
    ['✕ <script>', '#fca5a5'],
  ];
  const off = Math.floor(t * 1.2) % 3;
  for (let i = 0; i < 3; i++) {
    const [s, c] = lines[(i + off) % 3];
    txt(g, s, cx, -2 + i * 8, 5.5, i === 2 && kick > 0.3 ? '#fde047' : c, 800);
  }
  cracks(g, hp, cx - 8, -30, 52, '#042f2e');
};

/* ======================= CDN Edge: today's globe, improved ======================= */

function globe(g: G, a: DefAnim, inner: () => void): void {
  const { t, kick } = a;
  const v2 = isV2(a);
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
  g.save();
  circ(g, 0, 0, 24);
  g.clip();
  inner();
  g.restore();
  g.strokeStyle = 'rgba(244,114,182,0.5)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.ellipse(0, 0, Math.abs(Math.sin(t * 1.5) * 8) + 4, 24, 0, 0, TAU);
  g.moveTo(-24, 0);
  g.lineTo(24, 0);
  g.stroke();
  g.restore();
}

const cdnContinents: DefBody = (g, a) => {
  const { t } = a;
  globe(g, a, () => {
    const off = ((t * 6) % 60) - 30;
    g.fillStyle = 'rgba(244,114,182,0.45)';
    for (const dx of [0, 60]) {
      for (const [x, y, rx, ry] of [[-10, -8, 8, 6], [-4, 8, 5, 8], [10, -6, 9, 5], [14, 9, 4, 4]]) {
        g.beginPath();
        g.ellipse(x + off - dx + 30, y, rx, ry, 0.3, 0, TAU);
        g.fill();
      }
    }
  });
  txt(g, 'CDN', 0, 23, 6, '#fce7f3', 900);
};

const cdnPops: DefBody = (g, a) => {
  const { t } = a;
  globe(g, a, () => {
    const pts: [number, number][] = [[-12, -12], [8, -15], [15, 4], [-4, 6], [-16, 10]];
    pts.forEach(([x, y], i) => {
      const on = Math.sin(t * 4 + i * 1.7) > 0;
      if (on) {
        circ(g, x, y, 5);
        paint(g, 'rgba(74,222,128,0.25)');
      }
      circ(g, x, y, 2.2);
      paint(g, on ? '#4ade80' : '#fbcfe8');
    });
  });
  txt(g, 'CDN', 0, 23, 6, '#fce7f3', 900);
};

const cdnCache: DefBody = (g, a) => {
  const { t } = a;
  globe(g, a, () => undefined);
  txt(g, 'CDN', 0, -6, 9, '#fce7f3', 900);
  const hit = Math.floor(t * 1.3) % 3 !== 2;
  rr(g, -26, 15, 20, 10, 2);
  paint(g, hit ? '#14532d' : '#7f1d1d', hit ? '#4ade80' : '#f87171', 1);
  txt(g, hit ? 'HIT' : 'MISS', -16, 20, 5.5, '#f0fdf4', 900);
};

/* ======================= Kafka: today's queue, improved ======================= */

function queue(g: G, a: DefAnim, x: number, y: number, w: number, h: number, n: number, numbers: boolean): void {
  const sw = (w - 8 - (n - 1) * 2) / n;
  for (let i = 0; i < n; i++) {
    const on = a.busy ? Math.floor(a.t * 8) % n === i : i / n < a.ready;
    const sx = x + 4 + i * (sw + 2);
    rr(g, sx, y + 4, sw, h - 8, 2);
    paint(g, on ? '#fdba74' : '#7c2d12');
    if (numbers) txt(g, String(i), sx + sw / 2, y + h / 2, 6, on ? '#431407' : '#c2410c', 900);
  }
}
function topicTag(g: G, label: string, y: number, v2: boolean): void {
  rr(g, -24, y, 48, 14, 4);
  paint(g, '#7c2d12', v2 ? GOLD : '#fb923c', 1.2);
  txt(g, label, 0, y + 7, 7, '#ffedd5', 900);
}

const kafkaOffsets: DefBody = (g, a) => {
  const v2 = isV2(a);
  teamBase(g, 78, a.t);
  rr(g, -38, 0, 76, 26, 6);
  paint(g, '#431407', '#fb923c', 2);
  queue(g, a, -38, 0, 76, 26, v2 ? 8 : 6, true);
  topicTag(g, 'topic: req', -20, v2);
  line(g, 0, -6, 0, 0, '#fb923c', 2);
  if (v2) goldBand(g, -38, -2, 76);
};

const kafkaProducer: DefBody = (g, a) => {
  const { t, busy } = a;
  const v2 = isV2(a);
  teamBase(g, 78, t);
  // consumer (left) ← queue ← producer (right)
  rr(g, -38, 2, 14, 22, 3);
  paint(g, '#7c2d12', '#fb923c', 1.2);
  g.save();
  g.translate(-31, 13);
  g.rotate(busy ? 0 : t * 2);
  for (let k = 0; k < 6; k++) {
    g.fillStyle = '#fdba74';
    g.fillRect(-1.2, -6, 2.4, 3);
    g.rotate(TAU / 6);
  }
  circ(g, 0, 0, 3.5);
  paint(g, '#fdba74');
  g.restore();
  rr(g, -22, 2, v2 ? 46 : 40, 22, 5);
  paint(g, '#431407', '#fb923c', 1.8);
  queue(g, a, -22, 2, v2 ? 46 : 40, 22, v2 ? 6 : 5, false);
  const px = v2 ? 26 : 20;
  rr(g, px, 4, 14, 18, 3);
  paint(g, '#7c2d12', '#fb923c', 1.2);
  rr(g, px + 2.5, 9, 9, 7, 1);
  paint(g, '#ffedd5', '#c2410c', 0.8);
  txt(g, 'consumer', -31, -4, 4.5, '#fdba74', 800);
  txt(g, 'producer', px + 7, -4, 4.5, '#fdba74', 800);
  topicTag(g, 'kafka', -24, v2);
};

const kafkaPartitions: DefBody = (g, a) => {
  const v2 = isV2(a);
  teamBase(g, 78, a.t);
  const n = v2 ? 3 : 2;
  const h = 13;
  const top = 26 - n * (h + 2);
  for (let i = 0; i < n; i++) {
    const y = top + i * (h + 2);
    rr(g, -38, y, 76, h, 4);
    paint(g, '#431407', '#fb923c', 1.2);
    txt(g, `P${i}`, -32, y + h / 2, 6, '#fdba74', 900);
    queue(g, a, -28, y - 2, 66, h + 4, 6, false);
  }
  topicTag(g, 'kafka', top - 19, v2);
  if (v2) goldBand(g, -38, top - 4, 76);
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
const press = (a: DefAnim, i: number): number => (a.action ? Math.max(0, Math.sin(a.t * 14 + i * Math.PI)) * 2.5 : 0);

const rbRelief: DefBody = (g, a) => {
  const { t, action } = a;
  keycap(g, -24, -11, 23, 21, 'Ctrl', 6, press(a, 0));
  keycap(g, 1, -11, 23, 21, 'Z', 11, press(a, 1));
  if (action) {
    g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 8);
    txt(g, '↶', 0, -20, 12, '#22d3ee', 900);
    g.globalAlpha = 1;
  }
};

const rbBigZ: DefBody = (g, a) => {
  keycap(g, -25, -2, 16, 14, 'Ctrl', 4.5, press(a, 0));
  keycap(g, -6, -18, 30, 30, 'Z', 15, press(a, 1));
  txt(g, '↶', 15, -12 + press(a, 1), 8, '#22d3ee', 900);
};

const rbVersion: DefBody = (g, a) => {
  const { action } = a;
  keycap(g, -24, -4, 23, 19, 'Ctrl', 6, press(a, 0));
  keycap(g, 1, -4, 23, 19, 'Z', 11, press(a, 1));
  rr(g, -22, -22, 44, 12, 3);
  paint(g, '#03141a', '#22d3ee', 1);
  txt(g, action ? 'v1.3 → v1.2' : 'v1.3', 0, -16, 6, action ? '#fde047' : '#a5f3fc', 900);
};

/* ======================= Exports ======================= */

export const DEF_OPTIONS_R3: Record<DefItem, Record<Pick, DefOption>> = {
  worker: {
    A: { name: 'Chip · v2 de 2 núcleos', ref: 'Una CPU de 2 núcleos hace el doble de trabajo (v2 = el doble de CU).', body: workerCores },
    B: { name: 'Chip · v2 con disipador', ref: 'Más potencia da más calor: el disipador y el ventilador lo enfrían.', body: workerHeatsink },
    C: { name: 'Chip · v2 = Worker actual', ref: 'Al mejorar, el chip se convierte en un servidor completo (el dibujo de hoy).', body: workerToServer },
  },
  loadBalancer: {
    A: { name: 'Actual + tráfico entrante', ref: 'Recibe todo el tráfico por una entrada y lo reparte por varias salidas.', body: lbIncoming },
    B: { name: 'Actual + 3 servidores', ref: 'Detrás de un balanceador hay varios servidores iguales.', body: lbServers },
    C: { name: 'Actual + turno round-robin', ref: 'Round-robin: turno 1, 2, 3 y vuelta a empezar.', body: lbRoundRobin },
  },
  redis: {
    A: { name: 'Actual + llave', ref: 'Guarda pares llave → valor.', body: redisKey },
    B: { name: 'Actual + rayo', ref: 'Vive en la memoria RAM: responde en menos de 1 ms.', body: redisBolt },
    C: { name: 'Actual + pantalla HIT', ref: 'Cache hit: el dato ya está guardado y no hay que ir a la base de datos.', body: redisScreen },
  },
  rateLimiter: {
    A: { name: 'Actual + zonas de color', ref: 'Cuenta peticiones por segundo. En la zona roja responde 429.', body: rateZones },
    B: { name: 'Cubo de fichas (token bucket)', ref: 'Algoritmo real: cada petición gasta una ficha; sin fichas → 429.', body: rateBucket },
    C: { name: 'Contador 100 req/s', ref: 'Límite fijo, por ejemplo 100 peticiones por segundo por cliente.', body: rateCounter },
  },
  circuitBreaker: {
    A: { name: 'Cuadro + CLOSED / OPEN', ref: 'El patrón real tiene estados: CLOSED deja pasar, OPEN corta el paso.', body: cbStates },
    B: { name: 'Cuadro + contador de fallos', ref: 'Tras varios fallos seguidos, el circuito se abre.', body: cbFailures },
    C: { name: 'Cuadro + cuenta atrás', ref: 'En el juego explota 1 s después de activarse.', body: cbCountdown },
  },
  waf: {
    A: { name: 'Capas con reglas', ref: 'Cada capa es un grupo de reglas: SQLi, XSS, bots…', body: wafRules },
    B: { name: 'Capas que atrapan', ref: 'Revisa cada petición: lo bueno pasa, lo malo se queda en el filtro.', body: wafCatch },
    C: { name: 'Capas + registro', ref: 'Bloquea ataques web como SQL Injection o XSS y lo anota en un registro.', body: wafLog },
  },
  cdn: {
    A: { name: 'Actual + continentes', ref: 'Servidores repartidos por todo el mundo.', body: cdnContinents },
    B: { name: 'Actual + nodos edge', ref: 'Cada punto es un servidor "edge" cerca de los usuarios.', body: cdnPops },
    C: { name: 'Actual + caché HIT', ref: 'Guarda copias: si ya tiene el contenido, responde al momento (HIT).', body: cdnCache },
  },
  kafka: {
    A: { name: 'Actual + offsets', ref: 'Una cola guarda los mensajes en orden; cada uno tiene un número (offset).', body: kafkaOffsets },
    B: { name: 'Productor → cola → consumidor', ref: 'Un productor escribe mensajes; un consumidor los lee más tarde.', body: kafkaProducer },
    C: { name: 'Particiones', ref: 'Un topic se divide en particiones para repartir el trabajo.', body: kafkaPartitions },
  },
  rollback: {
    A: { name: 'Ctrl + Z con relieve', ref: 'Ctrl + Z = deshacer. Un rollback deshace el último cambio.', body: rbRelief },
    B: { name: 'Tecla Z grande', ref: 'La tecla de deshacer, bien grande para leerla de lejos.', body: rbBigZ },
    C: { name: 'Ctrl + Z + versión', ref: 'Vuelve a la versión anterior que funcionaba (v1.3 → v1.2).', body: rbVersion },
  },
};
