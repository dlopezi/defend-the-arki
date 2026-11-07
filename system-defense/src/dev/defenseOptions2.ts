import { circ, line, paint, rr, TAU, txt, type G, type Pick } from './avatarOptions';
import { armedBlink, cracks, hazard, shake, splitter, teamBase, undoArrow, type DefAnim, type DefBody, type DefItem } from './defenseOptions';

/*
 * Defense avatars, round 2 (from the comments on round 1):
 * - No faces: machines and objects only.
 * - Each option has its own v2 look. The v2 adds parts that show the real upgrade
 *   (2 cannons = fires 2 packets, armor = more hp…) and a gold stripe to spot it fast.
 *   Circuit Breaker and Rollback have no upgrade in the game, so they only have v1.
 * Same frame as round 1: centered at (0, 0), base top at y = 28.
 */

export const GOLD = '#facc15';
export const isV2 = (a: DefAnim): boolean => a.level === 2;
export function goldBand(g: G, x: number, y: number, w: number, h = 3): void {
  rr(g, x, y, w, h, h / 2);
  paint(g, GOLD);
}
function hexPath(g: G, x: number, y: number, r: number): void {
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * TAU + Math.PI / 6;
    if (i === 0) g.moveTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r);
    else g.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r);
  }
  g.closePath();
}
/** Metal armor plate with bolts (walls v2: more hp). */
export function armor(g: G, x: number, y: number, w: number, h: number): void {
  rr(g, x, y, w, h, 2);
  paint(g, '#64748b', '#cbd5e1', 1);
  for (const bx of [x + 4, x + w - 4]) {
    circ(g, bx, y + h / 2, 1.6);
    paint(g, GOLD);
  }
}
export const led = (on: boolean): string => (on ? '#4ade80' : '#166534');

/* ======================= Worker Node (v2: makes double CU) ======================= */

const workerChart: DefBody = (g, a) => {
  const { t, charge } = a;
  const tower = (x: number): void => {
    rr(g, x - 6, -37, 12, 3, 1.5);
    paint(g, '#fde047');
    rr(g, x - 15, -34, 30, 62, 5);
    paint(g, '#0f2a3d', '#38bdf8', 1.6);
    rr(g, x - 11, -28, 22, 18, 3);
    paint(g, '#081521');
    for (let i = 0; i < 4; i++) {
      const h = 3 + ((Math.sin(t * 3 + i * 1.3 + x) + 1) / 2) * 11;
      g.fillStyle = i === 3 ? '#fde047' : '#38bdf8';
      g.fillRect(x - 9 + i * 5, -11 - h, 3.5, h);
    }
    for (let i = 0; i < 2; i++) {
      rr(g, x - 11, -4 + i * 8, 22, 5, 2);
      paint(g, '#081521');
      circ(g, x + 7, -1.5 + i * 8, 1.5);
      paint(g, led(Math.sin(t * 5 + i + x) > -0.3));
    }
    rr(g, x - 11, 14, 22, 4, 2);
    paint(g, '#081521');
    rr(g, x - 11, 14, 22 * Math.max(0.08, charge), 4, 2);
    paint(g, '#fde047');
  };
  if (isV2(a)) {
    teamBase(g, 68, t);
    tower(-16);
    tower(16);
    goldBand(g, -31, 22, 62);
  } else {
    teamBase(g, 44, t);
    tower(0);
  }
};

const workerTurbine: DefBody = (g, a) => {
  const { t, charge, action } = a;
  const v2 = isV2(a);
  teamBase(g, 60, t);
  rr(g, -26, -32, 52, 58, 8);
  paint(g, '#0f2a3d', '#38bdf8', 1.6);
  const fans: [number, number, number][] = v2 ? [[-12, -12, 10], [12, -12, 10]] : [[0, -12, 15]];
  for (const [x, y, r] of fans) {
    circ(g, x, y, r);
    paint(g, '#081521', '#38bdf8', 1.2);
    g.save();
    g.translate(x, y);
    g.rotate(t * (action ? 16 : 6) + x);
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      g.ellipse(r * 0.45, 0, r * 0.45, r * 0.18, 0, 0, TAU);
      paint(g, '#7dd3fc');
      g.rotate(TAU / 4);
    }
    g.restore();
    circ(g, x, y, 2.6);
    paint(g, '#fde047');
  }
  // energy bolt + charge
  g.beginPath();
  g.moveTo(-14, 8);
  g.lineTo(-19, 15);
  g.lineTo(-15, 15);
  g.lineTo(-18, 21);
  g.lineTo(-11, 13);
  g.lineTo(-15, 13);
  g.closePath();
  paint(g, '#fde047');
  rr(g, -8, 13, 28, 5, 2.5);
  paint(g, '#081521');
  rr(g, -8, 13, 28 * Math.max(0.08, charge), 5, 2.5);
  paint(g, '#fde047');
  if (v2) goldBand(g, -26, -32, 52, 4);
};

