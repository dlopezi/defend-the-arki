import { circ, legs, line, MONO, padlock, paint, rr, TAU, txt, type Anim, type AvatarThreat, type G, type Pick } from './avatarOptions';

/*
 * Round 2 avatars: simple, technological, not monsters.
 * Shared style: flat shapes, a dark "screen" face with LED eyes looking left (toward the base),
 * one clear symbol per threat, 2 colors + 1 accent. No glows, no particles beyond a few rects.
 * Each body draws centered at (0, 0) with its feet on y = h/2, like the round 1 bodies.
 */

export interface Anim2 extends Anim {
  /** 0 while walking; 0..1 attack pulse while attacking. */
  atk: number;
}
export type Body2 = (g: G, a: Anim2) => void;

/* ---------------- Shared parts ---------------- */

/** Dark screen with two LED eyes looking left. Blinks now and then. */
export function face(g: G, x: number, y: number, w: number, h: number, led: string, t: number, seed = 0, bg = '#0b1224'): void {
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
export function antenna(g: G, x: number, y: number, len: number, stick: string, led: string, t: number): void {
  line(g, x, y, x + 2, y - len, stick, 1.5);
  circ(g, x + 2, y - len - 1.5, 2);
  paint(g, Math.sin(t * 5) > 0 ? led : '#1e293b');
}

/** Wheel with one turning spoke. */
export function wheel(g: G, x: number, y: number, r: number, t: number, fill: string, rim: string, speed = 4): void {
  circ(g, x, y, r);
  paint(g, fill, rim, 1.5);
  const a = -t * speed;
  line(g, x - Math.cos(a) * r * 0.7, y - Math.sin(a) * r * 0.7, x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, rim, 1.2);
}

/* ======================= Improved (chosen in round 1) ======================= */

/** Tráfico Normal: the current box, cleaner, with LED eyes and a "GET /" tab. */
export const normalPlus: Body2 = (g, a) => {
  const { w, h, t, atk } = a;
  legs(g, a, '#334155', 9, 12, 7);
  // little arm that knocks on the defense
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

/** Scraper Bot: the current spider bot, with a scan beam and cleaner legs. */
export const scraperPlus: Body2 = (g, a) => {
  const { h, t, atk } = a;
  const eyeX = -15 + ((Math.sin(t * 3) + 1) / 2) * 20;
  // scan beam toward the ground ahead (one flat triangle)
  g.fillStyle = `rgba(253,224,71,${0.2 + 0.15 * atk})`;
  g.beginPath();
  g.moveTo(eyeX, -h / 2 + 14);
  g.lineTo(-58, h / 2);
  g.lineTo(-30, h / 2);
  g.closePath();
  g.fill();
  // 4 legs with a knee joint
  for (let i = 0; i < 4; i++) {
    const hx = -15 + i * 10;
    const k = Math.sin(t * 10 + i * 1.7) * (atk ? 1.5 : 3.5);
    line(g, hx, 8, hx - 5 + k, 20, '#fdba74', 2.5);
    line(g, hx - 5 + k, 20, hx - 8 + k, h / 2, '#fdba74', 2.5);
    circ(g, hx - 5 + k, 20, 2);
    paint(g, '#9a3412');
  }
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

/** Botnet: camera + router + fridge, linked, with packets running between them. */
export const botnetPlus: Body2 = (g, a) => {
  const { t, atk } = a;
  const pulse = 0.5 + 0.5 * Math.sin(t * 5);
  const camY = -14 + Math.sin(t * 4) * 1.5;
  const rouY = -15 + Math.sin(t * 4 + 2) * 1.5;
  const nodes: [number, number][] = [
    [-20 - atk * 3, camY],
    [19 - atk * 3, rouY],
    [0, 12],
  ];
  // links
  g.strokeStyle = 'rgba(245,158,11,0.45)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(nodes[0][0], nodes[0][1]);
  g.lineTo(nodes[1][0], nodes[1][1]);
  g.lineTo(nodes[2][0], nodes[2][1]);
  g.closePath();
  g.stroke();
  // one packet per link
  for (let i = 0; i < 3; i++) {
    const p = (t * (0.7 + atk) + i / 3) % 1;
    const [x1, y1] = nodes[i];
    const [x2, y2] = nodes[(i + 1) % 3];
    g.fillStyle = '#fbbf24';
    g.fillRect(x1 + (x2 - x1) * p - 1.5, y1 + (y2 - y1) * p - 1.5, 3, 3);
  }
  const red = `rgba(239,68,68,${0.5 + 0.5 * pulse})`;
  // camera
  const [cx] = nodes[0];
  line(g, cx + 1, camY + 6, cx + 1, camY + 14, '#94a3b8', 2);
  rr(g, cx - 11, camY - 6, 22, 13, 3);
  paint(g, '#e5e7eb', '#94a3b8', 1);
  circ(g, cx - 7, camY + 0.5, 4.5);
  paint(g, '#111827');
  circ(g, cx - 7, camY + 0.5, 1.8);
  paint(g, red);
  // router
  const [rx] = nodes[1];
  line(g, rx - 7, rouY - 5, rx - 10, rouY - 13, '#64748b', 1.5);
  line(g, rx + 7, rouY - 5, rx + 10, rouY - 13, '#64748b', 1.5);
  rr(g, rx - 12, rouY - 5, 24, 10, 2);
  paint(g, '#1f2937', '#64748b', 1);
  for (let i = 0; i < 3; i++) {
    circ(g, rx - 6 + i * 6, rouY, 1.5);
    paint(g, red);
  }
  // fridge (walks)
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
export const botletPlus: Body2 = (g, a) => {
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

/* ======================= Black Friday ======================= */

export const bfRack: Body2 = (g, a) => {
  const { t, atk } = a;
  // casters + base
  rr(g, -38, 44, 76, 7, 2);
  paint(g, '#111827', '#facc15', 1.5);
  for (const x of [-28, -9, 9, 28]) wheel(g, x, 55, 5, t, '#374151', '#facc15', 3);
  // rack
  rr(g, -34, -56, 68, 100, 6);
  paint(g, '#1f2937', '#facc15', 2);
  face(g, -28, -50, 56, 20, atk > 0.5 ? '#ef4444' : '#facc15', t, 1.1);
  for (let i = 0; i < 4; i++) {
    const y = -22 + i * 15;
    rr(g, -28, y, 56, 11, 2);
    paint(g, '#374151');
    line(g, -24, y + 5.5, -6, y + 5.5, '#111827', 2);
    for (let j = 0; j < 3; j++) {
      circ(g, 12 + j * 6, y + 5.5, 1.7);
      paint(g, Math.floor(t * 6 + i * 2 + j) % 3 === 0 ? '#facc15' : '#22c55e');
    }
  }
  // "-70%" tag hanging in front (the signature)
  const swing = Math.sin(t * 3) * 0.12 - atk * 0.35;
  g.save();
  g.translate(-34, -14);
  g.rotate(swing);
  line(g, 0, 0, -6, 8, '#facc15', 1.5);
  rr(g, -24, 8, 26, 15, 3);
  paint(g, '#dc2626', '#fecaca', 1.5);
  txt(g, '-70%', -11, 15.5, 8, '#ffffff', 800);
  g.restore();
};

export const bfCart: Body2 = (g, a) => {
  const { t, atk } = a;
  g.translate(-atk * 8, 0);
  // wheels + struts
  line(g, -32, 30, -32, 46, '#facc15', 3);
  line(g, 24, 30, 24, 46, '#facc15', 3);
  wheel(g, -32, 52, 8, t, '#111827', '#facc15');
  wheel(g, 24, 52, 8, t, '#111827', '#facc15');
  // handle
  line(g, 40, -20, 52, -40, '#facc15', 3.5);
  line(g, 48, -40, 56, -40, '#facc15', 4);
  // monitor riding in the basket (the face)
  rr(g, -32, -56, 46, 32, 6);
  paint(g, '#374151', '#facc15', 2);
  face(g, -27, -51, 36, 22, atk > 0.5 ? '#ef4444' : '#facc15', t, 0.7);
  // boxes
  rr(g, 16, -38, 18, 18, 2);
  paint(g, '#a16207', '#facc15', 1);
  line(g, 25, -38, 25, -20, '#fde68a', 1.5);
  // basket
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
  g.moveTo(-42, 13);
  g.lineTo(35, 13);
  g.stroke();
  // sticker
  circ(g, -24, 4, 13);
  paint(g, '#dc2626', '#fecaca', 1.5);
  txt(g, '-70%', -24, 4.5, 8, '#ffffff', 800);
};

export const bfKiosk: Body2 = (g, a) => {
  const { t, atk } = a;
  // treads
  rr(g, -40, 42, 80, 16, 8);
  paint(g, '#111827', '#facc15', 1.5);
  for (let i = 0; i < 6; i++) {
    const x = -32 + ((i * 13 - t * 12) % 78 + 78) % 78;
    circ(g, x - 5, 50, 2.2);
    paint(g, '#374151');
  }
  rr(g, -36, -58, 72, 100, 8);
  paint(g, '#1f2937', '#facc15', 2);
  face(g, -30, -52, 60, 16, atk > 0.5 ? '#ef4444' : '#facc15', t, 0.2);
  // checkout screen: the bar fills, then overflows to 999%
  const flash = atk > 0.5;
  rr(g, -30, -30, 60, 42, 4);
  paint(g, flash ? '#450a0a' : '#0f172a');
  txt(g, flash ? 'SOLD OUT' : 'CHECKOUT', 0, -21, 7, flash ? '#fecaca' : '#facc15', 800);
  const prog = (t * 0.35) % 1.4;
  rr(g, -24, -12, 48, 8, 3);
  paint(g, '#1e293b');
  const full = prog >= 1;
  rr(g, -24, -12, 48 * Math.min(1, prog), 8, 3);
  paint(g, full ? '#ef4444' : '#facc15');
  txt(g, full ? '999%' : `${Math.round(prog * 100)}%`, 0, 4, 9, full ? '#f87171' : '#e2e8f0', 800);
  // card slot
  rr(g, -14, 22, 28, 4, 2);
  paint(g, '#030712');
  rr(g, -8, 30, 16, 6, 2);
  paint(g, '#dc2626');
};

/* ======================= DDoS ======================= */

export const ddosBlock: Body2 = (g, a) => {
  const { t, atk } = a;
  legs(g, a, '#7f1d1d', 14, 10, 10);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const i = r * 4 + c;
      const jx = Math.sin(t * 8 + i) * 0.8 - (c === 0 ? atk * 6 : 0);
      const jy = Math.cos(t * 7 + i * 1.3) * 0.8;
      const x = -30 + c * 15 + jx;
      const y = -34 + r * 15 + jy;
      rr(g, x, y, 14, 14, 2.5);
      const eye = r === 0 && c < 2;
      paint(g, eye ? '#1c0606' : i % 3 === 0 ? '#b91c1c' : '#dc2626', '#7f1d1d', 1);
      if (eye) {
        const blink = (t + 0.3) % 3.4 < 0.12;
        rr(g, x + 5, y + (blink ? 6.5 : 3), 4, blink ? 1.2 : 8, 1.2);
        paint(g, '#fecaca');
      }
    }
  }
  txt(g, 'DDoS', 0, 19, 8, '#fecaca', 800);
};

export const ddosSpeaker: Body2 = (g, a) => {
  const { t, atk } = a;
  // traffic waves to the left
  for (let i = 0; i < 3; i++) {
    const r = 8 + ((t * (30 + atk * 40) + i * 12) % 36);
    g.strokeStyle = `rgba(248,113,113,${Math.max(0, 1 - r / 44)})`;
    g.lineWidth = 2 + atk * 1.5;
    g.beginPath();
    g.arc(-24, 2, r, Math.PI * 0.75, Math.PI * 1.25);
    g.stroke();
  }
  wheel(g, -16, 32, 5, t, '#1f2937', '#fca5a5', 2);
  wheel(g, 18, 32, 5, t, '#1f2937', '#fca5a5', 2);
  rr(g, -26, -34, 54, 62, 6);
  paint(g, '#7f1d1d', '#fca5a5', 1.5);
  face(g, -18, -29, 36, 11, '#fecaca', t, 0.8);
  const k = 1 + 0.12 * Math.sin(t * 12) + atk * 0.15;
  circ(g, 1, 4, 16);
  paint(g, '#450a0a', '#fca5a5', 1.5);
  circ(g, 1, 4, 7 * k);
  paint(g, '#dc2626');
  circ(g, 1, 4, 2.5);
  paint(g, '#1c0606');
  txt(g, 'DDoS', 1, 23, 6, '#fecaca', 800);
};

export const ddosSwarm: Body2 = (g, a) => {
  const { t, atk } = a;
  const arrows: [number, number, number][] = [
    [32, -14, 6], [26, 16, 7], [24, -26, 7], [18, -4, 9], [4, 10, 10], [2, -18, 10], [-20, -4, 14],
  ];
  arrows.forEach(([x, y, s], i) => {
    const ax = x - atk * (4 + i * 1.2);
    const ay = y + Math.sin(t * 5 + i) * 2;
    g.beginPath();
    g.moveTo(ax - s, ay);
    g.lineTo(ax + s * 0.7, ay - s * 0.75);
    g.lineTo(ax + s * 0.25, ay);
    g.lineTo(ax + s * 0.7, ay + s * 0.75);
    g.closePath();
    paint(g, i === arrows.length - 1 ? '#ef4444' : i % 2 ? '#dc2626' : '#b91c1c', '#450a0a', 1.2);
  });
  // lead arrow has the LED eye
  const lx = -20 - atk * 11.2;
  const ly = -4 + Math.sin(t * 5 + 6) * 2;
  rr(g, lx - 2, ly - 3, 4, (t + 0.5) % 3.4 < 0.12 ? 1.2 : 6, 1.2);
  paint(g, '#fecaca');
  txt(g, 'x10⁶', 8, 28, 7, '#fca5a5', 800);
};

/* ======================= Zero-Day ======================= */

export const zeroGlitch: Body2 = (g, a) => {
  const { h, t, atk } = a;
  legs(g, a, '#701a75', 8, 11, 6);
  rr(g, -19, -h / 2 + 2, 38, 40, 6);
  paint(g, '#a21caf', '#f5d0fe', 1.5);
  face(g, -14, -h / 2 + 8, 28, 13, '#f5d0fe', t, 0.2, '#1a0b1f');
  txt(g, '0day', 0, 4, 8, '#fdf4ff', 800);
  // glitch: two shifted color bands now and then
  if (Math.floor(t * 6) % 7 === 0 || atk > 0.5) {
    g.fillStyle = 'rgba(34,211,238,0.75)';
    g.fillRect(-16, -12, 38, 3.5);
    g.fillStyle = 'rgba(244,114,182,0.75)';
    g.fillRect(-24, 7, 36, 3);
  }
};

export const zeroDrone: Body2 = (g, a) => {
  const { t, atk } = a;
  g.translate(-atk * 6, Math.sin(t * 6) * 2 - 6 + atk * 8);
  g.rotate(-atk * 0.3);
  // speed lines behind
  g.strokeStyle = 'rgba(232,121,249,0.5)';
  g.lineWidth = 1.5;
  g.beginPath();
  for (const [y, len] of [[-4, 12], [2, 16], [8, 10]] as const) {
    g.moveTo(20, y);
    g.lineTo(20 + len, y);
  }
  g.stroke();
  line(g, -9, -7, -14, -15, '#f5d0fe', 2);
  line(g, 9, -7, 14, -15, '#f5d0fe', 2);
  for (const x of [-14, 14]) {
    g.fillStyle = '#f5d0fe';
    g.beginPath();
    g.ellipse(x, -16, 1 + 10 * Math.abs(Math.cos(t * 40 + x)), 2, 0, 0, TAU);
    g.fill();
  }
  rr(g, -18, -8, 36, 17, 8);
  paint(g, '#a21caf', '#f5d0fe', 1.5);
  rr(g, -15, -4, 12, 9, 4);
  paint(g, '#1a0b1f');
  rr(g, -12, -2, 3, (t + 0.2) % 3.4 < 0.12 ? 1 : 5, 1);
  paint(g, '#f5d0fe');
  rr(g, -7, -2, 3, (t + 0.2) % 3.4 < 0.12 ? 1 : 5, 1);
  paint(g, '#f5d0fe');
  txt(g, '0', 7, 1, 12, '#fdf4ff', 900);
};

export const zeroKey: Body2 = (g, a) => {
  const { t, atk } = a;
  const hop = -Math.abs(Math.sin(t * 9)) * 3 * (1 - atk);
  g.translate(0, hop);
  legs(g, a, '#701a75', 5, 6, 5);
  g.save();
  g.translate(0, -12);
  g.rotate(atk * 0.6);
  g.translate(0, 12);
  // shaft + teeth
  rr(g, -3.5, -3, 7, 26, 2);
  paint(g, '#e879f9', '#f5d0fe', 1.2);
  rr(g, 3, 10, 7, 4, 1);
  paint(g, '#e879f9', '#f5d0fe', 1);
  rr(g, 3, 16, 9, 4, 1);
  paint(g, '#e879f9', '#f5d0fe', 1);
  // ring head with the face inside
  circ(g, 0, -14, 12);
  paint(g, '#a21caf', '#f5d0fe', 3);
  face(g, -7, -18.5, 14, 9, '#f5d0fe', t, 0.6, '#1a0b1f');
  g.restore();
  txt(g, '0day', 0, 31 - 4, 6, '#f5d0fe', 800);
};

/* ======================= SQL Injection ======================= */

export const sqliSyringe: Body2 = (g, a) => {
  const { t, atk } = a;
  legs(g, a, '#3f6212', 7, 14, 6);
  // needle + hub
  line(g, -16, -6, -28 - atk * 6, -6, '#cbd5e1', 2);
  rr(g, -18, -9, 4, 6, 1);
  paint(g, '#94a3b8');
  // plunger
  const push = atk * 7;
  line(g, 16, -6, 26 - push, -6, '#94a3b8', 3);
  rr(g, 25 - push, -14, 3, 16, 1);
  paint(g, '#94a3b8');
  // barrel
  rr(g, -14, -14, 30, 16, 3);
  paint(g, 'rgba(236,252,203,0.95)', '#4d7c0f', 1.5);
  rr(g, -13, -13, 22 - push, 14, 2);
  paint(g, '#84cc16');
  txt(g, 'OR 1=1', -2, -6, 6, '#1a2e05', 800);
  // head screen on top
  face(g, -9, -24, 16, 9, '#d9f99d', t, 0.9, '#1a2e05');
};

export const sqliDb: Body2 = (g, a) => {
  const { t, atk } = a;
  legs(g, a, '#3f6212', 8, 13, 6);
  const top = -22;
  const bot = 12;
  g.fillStyle = '#3f6212';
  g.beginPath();
  g.ellipse(0, bot, 18, 6, 0, 0, Math.PI);
  g.lineTo(-18, top);
  g.ellipse(0, top, 18, 6, 0, Math.PI, 0, true);
  g.closePath();
  paint(g, '#3f6212', '#bef264', 1.5);
  for (const y of [-11, 0]) {
    g.strokeStyle = '#bef264';
    g.lineWidth = 1.2;
    g.beginPath();
    g.ellipse(0, y, 18, 6, 0, 0, Math.PI);
    g.stroke();
  }
  g.beginPath();
  g.ellipse(0, top, 18, 6, 0, 0, TAU);
  paint(g, '#4d7c0f', '#bef264', 1.5);
  face(g, -11, top - 3.5, 18, 7, '#d9f99d', t, 0.3, '#1a2e05');
  // crack + injected code leaking out
  g.strokeStyle = '#1a2e05';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-8, -15);
  g.lineTo(-3, -8);
  g.lineTo(-8, -2);
  g.lineTo(-2, 5);
  g.stroke();
  const drift = (t * 0.8) % 1;
  g.globalAlpha = 1 - drift;
  txt(g, "';--", -16 - drift * 12 - atk * 6, -4 - drift * 6, 7, '#bef264', 800);
  g.globalAlpha = 1;
};

export const sqliTerminal: Body2 = (g, a) => {
  const { t, atk } = a;
  legs(g, a, '#3f6212', 8, 13, 6);
  rr(g, -21, -26, 42, 40, 4);
  paint(g, atk > 0.5 ? '#1a2e05' : '#0b1408', '#84cc16', 1.5);
  rr(g, -21, -26, 42, 7, 4);
  paint(g, '#365314');
  ['#f87171', '#facc15', '#84cc16'].forEach((c, i) => {
    circ(g, 14 - i * 5, -22.5, 1.5);
    paint(g, c);
  });
  // LED eyes in the window
  const blink = (t + 0.5) % 3.4 < 0.12;
  g.fillStyle = '#d9f99d';
  rr(g, -16, blink ? -14 : -16, 3, blink ? 1 : 5, 1);
  g.fill();
  rr(g, -10, blink ? -14 : -16, 3, blink ? 1 : 5, 1);
  g.fill();
  txt(g, '> DROP', -17, -5, 7, '#a3e635', 800, 'left');
  txt(g, 'TABLE;', -17, 3, 7, '#a3e635', 800, 'left');
  if (Math.sin(t * 6) > 0) {
    g.fillStyle = '#a3e635';
    g.fillRect(-17, 8, 5, 2);
  }
};

/* ======================= Ransomware ======================= */

export const ransomLock: Body2 = (g, a) => {
  const { t, atk } = a;
  legs(g, a, '#7f1d1d', 8, 12, 6);
  const lift = atk * 5;
  g.strokeStyle = '#fecaca';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(-10, -12);
  g.lineTo(-10, -16 - lift);
  g.arc(0, -16 - lift, 10, Math.PI, TAU);
  g.lineTo(10, -12 - lift);
  g.stroke();
  rr(g, -19, -13, 38, 30, 6);
  paint(g, '#dc2626', '#fecaca', 1.5);
  face(g, -13, -8, 26, 12, '#fecaca', t, 0.1, '#1c0606');
  circ(g, 0, 9, 2.6);
  paint(g, '#450a0a');
  g.fillStyle = '#450a0a';
  g.fillRect(-1, 10, 2, 5);
};

export const ransomFile: Body2 = (g, a) => {
  const { t } = a;
  legs(g, a, '#334155', 8, 12, 6);
  g.beginPath();
  g.moveTo(-16, -26);
  g.lineTo(8, -26);
  g.lineTo(16, -18);
  g.lineTo(16, 17);
  g.lineTo(-16, 17);
  g.closePath();
  paint(g, '#f1f5f9', '#94a3b8', 1.5);
  g.beginPath();
  g.moveTo(8, -26);
  g.lineTo(8, -18);
  g.lineTo(16, -18);
  paint(g, '#cbd5e1');
  face(g, -12, -22, 18, 9, '#f87171', t, 0.5, '#1c0606');
  for (const y of [-8, -2, 4, 10]) line(g, -11, y, 10, y, '#cbd5e1', 1.5);
  // chain across the file
  for (let i = 0; i < 6; i++) {
    const x = -20 + i * 8;
    const y = -12 + i * 4.4;
    g.strokeStyle = '#64748b';
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(x, y, i % 2 ? 2.2 : 4, i % 2 ? 4 : 2.2, 0.5, 0, TAU);
    g.stroke();
  }
  padlock(g, 2, -1, 0.55);
};

export const ransomTimer: Body2 = (g, a) => {
  const { t, atk } = a;
  legs(g, a, '#334155', 7, 9, 5);
  rr(g, -3, 10, 6, 7, 1);
  paint(g, '#475569');
  rr(g, -11, 16, 22, 4, 2);
  paint(g, '#475569');
  rr(g, -21, -27, 42, 38, 4);
  paint(g, '#1f2937', '#fca5a5', 1.5);
  rr(g, -18, -24, 36, 32, 2);
  paint(g, atk > 0.5 ? '#7f1d1d' : '#1c0606');
  face(g, -12, -22, 24, 7, '#fecaca', t, 0.9, 'rgba(0,0,0,0)');
  const s = 59 - (Math.floor(t) % 60);
  txt(g, `00:${String(s).padStart(2, '0')}`, 0, -9, 10, '#f87171', 800);
  padlock(g, 0, 0, 0.42);
};

/* ======================= Memory Leak (grows: drawn in a 40×44 box, then scaled) ======================= */

function leakBox(g: G, a: Anim2): Anim2 {
  g.scale(a.w / 40, a.h / 44);
  return { ...a, w: 40, h: 44 };
}

export const leakRam: Body2 = (g, a0) => {
  const a = leakBox(g, a0);
  const { t } = a;
  legs(g, a, '#3b0764', 8, 10, 5);
  // dripping bits under the pins
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.8 + i / 3) % 1;
    g.globalAlpha = 1 - p;
    g.fillStyle = '#c084fc';
    g.fillRect(-12 + i * 11, 11 + p * 11, 3, 3);
  }
  g.globalAlpha = 1;
  rr(g, -18, -14, 36, 23, 2);
  paint(g, '#6b21a8', '#d8b4fe', 1.5);
  for (let i = 0; i < 7; i++) {
    g.fillStyle = '#facc15';
    g.fillRect(-16 + i * 5, 7, 3, 3);
  }
  for (let i = 0; i < 3; i++) {
    rr(g, -15 + i * 11, -10, 9, 13, 1);
    paint(g, '#1e1b2e');
  }
  rr(g, -14, -7, 2, (t + 0.4) % 3.4 < 0.12 ? 1 : 5, 1);
  paint(g, '#e9d5ff');
  rr(g, -10, -7, 2, (t + 0.4) % 3.4 < 0.12 ? 1 : 5, 1);
  paint(g, '#e9d5ff');
  txt(g, 'RAM', 13, -18, 5, '#d8b4fe', 800);
};

