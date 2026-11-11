import type { DefenseType } from '../config';
import { DEFENSES } from '../config';
import { TAU, txt, type G } from './shapes';
import { faceQuad, fillQuad, GOLD, groundShadow, inArkiBox, isoBox, lamp, pad, paletteOf, poly, shade, type Look } from './isoKit';

/*
 * Defense avatars chosen by the user on the avatar picker page (defense round 4, option A):
 * the style of Design the Arki (isometric buildings on a dark pad, one colour per building,
 * yellow windows). Load Balancer = relay tower, Redis = cache crystal and Worker Node = factory,
 * the same buildings as in Arki. v2 (upgraded) adds the upgrade as a part (2nd chimney,
 * 2nd barrier…) and a gold pad edge. Shapes use Arki's 64 × 64 box (pad centre at 32, 50).
 * The picker page also draws the "rich" look (gradients and glow) with the same code.
 *
 * Each body draws centered at (0, 0), about 70×70; the pad's front corner is at y = 37.
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

const isV2 = (a: DefenseAnim): boolean => a.level === 2;
const shake = (a: DefenseAnim): number => (a.kick > 0 ? Math.sin(a.t * 70) * 1.5 * a.kick : 0);

type Build = (g: G, a: DefenseAnim, L: Look) => void;

const ROLLBACK_COLOR = '#22d3ee';

/** 0..1 that goes up and down slowly (idle pulse). */
const pulse = (t: number, speed = 3, phase = 0): number => 0.5 + 0.5 * Math.sin(t * speed + phase);

/* ======================= Worker Node: factory ======================= */

