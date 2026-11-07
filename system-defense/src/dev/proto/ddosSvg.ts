import { drawCracks, drawDust, ease, FX_LIMITS, TAU, type G, type ProtoState } from './rig';
import { SvgSprite } from './svgSprite';

/*
 * Technique C · Ataque DDoS — "Swarm Colossus".
 * A hulking brute made of packets: small head on a huge hunched body, one giant fist
 * dragging on the ground, one small arm. Signature: the glowing chest crack ("10⁶").
 * It sheds a few packets while it moves. Character space: feet at y = 37.
 */

const FEET = 37;
const PIVOT = [2, 22] as const;
const HIP = { front: [-8, 22], back: [14, 22] } as const;
const SHOULDER = { big: [-20, -12], small: [24, -10] } as const;
const NECK = [-18, -30] as const;
/** Falling packets per DDoS (particle budget). */
const SHED = 3;

const sprite = new SvgSprite(
  '/proto/ddos/',
  {
    torso: { vb: [-42, -46, 84, 78] },
    head: { vb: [-15, -19, 28, 23] },
    armBig: { vb: [-30, -10, 42, 56] },
    armSmall: { vb: [-6, -6, 20, 32] },
    leg: { vb: [-11, -4, 21, 21] },
  },
  5,
);

export function loadDdosSvg(): void {
  sprite.load();
}

interface Pose {
  sway: number;
  drop: number;
  legF: number;
  legB: number;
  big: number;
  small: number;
  head: number;
  impact: number;
}

function pose(t: number, state: ProtoState): Pose {
  if (state === 'walk') {
    const P = 1.8;
    const p = (t % P) / P;
    const s = Math.sin(p * TAU);
    const half = (p * 2) % 1;
    const impact = Math.max(0, 1 - half / 0.2);
    return {
      sway: -0.05 + Math.sin(p * TAU) * 0.04,
      drop: -Math.abs(s) * 1.5 + impact * 1.5,
      legF: s * 0.3,
      legB: -s * 0.3,
      big: 0.15 + s * 0.15,
      small: -s * 0.2,
      head: Math.sin(t * 1.3) * 0.08,
      impact: impact * 0.6,
    };
  }
  // Attack: raise the giant fist, slam it down, recover.
  const P = 1.2;
  const q = (t % P) / P;
  if (q < 0.6) {
    const k = ease(q / 0.6);
    return { sway: -0.05 + 0.12 * k, drop: -1.5 * k, legF: 0.2, legB: -0.2, big: 1.45 * k, small: 0.3 * k, head: -0.12 * k, impact: 0 };
  }
  if (q < 0.72) {
    const k = (q - 0.6) / 0.12;
    return { sway: 0.07 - 0.22 * k, drop: -1.5 + 4.5 * k, legF: 0.2, legB: -0.2, big: 1.45 - 1.65 * k, small: 0.3 - 0.5 * k, head: -0.12 + 0.2 * k, impact: 0 };
  }
  const r = (q - 0.72) / 0.28;
  const e = ease(r);
  return {
    sway: -0.15 + 0.1 * e,
    drop: 3 * (1 - e),
    legF: 0.2,
    legB: -0.2,
    big: -0.2 + 0.35 * e,
    small: -0.2 + 0.2 * e,
    head: 0.08 - 0.08 * e,
    impact: Math.max(0, 1 - r / 0.4),
  };
}

function part(g: G, name: 'head' | 'armBig' | 'armSmall' | 'leg', x: number, y: number, rot: number): void {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  sprite.draw(g, name);
  g.restore();
}

function enterBody(g: G, p: Pose): void {
  g.translate(0, p.drop);
  g.translate(PIVOT[0], PIVOT[1]);
  g.rotate(p.sway);
  g.translate(-PIVOT[0], -PIVOT[1]);
}

/** A few packets fall off the back and fade (cheap rects, fixed budget). */
function drawShedding(g: G, t: number): void {
  for (let i = 0; i < SHED; i++) {
    const age = (t * 0.6 + i / SHED) % 1;
    g.save();
    g.globalAlpha = 1 - age;
    g.translate(28 + i * 4 + age * 8, -18 + age * 48);
    g.rotate(age * 3 + i);
    g.fillStyle = i % 2 ? '#dc2626' : '#b91c1c';
    g.fillRect(-2.5, -2.5, 5, 5);
    g.restore();
  }
}

/** Origin: character center, feet at y = 37. */
export function drawDdosSvg(g: G, t: number, state: ProtoState): void {
  if (!sprite.ready) {
    sprite.drawStatus(g);
    return;
  }
  const p = pose(t, state);
  part(g, 'leg', HIP.back[0], HIP.back[1], p.legB);
  g.save();
  enterBody(g, p);
  part(g, 'armSmall', SHOULDER.small[0], SHOULDER.small[1], p.small);
  g.restore();
  part(g, 'leg', HIP.front[0], HIP.front[1], p.legF);
  g.save();
  enterBody(g, p);
  sprite.draw(g, 'torso');
  part(g, 'head', NECK[0], NECK[1], p.head);
  part(g, 'armBig', SHOULDER.big[0], SHOULDER.big[1], p.big);
  g.restore();
  drawShedding(g, t);
  if (state === 'attack') {
    drawDust(g, -38, FEET, p.impact, FX_LIMITS.smashDust, 1.1);
    drawCracks(g, -38, FEET, p.impact);
  } else {
    drawDust(g, -8, FEET, p.impact, FX_LIMITS.stepDust, 0.8);
  }
}
