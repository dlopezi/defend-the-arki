import {
  BF,
  BODY_D,
  BODY_SHADE_D,
  BROW_D,
  drawImpact,
  drawSmoke,
  enterBody,
  FOREARM_D,
  JAW_D,
  JAW_EDGE_D,
  JAW_OPEN,
  LOWER_TEETH,
  lowerEdgeY,
  MOUTH_D,
  TAU,
  TOP_EDGE_D,
  UPPER_ARM_D,
  UPPER_TEETH,
  upperEdgeY,
  type BfPose,
  type G,
} from './rig';

/*
 * Technique A · Cartoon rig.
 * Organic outlines (Bézier paths), 2-tone cel shading, thick ink outline, yellow rim light,
 * and separate parts (jaw, arm, tag, wheels) moved by the shared pose.
 */

const INK = '#0a0a0a';

// Paths are built once.
const P = {
  body: new Path2D(BODY_D),
  top: new Path2D(TOP_EDGE_D),
  shade: new Path2D(BODY_SHADE_D),
  jaw: new Path2D(JAW_D),
  jawEdge: new Path2D(JAW_EDGE_D),
  mouth: new Path2D(MOUTH_D),
  upperArm: new Path2D(UPPER_ARM_D),
  forearm: new Path2D(FOREARM_D),
  brow: new Path2D(BROW_D),
};

/** Ink outline + flat fill (outline drawn first so half of it shows outside). */
function ink(g: G, path: Path2D, fill: string, lw = 6): void {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.lineWidth = lw;
  g.strokeStyle = INK;
  g.stroke(path);
  g.fillStyle = fill;
  g.fill(path);
}

/** Cel shadow: darker shape clipped inside a part. */
function shade(g: G, clip: Path2D, shadow: Path2D, alpha = 0.45): void {
  g.save();
  g.clip(clip);
  g.fillStyle = `rgba(0,0,0,${alpha})`;
  g.fill(shadow);
  g.restore();
}

function tri(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): Path2D {
  const p = new Path2D();
  p.moveTo(ax, ay);
  p.lineTo(bx, by);
  p.lineTo(cx, cy);
  p.closePath();
  return p;
}

function drawWheel(g: G, x: number, y: number, rot: number, bent: boolean, t: number): void {
  g.save();
  g.translate(x, y);
  if (bent) {
    g.rotate(0.35 + Math.sin(t * 9) * 0.05);
    g.scale(1, 0.8);
  }
  g.rotate(rot);
  const tire = new Path2D();
  tire.arc(0, 0, 11, 0, TAU);
  ink(g, tire, '#18181b', 5);
  g.strokeStyle = '#3f3f46';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(0, 0, 7, 0, TAU);
  g.stroke();
  g.strokeStyle = '#facc15';
  g.lineWidth = 2;
  for (let s = 0; s < 3; s++) {
    const a = (s * TAU) / 3;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(Math.cos(a) * 7, Math.sin(a) * 7);
    g.stroke();
  }
  g.fillStyle = '#facc15';
  g.beginPath();
  g.arc(0, 0, 2.5, 0, TAU);
  g.fill();
  g.restore();
}

function drawUndercarriage(g: G, p: BfPose, t: number): void {
  const bar = (x1: number, y1: number, x2: number, y2: number) => {
    g.lineCap = 'round';
    g.strokeStyle = INK;
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
    g.strokeStyle = '#ca8a04';
    g.lineWidth = 3;
    g.stroke();
  };
  bar(-24, 40, 40, 40);
  bar(-20, 36, BF.frontWheel[0], BF.frontWheel[1]);
  bar(34, 36, BF.backWheel[0], BF.backWheel[1]);
  drawWheel(g, BF.backWheel[0], BF.backWheel[1], p.wheel, false, t);
  drawWheel(g, BF.frontWheel[0], BF.frontWheel[1], p.wheel * 0.8, true, t);
}

function drawHandle(g: G): void {
  g.lineCap = 'round';
  g.strokeStyle = INK;
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(38, -30);
  g.lineTo(58, -56);
  g.stroke();
  g.strokeStyle = '#facc15';
  g.lineWidth = 5;
  g.stroke();
  g.strokeStyle = '#fef08a';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(37, -32);
  g.lineTo(56, -57);
  g.stroke();
  g.save();
  g.translate(59, -58);
  g.rotate(-0.9);
  const grip = new Path2D();
  grip.roundRect(-9, -4, 18, 8, 4);
  ink(g, grip, '#dc2626', 4);
  g.restore();
}

function box(g: G, x: number, y: number, w: number, h: number, rot: number, lit: string, dark: string): void {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  const r = new Path2D();
  r.rect(-w / 2, -h / 2, w, h);
  ink(g, r, lit, 5);
  g.save();
  g.clip(r);
  g.fillStyle = dark;
  g.fillRect(w / 6, -h / 2, w, h);
  g.fillStyle = 'rgba(253,230,138,0.55)';
  g.fillRect(-2, -h / 2, 4, h);
  g.restore();
  g.restore();
}

