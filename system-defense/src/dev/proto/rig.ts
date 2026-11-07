/*
 * Shared rig for the Black Friday prototype ("Cart Juggernaut").
 * The three techniques (cartoon, pixel, SVG) use the same pose and the same geometry,
 * so only the drawing technique changes between them.
 *
 * Coordinates: character space, facing left (toward the base).
 * The feet (wheels) touch y = 60. Body parts live in "body space", which leans and squashes
 * around BF.pivot; wheels and dust live in ground space.
 */

export type G = CanvasRenderingContext2D;
export type ProtoState = 'walk' | 'attack';

export const TAU = Math.PI * 2;
export const ease = (k: number): number => k * k * (3 - 2 * k);

/** Pivots and anchors in body space. */
export const BF = {
  pivot: [6, 40] as const,
  hinge: [-12, 9] as const,
  /** Low on the body, so the claw arm never hides the jaw. */
  shoulder: [16, 22] as const,
  /** Elbow, in shoulder space (the arm is a child of the shoulder). */
  elbow: [-20, 16] as const,
  tagAnchor: [46, -40] as const,
  backWheel: [34, 49] as const,
  frontWheel: [-26, 49] as const,
  ground: 60,
};

/* ---------- Geometry (SVG path syntax, reused by Path2D and by the .svg files) ---------- */

/** Cart body: top-heavy, front face on the left, open mouth area at the front-bottom. */
export const BODY_D =
  'M -50 -34 C -40 -48 -10 -53 20 -50 C 34 -49 44 -44 46 -36 L 42 22 C 41 32 34 36 24 36 L -6 34 L -12 8 L -62 2 C -67 -12 -61 -28 -50 -34 Z';
/** Top edge of the body, for the rim light. */
export const TOP_EDGE_D = 'M -50 -34 C -40 -48 -10 -53 20 -50 C 34 -49 44 -44 46 -36';
/** Cel-shading shadow (clipped to the body). */
export const BODY_SHADE_D = 'M 50 -46 L 50 40 L -70 40 L -70 18 C -30 22 20 6 50 -46 Z';
/** Lower jaw, in jaw space (hinge at 0,0). */
export const JAW_D = 'M 0 0 L -50 -6 C -54 4 -50 16 -42 20 L -6 24 C -1 20 2 10 0 0 Z';
/** How far the jaw rotates when fully open (radians). */
export const JAW_OPEN = 0.75;
/** Outer (bottom + front) edge of the jaw, for its rim light (jaw space). */
export const JAW_EDGE_D = 'M -50 -6 C -54 4 -50 16 -42 20 L -6 24';
/** Mouth inside (body space), visible when the jaw opens. */
export const MOUTH_D = 'M -62 2 L -12 8 L -10 32 L -56 26 Z';
/** Upper arm (crumpled paper bag), in shoulder space. */
export const UPPER_ARM_D = 'M 6 -6 L -16 2 L -22 18 L -2 18 L 10 6 Z';
/** Forearm (plastic bag), in elbow space. */
export const FOREARM_D = 'M 4 -6 C -8 -10 -24 -2 -28 10 C -22 18 -6 16 2 8 Z';
/** Brow plate over the big eye (body space). */
export const BROW_D = 'M -52 -31 L -21 -37 L -23 -29 L -48 -22 Z';

/** Upper teeth along the upper jaw edge: [center x, width, length]. Uneven on purpose. */
export const UPPER_TEETH: [number, number, number][] = [
  [-57, 8, 7],
  [-48, 9, 9],
  [-39, 7, 6],
  [-30, 10, 10],
  [-21, 7, 7],
];
/** Lower teeth along the jaw top edge (jaw space): [center x, width, length]. */
export const LOWER_TEETH: [number, number, number][] = [
  [-45, 6, 6],
  [-36, 8, 8],
  [-27, 6, 6],
  [-18, 9, 9],
  [-9, 6, 5],
];
/** y of the upper jaw edge at x (body space). */
export const upperEdgeY = (x: number): number => 2 + (x + 62) * 0.12;
/** y of the jaw top edge at x (jaw space). */
export const lowerEdgeY = (x: number): number => x * 0.12;

/* ---------- Pose ---------- */

export interface BfPose {
  state: ProtoState;
  /** Body rotation around the pivot. Negative = leans forward (left). */
  lean: number;
  dropY: number;
  sx: number;
  sy: number;
  /** 0 = closed, 1 = wide open. */
  jaw: number;
  /** Shoulder angle. Positive = raised. */
  arm: number;
  elbow: number;
  /** Chain swing of the "-70%" tag. */
  tag: number;
  wheel: number;
  /** 1 right after a stomp / smash, fading to 0. */
  impact: number;
  /** Walk: -1 front wheel, 1 back wheel. Attack: 0 (claw). */
  impactSide: number;
  shake: number;
}

const WALK_PERIOD = 1.3;
/** Same as BOSS_SMASH_INTERVAL in config.ts. */
const ATTACK_PERIOD = 1.6;

