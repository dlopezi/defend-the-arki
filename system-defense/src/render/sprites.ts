import type { DefenseType, EnemyType } from '../config';
import type { EnemyState } from '../components';
import { DEFENSE_ART, rollbackArt } from './defenseArt';
import { attackPulse, ENEMY_ART } from './enemyArt';

type G = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

function rr(g: G, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

function circle(g: G, x: number, y: number, r: number): void {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
}

function label(g: G, text: string, x: number, y: number, size: number, color: string): void {
  g.font = `700 ${size}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(text, x, y);
}

export interface DefenseDrawOpts {
  flash?: number;
  /** 0..1 short push: recoil after firing, shake when hit. */
  kick?: number;
  /** Remaining fuse 0..1 (Circuit Breaker armed). */
  fuse?: number;
  /** Generator charge 0..1 (Worker Node). */
  charge?: number;
  hpRatio?: number;
  /** 2 = upgraded (shows a v2 badge). */
  level?: number;
  /** Locked by Ransomware. */
  encrypted?: boolean;
  /** Fire rate halved by a Slowloris. */
  throttled?: boolean;
  /** Kafka: 1 = ready, 0 = just used. */
  trapReady?: number;
  /** Kafka is holding a threat right now. */
  trapBusy?: boolean;
}

function padlock(g: G, x: number, y: number, s: number): void {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.strokeStyle = '#fecaca';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(0, -6, 7, Math.PI, TAU);
  g.stroke();
  rr(g, -10, -6, 20, 16, 3);
  g.fillStyle = '#dc2626';
  g.fill();
  g.fillStyle = '#450a0a';
  circle(g, 0, 1, 2.5);
  g.fill();
  g.fillRect(-1, 2, 2, 5);
  g.restore();
}

/** Draws a defense centered at (x, y), about 70x70 px, with the avatar chosen on the avatar picker page. */
export function drawDefense(g: G, type: DefenseType, x: number, y: number, time: number, o: DefenseDrawOpts = {}): void {
  g.save();
  g.translate(x, y);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath();
  g.ellipse(0, 37, 30, 6, 0, 0, TAU);
  g.fill();
  g.save();
  DEFENSE_ART[type](g, {
    t: time,
    kick: o.kick ?? 0,
    charge: o.charge ?? 0,
    fuse: o.fuse,
    hp: o.hpRatio ?? 1,
    ready: o.trapReady ?? 1,
    busy: o.trapBusy ?? false,
    level: o.level === 2 ? 2 : 1,
  });
  g.restore();

  // The v2 look is part of each avatar (gold accents), so there is no generic "v2" tag here.
  if (o.throttled) {
    rr(g, -34, -46, 22, 14, 4);
    g.fillStyle = '#0369a1';
    g.fill();
    label(g, '½', -23, -39, 10, '#e0f2fe');
  }
  if (o.encrypted) {
    g.globalAlpha = 0.55;
    rr(g, -32, -40, 64, 76, 10);
    g.fillStyle = '#1c0505';
    g.fill();
    g.globalAlpha = 1;
    padlock(g, 0, 0, 1.3);
  }
  if (o.flash && o.flash > 0) {
    g.globalAlpha = Math.min(0.55, o.flash * 6);
    rr(g, -32, -36, 64, 72, 10);
    g.fillStyle = '#ffffff';
    g.fill();
    g.globalAlpha = 1;
  }
  g.restore();
}

/** One-time Rollback (sweeper truck with an undo arrow) waiting next to the base, or sweeping the lane. */
export function drawRollback(g: G, x: number, y: number, running: boolean, time: number): void {
  g.save();
  g.translate(x, y);
  if (running) {
    const grad = g.createLinearGradient(-90, 0, 0, 0);
    grad.addColorStop(0, 'rgba(34,211,238,0)');
    grad.addColorStop(1, 'rgba(34,211,238,0.45)');
    g.fillStyle = grad;
    g.fillRect(-90, -40, 90, 80);
  }
  // smaller than a defense: it waits in the narrow gap next to the base
  g.scale(0.72, 0.72);
  rollbackArt(g, running, time);
  g.restore();
}

export interface EnemyDrawOpts {
  flash: number;
  slowed: boolean;
  state: EnemyState;
  jumpHeight: number;
  /** Kafka hold left, 0..1 (undefined when not held). */
  held?: number;
}

/** Draws an enemy centered at (x, y), with the avatar chosen on the avatar picker page. */
export function drawEnemy(g: G, type: EnemyType, x: number, y: number, w: number, h: number, time: number, o: EnemyDrawOpts): void {
  const walking = o.state === 'walk';
  const step = walking ? Math.sin(time * 9 + x * 0.13) : 0;
  // each enemy hits on its own beat
  const atk = o.state === 'attack' ? attackPulse(time + x * 0.01) : 0;

  g.save();
  g.translate(x, y);
  // ground shadow stays on the ground while jumping
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath();
  g.ellipse(0, h / 2 + 2, w * 0.45 * (1 - o.jumpHeight / 160), 6, 0, 0, TAU);
  g.fill();
  g.translate(0, step * 2 - o.jumpHeight);
  // lean forward around the feet when hitting; tilt up while jumping
  g.translate(0, h / 2);
  g.rotate(o.state === 'jump' ? -0.25 : -0.08 * atk);
  g.translate(0, -h / 2);
  g.save();
  ENEMY_ART[type](g, { w, h, t: time, step, atk });
  g.restore();

  if (o.held !== undefined) {
    g.strokeStyle = '#fb923c';
    g.lineWidth = 3;
    const bx = w / 2 + 5;
    const by = h / 2 + 3;
    g.beginPath();
    g.moveTo(-bx + 8, -by);
    g.lineTo(-bx, -by);
    g.lineTo(-bx, by);
    g.lineTo(-bx + 8, by);
    g.moveTo(bx - 8, -by);
    g.lineTo(bx, -by);
    g.lineTo(bx, by);
    g.lineTo(bx - 8, by);
    g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.6)';
    g.fillRect(-w / 2, by + 4, w, 4);
    g.fillStyle = '#fb923c';
    g.fillRect(-w / 2, by + 4, w * o.held, 4);
  }

  if (o.slowed) {
    g.globalAlpha = 0.3;
    rr(g, -w / 2 - 2, -h / 2 - 2, w + 4, h + 4, 10);
    g.fillStyle = '#60a5fa';
    g.fill();
    g.globalAlpha = 1;
    label(g, '429', w / 2 - 4, -h / 2 - 4, 9, '#bfdbfe');
  }
  if (o.flash > 0) {
    g.globalAlpha = Math.min(0.6, o.flash * 6);
    rr(g, -w / 2, -h / 2, w, h, 10);
    g.fillStyle = '#ffffff';
    g.fill();
    g.globalAlpha = 1;
  }
  g.restore();
}

export function drawProjectile(g: G, x: number, y: number, slow: boolean): void {
  g.save();
  g.shadowColor = slow ? '#a855f7' : '#22c55e';
  g.shadowBlur = 12;
  rr(g, x - 16, y - 8, 32, 16, 8);
  g.fillStyle = slow ? '#a855f7' : '#22c55e';
  g.fill();
  g.shadowBlur = 0;
  label(g, slow ? '429' : '200', x, y + 0.5, 10, slow ? '#faf5ff' : '#052e16');
  g.restore();
}

export function drawCU(g: G, x: number, y: number, value: number, time: number, alpha = 1): void {
  g.save();
  g.globalAlpha = alpha;
  g.translate(x, y);
  g.shadowColor = '#facc15';
  g.shadowBlur = 16;
  g.beginPath();
  const r = 18 + Math.sin(time * 4) * 1.2;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + Math.PI / 6;
    if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
  const grad = g.createLinearGradient(0, -r, 0, r);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(1, '#f59e0b');
  g.fillStyle = grad;
  g.fill();
  g.shadowBlur = 0;
  g.strokeStyle = '#fffbeb';
  g.lineWidth = 1.5;
  g.stroke();
  label(g, 'CU', 0, -3, 11, '#422006');
  label(g, String(value), 0, 8, 8, '#713f12');
  g.restore();
}