export const leakBubble: Body2 = (g, a0) => {
  const a = leakBox(g, a0);
  const { t } = a;
  legs(g, a, '#3b0764', 6, 6, 5);
  g.save();
  g.translate(0, -2);
  g.scale(1 + 0.04 * Math.sin(t * 3), 1 - 0.04 * Math.sin(t * 3));
  circ(g, 0, 0, 18);
  paint(g, '#7e22ce', '#e9d5ff', 1.5);
  g.strokeStyle = 'rgba(255,255,255,0.35)';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(0, 0, 13, Math.PI * 1.1, Math.PI * 1.45);
  g.stroke();
  face(g, -11, -9, 20, 9, '#e9d5ff', t, 0.1, '#1e1b2e');
  txt(g, '1010', 0, 7, 6, '#e9d5ff', 800);
  g.restore();
};

export const leakBin: Body2 = (g, a0) => {
  const a = leakBox(g, a0);
  const { t } = a;
  legs(g, a, '#3b0764', 8, 7, 5);
  // bits piled above the rim, two spilling over the edge
  const pile: [number, number][] = [[-12, -10], [-6, -10], [0, -10], [6, -10], [12, -10], [-9, -15], [-3, -15], [3, -15], [9, -15], [-6, -20], [0, -20], [6, -20]];
  pile.forEach(([x, y], i) => {
    g.fillStyle = i % 3 ? '#c084fc' : '#e9d5ff';
    g.fillRect(x - 2.5, y - 2.5, 5, 5);
  });
  for (let i = 0; i < 2; i++) {
    const p = (t * 0.7 + i / 2) % 1;
    g.globalAlpha = 1 - p;
    g.fillStyle = '#c084fc';
    g.fillRect(17 + p * 3, -8 + p * 22, 4, 4);
  }
  g.globalAlpha = 1;
  rr(g, -17, -7, 34, 22, 3);
  paint(g, '#581c87', '#d8b4fe', 1.5);
  face(g, -12, -3, 24, 8, '#e9d5ff', t, 0.7, '#1e1b2e');
  txt(g, 'RAM 99%', 0, 10, 5.5, '#e9d5ff', 800);
};

