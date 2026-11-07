/* Small helpers for the animated canvases of the menus (home arena, guide, how-to, concept card). */

export type G = CanvasRenderingContext2D;

/** Calls frame(t) on every animation frame while alive() is true (t in seconds). */
export function loop(alive: () => boolean, frame: (t: number) => void): void {
  const step = (now: number): void => {
    if (!alive()) return;
    frame(now / 1000);
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Gives the canvas a crisp backing store for a fixed logical size (CSS may scale it). */
export function fitCanvas(c: HTMLCanvasElement, w: number, h: number): G | null {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (c.width !== bw || c.height !== bh) {
    c.width = bw;
    c.height = bh;
  }
  const g = c.getContext('2d');
  if (!g) return null;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return g;
}

/** The same "+" as the mouse cursor, drawn in a canvas (for the how-to scenes). */
export function drawPlus(g: G, x: number, y: number, pressed: boolean, color = '#38bdf8'): void {
  g.save();
  g.translate(x, y);
  const s = pressed ? 0.8 : 1;
  g.scale(s, s);
  if (pressed) {
    g.strokeStyle = 'rgba(56,189,248,0.7)';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(0, 0, 16, 0, Math.PI * 2);
    g.stroke();
  }
  g.beginPath();
  g.moveTo(-2, -10);
  g.lineTo(2, -10);
  g.lineTo(2, -2);
  g.lineTo(10, -2);
  g.lineTo(10, 2);
  g.lineTo(2, 2);
  g.lineTo(2, 10);
  g.lineTo(-2, 10);
  g.lineTo(-2, 2);
  g.lineTo(-10, 2);
  g.lineTo(-10, -2);
  g.lineTo(-2, -2);
  g.closePath();
  g.fillStyle = color;
  g.fill();
  g.strokeStyle = '#020617';
  g.lineWidth = 1.6;
  g.lineJoin = 'round';
  g.stroke();
  g.restore();
}

/** Smooth 0..1 step between a and b. */
export function ease(t: number, a: number, b: number): number {
  const k = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return k * k * (3 - 2 * k);
}
