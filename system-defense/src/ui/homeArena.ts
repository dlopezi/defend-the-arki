import { t as tr } from '../i18n';
import { ENEMIES, type DefenseType, type EnemyType } from '../config';
import { drawCU, drawDefense, drawEnemy, drawProjectile } from '../render/sprites';
import { ease, type G } from './anim';

/*
 * Title screen background (full screen): defenses (left) face to face with threats (right)
 * on a perspective "data floor". Shooters fire packets across the screen (behind the menu),
 * threats flash when hit. At the start both teams walk in from the sides.
 * Drawn in CSS pixels on a canvas that covers the whole title screen.
 */

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

interface Row {
  /** Depth 0..1 on the floor (0 = horizon, 1 = bottom of the screen). */
  depth: number;
  /** Size of the characters on this row. */
  size: number;
  back: DefenseType;
  front: DefenseType;
  /** Front threat (it takes the hits) and back threat. */
  threats: [EnemyType, EnemyType];
  period: number;
  offset: number;
}

/** Phones: one small row below the menu. */
const NARROW_ROWS: Row[] = [{ depth: 0.62, size: 0.8, back: 'worker', front: 'loadBalancer', threats: ['normal', 'scraper'], period: 1.4, offset: 0 }];

const ROWS: Row[] = [
  { depth: 0.2, size: 0.74, back: 'kafka', front: 'cdn', threats: ['ddos', 'blackFriday'], period: 1.55, offset: 0.9 },
  { depth: 0.5, size: 0.9, back: 'waf', front: 'rateLimiter', threats: ['normal', 'scraper'], period: 1.75, offset: 0.5 },
  { depth: 0.82, size: 1.05, back: 'worker', front: 'loadBalancer', threats: ['zeroDay', 'sqli'], period: 1.4, offset: 0 },
];

/** Cheap stable pseudo-random number for particle i. */
const rnd = (i: number, k: number): number => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function sky(g: G, W: number, H: number, horizon: number, t: number): void {
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#02040a');
  bg.addColorStop(horizon / H, '#0a1633');
  bg.addColorStop(1, '#04070f');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // team light on each side
  const left = g.createRadialGradient(0, horizon, 0, 0, horizon, W * 0.55);
  left.addColorStop(0, 'rgba(56,189,248,0.20)');
  left.addColorStop(1, 'rgba(56,189,248,0)');
  g.fillStyle = left;
  g.fillRect(0, 0, W, H);
  const right = g.createRadialGradient(W, horizon, 0, W, horizon, W * 0.55);
  right.addColorStop(0, 'rgba(239,68,68,0.22)');
  right.addColorStop(1, 'rgba(239,68,68,0)');
  g.fillStyle = right;
  g.fillRect(0, 0, W, H);
  // falling data (0/1) in the sky
  g.font = `700 12px ${MONO}`;
  g.textAlign = 'center';
  for (let i = 0; i < 70; i++) {
    const x = rnd(i, 1) * W;
    const speed = 14 + rnd(i, 2) * 30;
    const y = ((rnd(i, 3) * horizon + t * speed) % (horizon + 20)) - 10;
    const fade = 1 - y / horizon;
    const blue = x < W / 2;
    g.fillStyle = blue ? `rgba(125,211,252,${0.22 * fade})` : `rgba(252,165,165,${0.22 * fade})`;
    g.fillText(rnd(i, 4 + Math.floor(t * 2 + i)) > 0.5 ? '1' : '0', x, y);
  }
}