const workerContainers: DefBody = (g, a) => {
  const { t, charge } = a;
  const v2 = isV2(a);
  teamBase(g, 64, t);
  const ys = v2 ? [-30, -10, 10] : [-10, 10];
  ys.forEach((y, i) => {
    rr(g, -30, y, 60, 18, 2);
    paint(g, i % 2 ? '#0c2233' : '#0f2a3d', '#7dd3fc', 1.2);
    for (let k = 0; k < 7; k++) line(g, -25 + k * 6, y + 3, -25 + k * 6, y + 15, 'rgba(125,211,252,0.35)', 1.5);
    rr(g, 17, y + 2, 10, 14, 1);
    paint(g, '#081521', '#7dd3fc', 1);
    circ(g, 14, y + 9, 1.6);
    paint(g, led(Math.sin(t * 5 + i * 2) > -0.3));
  });
  // charge fills the door of the top container
  const top = ys[0];
  rr(g, 18, top + 15 - 12 * Math.max(0.08, charge), 8, 12 * Math.max(0.08, charge), 1);
  paint(g, '#fde047');
  if (v2) goldBand(g, -30, top - 3, 60);
};

/* ======================= Load Balancer (v2: fires 2 packets) ======================= */

function barrels(g: G, x: number, kick: number, v2: boolean, len = 14): void {
  const ys = v2 ? [-13, -3] : [-9];
  for (const y of ys) {
    rr(g, x - kick * 4, y, len, v2 ? 8 : 10, 3);
    paint(g, '#1d4ed8', '#93c5fd', 1.3);
  }
}

const lbSwitch: DefBody = (g, a) => {
  const { t, kick } = a;
  const v2 = isV2(a);
  teamBase(g, 62, t);
  barrels(g, 22, kick, v2);
  if (v2) {
    rr(g, -26, -34, 44, 12, 4);
    paint(g, '#0d2350', '#60a5fa', 1.5);
    for (let i = 0; i < 5; i++) {
      circ(g, -19 + i * 7, -28, 1.6);
      paint(g, led(Math.sin(t * 7 - i) > 0));
    }
    goldBand(g, -26, -22, 44);
  }
  rr(g, -30, -19, 52, 44, 6);
  paint(g, '#0d2350', '#60a5fa', 1.8);
  splitter(g, -6, -6, 1, t, '#93c5fd');
  for (let i = 0; i < 6; i++) {
    rr(g, -26 + i * 7.6, 10, 6, 6, 1);
    paint(g, '#081521');
    circ(g, -23 + i * 7.6, 20, 1.3);
    paint(g, led(Math.sin(t * 6 + i * 1.3) > 0));
  }
};

const lbScale: DefBody = (g, a) => {
  const { t, kick } = a;
  const v2 = isV2(a);
  teamBase(g, 58, t);
  rr(g, -14, 22, 28, 6, 2);
  paint(g, '#0d2350', '#60a5fa', 1.2);
  barrels(g, 4, kick, v2, 30);
  rr(g, -4, -28, 8, 50, 2);
  paint(g, '#0d2350', '#60a5fa', 1.2);
  // the balance beam: load moves between the 2 pans
  g.save();
  g.translate(0, -30);
  g.rotate(Math.sin(t * 1.5) * 0.12);
  line(g, -24, 0, 24, 0, '#93c5fd', 3);
  for (const x of [-22, 22]) {
    line(g, x, 0, x - 5, 10, '#93c5fd', 1);
    line(g, x, 0, x + 5, 10, '#93c5fd', 1);
    g.beginPath();
    g.arc(x, 10, 8, 0, Math.PI);
    g.closePath();
    paint(g, '#1e3a8a', '#60a5fa', 1.2);
    g.fillStyle = '#4ade80';
    g.fillRect(x - 4, 7, 3, 3);
    g.fillRect(x + 1, 7, 3, 3);
  }
  g.restore();
  circ(g, 0, -30, 3.5);
  paint(g, v2 ? GOLD : '#93c5fd');
  txt(g, 'LB', 0, 12, 7, '#bfdbfe', 800);
};

const lbRoundRobin: DefBody = (g, a) => {
  const { t, kick, action } = a;
  const v2 = isV2(a);
  teamBase(g, 58, t);
  rr(g, -8, 18, 16, 10, 2);
  paint(g, '#0d2350', '#60a5fa', 1.2);
  barrels(g, 20, kick, v2, 16);
  if (v2) {
    circ(g, 0, -4, 27);
    g.strokeStyle = GOLD;
    g.lineWidth = 2.5;
    g.stroke();
  }
  circ(g, 0, -4, 24);
  paint(g, '#0d2350', '#60a5fa', 1.8);
  g.save();
  g.translate(0, -4);
  g.rotate(t * (action ? 3 : 1.2));
  for (let i = 0; i < 3; i++) {
    const a0 = (i / 3) * TAU;
    g.strokeStyle = '#93c5fd';
    g.lineWidth = 3;
    g.beginPath();
    g.arc(0, 0, 15, a0, a0 + 1.4);
    g.stroke();
    const hx = Math.cos(a0 + 1.4) * 15;
    const hy = Math.sin(a0 + 1.4) * 15;
    const tx = -Math.sin(a0 + 1.4);
    const ty = Math.cos(a0 + 1.4);
    g.fillStyle = '#93c5fd';
    g.beginPath();
    g.moveTo(hx + tx * 5, hy + ty * 5);
    g.lineTo(hx - ty * 4, hy + tx * 4);
    g.lineTo(hx + ty * 4, hy - tx * 4);
    g.closePath();
    g.fill();
  }
  g.restore();
  txt(g, 'LB', 0, -4, 9, '#bfdbfe', 900);
};