function drawLoot(g: G): void {
  // Shopping bag (red, with handles)
  g.save();
  g.translate(-22, -56);
  g.rotate(-0.25);
  g.strokeStyle = INK;
  g.lineWidth = 4;
  g.beginPath();
  g.arc(0, -10, 5, Math.PI, TAU);
  g.stroke();
  const bag = new Path2D('M -9 -10 L 9 -10 L 11 10 L -11 10 Z');
  ink(g, bag, '#dc2626', 5);
  shade(g, bag, new Path2D('M 3 -12 L 14 -12 L 14 12 L 4 12 Z'), 0.35);
  g.restore();
  box(g, 4, -60, 30, 22, -0.12, '#b45309', '#78350f');
  box(g, 30, -57, 22, 18, 0.22, '#a16207', '#713f12');
}

function drawMouth(g: G, p: BfPose): void {
  const grad = g.createRadialGradient(-36, 16, 2, -36, 16, 30);
  grad.addColorStop(0, `rgba(254,202,202,${0.3 + 0.7 * p.jaw})`);
  grad.addColorStop(0.35, '#dc2626');
  grad.addColorStop(0.7, '#7f1d1d');
  grad.addColorStop(1, '#1c0505');
  g.fillStyle = grad;
  g.fill(P.mouth);
}

function drawBody(g: G): void {
  ink(g, P.body, '#292524', 6);
  g.save();
  g.clip(P.body);
  // cart wire mesh
  g.strokeStyle = 'rgba(250,204,21,0.10)';
  g.lineWidth = 1.5;
  for (let x = -110; x < 70; x += 9) {
    g.beginPath();
    g.moveTo(x, -60);
    g.lineTo(x + 60, 40);
    g.stroke();
    g.beginPath();
    g.moveTo(x + 60, -60);
    g.lineTo(x, 40);
    g.stroke();
  }
  g.fillStyle = 'rgba(0,0,0,0.5)';
  g.fill(P.shade);
  g.fillStyle = 'rgba(255,255,255,0.07)';
  g.beginPath();
  g.ellipse(-18, -38, 28, 8, -0.1, 0, TAU);
  g.fill();
  g.restore();
  // rim light on the top edge
  g.lineCap = 'round';
  g.strokeStyle = '#facc15';
  g.lineWidth = 3;
  g.stroke(P.top);
  // exhaust pipe on the back
  const pipe = new Path2D();
  pipe.roundRect(42, -9, 13, 7, 2);
  ink(g, pipe, '#52525b', 4);
}

function drawUpperTeeth(g: G): void {
  for (const [cx, w, s] of UPPER_TEETH) {
    const y0 = upperEdgeY(cx);
    const tooth = tri(cx - w / 2, y0 - 0.5, cx + w / 2, y0 + 0.5, cx + 1, y0 + s);
    ink(g, tooth, '#f5f5f4', 2.5);
    shade(g, tooth, tri(cx, y0 - 1, cx + w, y0, cx + 1, y0 + s + 1), 0.25);
  }
}

function drawJaw(g: G, p: BfPose): void {
  g.save();
  g.translate(BF.hinge[0], BF.hinge[1]);
  g.rotate(-p.jaw * JAW_OPEN);
  ink(g, P.jaw, '#1c1917', 6);
  shade(g, P.jaw, new Path2D('M -60 10 L 10 6 L 10 30 L -60 30 Z'), 0.5);
  g.lineCap = 'round';
  g.strokeStyle = '#facc15';
  g.lineWidth = 2.5;
  g.stroke(P.jawEdge);
  for (const [cx, w, s] of LOWER_TEETH) {
    const y0 = lowerEdgeY(cx);
    const tooth = tri(cx - w / 2, y0 + 0.4, cx + w / 2, y0 - 0.4, cx - 1, y0 - s);
    ink(g, tooth, '#f5f5f4', 2.5);
  }
  g.restore();
}

function drawFace(g: G, t: number): void {
  ink(g, P.brow, '#ca8a04', 4);
  g.strokeStyle = '#fde047';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(-50, -31);
  g.lineTo(-22, -36);
  g.stroke();
  // big eye
  g.fillStyle = INK;
  g.beginPath();
  g.arc(-36, -17, 10, 0, TAU);
  g.fill();
  const pulse = 0.85 + 0.15 * Math.sin(t * 5);
  const iris = g.createRadialGradient(-37, -18, 1, -36, -17, 8);
  iris.addColorStop(0, '#fecaca');
  iris.addColorStop(0.45, '#ef4444');
  iris.addColorStop(1, '#7f1d1d');
  g.shadowColor = '#ef4444';
  g.shadowBlur = 14 * pulse;
  g.fillStyle = iris;
  g.beginPath();
  g.arc(-36, -17, 7.5, 0, TAU);
  g.fill();
  g.shadowBlur = 0;
  g.fillStyle = INK;
  g.beginPath();
  g.ellipse(-37.5, -17, 1.8, 6, 0, 0, TAU);
  g.fill();
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.arc(-39.5, -20.5, 1.6, 0, TAU);
  g.fill();
  // small eye (higher, smaller: asymmetric)
  g.fillStyle = INK;
  g.beginPath();
  g.arc(-13, -25, 5.5, 0, TAU);
  g.fill();
  g.fillStyle = '#ef4444';
  g.beginPath();
  g.arc(-13, -25, 3.8, 0, TAU);
  g.fill();
  g.fillStyle = INK;
  g.beginPath();
  g.arc(-14, -25, 1.5, 0, TAU);
  g.fill();
}