function floor(g: G, W: number, H: number, horizon: number, t: number): void {
  const color = g.createLinearGradient(0, 0, W, 0);
  color.addColorStop(0, 'rgba(56,189,248,0.55)');
  color.addColorStop(0.5, 'rgba(167,139,250,0.35)');
  color.addColorStop(1, 'rgba(248,113,113,0.55)');
  g.save();
  g.beginPath();
  g.rect(0, horizon, W, H - horizon);
  g.clip();
  const fl = g.createLinearGradient(0, horizon, 0, H);
  fl.addColorStop(0, 'rgba(10,22,51,0.2)');
  fl.addColorStop(1, 'rgba(2,4,10,0.9)');
  g.fillStyle = fl;
  g.fillRect(0, horizon, W, H - horizon);
  g.strokeStyle = color;
  // lines toward the vanishing point
  g.lineWidth = 1;
  g.globalAlpha = 0.5;
  g.beginPath();
  for (let i = -14; i <= 14; i++) {
    g.moveTo(W / 2 + i * (W / 28) * 0.15, horizon);
    g.lineTo(W / 2 + i * (W / 28) * 2.2, H);
  }
  g.stroke();
  // lines that come toward the player
  for (let i = 0; i < 12; i++) {
    const z = (i / 12 + t * 0.08) % 1;
    const y = horizon + (H - horizon) * z * z;
    g.globalAlpha = 0.15 + 0.6 * z;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  g.restore();
  // horizon glow
  const glow = g.createLinearGradient(0, horizon - 2, 0, horizon + 2);
  glow.addColorStop(0, 'rgba(56,189,248,0)');
  glow.addColorStop(0.5, 'rgba(186,230,253,0.6)');
  glow.addColorStop(1, 'rgba(56,189,248,0)');
  g.fillStyle = glow;
  g.fillRect(0, horizon - 2, W, 4);
}

function header(g: G, W: number, t: number): void {
  g.font = `800 13px ${MONO}`;
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.fillStyle = '#38bdf8';
  g.fillText(tr('◀ DEFENSES', '◀ DEFENSAS'), 24, 30);
  g.textAlign = 'right';
  g.fillStyle = '#f87171';
  g.fillText(tr('THREATS ▶', 'AMENAZAS ▶'), W - 24, 30);
  // "VS" badge: half blue, half red, with a glow line to each side
  const cx = W / 2;
  const cy = 30;
  const r = 19 * (1 + Math.sin(t * 4) * 0.04);
  const glow = 0.35 + 0.25 * Math.sin(t * 4);
  const span = Math.min(260, W / 2 - 140);
  if (span > r) {
    const l = g.createLinearGradient(cx - span, 0, cx - r, 0);
    l.addColorStop(0, 'rgba(56,189,248,0)');
    l.addColorStop(1, `rgba(56,189,248,${glow + 0.3})`);
    g.fillStyle = l;
    g.fillRect(cx - span, cy - 1, span - r, 2);
    const rgt = g.createLinearGradient(cx + r, 0, cx + span, 0);
    rgt.addColorStop(0, `rgba(248,113,113,${glow + 0.3})`);
    rgt.addColorStop(1, 'rgba(248,113,113,0)');
    g.fillStyle = rgt;
    g.fillRect(cx + r, cy - 1, span - r, 2);
  }
  g.save();
  g.shadowColor = `rgba(255,255,255,${glow})`;
  g.shadowBlur = 14;
  g.beginPath();
  g.arc(cx, cy, r, Math.PI / 2, Math.PI * 1.5);
  g.closePath();
  g.fillStyle = '#0369a1';
  g.fill();
  g.beginPath();
  g.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2);
  g.closePath();
  g.fillStyle = '#b91c1c';
  g.fill();
  g.restore();
  g.strokeStyle = '#e2e8f0';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.stroke();
  g.font = `900 15px ${MONO}`;
  g.textAlign = 'center';
  g.fillStyle = '#ffffff';
  g.fillText('VS', cx, cy + 1);
}

/** Where a packet is and whether it just hit (p = phase 0..1 of the row's shot). */
function shot(p: number): { travel: number; hit: boolean; kick: number } {
  return { travel: Math.min(1, p / 0.7), hit: p >= 0.7 && p < 0.82, kick: p < 0.08 ? 1 - p / 0.08 : 0 };
}

/**
 * Draws one frame. `intro` = seconds since the title screen opened
 * (the teams walk in during the first second and a half).
 */