/* ======================= Redis Cache (v2: hp ×2 → armor) ======================= */

const redisRam: DefBody = (g, a) => {
  const { t, hp } = a;
  const v2 = isV2(a);
  teamBase(g, 62, t);
  g.translate(shake(a), 0);
  const hit = Math.floor(t * 3) % 12;
  for (let i = 0; i < 3; i++) {
    const x = -24 + i * 17;
    rr(g, x, -26, 14, 52, 2);
    paint(g, '#991b1b', '#fecaca', 1);
    for (let k = 0; k < 4; k++) {
      rr(g, x + 3, -21 + k * 11, 8, 8, 1);
      paint(g, i * 4 + k === hit ? '#fca5a5' : '#450a0a');
    }
    g.fillStyle = GOLD;
    for (let j = 0; j < 4; j++) g.fillRect(x + 1.5 + j * 3, 25, 1.6, 3);
  }
  rr(g, -26, -38, 52, 11, 3);
  paint(g, '#ef4444');
  txt(g, 'redis', 0, -32.5, 8, '#fff1f2', 800);
  if (v2) {
    armor(g, -30, -6, 60, 9);
    armor(g, -30, 10, 60, 9);
    goldBand(g, -26, -41, 52);
  }
  cracks(g, hp, -4, -24, 48, '#1f0505');
};

const redisBricks: DefBody = (g, a) => {
  const { t, hp } = a;
  const v2 = isV2(a);
  teamBase(g, 62, t);
  g.translate(shake(a), 0);
  const hit = Math.floor(t * 2.5) % 6;
  let n = 0;
  for (const y of [-27, -8, 11]) {
    for (const x of [-27, 1]) {
      rr(g, x, y, 26, 17, 2);
      paint(g, n === hit ? '#ef4444' : '#991b1b', '#fecaca', 1.2);
      txt(g, `k${n}`, x + 13, y + 8.5, 7, '#fecaca', 800);
      n++;
    }
  }
  if (v2) {
    rr(g, -31, -31, 62, 62, 4);
    g.strokeStyle = '#cbd5e1';
    g.lineWidth = 3;
    g.stroke();
    for (const [x, y] of [[-31, -31], [31, -31], [-31, 28], [31, 28]]) {
      circ(g, x, y, 2.5);
      paint(g, GOLD);
    }
  }
  cracks(g, hp, -4, -26, 50, '#1f0505');
};

const redisHex: DefBody = (g, a) => {
  const { t, hp } = a;
  const v2 = isV2(a);
  teamBase(g, 60, t);
  g.translate(shake(a), 0);
  if (v2) {
    hexPath(g, 0, -4, 33);
    paint(g, '#475569', GOLD, 2.5);
  }
  hexPath(g, 0, -4, 29);
  paint(g, '#7f1d1d', '#fecaca', 2);
  hexPath(g, 0, -4, 19);
  paint(g, '#991b1b', '#fca5a5', 1);
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * TAU + Math.PI / 6;
    circ(g, Math.cos(ang) * 24, -4 + Math.sin(ang) * 24, 1.8);
    paint(g, '#fca5a5');
  }
  txt(g, 'redis', 0, -4, 9, '#fff1f2', 900);
  cracks(g, hp, -6, -26, 42, '#1f0505');
};

/* ======================= Rate Limiter (v2: fires 2 packets 429) ======================= */

const rateFunnel: DefBody = (g, a) => {
  const { t, kick } = a;
  const v2 = isV2(a);
  teamBase(g, 58, t);
  line(g, -2, 4, -2, 28, '#475569', 3);
  g.save();
  g.translate(-kick * 3, 0);
  // wide mouth to the right (where traffic arrives), narrow end on the left
  g.beginPath();
  g.moveTo(-26, -9);
  g.lineTo(-8, -9);
  g.lineTo(26, -26);
  g.lineTo(26, 18);
  g.lineTo(-8, 1);
  g.lineTo(-26, 1);
  g.closePath();
  paint(g, '#2a0f5c', '#a78bfa', 1.8);
  // requests waiting inside; only one passes at a time
  for (let i = 0; i < 4; i++) {
    const p = (t * 0.6 + i / 4) % 1;
    const x = 22 - p * 44;
    const spread = Math.max(0, (x + 8) / 34) * 14;
    rr(g, x - 2, -4 - spread * ((i % 2) * 2 - 1) * 0.6 - 2, 4, 4, 1);
    paint(g, x < -8 ? '#f472b6' : '#c4b5fd');
  }
  txt(g, '429', 8, 10, 7, '#ddd6fe', 900);
  if (v2) {
    rr(g, 24, -28, 5, 48, 2);
    paint(g, GOLD);
    rr(g, 29, -16, 6, 8, 2);
    paint(g, '#6d28d9', '#c4b5fd', 1);
    rr(g, 29, 0, 6, 8, 2);
    paint(g, '#6d28d9', '#c4b5fd', 1);
  }
  g.restore();
};