/* ======================= Slowloris (moves very slowly) ======================= */

export const slowHourglass: Body2 = (g, a) => {
  const { t, atk } = a;
  legs(g, { ...a, step: Math.sin(t * 3) }, '#0c4a6e', 8, 10, 6);
  g.rotate(Math.sin(t * 20) * 0.04 * atk);
  const k = (t * 0.12) % 1;
  // glass
  g.fillStyle = 'rgba(186,230,253,0.18)';
  g.strokeStyle = '#7dd3fc';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(-13, -22);
  g.lineTo(13, -22);
  g.lineTo(1.5, -3);
  g.lineTo(13, 16);
  g.lineTo(-13, 16);
  g.lineTo(-1.5, -3);
  g.closePath();
  g.fill();
  g.stroke();
  // sand: top empties, bottom fills
  const ts = 1 - k;
  g.fillStyle = '#38bdf8';
  g.beginPath();
  g.moveTo(-11 * ts, -3 - 17 * ts);
  g.lineTo(11 * ts, -3 - 17 * ts);
  g.lineTo(0, -3);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(-12, 16);
  g.lineTo(12, 16);
  g.lineTo(0, 16 - 14 * k);
  g.closePath();
  g.fill();
  line(g, 0, -3, 0, 16 - 14 * k, '#38bdf8', 1);
  // frames (the top one is the face)
  line(g, -16, -24, -16, 18, '#0c4a6e', 3);
  line(g, 16, -24, 16, 18, '#0c4a6e', 3);
  rr(g, -19, -33, 38, 11, 3);
  paint(g, '#0c4a6e', '#7dd3fc', 1.5);
  face(g, -14, -31, 26, 7, '#bae6fd', t, 0.3);
  rr(g, -19, 16, 38, 6, 2);
  paint(g, '#0c4a6e', '#7dd3fc', 1.5);
};