export function bfPose(t: number, state: ProtoState): BfPose {
  if (state === 'walk') {
    const p = (t % WALK_PERIOD) / WALK_PERIOD;
    const half = (p * 2) % 1;
    const impact = Math.max(0, 1 - half / 0.25);
    const lift = Math.sin(half * Math.PI);
    return {
      state,
      lean: -0.07 + Math.sin(p * TAU * 2) * 0.015,
      dropY: -lift * 3 + impact * 2,
      sx: 1 + impact * 0.05,
      sy: 1 - impact * 0.06,
      jaw: 0.12 + 0.18 * Math.max(0, Math.sin(t * 2.4)),
      arm: Math.sin(p * TAU) * 0.22,
      elbow: Math.sin(p * TAU - 0.8) * 0.18,
      tag: Math.sin(t * 2.6 - 0.7) * 0.32 + impact * 0.1 * (p < 0.5 ? 1 : -1),
      wheel: -t * 3,
      impact,
      impactSide: p < 0.5 ? -1 : 1,
      shake: impact * 1.2,
    };
  }

  const q = (t % ATTACK_PERIOD) / ATTACK_PERIOD;
  let lean: number, arm: number, elbow: number, jaw: number, dropY: number;
  let sx = 1;
  let sy = 1;
  let impact = 0;
  if (q < 0.55) {
    // Wind-up: lean back, raise the claw, open the jaw wide.
    const k = ease(q / 0.55);
    lean = -0.07 + 0.16 * k;
    arm = 1.0 * k;
    elbow = 0.7 * k;
    jaw = 0.15 + 0.85 * k;
    dropY = -2 * k;
    sx = 1 - 0.03 * k;
    sy = 1 + 0.05 * k;
  } else if (q < 0.66) {
    // Smash: lunge forward, claw down, jaw snaps shut.
    const k = (q - 0.55) / 0.11;
    lean = 0.09 - 0.34 * k;
    arm = 1.0 - 1.1 * k;
    elbow = 0.7 - 0.8 * k;
    jaw = 1 - 0.9 * k;
    dropY = -2 + 6 * k;
  } else {
    // Recover, with the impact fading.
    const r = (q - 0.66) / 0.34;
    const e = ease(r);
    impact = Math.max(0, 1 - r / 0.35);
    lean = -0.25 + 0.18 * e;
    // The claw stays slammed on the ground in front, then lifts back to rest.
    arm = -0.1 + 0.1 * e;
    elbow = -0.1 + 0.1 * e;
    jaw = 0.1 + 0.05 * e;
    dropY = 4 * (1 - e);
    sx = 1 + 0.08 * impact;
    sy = 1 - 0.1 * impact;
  }
  return {
    state,
    lean,
    dropY,
    sx,
    sy,
    jaw,
    arm,
    elbow,
    // The tag lags behind the body (inertia).
    tag: Math.sin(t * 2.6) * 0.25 - lean * 1.4,
    wheel: 0,
    impact,
    impactSide: 0,
    shake: impact * 3,
  };
}

/** Moves the context into body space for a pose (lean, squash, drop, shake). */
export function enterBody(g: G, p: BfPose, t: number): void {
  g.translate(p.shake * Math.sin(t * 60), p.dropY);
  const [px, py] = BF.pivot;
  g.translate(px, py);
  g.rotate(p.lean);
  g.scale(p.sx, p.sy);
  g.translate(-px, -py);
}

/* ---------- Effects shared by all characters (particles, not character art) ---------- */

/**
 * Particle budget per character. Kept low on purpose: with many threats on screen,
 * particles add up fast. Only cheap shapes (circles, rects, lines), no blur, no gradients.
 */
export const FX_LIMITS = {
  smokePuffs: 2,
  stepDust: 3,
  smashDust: 4,
};

/** Rising smoke puffs from (x, y). */
export function drawSmokeAt(g: G, x: number, y: number, t: number, count = FX_LIMITS.smokePuffs, color = '#78716c'): void {
  g.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const age = (t * 0.7 + i / count) % 1;
    g.globalAlpha = 0.5 * (1 - age);
    g.beginPath();
    g.arc(x + age * 10 + Math.sin(t * 2 + i) * 3, y - age * 44, 3 + age * 9, 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;
}

/** Dust cloud on the ground at x. k: 1 right after the impact, fading to 0. */
export function drawDust(g: G, x: number, groundY: number, k: number, count: number, size = 1): void {
  if (k <= 0) return;
  const spread = 1.2 - k;
  g.fillStyle = '#a8a29e';
  g.globalAlpha = k * 0.55;
  for (let i = 0; i < count; i++) {
    const off = i - (count - 1) / 2;
    g.beginPath();
    g.arc(x + off * 9 * spread * size, groundY - 2 - spread * 6 * size - (i % 2) * 3, (3 + spread * 7) * size, 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;
}

/** Yellow ground cracks after a heavy smash. */
export function drawCracks(g: G, x: number, groundY: number, k: number): void {
  if (k <= 0) return;
  g.globalAlpha = k;
  g.strokeStyle = '#facc15';
  g.lineWidth = 2;
  for (const dir of [-1, 1]) {
    g.beginPath();
    g.moveTo(x, groundY);
    g.lineTo(x + dir * 10, groundY - 2);
    g.lineTo(x + dir * 18, groundY + 1);
    g.lineTo(x + dir * 28, groundY - 1);
    g.stroke();
  }
  g.globalAlpha = 1;
}

/** Black Friday exhaust smoke. Drawn behind the character. */
export function drawSmoke(g: G, t: number, pixel = false): void {
  drawSmokeAt(g, 56, -8, t, FX_LIMITS.smokePuffs, pixel ? '#57534e' : '#78716c');
}

/** Black Friday: dust after a stomp (walk) or dust + cracks after a smash (attack). */
export function drawImpact(g: G, p: BfPose): void {
  if (p.impact <= 0) return;
  if (p.state === 'walk') {
    const x0 = p.impactSide < 0 ? BF.frontWheel[0] : BF.backWheel[0];
    drawDust(g, x0, BF.ground, p.impact, FX_LIMITS.stepDust);
    return;
  }
  drawDust(g, -50, BF.ground, p.impact, FX_LIMITS.smashDust, 1.4);
  drawCracks(g, -50, BF.ground, p.impact);
}