const rateValve: DefBody = (g, a) => {
  const { t, kick, action } = a;
  const v2 = isV2(a);
  teamBase(g, 62, t);
  line(g, -22, 2, -22, 28, '#475569', 3);
  line(g, 20, 2, 20, 28, '#475569', 3);
  rr(g, -32 + 0, -10, 62 - kick * 3, 12, 4);
  paint(g, '#334155', '#94a3b8', 1.2);
  rr(g, 28 - kick * 3, -13, 7, 18, 2);
  paint(g, '#6d28d9', '#c4b5fd', 1.2);
  const valves = v2 ? [-12, 10] : [0];
  for (const x of valves) {
    rr(g, x - 9, -15, 18, 22, 4);
    paint(g, '#2a0f5c', '#a78bfa', 1.5);
    line(g, x, -15, x, -24, '#94a3b8', 2.5);
    g.save();
    g.translate(x, -27);
    g.rotate(t * (action ? 4 : 1) + x);
    circ(g, 0, 0, v2 ? 8 : 10);
    g.strokeStyle = '#c4b5fd';
    g.lineWidth = 3;
    g.stroke();
    for (let k = 0; k < 4; k++) {
      line(g, 0, 0, v2 ? 8 : 10, 0, '#c4b5fd', 1.5);
      g.rotate(TAU / 4);
    }
    g.restore();
    txt(g, '429', x, -3, 6, '#f9a8d4', 900);
  }
  if (v2) goldBand(g, -32, 3, 60);
};

const rateScreen: DefBody = (g, a) => {
  const { t, kick } = a;
  const v2 = isV2(a);
  teamBase(g, 58, t);
  rr(g, -4, 12, 8, 16, 2);
  paint(g, '#334155');
  const ys = v2 ? [-13, -3] : [-9];
  for (const y of ys) {
    rr(g, 26 - kick * 4, y, 10, v2 ? 8 : 10, 2);
    paint(g, '#6d28d9', '#c4b5fd', 1.2);
  }
  rr(g, -28, -34, 56, 46, 5);
  paint(g, '#1e1b2e', '#a78bfa', 1.8);
  rr(g, -24, -30, 48, 38, 3);
  paint(g, '#0b0618');
  txt(g, '429', -9, -23, 10, '#f9a8d4', 900);
  txt(g, 'req/s', 12, -23, 6, '#a78bfa', 800);
  // traffic bars, cut at the limit line
  const limit = -8;
  for (let i = 0; i < 7; i++) {
    const h = 5 + ((Math.sin(t * 2.4 + i * 1.1) + 1) / 2) * 16;
    const top = Math.max(limit, 5 - h);
    g.fillStyle = 5 - h < limit ? '#f472b6' : '#8b5cf6';
    g.fillRect(-21 + i * 6.5, top, 4.5, 5 - top);
  }
  g.setLineDash([3, 2]);
  line(g, -23, limit, 23, limit, '#f9a8d4', 1.2);
  g.setLineDash([]);
  if (v2) goldBand(g, -28, -37, 56);
};

/* ======================= Circuit Breaker (no upgrade) ======================= */

const cbPanel: DefBody = (g, a) => {
  const { t } = a;
  const armed = a.fuse !== undefined;
  const k = armed ? 1 - (a.fuse ?? 0) : 0;
  teamBase(g, 60, t);
  rr(g, -28, -32, 56, 60, 5);
  paint(g, '#334155', '#facc15', 2);
  hazard(g, -28, -32, 56, 10, 4);
  for (let i = 0; i < 3; i++) {
    const x = -18 + i * 18;
    const tripped = armed && k > i / 3;
    rr(g, x - 6, -16, 12, 30, 2);
    paint(g, '#111827');
    rr(g, x - 5, tripped ? 1 : -14, 10, 12, 2);
    paint(g, tripped ? '#dc2626' : '#22c55e');
  }
  txt(g, armed ? 'TRIP' : 'ON', 0, 21, 7, armed ? '#fca5a5' : '#86efac', 900);
  armedBlink(g, a, -28, -32, 56, 60, 5);
};

const cbTimer: DefBody = (g, a) => {
  const { t } = a;
  const armed = a.fuse !== undefined;
  teamBase(g, 58, t);
  rr(g, -5, -34, 10, 8, 2);
  paint(g, '#facc15', '#111827', 1);
  if (armed) {
    circ(g, 0, -36, 2.5 + Math.sin(t * 50));
    paint(g, '#fde047');
  }
  circ(g, 0, -2, 26);
  paint(g, '#1c1917', '#facc15', 2.5);
  hazard(g, -15, 12, 30, 8, 3);
  rr(g, -17, -14, 34, 16, 3);
  paint(g, '#0b0b0b');
  txt(g, armed ? `${(a.fuse ?? 0).toFixed(1)}s` : 'ON', 0, -6, 10, armed ? '#f87171' : '#86efac', 900);
  armedBlink(g, a, -26, -28, 52, 52, 26);
};

