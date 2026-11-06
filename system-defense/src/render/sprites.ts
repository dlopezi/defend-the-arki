import type { DefenseType, EnemyType } from '../config';
import type { EnemyState } from '../components';

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
  /** Remaining fuse 0..1 (Circuit Breaker armed). */
  fuse?: number;
  /** Generator charge 0..1 (Worker Node). */
  charge?: number;
  hpRatio?: number;
}

/** Draws a defense centered at (x, y), about 70x70 px. */
export function drawDefense(g: G, type: DefenseType, x: number, y: number, time: number, o: DefenseDrawOpts = {}): void {
  g.save();
  g.translate(x, y);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath();
  g.ellipse(0, 37, 30, 6, 0, 0, TAU);
  g.fill();
  g.lineWidth = 2;

  switch (type) {
    case 'worker': {
      rr(g, -28, -36, 56, 70, 7);
      g.fillStyle = '#0f2a3d';
      g.fill();
      g.strokeStyle = '#38bdf8';
      g.stroke();
      for (let i = 0; i < 4; i++) {
        const sy = -28 + i * 13.5;
        rr(g, -21, sy, 42, 10, 2);
        g.fillStyle = '#081521';
        g.fill();
        g.fillStyle = '#1e4a66';
        g.fillRect(-17, sy + 3, 18, 2);
        g.fillRect(-17, sy + 6, 11, 1.5);
        const on = Math.sin(time * 5 + i * 1.7) > -0.3;
        g.fillStyle = on ? '#4ade80' : '#14532d';
        circle(g, 14, sy + 5, 2.4);
        g.fill();
      }
      rr(g, -21, 26, 42, 4, 2);
      g.fillStyle = '#081521';
      g.fill();
      if (o.charge !== undefined) {
        rr(g, -21, 26, 42 * Math.max(0.02, o.charge), 4, 2);
        g.fillStyle = '#fde047';
        g.fill();
      }
      break;
    }
    case 'loadBalancer': {
      rr(g, 24, -7, 18, 14, 3);
      g.fillStyle = '#1d4ed8';
      g.fill();
      g.strokeStyle = '#93c5fd';
      g.stroke();
      rr(g, -30, -30, 60, 60, 12);
      g.fillStyle = '#0d2350';
      g.fill();
      g.strokeStyle = '#60a5fa';
      g.stroke();
      g.strokeStyle = '#93c5fd';
      g.lineWidth = 2;
      const outs = [-13, 0, 13];
      for (const oy of outs) {
        g.beginPath();
        g.moveTo(-12, -4);
        g.lineTo(12, oy - 4);
        g.stroke();
      }
      g.fillStyle = '#93c5fd';
      circle(g, -12, -4, 5);
      g.fill();
      outs.forEach((oy, i) => {
        const pulse = Math.sin(time * 6 - i) > 0;
        g.fillStyle = pulse ? '#4ade80' : '#166534';
        circle(g, 14, oy - 4, 3.6);
        g.fill();
      });
      label(g, 'LB', 0, 20, 10, '#bfdbfe');
      break;
    }
    case 'redis': {
      for (let i = 0; i < 3; i++) {
        const cy = 20 - i * 19;
        g.fillStyle = '#991b1b';
        g.fillRect(-28, cy - 7, 56, 14);
        g.beginPath();
        g.ellipse(0, cy + 7, 28, 8, 0, 0, Math.PI);
        g.fill();
        g.fillStyle = '#ef4444';
        g.beginPath();
        g.ellipse(0, cy - 7, 28, 8, 0, 0, TAU);
        g.fill();
        g.strokeStyle = '#fecaca';
        g.lineWidth = 1;
        g.stroke();
      }
      label(g, 'redis', 0, 5, 10, '#fff1f2');
      const hp = o.hpRatio ?? 1;
      if (hp < 0.66) {
        g.strokeStyle = '#1f0505';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(-18, -20);
        g.lineTo(-8, -6);
        g.lineTo(-14, 6);
        g.lineTo(-4, 20);
        g.stroke();
      }
      if (hp < 0.33) {
        g.beginPath();
        g.moveTo(20, -24);
        g.lineTo(10, -10);
        g.lineTo(18, 2);
        g.lineTo(8, 18);
        g.stroke();
      }
      break;
    }
    case 'rateLimiter': {
      rr(g, 24, -7, 18, 14, 3);
      g.fillStyle = '#6d28d9';
      g.fill();
      g.strokeStyle = '#c4b5fd';
      g.stroke();
      rr(g, -30, -30, 60, 60, 10);
      g.fillStyle = '#2a0f5c';
      g.fill();
      g.strokeStyle = '#a78bfa';
      g.stroke();
      g.strokeStyle = '#c4b5fd';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(0, 10, 18, Math.PI, TAU);
      g.stroke();
      const ang = Math.PI + (0.5 + 0.38 * Math.sin(time * 2.2)) * Math.PI;
      g.strokeStyle = '#f472b6';
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(0, 10);
      g.lineTo(Math.cos(ang) * 15, 10 + Math.sin(ang) * 15);
      g.stroke();
      label(g, '429', 0, -18, 11, '#ddd6fe');
      label(g, 'req/s', 0, 21, 8, '#a78bfa');
      break;
    }
    case 'circuitBreaker': {
      const armed = o.fuse !== undefined;
      const s = armed ? 1 + 0.07 * Math.sin(time * 40) : 1;
      g.scale(s, s);
      rr(g, -28, -32, 56, 64, 6);
      g.save();
      g.fillStyle = '#facc15';
      g.fill();
      g.clip();
      g.fillStyle = '#111827';
      for (let i = -6; i < 6; i++) {
        g.beginPath();
        g.moveTo(i * 14, -32);
        g.lineTo(i * 14 + 7, -32);
        g.lineTo(i * 14 + 7 + 64, 32);
        g.lineTo(i * 14 + 64, 32);
        g.fill();
      }
      g.restore();
      g.strokeStyle = '#000';
      rr(g, -28, -32, 56, 64, 6);
      g.stroke();
      rr(g, -17, -19, 34, 38, 4);
      g.fillStyle = '#1c1917';
      g.fill();
      rr(g, -6, armed ? 0 : -14, 12, 14, 2);
      g.fillStyle = armed ? '#dc2626' : '#22c55e';
      g.fill();
      label(g, armed ? 'OPEN' : 'ON', 0, armed ? -10 : 9, 8, '#e5e7eb');
      if (armed) {
        const k = 1 - (o.fuse ?? 0);
        const blink = 0.5 + 0.5 * Math.sin(time * (14 + k * 50));
        g.globalAlpha = 0.25 + 0.45 * blink;
        rr(g, -28, -32, 56, 64, 6);
        g.fillStyle = '#ef4444';
        g.fill();
        g.globalAlpha = 1;
      }
      break;
    }
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

export interface EnemyDrawOpts {
  flash: number;
  slowed: boolean;
  state: EnemyState;
  jumpHeight: number;
}

/** Draws an enemy centered at (x, y). */
export function drawEnemy(g: G, type: EnemyType, x: number, y: number, w: number, h: number, time: number, o: EnemyDrawOpts): void {
  const bob = o.state === 'walk' ? Math.sin(time * 9 + x * 0.13) * 2 : 0;
  const lean = o.state === 'attack' ? Math.sin(time * 14) * 3 : 0;
  const step = Math.sin(time * 9 + x * 0.13);

  g.save();
  g.translate(x, y);
  // ground shadow stays on the ground while jumping
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath();
  g.ellipse(0, h / 2 + 2, w * 0.45 * (1 - o.jumpHeight / 160), 6, 0, 0, TAU);
  g.fill();
  g.translate(lean, bob - o.jumpHeight);
  g.lineWidth = 2;

  switch (type) {
    case 'normal': {
      g.fillStyle = '#334155';
      g.fillRect(-12 + step * 3, h / 2 - 12, 7, 12);
      g.fillRect(5 - step * 3, h / 2 - 12, 7, 12);
      rr(g, -w / 2, -h / 2, w, h - 10, 8);
      g.fillStyle = '#475569';
      g.fill();
      g.strokeStyle = '#cbd5e1';
      g.stroke();
      rr(g, -w / 2 + 6, -h / 2 + 7, w - 12, 18, 4);
      g.fillStyle = '#0f172a';
      g.fill();
      g.fillStyle = '#e2e8f0';
      circle(g, -8, -h / 2 + 16, 3);
      g.fill();
      circle(g, 4, -h / 2 + 16, 3);
      g.fill();
      label(g, 'GET /', 0, 6, 9, '#e2e8f0');
      break;
    }
    case 'scraper': {
      g.strokeStyle = '#fdba74';
      for (let i = 0; i < 3; i++) {
        const lx = -14 + i * 14;
        const k = Math.sin(time * 10 + i * 2) * 4;
        g.beginPath();
        g.moveTo(lx, h / 2 - 16);
        g.lineTo(lx - 6 + k, h / 2);
        g.stroke();
      }
      g.beginPath();
      g.moveTo(0, -h / 2 + 4);
      g.lineTo(4, -h / 2 - 8);
      g.stroke();
      g.fillStyle = Math.sin(time * 8) > 0 ? '#ef4444' : '#7f1d1d';
      circle(g, 4, -h / 2 - 9, 3.5);
      g.fill();
      rr(g, -w / 2, -h / 2 + 2, w, h - 16, 10);
      g.fillStyle = '#9a3412';
      g.fill();
      g.strokeStyle = '#fdba74';
      g.stroke();
      rr(g, -w / 2 + 6, -h / 2 + 10, w - 12, 12, 6);
      g.fillStyle = '#1c1917';
      g.fill();
      g.fillStyle = '#fde047';
      g.fillRect(-14 + Math.sin(time * 3) * 6, -h / 2 + 13, 10, 6);
      label(g, 'BOT', 0, 8, 11, '#ffedd5');
      label(g, '</>', 0, 20, 8, '#fdba74');
      break;
    }
    case 'ddos': {
      const blobs = 9;
      for (let i = 0; i < blobs; i++) {
        const a = (i / blobs) * TAU + time * 0.8;
        const r = w * 0.32 + Math.sin(time * 6 + i) * 3;
        g.fillStyle = i % 2 ? '#7f1d1d' : '#991b1b';
        circle(g, Math.cos(a) * r, Math.sin(a) * r * 0.9, 12);
        g.fill();
        g.strokeStyle = '#f87171';
        g.lineWidth = 1.5;
        g.stroke();
      }
      circle(g, 0, 0, w * 0.3);
      g.fillStyle = '#450a0a';
      g.fill();
      g.strokeStyle = '#fca5a5';
      g.lineWidth = 2;
      g.stroke();
      label(g, 'DDoS', 0, -2, 12, '#fee2e2');
      label(g, '×10⁶', 0, 11, 8, '#fca5a5');
      break;
    }
    case 'zeroDay': {
      if (o.state === 'jump') g.rotate(-0.35);
      g.fillStyle = '#4a044e';
      g.fillRect(-10 + step * 4, h / 2 - 12, 6, 12);
      g.fillRect(4 - step * 4, h / 2 - 12, 6, 12);
      g.beginPath();
      g.moveTo(0, -h / 2);
      g.lineTo(w / 2, h / 2 - 10);
      g.lineTo(-w / 2, h / 2 - 10);
      g.closePath();
      g.fillStyle = '#86198f';
      g.fill();
      g.strokeStyle = '#f0abfc';
      g.stroke();
      g.fillStyle = '#0a0a0a';
      circle(g, -6, -2, 4);
      g.fill();
      circle(g, 6, -2, 4);
      g.fill();
      g.fillStyle = '#f0abfc';
      circle(g, -6, -2, 1.5);
      g.fill();
      circle(g, 6, -2, 1.5);
      g.fill();
      label(g, '0day', 0, 11, 8, '#fae8ff');
      break;
    }
    case 'blackFriday': {
      g.fillStyle = '#262626';
      g.strokeStyle = '#facc15';
      for (const wx of [-36, 36]) {
        circle(g, wx, h / 2 - 8, 9);
        g.fill();
        g.stroke();
      }
      rr(g, -w / 2, -h / 2, w, h - 16, 10);
      g.fillStyle = '#0a0a0a';
      g.fill();
      g.lineWidth = 3;
      g.stroke();
      for (let i = 0; i < 5; i++) {
        const on = Math.floor(time * 6 + i) % 2 === 0;
        g.fillStyle = on ? '#facc15' : '#dc2626';
        circle(g, -40 + i * 20, -h / 2 + 10, 4);
        g.fill();
      }
      label(g, 'BLACK', 0, -h / 2 + 34, 20, '#facc15');
      label(g, 'FRIDAY', 0, -h / 2 + 56, 18, '#facc15');
      rr(g, -32, -h / 2 + 70, 64, 24, 5);
      g.fillStyle = '#dc2626';
      g.fill();
      label(g, '-70%', 0, -h / 2 + 82, 16, '#ffffff');
      break;
    }
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
