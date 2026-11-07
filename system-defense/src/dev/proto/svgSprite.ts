import type { G } from './rig';

/*
 * Technique C building block: a character made of SVG part files.
 * Each part is rasterized ONCE at load time (filters and gradients included),
 * so drawing during the game is only drawImage: no runtime glow, no gradients.
 */

export interface PartSpec {
  /** viewBox of the .svg file, in part space: x, y, width, height. */
  vb: [number, number, number, number];
}

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export class SvgSprite<N extends string> {
  private readonly base: string;
  private readonly parts: Record<N, PartSpec>;
  /** Raster resolution (pixels per unit). Higher = sharper when zoomed, more memory. */
  private readonly res: number;
  private readonly canvases = new Map<N, HTMLCanvasElement>();
  state: LoadState = 'idle';

  constructor(base: string, parts: Record<N, PartSpec>, res = 4) {
    this.base = base;
    this.parts = parts;
    this.res = res;
  }

  /** Starts loading all parts (once). */
  load(): void {
    if (this.state !== 'idle') return;
    this.state = 'loading';
    const names = Object.keys(this.parts) as N[];
    Promise.all(names.map((n) => this.loadPart(n)))
      .then(() => {
        this.state = 'ready';
      })
      .catch((err: unknown) => {
        this.state = 'error';
        console.error(`[proto] SVG parts failed to load from ${this.base}`, err);
      });
  }

  get ready(): boolean {
    return this.state === 'ready';
  }

  /** Draws a part in its own space (the caller sets up the transform). */
  draw(g: G, name: N): void {
    const c = this.canvases.get(name);
    if (!c) return;
    const [x, y, w, h] = this.parts[name].vb;
    g.drawImage(c, x, y, w, h);
  }

  /** Placeholder text while loading or after an error. */
  drawStatus(g: G): void {
    g.fillStyle = '#94a3b8';
    g.font = '600 12px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText(this.state === 'error' ? 'Error al cargar los SVG' : 'Cargando SVG…', 0, 0);
  }

  private async loadPart(name: N): Promise<void> {
    const [, , w, h] = this.parts[name].vb;
    const img = new Image();
    img.src = `${this.base}${name}.svg`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * this.res);
    c.height = Math.ceil(h * this.res);
    c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
    this.canvases.set(name, c);
  }
}
