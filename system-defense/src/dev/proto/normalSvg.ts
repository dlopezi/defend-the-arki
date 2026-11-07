import { drawDust, ease, FX_LIMITS, TAU, type G, type ProtoState } from './rig';
import { SvgSprite } from './svgSprite';

/*
 * Technique C · Tráfico Normal — "Request Runner".
 * An ordinary request in a hurry: leans forward, brisk steps, one big determined eye,
 * messenger cap, satchel on one side. Signature: the "GET /" envelope it slaps defenses with.
 * Character space: feet at y = 28 (ENEMIES.normal.height / 2).
 */

const FEET = 28;
const HIP = { front: [-5, 13.5], back: [5, 13.5] } as const;
const SHOULDER = { front: [-4, -4], back: [6, -4] } as const;
const PIVOT = [0, 14] as const;

const sprite = new SvgSprite(
  '/src/dev/proto/assets/normal/',
  {
    body: { vb: [-26, -38, 46, 58] },
    armFront: { vb: [-32, -8, 36, 32] },
    armBack: { vb: [-4, -4, 12, 18] },
    leg: { vb: [-10, -3, 15, 19] },
  },
  6,
);

export function loadNormalSvg(): void {
  sprite.load();
}

interface Pose {
  lean: number;
  bob: number;
  legF: number;
  legB: number;
  armF: number;
  armB: number;
  dust: number;
}

function pose(t: number, state: ProtoState): Pose {
  if (state === 'walk') {
    const P = 0.6;
    const p = (t % P) / P;
    const s = Math.sin(p * TAU);
    const half = (p * 2) % 1;
    return {
      lean: -0.12,
      bob: -Math.abs(s) * 2,
      legF: s * 0.55,
      legB: -s * 0.55,
      armF: -s * 0.45,
      armB: s * 0.5,
      dust: Math.max(0, 1 - half / 0.2) * 0.6,
    };
  }
  // Attack: wind up the envelope, slap, recover (fast loop: continuous damage).
  const P = 0.5;
  const q = (t % P) / P;
  let armF: number;
  let lean: number;
  if (q < 0.55) {
    const k = ease(q / 0.55);
    armF = 1.4 * k;
    lean = -0.12 + 0.18 * k;
  } else if (q < 0.7) {
    const k = (q - 0.55) / 0.15;
    armF = 1.4 - 1.9 * k;
    lean = 0.06 - 0.26 * k;
  } else {
    const e = ease((q - 0.7) / 0.3);
    armF = -0.5 + 0.5 * e;
    lean = -0.2 + 0.08 * e;
  }
  return { lean, bob: 0, legF: 0.3, legB: -0.35, armF, armB: 0.25, dust: 0 };
}

function limb(g: G, name: 'leg' | 'armFront' | 'armBack', x: number, y: number, rot: number): void {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  sprite.draw(g, name);
  g.restore();
}

/** Origin: character center, feet at y = 28. */
export function drawNormalSvg(g: G, t: number, state: ProtoState): void {
  if (!sprite.ready) {
    sprite.drawStatus(g);
    return;
  }
  const p = pose(t, state);
  limb(g, 'leg', HIP.back[0], HIP.back[1], p.legB);
  g.save();
  g.translate(0, p.bob);
  g.translate(PIVOT[0], PIVOT[1]);
  g.rotate(p.lean);
  g.translate(-PIVOT[0], -PIVOT[1]);
  limb(g, 'armBack', SHOULDER.back[0], SHOULDER.back[1], p.armB);
  g.restore();
  limb(g, 'leg', HIP.front[0], HIP.front[1], p.legF);
  g.save();
  g.translate(0, p.bob);
  g.translate(PIVOT[0], PIVOT[1]);
  g.rotate(p.lean);
  g.translate(-PIVOT[0], -PIVOT[1]);
  sprite.draw(g, 'body');
  limb(g, 'armFront', SHOULDER.front[0], SHOULDER.front[1], p.armF);
  g.restore();
  drawDust(g, -4, FEET, p.dust, Math.min(2, FX_LIMITS.stepDust), 0.5);
}
