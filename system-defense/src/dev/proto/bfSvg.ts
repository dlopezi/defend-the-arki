import { BF, drawImpact, drawSmoke, enterBody, JAW_OPEN, type BfPose, type G } from './rig';

/*
 * Technique C · SVG illustration.
 * Each part is an .svg file in public/proto/black-friday/ (editable in Figma or Inkscape).
 * Parts are rasterized once at 4× and drawn with the same rig transforms as technique A.
 * Smoke and dust are effects, so they reuse the shared particle code.
 */

type PartName = 'body' | 'jaw' | 'arm' | 'tag' | 'wheel';

interface Part {
  /** viewBox of the SVG, in part space: x, y, width, height. */
  vb: [number, number, number, number];
  canvas: HTMLCanvasElement | null;
}

const RES = 4;
const BASE = '/proto/black-friday/';
const PARTS: Record<PartName, Part> = {
  body: { vb: [-80, -80, 150, 125], canvas: null },
  jaw: { vb: [-58, -16, 64, 44], canvas: null },
  arm: { vb: [-66, -12, 80, 66], canvas: null },
  tag: { vb: [-22, -2, 44, 52], canvas: null },
  wheel: { vb: [-13, -13, 26, 26], canvas: null },
};

let state: 'idle' | 'loading' | 'ready' | 'error' = 'idle';

async function loadPart(name: PartName): Promise<void> {
  const part = PARTS[name];
  const img = new Image();
  img.src = `${BASE}${name}.svg`;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = part.vb[2] * RES;
  c.height = part.vb[3] * RES;
  c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
  part.canvas = c;
}

/** Starts loading the SVG parts (once). */
export function loadSvgParts(): void {
  if (state !== 'idle') return;
  state = 'loading';
  Promise.all((Object.keys(PARTS) as PartName[]).map(loadPart))
    .then(() => {
      state = 'ready';
    })
    .catch((err: unknown) => {
      state = 'error';
      console.error('[proto] SVG parts failed to load', err);
    });
}

export function svgPartsState(): typeof state {
  return state;
}

function part(g: G, name: PartName): void {
  const p = PARTS[name];
  if (p.canvas) g.drawImage(p.canvas, p.vb[0], p.vb[1], p.vb[2], p.vb[3]);
}

function bar(g: G, x1: number, y1: number, x2: number, y2: number): void {
  g.lineCap = 'round';
  g.strokeStyle = '#0a0a0a';
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
  const grad = g.createLinearGradient(x1, y1 - 2, x1, y1 + 2);
  grad.addColorStop(0, '#fde047');
  grad.addColorStop(1, '#a16207');
  g.strokeStyle = grad;
  g.lineWidth = 3;
  g.stroke();
}

/** Draws the whole character for a pose. Origin: character center, feet at y = 60. */
export function drawBlackFridaySvg(g: G, p: BfPose, t: number): void {
  if (state !== 'ready') {
    g.fillStyle = '#94a3b8';
    g.font = '600 12px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText(state === 'error' ? 'Error al cargar los SVG' : 'Cargando SVG…', 0, 0);
    return;
  }
  drawSmoke(g, t);
  bar(g, -24, 40, 40, 40);
  bar(g, -20, 36, BF.frontWheel[0], BF.frontWheel[1]);
  bar(g, 34, 36, BF.backWheel[0], BF.backWheel[1]);
  g.save();
  g.translate(BF.backWheel[0], BF.backWheel[1]);
  g.rotate(p.wheel);
  part(g, 'wheel');
  g.restore();
  g.save();
  g.translate(BF.frontWheel[0], BF.frontWheel[1]);
  g.rotate(0.35 + Math.sin(t * 9) * 0.05);
  g.scale(1, 0.8);
  g.rotate(p.wheel * 0.8);
  part(g, 'wheel');
  g.restore();

  g.save();
  enterBody(g, p, t);
  part(g, 'body');
  g.save();
  g.translate(BF.hinge[0], BF.hinge[1]);
  g.rotate(-p.jaw * JAW_OPEN);
  part(g, 'jaw');
  g.restore();
  g.save();
  g.translate(BF.tagAnchor[0], BF.tagAnchor[1]);
  g.rotate(p.tag);
  part(g, 'tag');
  g.restore();
  g.save();
  g.translate(BF.shoulder[0], BF.shoulder[1]);
  g.rotate(p.arm);
  part(g, 'arm');
  g.restore();
  g.restore();
  drawImpact(g, p);
}