const cbPlug: DefBody = (g, a) => {
  const { t } = a;
  const armed = a.fuse !== undefined;
  const off = armed ? (1 - (a.fuse ?? 0)) * 12 : 0;
  teamBase(g, 62, t);
  rr(g, -30, -26, 20, 46, 4);
  paint(g, '#334155', '#facc15', 1.5);
  rr(g, -22, -12, 4, 8, 1);
  paint(g, '#0b0b0b');
  rr(g, -22, 4, 4, 8, 1);
  paint(g, '#0b0b0b');
  // cable
  g.strokeStyle = '#111827';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(20 + off, -4);
  g.quadraticCurveTo(34, -4, 30, 26);
  g.stroke();
  line(g, -10 + off, -8, -20 + off, -8, '#cbd5e1', 3);
  line(g, -10 + off, 8, -20 + off, 8, '#cbd5e1', 3);
  rr(g, -10 + off, -20, 30, 32, 5);
  paint(g, '#facc15', '#111827', 1.5);
  txt(g, armed ? 'OFF' : 'ON', 5 + off, -4, 8, armed ? '#b91c1c' : '#166534', 900);
  if (armed && off > 2) {
    for (let i = 0; i < 3; i++) {
      const y = -10 + i * 9 + Math.sin(t * 40 + i) * 2;
      line(g, -18, y, -18 + off * 0.8, y + Math.sin(t * 60 + i) * 3, '#fde047', 1.5);
    }
  }
  armedBlink(g, a, -10 + off, -20, 30, 32, 5);
};

/* ======================= WAF (v2: hp ×1.5 → armor + battlements) ======================= */

function bricks(g: G, x: number, y: number, w: number, h: number): void {
  g.save();
  rr(g, x, y, w, h, 4);
  g.clip();
  for (let r = 0; r * 11 < h; r++) {
    const by = y + r * 11;
    line(g, x, by, x + w, by, 'rgba(45,212,191,0.3)', 1.2);
    const offx = r % 2 === 0 ? -8 : 8;
    line(g, offx, by, offx, by + 11, 'rgba(45,212,191,0.3)', 1.2);
  }
  g.restore();
}
function flame(g: G, x: number, y: number, s: number, t: number, color: string): void {
  const f = 1 + Math.sin(t * 9 + x) * 0.08;
  g.beginPath();
  g.moveTo(x - 6 * s, y);
  g.quadraticCurveTo(x - 8 * s, y - 8 * s * f, x - 1 * s, y - 16 * s * f);
  g.quadraticCurveTo(x, y - 9 * s, x + 3 * s, y - 11 * s * f);
  g.quadraticCurveTo(x + 9 * s, y - 6 * s * f, x + 6 * s, y);
  g.closePath();
  paint(g, color);
}

const wafFlame: DefBody = (g, a) => {
  const { t, hp } = a;
  const v2 = isV2(a);
  teamBase(g, 56, t);
  g.translate(shake(a), 0);
  flame(g, -10, -25, 1, t, '#f97316');
  flame(g, 8, -25, 1.1, t + 1, '#f97316');
  flame(g, -1, -25, 0.8, t + 2, '#fde047');
  rr(g, -25, -26, 50, 54, 4);
  paint(g, '#134e4a', '#2dd4bf', 1.8);
  bricks(g, -25, -26, 50, 54);
  if (v2) {
    for (let i = 0; i < 4; i++) {
      rr(g, -25 + i * 14, -31, 8, 6, 1);
      paint(g, GOLD);
    }
    armor(g, -28, 8, 56, 10);
  }
  rr(g, -16, -14, 32, 16, 3);
  paint(g, '#042f2e', '#99f6e4', 1);
  txt(g, 'WAF', 0, -5.5, 10, '#f0fdfa', 900);
  cracks(g, hp, -6, -22, 46, '#042f2e');
};

const wafLayers: DefBody = (g, a) => {
  const { t, hp, kick } = a;
  const v2 = isV2(a);
  teamBase(g, 58, t);
  g.translate(shake(a), 0);
  const n = v2 ? 4 : 3;
  const x0 = -22 - (n - 1) * 2.5;
  for (let i = 0; i < n; i++) {
    const front = i === n - 1;
    rr(g, x0 + i * 5, -42 + i * 3, 40, 70 - i * 3, 5);
    paint(g, front ? 'rgba(19,78,74,0.9)' : 'rgba(45,212,191,0.16)', front && v2 ? GOLD : '#2dd4bf', 1.5);
  }
  const cx = x0 + (n - 1) * 5 + 20;
  g.beginPath();
  g.moveTo(cx, -24);
  g.lineTo(cx + 12, -19);
  g.lineTo(cx + 10, -4);
  g.lineTo(cx, 4);
  g.lineTo(cx - 10, -4);
  g.lineTo(cx - 12, -19);
  g.closePath();
  paint(g, kick > 0.3 ? '#0f766e' : '#115e59', '#99f6e4', 1.8);
  txt(g, 'WAF', cx, -11, 8, '#f0fdfa', 900);
  txt(g, `${n} filtros`, cx, 16, 6, '#99f6e4', 800);
  cracks(g, hp, cx - 8, -36, 56, '#042f2e');
};

