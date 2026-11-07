import { ENEMIES, type DefenseType, type EnemyType } from '../config';
import { drawCU, drawDefense, drawEnemy, drawProjectile } from '../render/sprites';
import type { G } from './anim';

/*
 * Home screen background: defenses (left) face to face with threats (right).
 * Shooters fire packets across the screen (behind the menu); threats flash when hit.
 * Drawn in CSS pixels on a canvas that covers the whole home panel.
 */

interface Lane {
  /** Feet line as a share of the height. */
  y: number;
  back: DefenseType;
  front: DefenseType;
  /** Front threat (it takes the hits) and back threat. */
  threats: [EnemyType, EnemyType];
  period: number;
  offset: number;
}

const LANES: Lane[] = [
  { y: 0.36, back: 'worker', front: 'loadBalancer', threats: ['sqli', 'scraper'], period: 1.4, offset: 0 },
  { y: 0.6, back: 'waf', front: 'rateLimiter', threats: ['normal', 'blackFriday'], period: 1.75, offset: 0.5 },
  { y: 0.84, back: 'kafka', front: 'cdn', threats: ['zeroDay', 'ddos'], period: 1.55, offset: 0.9 },
];

/** Where a packet is and whether it just hit (p = phase 0..1 of the lane's shot). */
function shot(p: number): { travel: number; hit: boolean; kick: number } {
  return { travel: Math.min(1, p / 0.7), hit: p >= 0.7 && p < 0.82, kick: p < 0.08 ? 1 - p / 0.08 : 0 };
}