export function drawArena(g: G, W: number, H: number, t: number, intro: number): void {
  const horizon = H * 0.54;
  sky(g, W, H, horizon, t);
  floor(g, W, H, horizon, t);
  header(g, W, t);

  // Wide screens: 3 rows on the sides of the menu. Phones upright: 1 small row below it.
  // Phones in landscape (short and wide): 3 smaller rows on the sides.
  const short = H < 500 && W > H * 1.4;
  const narrow = W < 760 && !short;
  const k = narrow ? 1 : Math.min(1.3, W / 1068, short ? H / 600 : 9);
  const enter = ease(intro, 0.15, 1.5);
  const fight = intro > 1.5;
  // x of: back defense, front defense, front threat, back threat
  const xs = narrow ? [W * 0.11, W * 0.3, W * 0.7, W * 0.89] : [72 * k, 180 * k, W - 250 * k, W - 118 * k];

  (narrow ? NARROW_ROWS : ROWS).forEach((row, i) => {
    const feet = horizon + (H - horizon) * row.depth;
    const sc = row.size * k * (narrow ? 0.75 : 0.92);
    const p = ((t + row.offset) % row.period) / row.period;
    const s = shot(p);
    const inL = -(1 - enter) * (260 * k + i * 40);
    const inR = (1 - enter) * (260 * k + i * 40);

    // threats (right); the front one takes the hits
    const fx = xs[2] + Math.sin(t * 0.8 + i) * 8 + inR;
    const bx = xs[3] + Math.sin(t * 0.7 + i * 2) * 6 + inR;
    const [frontType, backType] = row.threats;
    for (const [type, x, front] of [
      [backType, bx, false],
      [frontType, fx, true],
    ] as [EnemyType, number, boolean][]) {
      const spec = ENEMIES[type];
      g.save();
      g.translate(x, feet - (spec.height / 2) * sc);
      g.scale(sc, sc);
      drawEnemy(g, type, 0, 0, spec.width, spec.height, t + i, {
        flash: fight && front && s.hit ? 0.08 : 0,
        slowed: fight && front && row.front === 'rateLimiter' && p > 0.7,
        state: 'walk',
        jumpHeight: 0,
      });
      g.restore();
    }

    // defenses (left)
    const dy = feet - 35 * sc;
    const backX = xs[0] + inL;
    const frontX = xs[1] + inL;
    for (const [type, x, front] of [
      [row.back, backX, false],
      [row.front, frontX, true],
    ] as [DefenseType, number, boolean][]) {
      g.save();
      g.translate(x, dy);
      g.scale(sc, sc);
      drawDefense(g, type, 0, 0, t + i, {
        kick: fight && front ? s.kick : 0,
        charge: (t * 0.35 + i * 0.3) % 1,
        trapReady: 1,
      });
      g.restore();
    }
    if (!fight) return;

    // the Worker makes CU now and then
    if (row.back === 'worker') {
      const c = (t * 0.35) % 1;
      if (c < 0.35) {
        g.save();
        g.translate(backX + 6, dy - 48 * sc - c * 60);
        g.scale(sc * 0.8, sc * 0.8);
        drawCU(g, 0, 0, 25, t, 1 - c / 0.35);
        g.restore();
      }
    }

    // packets flying across the screen (behind the menu)
    const x0 = frontX + 40 * sc;
    const x1 = fx - (ENEMIES[frontType].width / 2) * sc;
    const slow = row.front === 'rateLimiter';
    const py = dy - 4 * sc;
    if (p < 0.7) {
      const px = x0 + (x1 - x0) * s.travel;
      const packets: [number, number, number][] = [[px, py, 1]];
      if (row.front === 'cdn') packets.push([px, py - s.travel * 60, 1 - s.travel]);
      for (const [x, y, alpha] of packets) {
        g.save();
        g.globalAlpha = alpha;
        g.translate(x, y);
        g.scale(sc, sc);
        drawProjectile(g, 0, 0, slow);
        g.restore();
      }
    } else if (s.hit) {
      const k2 = (p - 0.7) / 0.12;
      g.strokeStyle = slow ? `rgba(196,181,253,${1 - k2})` : `rgba(134,239,172,${1 - k2})`;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(x1, py, 6 + k2 * 18, 0, Math.PI * 2);
      g.stroke();
    }
  });
}