const wafGate: DefBody = (g, a) => {
  const { t, hp, kick } = a;
  const v2 = isV2(a);
  teamBase(g, 58, t);
  g.translate(shake(a), 0);
  rr(g, -26, -44, 52, 72, 4);
  paint(g, '#042f2e', '#2dd4bf', 2);
  const n = v2 ? 7 : 5;
  for (let i = 0; i < n; i++) {
    const x = -20 + (i * 40) / (n - 1);
    line(g, x, -30, x, 26, kick > 0.3 ? '#f87171' : '#5eead4', v2 ? 3.5 : 3);
  }
  rr(g, -26, -12, 52, 7, 2);
  paint(g, '#134e4a', '#2dd4bf', 1.2);
  if (v2) {
    rr(g, -26, 8, 52, 7, 2);
    paint(g, '#134e4a', '#2dd4bf', 1.2);
    for (const [x, y] of [[-26, -44], [26, -44], [-26, 28], [26, 28]]) {
      circ(g, x, y, 3);
      paint(g, GOLD);
    }
  }
  rr(g, -16, -41, 32, 11, 2);
  paint(g, '#134e4a', '#99f6e4', 1);
  txt(g, 'WAF', 0, -35.5, 8, '#f0fdfa', 900);
  cracks(g, hp, -6, -28, 52, '#99f6e4');
};

/* ======================= CDN Edge (v2: damage ×2 → bigger outputs) ======================= */

const cdnTower: DefBody = (g, a) => {
  const { t, kick } = a;
  const v2 = isV2(a);
  teamBase(g, 56, t);
  // lattice
  line(g, -14, 28, -4, -30, '#f472b6', 2);
  line(g, 14, 28, 4, -30, '#f472b6', 2);
  g.strokeStyle = 'rgba(244,114,182,0.6)';
  g.lineWidth = 1.2;
  g.beginPath();
  for (let i = 0; i < 5; i++) {
    const y1 = 28 - i * 11.6;
    const y2 = y1 - 11.6;
    const w1 = 14 - i * 2;
    const w2 = 14 - (i + 1) * 2;
    g.moveTo(-w1, y1);
    g.lineTo(w2, y2);
    g.moveTo(w1, y1);
    g.lineTo(-w2, y2);
  }
  g.stroke();
  const [pw, ph] = v2 ? [18, 12] : [13, 9];
  for (const [ang, y] of [[-0.5, -24], [0, -10], [0.5, 4]] as [number, number][]) {
    g.save();
    g.translate(6, y);
    g.rotate(ang);
    rr(g, -kick * 2, -ph / 2, pw, ph, 2);
    paint(g, '#be185d', v2 ? GOLD : '#fbcfe8', 1.5);
    g.restore();
  }
  circ(g, 0, -32, 3);
  paint(g, Math.sin(t * 4) > 0 ? '#f472b6' : '#500724');
  rr(g, -12, 14, 18, 9, 2);
  paint(g, '#500724', '#f472b6', 1);
  txt(g, 'CDN', -3, 18.5, 6, '#fce7f3', 900);
};

const cdnCabinet: DefBody = (g, a) => {
  const { t, kick } = a;
  const v2 = isV2(a);
  teamBase(g, 56, t);
  const [pw, ph] = v2 ? [16, 13] : [12, 10];
  rr(g, -22, -40, 40, 68, 5);
  paint(g, '#500724', '#f472b6', 1.8);
  txt(g, 'CDN', -2, -35, 7, '#fce7f3', 900);
  ([[-26, '↗'], [-6, '→'], [14, '↘']] as [number, string][]).forEach(([y, arrow], i) => {
    rr(g, 16 - kick * 3, y - ph / 2, pw, ph, 3);
    paint(g, '#be185d', v2 ? GOLD : '#fbcfe8', 1.3);
    txt(g, arrow, 4, y, 10, '#f9a8d4', 900);
    circ(g, -12, y, 1.8);
    paint(g, led(Math.sin(t * 6 - i) > 0));
  });
  if (v2) goldBand(g, -22, 24, 40);
};