export const slowSpinner: Body2 = (g, a) => {
  const { t } = a;
  legs(g, { ...a, step: Math.sin(t * 3) }, '#0c4a6e', 8, 12, 6);
  const head = Math.floor(t * 4) % 8;
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * TAU - Math.PI / 2;
    const age = (head - i + 8) % 8;
    circ(g, Math.cos(ang) * 16, -8 + Math.sin(ang) * 16, 3.4);
    paint(g, `rgba(56,189,248,${1 - age * 0.11})`);
  }
  circ(g, 0, -8, 10);
  paint(g, '#0c4a6e', '#7dd3fc', 1.5);
  face(g, -7, -12, 14, 8, '#bae6fd', t, 0.6);
  g.font = `700 6px ${MONO}`;
  txt(g, 'cargando…', 0, 15, 6, '#7dd3fc', 700);
};

export const slowPlug: Body2 = (g, a) => {
  const { t, atk } = a;
  // cable trailing behind on the ground
  g.strokeStyle = '#334155';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(18, 14);
  g.quadraticCurveTo(30, 30, 44, 30);
  g.stroke();
  // prongs (front)
  rr(g, -23 - atk * 4, 4, 9, 4, 1);
  paint(g, '#cbd5e1');
  rr(g, -23 - atk * 4, 14, 9, 4, 1);
  paint(g, '#cbd5e1');
  wheel(g, -6, 28, 4, t, '#1f2937', '#7dd3fc', 0.8);
  wheel(g, 10, 28, 4, t, '#1f2937', '#7dd3fc', 0.8);
  rr(g, -14, -4, 32, 30, 6);
  paint(g, '#0c4a6e', '#7dd3fc', 1.5);
  face(g, -10, 0, 22, 9, '#bae6fd', t, 0.2);
  // progress bar that barely moves
  rr(g, -10, 13, 22, 5, 2);
  paint(g, '#082f49');
  rr(g, -10, 13, 1.5 + ((t * 0.05) % 1) * 3, 5, 2);
  paint(g, '#38bdf8');
  txt(g, '1%', 2, 22, 5.5, '#bae6fd', 800);
};