function drawHorn(g: G): void {
  g.save();
  g.translate(-46, -37);
  g.rotate(-0.75);
  const tag = new Path2D('M -6 0 L 6 0 L 6 -20 L 0 -28 L -6 -20 Z');
  ink(g, tag, '#fde047', 4);
  shade(g, tag, new Path2D('M 1 -30 L 8 -30 L 8 2 L 1 2 Z'), 0.25);
  g.fillStyle = INK;
  g.beginPath();
  g.arc(0, -21, 1.7, 0, TAU);
  g.fill();
  g.restore();
}

function drawTag(g: G, p: BfPose): void {
  g.save();
  g.translate(BF.tagAnchor[0], BF.tagAnchor[1]);
  g.rotate(p.tag);
  g.strokeStyle = '#a1a1aa';
  g.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.ellipse(0, 3 + i * 5, 2, 3, i % 2 ? 0 : Math.PI / 2, 0, TAU);
    g.stroke();
  }
  g.translate(0, 22);
  g.rotate(0.15);
  const card = new Path2D();
  card.roundRect(-17, 0, 34, 24, 5);
  ink(g, card, '#dc2626', 5);
  shade(g, card, new Path2D('M -20 16 L 20 12 L 20 30 L -20 30 Z'), 0.3);
  g.fillStyle = INK;
  g.beginPath();
  g.arc(-11, 6, 2, 0, TAU);
  g.fill();
  g.font = '900 13px ui-monospace, SFMono-Regular, Menlo, monospace';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = 3;
  g.strokeStyle = '#450a0a';
  g.strokeText('-70%', 3, 14);
  g.fillStyle = '#ffffff';
  g.fillText('-70%', 3, 14);
  g.restore();
}

function drawArm(g: G, p: BfPose): void {
  g.save();
  g.translate(BF.shoulder[0], BF.shoulder[1]);
  g.rotate(p.arm);
  ink(g, P.upperArm, '#a16207', 5);
  shade(g, P.upperArm, new Path2D('M -30 14 L 12 4 L 12 30 L -30 30 Z'), 0.35);
  g.strokeStyle = '#713f12';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(-6, 0);
  g.lineTo(-12, 12);
  g.moveTo(2, -2);
  g.lineTo(-2, 12);
  g.stroke();
  g.translate(BF.elbow[0], BF.elbow[1]);
  g.rotate(p.elbow);
  ink(g, P.forearm, '#e7e5e4', 5);
  shade(g, P.forearm, new Path2D('M -30 6 L 6 2 L 6 20 L -30 20 Z'), 0.3);
  g.strokeStyle = '#a8a29e';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-6, -4);
  g.lineTo(-10, 6);
  g.moveTo(-14, -3);
  g.lineTo(-18, 8);
  g.stroke();
  // claw: three bag-handle hooks
  for (let k = 0; k < 3; k++) {
    g.beginPath();
    g.moveTo(-24 + k * 3, 6 + k * 4);
    g.quadraticCurveTo(-40, 4 + k * 6, -37, 17 + k * 5);
    g.lineCap = 'round';
    g.strokeStyle = INK;
    g.lineWidth = 6;
    g.stroke();
    g.strokeStyle = '#facc15';
    g.lineWidth = 2.5;
    g.stroke();
  }
  g.restore();
}

/** Draws the whole character for a pose. Origin: character center, feet at y = 60. */
export function drawBlackFridayCartoon(g: G, p: BfPose, t: number, pixel = false): void {
  drawSmoke(g, t, pixel);
  drawUndercarriage(g, p, t);
  g.save();
  enterBody(g, p, t);
  drawHandle(g);
  drawLoot(g);
  drawMouth(g, p);
  drawBody(g);
  drawUpperTeeth(g);
  drawJaw(g, p);
  drawFace(g, t);
  drawHorn(g);
  drawTag(g, p);
  drawArm(g, p);
  g.restore();
  drawImpact(g, p);
}

/** Parts other techniques can reuse (SVG version draws assets but keeps these effects). */
export { drawUndercarriage, drawWheel };