const cdnLighthouse: DefBody = (g, a) => {
  const { t, kick, action } = a;
  const v2 = isV2(a);
  teamBase(g, 54, t);
  // beams to the 3 lanes
  const lampR = v2 ? 5.5 : 4;
  for (const ang of [-0.35, 0, 0.35]) {
    g.save();
    g.translate(0, -26);
    g.rotate(ang);
    g.fillStyle = `rgba(253,224,71,${(v2 ? 0.3 : 0.2) + (action ? 0.2 * kick : 0) + 0.05 * Math.sin(t * 5)})`;
    g.beginPath();
    g.moveTo(0, -2);
    g.lineTo(36, -7);
    g.lineTo(36, 7);
    g.lineTo(0, 2);
    g.closePath();
    g.fill();
    g.restore();
  }
  g.beginPath();
  g.moveTo(-14, 28);
  g.lineTo(14, 28);
  g.lineTo(9, -20);
  g.lineTo(-9, -20);
  g.closePath();
  paint(g, '#fbcfe8', '#be185d', 1.5);
  g.fillStyle = '#be185d';
  g.fillRect(-12, 10, 24, 7);
  g.fillRect(-10, -6, 20, 7);
  rr(g, -11, -32, 22, 12, 3);
  paint(g, '#1f2937', '#f472b6', 1.5);
  circ(g, 0, -26, lampR);
  paint(g, '#fde047');
  g.beginPath();
  g.moveTo(-13, -32);
  g.lineTo(13, -32);
  g.lineTo(0, -42);
  g.closePath();
  paint(g, v2 ? GOLD : '#be185d');
  txt(g, 'CDN', 0, 21.5, 6, '#fce7f3', 900);
};

/* ======================= Kafka (v2: holds 7 s, recharges faster) ======================= */

function readyLeds(g: G, x: number, y: number, n: number, a: DefAnim): void {
  for (let i = 0; i < n; i++) {
    const on = a.busy ? Math.floor(a.t * 8) % n === i : i / n < a.ready;
    rr(g, x + i * 7, y, 5, 4, 1);
    paint(g, on ? '#fdba74' : '#7c2d12');
  }
}

const kafkaMailbox: DefBody = (g, a) => {
  const { t, busy } = a;
  const v2 = isV2(a);
  const w = v2 ? 30 : 26;
  teamBase(g, 60, t);
  rr(g, -3, 6, 6, 22, 1);
  paint(g, '#78716c');
  g.beginPath();
  g.moveTo(-w, 8);
  g.lineTo(-w, -14);
  g.arc(0, -14, w, Math.PI, 0);
  g.lineTo(w, 8);
  g.closePath();
  paint(g, '#431407', '#fb923c', 1.8);
  const slots = v2 ? [-14, -6] : [-10];
  for (const y of slots) {
    rr(g, -14, y, 28, 4, 2);
    paint(g, '#1c0a03');
  }
  // envelope going in
  const p = (t * 0.8) % 1;
  if (!busy) {
    rr(g, -6, -10 - 12 * (1 - p), 12, 8, 1);
    g.globalAlpha = 1 - p;
    paint(g, '#ffedd5', '#c2410c', 1);
    g.globalAlpha = 1;
  }
  // flag: up while holding a threat
  g.save();
  g.translate(w - 2, -12);
  g.rotate(busy ? -Math.PI / 2 : 0);
  rr(g, 0, -2, 12, 4, 1);
  paint(g, '#78716c');
  rr(g, 8, -6, 8, 6, 1);
  paint(g, '#dc2626');
  g.restore();
  txt(g, 'kafka', 0, 0, 7, '#ffedd5', 900);
  readyLeds(g, -16, 3, 5, a);
  if (v2) goldBand(g, -w, -16, 2 * w);
};

const kafkaCabinet: DefBody = (g, a) => {
  const { t, busy } = a;
  const v2 = isV2(a);
  teamBase(g, 56, t);
  rr(g, -24, -40, 48, 68, 4);
  paint(g, '#431407', '#fb923c', 1.8);
  const n = v2 ? 4 : 3;
  const h = 60 / n;
  const open = busy ? Math.floor(t * 2) % n : -1;
  for (let i = 0; i < n; i++) {
    const y = -36 + i * h;
    const out = i === open ? 6 : 0;
    const lit = !busy && i / n < a.ready;
    rr(g, -20 + out, y, 40, h - 3, 3);
    paint(g, lit ? '#9a3412' : '#7c2d12', '#fdba74', 1);
    rr(g, -6 + out, y + (h - 3) / 2 - 1.5, 12, 3, 1.5);
    paint(g, '#fdba74');
    txt(g, `P${i}`, -13 + out, y + (h - 3) / 2, 6, '#ffedd5', 800);
  }
  if (v2) goldBand(g, -24, -43, 48);
};

const kafkaCage: DefBody = (g, a) => {
  const { t, busy } = a;
  const v2 = isV2(a);
  teamBase(g, 66, t);
  rr(g, -28, -26, 56, 54, 4);
  paint(g, 'rgba(67,20,7,0.55)', '#fb923c', 2);
  for (let i = 0; i < 6; i++) {
    const x = -20 + i * 8;
    line(g, x, -26, x, 28, busy ? '#fdba74' : 'rgba(251,146,60,0.55)', v2 ? 2.4 : 1.5);
  }
  if (v2) {
    for (const [x, y] of [[-28, -26], [28, -26], [-28, 28], [28, 28]]) {
      circ(g, x, y, 3);
      paint(g, GOLD);
    }
  }
  // rail with messages on top
  rr(g, -32, -38, 64, 10, 3);
  paint(g, '#7c2d12', '#fb923c', 1.2);
  const off = busy ? 0 : (t * 10) % 14;
  g.save();
  rr(g, -32, -38, 64, 10, 3);
  g.clip();
  for (let i = -1; i < 5; i++) {
    rr(g, -30 + i * 14 + off, -36, 9, 6, 1);
    paint(g, '#ffedd5');
  }
  g.restore();
  txt(g, 'kafka', 0, -42, 6, '#fdba74', 900);
  readyLeds(g, -17, 20, 5, a);
};

