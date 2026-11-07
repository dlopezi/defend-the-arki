/* Basic canvas shapes shared by the threat and defense avatars. */

export type G = CanvasRenderingContext2D;

export const TAU = Math.PI * 2;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export function rr(g: G, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}
export function circ(g: G, x: number, y: number, r: number): void {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
}
/** Fills the current path, and strokes it when a stroke color is given. */
export function paint(g: G, fill: string, stroke?: string, lw = 2): void {
  g.fillStyle = fill;
  g.fill();
  if (stroke) {
    g.lineWidth = lw;
    g.strokeStyle = stroke;
    g.stroke();
  }
}
export function line(g: G, x1: number, y1: number, x2: number, y2: number, color: string, lw = 2): void {
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}
/** Centered monospace text. */
export function txt(g: G, s: string, x: number, y: number, size: number, color: string, weight = 700): void {
  g.font = `${weight} ${size}px ${MONO}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(s, x, y);
}
