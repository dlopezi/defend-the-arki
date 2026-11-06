import { drawBlackFridayCartoon } from './bfCartoon';
import { bfPose, type G, type ProtoState } from './rig';

/*
 * Technique B · Pixel art.
 * Each frame is the rig drawn at half resolution, then turned into pixel art:
 * hard alpha, a limited palette, and a 1-pixel black outline. It animates at 8 frames
 * per second, like hand-made sprites. (A final version would be drawn by hand in a
 * pixel editor such as Aseprite, using these frames as a base.)
 */

const SCALE = 0.5;
/** Low-res canvas covers character space x -84..84, y -100..60. */
const LOW_W = 84;
const LOW_H = 80;
const ORIGIN_X = 42;
const ORIGIN_Y = 50;
const FPS = 8;

const PALETTE = [
  '#0a0a0a', '#1c1917', '#292524', '#44403c', '#57534e', '#78716c', '#a8a29e', '#e7e5e4',
  '#ffffff', '#facc15', '#fde047', '#ca8a04', '#a16207', '#713f12', '#b45309', '#dc2626',
  '#ef4444', '#7f1d1d', '#450a0a', '#fecaca',
].map((hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)] as const);

function nearest(r: number, g: number, b: number): readonly [number, number, number] {
  let best = PALETTE[0];
  let bestD = Infinity;
  for (const c of PALETTE) {
    const d = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

export class PixelBlackFriday {
  private readonly low = document.createElement('canvas');
  private readonly out = document.createElement('canvas');
  private lastKey = '';

  constructor() {
    for (const c of [this.low, this.out]) {
      c.width = LOW_W;
      c.height = LOW_H;
    }
  }

  /** Draws in character space (origin at center, feet at y = 60). */
  draw(g: G, t: number, state: ProtoState): void {
    const tq = Math.floor(t * FPS) / FPS;
    const key = `${state}:${tq}`;
    if (key !== this.lastKey) {
      this.render(tq, state);
      this.lastKey = key;
    }
    const smooth = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    g.drawImage(this.out, -ORIGIN_X / SCALE, -ORIGIN_Y / SCALE, LOW_W / SCALE, LOW_H / SCALE);
    g.imageSmoothingEnabled = smooth;
  }

  private render(t: number, state: ProtoState): void {
    const lg = this.low.getContext('2d', { willReadFrequently: true });
    const og = this.out.getContext('2d');
    if (!lg || !og) return;
    lg.clearRect(0, 0, LOW_W, LOW_H);
    lg.save();
    lg.translate(ORIGIN_X, ORIGIN_Y);
    lg.scale(SCALE, SCALE);
    drawBlackFridayCartoon(lg, bfPose(t, state), t, true);
    lg.restore();

    const img = lg.getImageData(0, 0, LOW_W, LOW_H);
    const d = img.data;
    const solid = new Uint8Array(LOW_W * LOW_H);
    for (let i = 0; i < LOW_W * LOW_H; i++) {
      const a = d[i * 4 + 3];
      if (a < 110) {
        d[i * 4 + 3] = 0;
        continue;
      }
      // ImageData colors are not premultiplied, so they can be snapped to the palette directly.
      const [r, gg, b] = nearest(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
      d[i * 4] = r;
      d[i * 4 + 1] = gg;
      d[i * 4 + 2] = b;
      d[i * 4 + 3] = 255;
      solid[i] = 1;
    }
    // 1-pixel outline around the sprite.
    for (let y = 0; y < LOW_H; y++) {
      for (let x = 0; x < LOW_W; x++) {
        const i = y * LOW_W + x;
        if (solid[i]) continue;
        const near =
          (x > 0 && solid[i - 1]) || (x < LOW_W - 1 && solid[i + 1]) || (y > 0 && solid[i - LOW_W]) || (y < LOW_H - 1 && solid[i + LOW_W]);
        if (near) {
          d[i * 4] = 10;
          d[i * 4 + 1] = 10;
          d[i * 4 + 2] = 10;
          d[i * 4 + 3] = 255;
        }
      }
    }
    og.clearRect(0, 0, LOW_W, LOW_H);
    og.putImageData(img, 0, 0);
  }
}