/* ======================= Rollback (no upgrade) ======================= */

const rbArrow: DefBody = (g, a) => {
  const { t, action } = a;
  for (const x of [-8, 8]) {
    circ(g, x, 14, 4);
    paint(g, '#083344', '#22d3ee', 1.5);
  }
  rr(g, -14, 6, 28, 6, 2);
  paint(g, '#0e4f63', '#22d3ee', 1);
  g.save();
  g.translate(0, -6);
  g.rotate(action ? -t * 12 : 0);
  g.strokeStyle = '#22d3ee';
  g.lineWidth = 5;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(0, 0, 9, Math.PI * 0.25, Math.PI * 1.6);
  g.stroke();
  g.lineCap = 'butt';
  const ex = Math.cos(Math.PI * 1.6) * 9;
  const ey = Math.sin(Math.PI * 1.6) * 9;
  g.fillStyle = '#22d3ee';
  g.beginPath();
  g.moveTo(ex + 7, ey);
  g.lineTo(ex - 3, ey - 6);
  g.lineTo(ex - 3, ey + 6);
  g.closePath();
  g.fill();
  g.restore();
};

const rbKeys: DefBody = (g, a) => {
  const { t, action } = a;
  const press = (i: number): number => (action ? Math.max(0, Math.sin(t * 14 + i * Math.PI)) * 2 : 0);
  rr(g, -24, -4, 48, 18, 4);
  paint(g, '#03141a');
  rr(g, -23, -11 + press(0), 22, 20, 4);
  paint(g, '#0e4f63', '#22d3ee', 1.5);
  txt(g, 'Ctrl', -12, -1.5 + press(0), 6, '#a5f3fc', 900);
  rr(g, 1, -11 + press(1), 22, 20, 4);
  paint(g, '#0e4f63', '#22d3ee', 1.5);
  txt(g, 'Z', 12, -1.5 + press(1), 11, '#a5f3fc', 900);
};

const rbRoller: DefBody = (g, a) => {
  const { t, action } = a;
  line(g, 4, -2, 16, -22, '#94a3b8', 2.5);
  rr(g, 12, -27, 9, 6, 2);
  paint(g, '#475569');
  rr(g, -16, -8, 32, 20, 10);
  paint(g, '#083344', '#22d3ee', 2);
  g.save();
  rr(g, -16, -8, 32, 20, 10);
  g.clip();
  const off = ((action ? t * 40 : t * 3) % 8) - 8;
  for (let x = -16 + off; x < 16; x += 8) line(g, x, -8, x + 4, 12, 'rgba(34,211,238,0.35)', 2);
  g.restore();
  undoArrow(g, 0, 2, 5, '#a5f3fc', action ? -t * 12 : 0);
};

/* ======================= Exports ======================= */

export const DEF_OPTIONS_R2: Record<DefItem, Record<Pick, { name: string; body: DefBody }>> = {
  worker: {
    A: { name: 'Torre con gráfica', body: workerChart },
    B: { name: 'Turbina de energía', body: workerTurbine },
    C: { name: 'Contenedores apilados', body: workerContainers },
  },
  loadBalancer: {
    A: { name: 'Switch de red', body: lbSwitch },
    B: { name: 'Balanza', body: lbScale },
    C: { name: 'Rueda round-robin', body: lbRoundRobin },
  },
  redis: {
    A: { name: 'Módulos de RAM', body: redisRam },
    B: { name: 'Bloques de llaves', body: redisBricks },
    C: { name: 'Hexágono blindado', body: redisHex },
  },
  rateLimiter: {
    A: { name: 'Embudo', body: rateFunnel },
    B: { name: 'Válvula', body: rateValve },
    C: { name: 'Pantalla con límite', body: rateScreen },
  },
  circuitBreaker: {
    A: { name: 'Cuadro de interruptores', body: cbPanel },
    B: { name: 'Temporizador', body: cbTimer },
    C: { name: 'Enchufe que se desconecta', body: cbPlug },
  },
  waf: {
    A: { name: 'Muro con fuego (firewall)', body: wafFlame },
    B: { name: 'Capas de filtros', body: wafLayers },
    C: { name: 'Reja', body: wafGate },
  },
  cdn: {
    A: { name: 'Torre de antenas', body: cdnTower },
    B: { name: 'Armario de 3 salidas', body: cdnCabinet },
    C: { name: 'Faro', body: cdnLighthouse },
  },
  kafka: {
    A: { name: 'Buzón', body: kafkaMailbox },
    B: { name: 'Archivador de particiones', body: kafkaCabinet },
    C: { name: 'Jaula con cola de mensajes', body: kafkaCage },
  },
  rollback: {
    A: { name: 'Flecha deshacer con ruedas', body: rbArrow },
    B: { name: 'Teclas Ctrl + Z', body: rbKeys },
    C: { name: 'Rodillo que barre', body: rbRoller },
  },
};