function smoke(g: G, x: number, y: number, t: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const k = (t * 0.5 + i / n) % 1;
    g.globalAlpha = 0.55 * (1 - k);
    g.fillStyle = '#9aa3b2';
    g.beginPath();
    g.arc(x + k * 5, y - k * 16, 1.8 + k * 3, 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;
}

const worker: Build = (g, a, L) => {
  const v2 = isV2(a);
  const { p } = L;
  smoke(g, 23, 20, a.t, 3);
  isoBox(g, L, 29, 47, 17, 15);
  fillQuad(g, L, faceQuad('left', 29, 47, 17, 0.55, 0.85, 0, 8), '#0b1114');
  // windows light up one by one while the CU charges; all flash when they are ready
  const flash = a.charge > 0.92;
  [0.12, 0.42, 0.72].forEach((u, i) => {
    const on = a.charge > (i + 1) / 4;
    const c = flash ? '#ffffff' : on ? p.window : '#3a3f4a';
    fillQuad(g, L, faceQuad('right', 29, 47, 17, u, u + 0.2, 7, 11), c, on);
  });
  isoBox(g, L, 23, 31, 3.5, 10);
  isoBox(g, L, 33, 29, 3, 7);
  if (v2) {
    // makes double CU: a second production line with its own chimney
    smoke(g, 37, 22, a.t + 0.5, 3);
    isoBox(g, L, 37, 35, 3, 9);
    fillQuad(g, L, faceQuad('right', 37, 35, 3, 0, 1, 6.5, 8), GOLD);
  }
  isoBox(g, L, 47, 50, 7, 8);
  fillQuad(g, L, faceQuad('right', 47, 50, 7, 0.25, 0.75, 3, 5.5), v2 ? GOLD : p.window, true);
};

/* ======================= Load Balancer: relay tower ======================= */

const loadBalancer: Build = (g, a, L) => {
  const { p } = L;
  const v2 = isV2(a);
  isoBox(g, L, 32, 48, 14, 6);
  isoBox(g, L, 32, 41, 2.5, 26);
  g.lineCap = 'round';
  g.lineWidth = 1.4;
  g.strokeStyle = p.light;
  g.beginPath();
  g.moveTo(32, 20);
  g.lineTo(18, 27);
  g.moveTo(32, 20);
  g.lineTo(46, 27);
  g.moveTo(32, 26);
  g.lineTo(22, 31);
  g.moveTo(32, 26);
  g.lineTo(42, 31);
  if (v2) {
    // shoots 2 packets: a second pair of arms
    g.moveTo(32, 32);
    g.lineTo(25, 35.5);
    g.moveTo(32, 32);
    g.lineTo(39, 35.5);
  }
  g.stroke();
  const dish = (x: number, y: number, c: string): void => {
    g.beginPath();
    g.ellipse(x, y, 3.4, 2, 0, 0, TAU);
    g.fillStyle = c;
    g.fill();
    g.lineWidth = 0.5;
    g.strokeStyle = p.dark;
    g.stroke();
  };
  dish(18, 27, p.top);
  dish(46, 27, p.top);
  if (v2) {
    dish(25, 35.5, GOLD);
    dish(39, 35.5, GOLD);
  }
  const firing = a.kick > 0;
  const on = firing ? 0.5 + 0.5 * a.kick : 0.6 + 0.4 * pulse(a.t);
  lamp(g, L, 32, 12, 2.6, p.glow, on);
  // signal arcs; when it fires they fly out to the right
  const out = firing ? (1 - a.kick) * 6 : 0;
  g.lineWidth = 1.2;
  g.strokeStyle = p.glow;
  g.globalAlpha = firing ? 0.3 + 0.7 * a.kick : 0.8;
  g.beginPath();
  g.arc(32 + out, 16, 10 + out, -1.2, -0.35);
  g.stroke();
  g.beginPath();
  g.arc(32, 16, 10, Math.PI + 0.35, Math.PI + 1.2);
  g.stroke();
  g.globalAlpha = 1;
};

/* ======================= Redis: cache crystal ======================= */

const redis: Build = (g, a, L) => {
  const { p } = L;
  const v2 = isV2(a);
  isoBox(g, L, 32, 50, 16, v2 ? 10 : 7);
  if (v2) {
    // health ×2: armoured base with two pylons
    fillQuad(g, L, faceQuad('right', 32, 50, 16, 0, 1, 7, 8.5), GOLD);
    fillQuad(g, L, faceQuad('left', 32, 50, 16, 0, 1, 7, 8.5), shade(GOLD, -0.3));
    isoBox(g, L, 17, 50, 3, 14);
    isoBox(g, L, 47, 50, 3, 14);
    lamp(g, L, 17, 34, 1.3, GOLD, pulse(a.t, 4));
    lamp(g, L, 47, 34, 1.3, GOLD, pulse(a.t, 4, 1));
  }
  const lift = v2 ? 3 : 0;
  g.globalAlpha = 0.35 + 0.25 * pulse(a.t);
  g.beginPath();
  g.ellipse(32, 43 - lift, 9, 4.5, 0, 0, TAU);
  g.fillStyle = p.glow;
  g.fill();
  g.globalAlpha = 1;
  const dy = Math.sin(a.t * 2) * 1.5 - lift;
  // ring around the crystal, with a dot going round
  g.lineWidth = 1;
  g.strokeStyle = p.light;
  g.globalAlpha = 0.7;
  g.beginPath();
  g.ellipse(32, 23 + dy, 15, 4.5, 0, 0, TAU);
  g.stroke();
  g.globalAlpha = 1;
  const ang = a.t * 2;
  lamp(g, L, 32 + Math.cos(ang) * 15, 23 + dy + Math.sin(ang) * 4.5, 1.2, p.glow);
  g.save();
  g.translate(shake(a), dy);
  poly(g, [[32, 6], [41, 22], [32, 38], [23, 22]]);
  g.fillStyle = p.light;
  g.fill();
  g.lineWidth = 0.6;
  g.strokeStyle = p.dark;
  g.stroke();
  poly(g, [[32, 6], [41, 22], [32, 38]]);
  g.fillStyle = p.base;
  g.fill();
  poly(g, [[32, 11], [36, 22], [32, 30], [28, 22]]);
  if (L.rich) {
    g.shadowColor = p.glow;
    g.shadowBlur = 6;
  }
  g.globalAlpha = 0.85;
  g.fillStyle = p.glow;
  g.fill();
  g.shadowBlur = 0;
  g.globalAlpha = 1;
  // takes hits: cracks on the crystal
  crystalCracks(g, a.hp);
  g.restore();
};

function crystalCracks(g: G, hp: number): void {
  g.lineWidth = 0.8;
  g.strokeStyle = '#1f0a0a';
  if (hp < 0.66) {
    g.beginPath();
    g.moveTo(29, 12);
    g.lineTo(31, 18);
    g.lineTo(28, 23);
    g.lineTo(30, 29);
    g.stroke();
  }
  if (hp < 0.33) {
    g.beginPath();
    g.moveTo(38, 18);
    g.lineTo(35, 23);
    g.lineTo(37, 27);
    g.stroke();
  }
}

/* ======================= Rate Limiter: toll gate ======================= */

const rateLimiter: Build = (g, a, L) => {
  const { p } = L;
  const v2 = isV2(a);
  isoBox(g, L, 22, 48, 9, 17);
  fillQuad(g, L, faceQuad('right', 22, 48, 9, 0.2, 0.8, 8, 13), p.window, true);
  // "429" sign on the roof
  isoBox(g, L, 22, 31, 6, 7, paletteOf(shade(p.base, -0.3)));
  txt(g, '429', 22, 27.5, 4.2, '#f5f3ff', 800);
  lamp(g, L, 22, 20, 1.5, '#f87171', a.kick > 0 ? a.kick : pulse(a.t, 2));
  // barrier: down at rest, lifts when it fires and falls again
  const bar = (y: number, color: string, lift: number): void => {
    g.save();
    g.translate(34, y);
    g.rotate(Math.atan2(0.5, 1) - lift * 0.9);
    for (let i = 0; i < 5; i++) {
      g.fillStyle = i % 2 ? '#f5f3ff' : color;
      g.fillRect(i * 4.4, -1.2, 4.4, 2.4);
    }
    g.restore();
  };
  isoBox(g, L, 34, 47, 2.2, 12);
  const lift = a.kick;
  bar(37, p.base, lift);
  if (v2) {
    // 2 packets of 429: a second barrier
    isoBox(g, L, 40, 50, 2, 8);
    bar(43, GOLD, Math.max(0, a.kick - 0.3));
  }
};

/* ======================= Circuit Breaker: switch box ======================= */

const circuitBreaker: Build = (g, a, L) => {
  const { p } = L;
  const armed = a.fuse !== undefined;
  const fuse = a.fuse ?? 1;
  g.save();
  if (armed) g.translate(Math.sin(a.t * 60) * (1 - fuse) * 1.2, 0);
  isoBox(g, L, 32, 49, 15, 20);
  // hazard stripes at the bottom of the right face
  for (let i = 0; i < 5; i++) fillQuad(g, L, faceQuad('right', 32, 49, 15, i * 0.2, i * 0.2 + 0.1, 1, 5), '#111827');
  // lever panel on the left face
  const panel = faceQuad('left', 32, 49, 15, 0.25, 0.75, 7, 16);
  fillQuad(g, L, panel, '#1f2937');
  const [px, py] = [(panel[0][0] + panel[1][0]) / 2, (panel[0][1] + panel[2][1]) / 2];
  const ang = armed ? 0.9 : -0.9; // up = ON, down = tripped
  g.lineCap = 'round';
  g.lineWidth = 1.8;
  g.strokeStyle = '#e5e7eb';
  g.beginPath();
  g.moveTo(px, py);
  g.lineTo(px + Math.sin(ang) * 2, py - Math.cos(ang) * 5);
  g.stroke();
  g.beginPath();
  g.arc(px + Math.sin(ang) * 2, py - Math.cos(ang) * 5, 1.4, 0, TAU);
  g.fillStyle = '#ef4444';
  g.fill();
  // lamp on the roof: green at rest, blinks red faster and faster while armed
  const blink = armed ? (Math.sin(a.t * (8 + (1 - fuse) * 30)) > 0 ? 1 : 0.2) : 0.6 + 0.4 * pulse(a.t, 2);
  lamp(g, L, 32, 25, 2.4, armed ? '#ef4444' : '#4ade80', blink);
  if (armed && fuse < 0.4) {
    // sparks
    g.strokeStyle = p.glow;
    g.lineWidth = 0.8;
    for (let i = 0; i < 5; i++) {
      const r = (a.t * 13 + i * 1.7) % TAU;
      g.beginPath();
      g.moveTo(32 + Math.cos(r) * 6, 25 + Math.sin(r) * 4);
      g.lineTo(32 + Math.cos(r) * 11, 25 + Math.sin(r) * 7);
      g.stroke();
    }
  }
  g.restore();
};

/* ======================= WAF: filter wall ======================= */

const waf: Build = (g, a, L) => {
  const { p } = L;
  const v2 = isV2(a);
  g.save();
  g.translate(shake(a), 0);
  isoBox(g, L, 32, 50, 14, 28);
  // filter slits on the right face: light runs through them
  for (let i = 0; i < 4; i++) {
    const v = 6 + i * 5.5;
    const lit = pulse(a.t, 3, i * 0.9);
    fillQuad(g, L, faceQuad('right', 32, 50, 14, 0.15, 0.85, v, v + 1.6), lit > 0.5 ? p.glow : shade(p.base, -0.5), lit > 0.5);
  }
  // shield on the left face
  const s = faceQuad('left', 32, 50, 14, 0.3, 0.7, 10, 20);
  fillQuad(g, L, s, shade(p.base, -0.6));
  const cx = (s[0][0] + s[1][0]) / 2;
  const cy = (s[0][1] + s[3][1]) / 2;
  poly(g, [[cx - 2.5, cy - 3.5], [cx + 2.5, cy - 4.5], [cx + 2.5, cy], [cx, cy + 3.5], [cx - 2.5, cy + 1]]);
  g.fillStyle = p.glow;
  g.fill();
  // battlements
  for (const [x, y] of [[23, 22], [32, 17.5], [41, 22], [32, 26.5]] as [number, number][]) isoBox(g, L, x, y, 2.6, 4, v2 ? paletteOf(GOLD) : L.p);
  {
    g.lineWidth = 0.9;
    g.strokeStyle = shade(p.base, -0.75);
    if (a.hp < 0.66) {
      g.beginPath();
      g.moveTo(40, 30);
      g.lineTo(38, 36);
      g.lineTo(41, 41);
      g.stroke();
    }
    if (a.hp < 0.33) {
      g.beginPath();
      g.moveTo(24, 32);
      g.lineTo(27, 38);
      g.lineTo(25, 44);
      g.stroke();
    }
  }
  g.restore();
  if (v2) {
    // health ×1.5: an extra filter screen in front
    g.globalAlpha = 0.55;
    isoBox(g, L, 50, 54, 4, 18, paletteOf(p.glow));
    g.globalAlpha = 1;
  }
};

/* ======================= CDN Edge: globe station ======================= */

const cdn: Build = (g, a, L) => {
  const { p } = L;
  const v2 = isV2(a);
  isoBox(g, L, 32, 49, 14, 11);
  // 3 emitters on the right face: one per lane
  for (let i = 0; i < 3; i++) {
    const on = a.kick > 0 ? a.kick : pulse(a.t, 3, i);
    fillQuad(g, L, faceQuad('right', 32, 49, 14, 0.12 + i * 0.3, 0.3 + i * 0.3, 4, 7), on > 0.5 ? (v2 ? GOLD : p.glow) : shade(p.base, -0.4), on > 0.5);
  }
  // globe
  const gx = 32;
  const gy = 24 - a.kick * 1.5;
  const r = 9;
  g.beginPath();
  g.arc(gx, gy, r, 0, TAU);
  if (L.rich) {
    const gr = g.createRadialGradient(gx - 3, gy - 3, 1, gx, gy, r);
    gr.addColorStop(0, p.top);
    gr.addColorStop(1, p.dark);
    g.fillStyle = gr;
  } else g.fillStyle = p.base;
  g.fill();
  g.lineWidth = 0.6;
  g.strokeStyle = p.dark;
  g.stroke();
  g.strokeStyle = p.top;
  g.lineWidth = 0.7;
  g.beginPath();
  g.ellipse(gx, gy, r, r * 0.3, 0, 0, TAU);
  g.stroke();
  // turning meridian
  g.beginPath();
  g.ellipse(gx, gy, Math.abs(Math.cos(a.t * 1.5)) * r, r, 0, 0, TAU);
  g.stroke();
  // stand
  isoBox(g, L, 32, 38, 2, 5);
  // satellites: 1 in v1, 2 in v2 (damage ×2), on a tilted orbit
  const sats = v2 ? 2 : 1;
  for (let i = 0; i < sats; i++) {
    const ang = a.t * 1.8 + i * Math.PI;
    lamp(g, L, gx + Math.cos(ang) * 14, gy + Math.sin(ang) * 4 - Math.cos(ang) * 2, 1.4, v2 ? GOLD : p.glow);
  }
};

/* ======================= Kafka: message queue ======================= */

const kafka: Build = (g, a, L) => {
  const { p } = L;
  const v2 = isV2(a);
  isoBox(g, L, 32, 50, 16, 4);
  // messages move along the queue; they stop while it holds a threat
  const tq = a.busy ? 0 : a.t;
  for (let i = 0; i < 3; i++) {
    const x = 18 + ((tq * 6 + i * 9.3) % 28);
    isoBox(g, L, x, 46, 3.6, 6, paletteOf(i % 2 ? p.light : p.base));
  }
  // arch with the "hold" ring
  const beam = v2 ? paletteOf(GOLD) : p;
  isoBox(g, L, 17, 46, 2, 22);
  isoBox(g, L, 47, 46, 2, 22);
  g.lineWidth = 2.4;
  g.strokeStyle = beam.base;
  g.beginPath();
  g.moveTo(17, 23);
  g.lineTo(47, 23);
  g.stroke();
  const hold = a.busy ? 1 : 0.35 + 0.25 * pulse(a.t);
  for (let k = 0; k < (v2 ? 2 : 1); k++) {
    g.globalAlpha = hold;
    g.lineWidth = 1.4;
    g.strokeStyle = p.glow;
    if (L.rich) {
      g.shadowColor = p.glow;
      g.shadowBlur = 6 * hold;
    }
    g.beginPath();
    g.ellipse(32, 31 + k * 6, 7 - k, 3 - k * 0.4, 0, 0, TAU);
    g.stroke();
    g.shadowBlur = 0;
  }
  g.globalAlpha = 1;
  // recharge bar on the beam
  g.fillStyle = '#111827';
  g.fillRect(22, 18.5, 20, 2.4);
  g.fillStyle = a.ready >= 1 ? '#4ade80' : beam.light;
  g.fillRect(22, 18.5, 20 * a.ready, 2.4);
};

/* ======================= Rollback: sweeper truck ======================= */

function rollbackTruck(g: G, running: boolean, t: number, L: Look): void {
  const { p } = L;
  groundShadow(g, 32, 54, 15);
  isoBox(g, L, 32, 52, 12, 9);
  // wheels on the left face
  for (const [x, y] of [[23.5, 53], [29.5, 56]] as [number, number][]) {
    g.beginPath();
    g.ellipse(x, y, 2.2, 2.8, -0.45, 0, TAU);
    g.fillStyle = '#0b1114';
    g.fill();
    g.lineWidth = 0.6;
    g.strokeStyle = p.dark;
    g.stroke();
  }
  // glowing blade at the front (right face)
  fillQuad(g, L, faceQuad('right', 32, 52, 12, 0.05, 0.95, 0.5, 5), p.glow, true);
  // big undo arrow on top: turns while it sweeps
  const rot = running ? t * 6 : Math.sin(t * 1.5) * 0.25;
  g.save();
  g.translate(32, 31);
  g.scale(1, 0.75);
  g.rotate(rot);
  g.lineCap = 'round';
  g.lineWidth = 2.4;
  g.strokeStyle = p.glow;
  if (L.rich) {
    g.shadowColor = p.glow;
    g.shadowBlur = 6;
  }
  g.beginPath();
  g.arc(0, 0, 8, -2.6, 1.6);
  g.stroke();
  poly(g, [[-8.5, -6.5], [-11, 1], [-3, -2.5]]);
  g.fillStyle = p.glow;
  g.fill();
  g.restore();
  isoBox(g, L, 32, 41, 2, 4);
}

/* ======================= tables ======================= */

const BUILDS: Record<DefenseType, Build> = { worker, loadBalancer, redis, rateLimiter, circuitBreaker, waf, cdn, kafka };

/** A defense body in the flat look (the game) or the rich look (picker page, round 4 option B). */
export function defenseBody(type: DefenseType, rich = false): DefenseBody {
  const L: Look = { rich, p: paletteOf(DEFENSES[type].color) };
  const build = BUILDS[type];
  return (g, a) =>
    inArkiBox(g, () => {
      pad(g, L, isV2(a));
      build(g, a, L);
    });
}

export const DEFENSE_ART: Record<DefenseType, DefenseBody> = Object.fromEntries(
  (Object.keys(BUILDS) as DefenseType[]).map((type) => [type, defenseBody(type)]),
) as Record<DefenseType, DefenseBody>;

/* ======================= Rollback ======================= */

/** The Rollback sweeper truck; while sweeping its undo arrow turns. */
export function rollbackArt(g: G, running: boolean, t: number, rich = false): void {
  const L: Look = { rich, p: paletteOf(ROLLBACK_COLOR) };
  inArkiBox(g, () => rollbackTruck(g, running, t, L), 1.2, 26);
}