/* ======================= Exports ======================= */

/** Threats chosen in round 1: one improved version each. */
export const IMPROVED: Partial<Record<AvatarThreat, Body2>> = {
  normal: normalPlus,
  scraper: scraperPlus,
  botnet: botnetPlus,
};
export const IMPROVED_BOTLET: Body2 = botletPlus;

/** Threats with no pick in round 1: 3 new options each. */
export const NEW_OPTIONS: Partial<Record<AvatarThreat, Record<Pick, { name: string; body: Body2 }>>> = {
  blackFriday: {
    A: { name: 'Rack de servidores', body: bfRack },
    B: { name: 'Carrito robot', body: bfCart },
    C: { name: 'Kiosco de pago', body: bfKiosk },
  },
  ddos: {
    A: { name: 'Bloque de paquetes', body: ddosBlock },
    B: { name: 'Altavoz de tráfico', body: ddosSpeaker },
    C: { name: 'Enjambre de flechas', body: ddosSwarm },
  },
  zeroDay: {
    A: { name: 'Cubo glitch', body: zeroGlitch },
    B: { name: 'Dron rápido', body: zeroDrone },
    C: { name: 'Llave maestra', body: zeroKey },
  },
  sqli: {
    A: { name: 'Jeringa', body: sqliSyringe },
    B: { name: 'Base de datos rota', body: sqliDb },
    C: { name: 'Terminal', body: sqliTerminal },
  },
  ransomware: {
    A: { name: 'Robot candado', body: ransomLock },
    B: { name: 'Archivo encadenado', body: ransomFile },
    C: { name: 'Cuenta atrás', body: ransomTimer },
  },
  memoryLeak: {
    A: { name: 'RAM que gotea', body: leakRam },
    B: { name: 'Burbuja de bytes', body: leakBubble },
    C: { name: 'Contenedor lleno', body: leakBin },
  },
  slowloris: {
    A: { name: 'Reloj de arena', body: slowHourglass },
    B: { name: 'Spinner de carga', body: slowSpinner },
    C: { name: 'Enchufe lento', body: slowPlug },
  },
};