export function drawArena(g: G, W: number, H: number, t: number): void {
  g.clearRect(0, 0, W, H);
  // team sides
  const left = g.createLinearGradient(0, 0, W * 0.45, 0);
  left.addColorStop(0, 'rgba(56,189,248,0.10)');
  left.addColorStop(1, 'rgba(56,189,248,0)');
  g.fillStyle = left;
  g.fillRect(0, 0, W * 0.45, H);
  const right = g.createLinearGradient(W, 0, W * 0.55, 0);
  right.addColorStop(0, 'rgba(239,68,68,0.12)');
  right.addColorStop(1, 'rgba(239,68,68,0)');
  g.fillStyle = right;
  g.fillRect(W * 0.55, 0, W * 0.45, H);

  // big "VS" in the middle, behind the title and the menu
  const pulse = 1 + Math.sin(t * 3) * 0.03;
  g.save();
  g.translate(W / 2, H * 0.52);
  g.scale(pulse, pulse);
  g.font = `900 ${Math.min(280, W * 0.3)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = 'rgba(148,163,184,0.07)';
  g.fillText('VS', 0, 0);
  g.restore();

  // team labels
  g.font = '800 13px ui-monospace, SFMono-Regular, Menlo, monospace';
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.fillStyle = '#38bdf8';
  g.fillText('◀ DEFENSAS', 24, 28);
  g.textAlign = 'right';
  g.fillStyle = '#f87171';
  g.fillText('AMENAZAS ▶', W - 24, 28);

  // "VS" badge between the two teams: half blue, half red, with a glow line to each side
  const cx = W / 2;
  const cy = 30;
  const r = 19 * (1 + Math.sin(t * 4) * 0.04);
  const glow = 0.35 + 0.25 * Math.sin(t * 4);
  const lineL = g.createLinearGradient(cx - 260, 0, cx - r, 0);
  lineL.addColorStop(0, 'rgba(56,189,248,0)');
  lineL.addColorStop(1, `rgba(56,189,248,${glow + 0.3})`);
  g.fillStyle = lineL;
  g.fillRect(cx - 260, cy - 1, 260 - r, 2);
  const lineR = g.createLinearGradient(cx + r, 0, cx + 260, 0);
  lineR.addColorStop(0, `rgba(248,113,113,${glow + 0.3})`);
  lineR.addColorStop(1, 'rgba(248,113,113,0)');
  g.fillStyle = lineR;
  g.fillRect(cx + r, cy - 1, 260 - r, 2);
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
  g.font = '900 15px ui-monospace, SFMono-Regular, Menlo, monospace';
  g.textAlign = 'center';
  g.fillStyle = '#ffffff';
  g.fillText('VS', cx, cy + 1);

  // Too narrow: the characters would cover the menu.
  if (W < 760) return;
  const k = Math.min(1, W / 1068);
  const sc = 0.9 * k;

  LANES.forEach((lane, i) => {
    const feet = H * lane.y;
    const p = ((t + lane.offset) % lane.period) / lane.period;
    const s = shot(p);

    // ground line on both sides
    g.strokeStyle = 'rgba(56,189,248,0.10)';
    g.lineWidth = 2;
    g.setLineDash([6, 10]);
    g.lineDashOffset = t * 30;
    g.beginPath();
    g.moveTo(0, feet + 2);
    g.lineTo(W, feet + 2);
    g.stroke();
    g.setLineDash([]);

    // threats (right), front one takes the hits
    const fx = W - 250 * k + Math.sin(t * 0.8 + i) * 8;
    const bx = W - 120 * k + Math.sin(t * 0.7 + i * 2) * 6;
    const [frontType, backType] = lane.threats;
    for (const [type, x, front] of [
      [backType, bx, false],
      [frontType, fx, true],
    ] as [EnemyType, number, boolean][]) {
      const spec = ENEMIES[type];
      g.save();
      g.translate(x, feet - (spec.height / 2) * sc);
      g.scale(sc, sc);
      drawEnemy(g, type, 0, 0, spec.width, spec.height, t + i, {
        flash: front && s.hit ? 0.08 : 0,
        slowed: front && lane.front === 'rateLimiter' && p > 0.7,
        state: 'walk',
        jumpHeight: 0,
      });
      g.restore();
    }

    // defenses (left)
    const dy = feet - 35 * sc;
    const backX = 70 * k;
    const frontX = 175 * k;
    for (const [type, x, front] of [
      [lane.back, backX, false],
      [lane.front, frontX, true],
    ] as [DefenseType, number, boolean][]) {
      g.save();
      g.translate(x, dy);
      g.scale(sc, sc);
      drawDefense(g, type, 0, 0, t + i, {
        kick: front ? s.kick : 0,
        charge: (t * 0.35 + i * 0.3) % 1,
        trapReady: 1,
      });
      g.restore();
    }

    // the Worker makes CU now and then
    if (lane.back === 'worker') {
      const c = (t * 0.35) % 1;
      if (c < 0.35) {
        g.save();
        g.translate(backX + 6, dy - 48 * sc - c * 60);
        g.scale(sc * 0.8, sc * 0.8);
        drawCU(g, 0, 0, 25, t, 1 - c / 0.35);
        g.restore();
      }
    }

    // packets flying across the screen
    const x0 = frontX + 40 * sc;
    const x1 = fx - (ENEMIES[frontType].width / 2) * sc;
    const slow = lane.front === 'rateLimiter';
    const py = dy - 4 * sc;
    if (p < 0.7) {
      const px = x0 + (x1 - x0) * s.travel;
      const pk = [[px, py]];
      if (lane.front === 'cdn') pk.push([px, py - s.travel * 70]);
      pk.forEach(([x, y], j) => {
        g.save();
        g.globalAlpha = j === 0 ? 1 : 1 - s.travel;
        g.translate(x, y);
        g.scale(sc, sc);
        drawProjectile(g, 0, 0, slow);
        g.restore();
      });
    } else if (s.hit) {
      // impact spark
      const k2 = (p - 0.7) / 0.12;
      g.strokeStyle = slow ? `rgba(196,181,253,${1 - k2})` : `rgba(134,239,172,${1 - k2})`;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(x1, py, 6 + k2 * 18, 0, Math.PI * 2);
      g.stroke();
    }
  });
}
