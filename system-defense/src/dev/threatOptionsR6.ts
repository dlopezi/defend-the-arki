import { TAU, txt, type G } from './avatarOptions';
import type { Body2 } from './round2Options';
import { ENEMY_ART, hover, hoverPad, rect, ROUND6, withAttack } from '../render/enemyArt';
import type { ThreatOptionR5 } from './threatOptionsR5';

/*
 * Threat avatars, round 6 (from the comments on round 5, where A = flat was chosen for all):
 * - Black Friday: two wire shopping carts (A, with the sign on a pole, is now in the game).
 * - SQL Injection: two classic syringes (not chosen: the game keeps the round 5 syringe).
 * - DDoS: 4 robots instead of 6 (now in the game).
 */

type Pt = [number, number];

function path(g: G, pts: Pt[], close = true): void {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  if (close) g.closePath();
}

const bfPole: Body2 = ROUND6.bfPole;
const bfTag: Body2 = ROUND6.bfTag;
const ddos4: Body2 = ENEMY_ART.ddos;

/* ======================= SQL Injection: classic syringe ======================= */

/**
 * A syringe lying along x with the needle to the left, centred at (0, 0), in flat colours.
 * `push` (0..1) moves the plunger in.
 */
function syringe(g: G, t: number, push: number, label: string): void {
  const r = 7;
  const x0 = -16;
  const x1 = 16;
  const ry = r;
  const rx = r * 0.38;
  // plunger rod and thumb rest (behind the barrel's right end)
  const rodEnd = x1 + 16 - push * 12;
  rect(g, x1 - 2, -1.8, rodEnd - x1 + 2, 3.6, '#cbd5e1');
  rect(g, x1 - 2, -1.8, rodEnd - x1 + 2, 1.2, '#e2e8f0');
  g.beginPath();
  g.ellipse(rodEnd, 0, 2.2, 7, 0, 0, TAU);
  g.fillStyle = '#94a3b8';
  g.fill();
  g.beginPath();
  g.ellipse(rodEnd + 1, 0, 2.2, 7, 0, 0, TAU);
  g.fillStyle = '#e2e8f0';
  g.fill();
  // needle and hub
  rect(g, x0 - 22, -0.6, 16, 1.2, '#cbd5e1');
  path(g, [[x0 - 7, -2.6], [x0, -4], [x0, 4], [x0 - 7, 2.6]]);
  g.fillStyle = '#65a30d';
  g.fill();
  // barrel: glass with the green liquid inside
  rect(g, x0, -ry, x1 - x0, ry * 2, '#ecfccb');
  const fill = (x1 - x0) * (0.85 - push * 0.35);
  rect(g, x0, -ry + 2, fill, ry * 2 - 4, '#65a30d');
  rect(g, x0, -ry + 2, fill, 2, '#84cc16');
  // plunger seal inside the barrel
  rect(g, x0 + fill, -ry + 1, 2.4, ry * 2 - 2, '#1f2937');
  // glass shading: light top stripe, darker bottom
  rect(g, x0, -ry, x1 - x0, 1.6, '#f7fee7');
  rect(g, x0, ry - 1.6, x1 - x0, 1.6, '#a3e635');
  // round ends (seen a little from the side)
  g.beginPath();
  g.ellipse(x0, 0, rx, ry, 0, Math.PI / 2, -Math.PI / 2);
  g.fillStyle = '#d9f99d';
  g.fill();
  g.beginPath();
  g.ellipse(x1, 0, rx, ry, 0, 0, TAU);
  g.fillStyle = '#d9f99d';
  g.fill();
  g.strokeStyle = '#4d7c0f';
  g.lineWidth = 0.8;
  g.stroke();
  // finger grip
  rect(g, x1 - 1.5, -ry - 5, 3, ry * 2 + 10, '#94a3b8');
  rect(g, x1 - 1.5, -ry - 5, 1.2, ry * 2 + 10, '#cbd5e1');
  // marks
  for (let i = 1; i < 7; i++) rect(g, x0 + i * 4.4, -ry, 0.6, i % 2 ? 2.4 : 3.6, '#365314');
  txt(g, label, (x0 + x1) / 2 - 1, 0.6, 4.6, '#f7fee7', 800);
  // drop at the needle tip
  const drop = (t * 1.1) % 1;
  g.globalAlpha = 1 - drop;
  g.beginPath();
  g.arc(x0 - 23, 1 + drop * 9, 1.4, 0, TAU);
  g.fillStyle = '#84cc16';
  g.fill();
  g.globalAlpha = 1;
}

/** A: lying flat and floating, needle forward. */
const sqliSide: Body2 = withAttack((g, a) => {
  hoverPad(g, a.h / 2 - 2, 18, '#84cc16', a.t);
  g.save();
  g.translate(2, hover(a.t) + 2);
  syringe(g, a.t, a.atk, 'OR 1=1');
  g.restore();
});

/** B: tilted, needle down toward the defense, as if it is about to inject. */
const sqliStab: Body2 = withAttack((g, a) => {
  hoverPad(g, a.h / 2 - 2, 18, '#84cc16', a.t);
  g.save();
  g.translate(4, hover(a.t) - 2);
  g.rotate(-0.5 - a.atk * 0.15);
  syringe(g, a.t, a.atk, "' OR 1=1 --");
  g.restore();
});

/* ======================= options ======================= */

export const THREAT_R6: {
  blackFriday: { A: ThreatOptionR5; B: ThreatOptionR5 };
  sqli: { A: ThreatOptionR5; B: ThreatOptionR5 };
  ddos4: Body2;
} = {
  blackFriday: {
    A: { name: 'Carrito de rejilla + cartel', body: bfPole },
    B: { name: 'Carrito de rejilla + etiqueta de precio', body: bfTag },
  },
  sqli: {
    A: { name: 'Jeringa tumbada', body: sqliSide },
    B: { name: 'Jeringa que pincha', body: sqliStab },
  },
  ddos4,
};
