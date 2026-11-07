import { DEFENSES, ENEMIES, type DefenseType, type EnemyType } from '../config';
import { drawCU, drawDefense, drawEnemy, drawProjectile, drawRollback } from '../render/sprites';
import { drawPlus, ease, type G } from './anim';

/*
 * Animated mini scenes for the "Cómo jugar" screen. Each one loops and shows one idea
 * with the real game sprites and the same "+" cursor as the mouse.
 * Logical size of every scene: SCENE_W × SCENE_H (the canvas is scaled by CSS).
 */

export const SCENE_W = 320;
export const SCENE_H = 150;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const K = 0.55;

function text(g: G, s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'center', weight = 800): void {
  g.font = `${weight} ${size}px ${MONO}`;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(s, x, y);
}
function box(g: G, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string, lw = 1.5): void {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = lw;
    g.stroke();
  }
}
/** Board cells like the game board. */
function cells(g: G, x: number, y: number, cols: number, rows: number, size: number): void {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      g.fillStyle = (r + c) % 2 === 0 ? '#0f1730' : '#121c39';
      g.fillRect(x + c * size, y + r * size, size, size);
      g.strokeStyle = '#1a2547';
      g.lineWidth = 1;
      g.strokeRect(x + c * size + 0.5, y + r * size + 0.5, size - 1, size - 1);
    }
  }
}
function background(g: G): void {
  g.fillStyle = '#070b17';
  g.fillRect(0, 0, SCENE_W, SCENE_H);
}
/** CU counter like the HUD. */
function counter(g: G, x: number, y: number, value: number, glow: boolean): void {
  box(g, x, y, 74, 22, 6, glow ? '#422006' : '#1c1405', glow ? '#fde047' : '#a16207', 1.2);
  g.save();
  g.translate(x + 12, y + 11);
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    if (i === 0) g.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
    else g.lineTo(Math.cos(a) * 6, Math.sin(a) * 6);
  }
  g.closePath();
  g.fillStyle = '#fde047';
  g.fill();
  g.restore();
  text(g, String(value), x + 46, y + 11.5, 12, '#fde047', 'center', 900);
}
function defense(g: G, type: DefenseType, x: number, y: number, t: number, k = K, opts: Parameters<typeof drawDefense>[5] = {}): void {
  g.save();
  g.translate(x, y);
  g.scale(k, k);
  drawDefense(g, type, 0, 0, t, opts);
  g.restore();
}
function enemy(g: G, type: EnemyType, x: number, feet: number, t: number, flash = 0, alpha = 1): void {
  const s = ENEMIES[type];
  g.save();
  g.globalAlpha = alpha;
  g.translate(x, feet - (s.height / 2) * K);
  g.scale(K, K);
  drawEnemy(g, type, 0, 0, s.width, s.height, t, { flash, slowed: false, state: 'walk', jumpHeight: 0 });
  g.restore();
}
function packet(g: G, x: number, y: number, slow = false): void {
  g.save();
  g.translate(x, y);
  g.scale(K, K);
  drawProjectile(g, 0, 0, slow);
  g.restore();
}
function poof(g: G, x: number, y: number, k: number, color: string): void {
  g.strokeStyle = color;
  g.globalAlpha = 1 - k;
  g.lineWidth = 2.5;
  g.beginPath();
  g.arc(x, y, 6 + k * 18, 0, Math.PI * 2);
  g.stroke();
  g.globalAlpha = 1;
}
const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

/* ======================= 1 · Collect CU ======================= */

function sceneCollect(g: G, t: number): void {
  const T = t % 3.4;
  background(g);
  const cell = 55;
  const x0 = 22;
  const y0 = 36;
  cells(g, x0, y0, 5, 2, cell);
  defense(g, 'worker', x0 + cell / 2, y0 + cell / 2 + 2, t, K, { charge: (t * 0.4) % 1 });
  const land: [number, number] = [x0 + 3.5 * cell, y0 + 1.5 * cell];
  const flyK = ease(T, 1.9, 2.4);
  const got = T >= 2.4;
  counter(g, 10, 7, got ? 175 : 150, got && T < 2.9);
  if (T < 2.4) {
    const fall = ease(T, 0, 1);
    const x = lerp(land[0], 46, flyK);
    const y = flyK > 0 ? lerp(land[1], 18, flyK) : lerp(-20, land[1], fall);
    g.save();
    g.translate(x, y);
    const s = 0.7 * (1 - flyK * 0.6);
    g.scale(s, s);
    drawCU(g, 0, 0, 25, t);
    g.restore();
  }
  if (got && T < 2.9) text(g, '+25', 96, 18, 11, '#fde047', 'left', 900);
  // cursor: comes in, clicks the CU, leaves
  const go = ease(T, 1, 1.6);
  const back = ease(T, 2.2, 2.9);
  const cx = lerp(lerp(300, land[0] + 6, go), 300, back);
  const cy = lerp(lerp(148, land[1] + 6, go), 148, back);
  drawPlus(g, cx, cy, T > 1.6 && T < 1.85);
}

/* ======================= 2 · Place a defense ======================= */

const CARDS: DefenseType[] = ['worker', 'loadBalancer', 'redis'];

function scenePlace(g: G, t: number): void {
  const T = t % 3.8;
  background(g);
  const selected = T > 0.85 && T < 1.9;
  // mini HUD cards
  CARDS.forEach((type, i) => {
    const x = 8 + i * 60;
    const on = selected && type === 'loadBalancer';
    box(g, x, 6, 54, 46, 7, on ? '#0c4a6e' : '#0f1a33', on ? '#38bdf8' : '#1e2b4d', on ? 2 : 1);
    defense(g, type, x + 27, 22, t, 0.28);
    text(g, String(DEFENSES[type].cost), x + 27, 43, 9, '#fde047', 'center', 900);
  });
  const placed = T >= 1.9;
  counter(g, 238, 8, placed ? 150 : 250, placed && T < 2.5);
  const cell = 58;
  const bx = 15;
  const by = 70;
  cells(g, bx, by, 5, 1, cell);
  const target: [number, number] = [bx + 2.5 * cell, by + cell / 2 + 2];
  if (placed) {
    defense(g, 'loadBalancer', target[0], target[1], t);
    if (T < 2.6) {
      text(g, '-100 CU', target[0], by - 6 - (T - 1.9) * 12, 10, '#f87171', 'center', 900);
      poof(g, target[0], target[1], (T - 1.9) / 0.7, 'rgba(56,189,248,0.9)');
    }
  }
  // cursor path: card → cell
  const toCard = ease(T, 0.1, 0.8);
  const toCell = ease(T, 1.05, 1.8);
  const away = ease(T, 2.3, 3.1);
  const cx = lerp(lerp(lerp(280, 98, toCard), target[0], toCell), 290, away);
  const cy = lerp(lerp(lerp(140, 30, toCard), target[1], toCell), 140, away);
  if (selected) {
    // ghost of the defense under the cursor
    g.save();
    g.globalAlpha = 0.45;
    defense(g, 'loadBalancer', cx, cy, t);
    g.restore();
  }
  drawPlus(g, cx, cy, (T > 0.8 && T < 1) || (T > 1.8 && T < 2));
}

/* ======================= 3 · Stop the threats ======================= */

function sceneDefend(g: G, t: number): void {
  const T = t % 3.6;
  background(g);
  const cell = 52;
  const bx = 8;
  const by = 46;
  cells(g, bx, by, 6, 1, cell);
  const lbX = bx + cell / 2;
  const laneY = by + cell / 2 + 2;
  const feet = by + cell - 4;
  defense(g, 'loadBalancer', lbX, laneY, t, K, { kick: 0 });
  // the threat walks in from the right; packets every 0.55 s; 3 hits = gone
  const speed = 30;
  const v = 200;
  const start = SCENE_W - 10;
  const x0 = lbX + 22;
  const tx = (tt: number): number => start - tt * speed;
  const hits: number[] = [];
  for (let ft = 0.4; ft < 3.6; ft += 0.6) {
    const hitT = (start - 12 - x0 + ft * v) / (v + speed);
    if (hits.length < 3) hits.push(hitT);
    if (hits.length === 3) break;
  }
  const dead = hits[2];
  const fired: number[] = [];
  for (let ft = 0.4; ft < dead; ft += 0.6) fired.push(ft);
  // packets in flight
  for (const ft of fired) {
    const hitT = (start - 12 - x0 + ft * v) / (v + speed);
    // only the 3 packets that hit; nothing flies after the threat is gone
    if (hitT > dead + 1e-6) continue;
    if (T >= ft && T < hitT) packet(g, x0 + (T - ft) * v, laneY - 3);
  }
  const lastHit = hits.filter((h) => h <= T).pop();
  const flash = lastHit !== undefined && T - lastHit < 0.12 ? 0.08 : 0;
  if (T < dead) enemy(g, 'normal', tx(T), feet, t, flash);
  else if (T < dead + 0.6) poof(g, tx(dead), laneY, (T - dead) / 0.6, 'rgba(134,239,172,0.9)');
  // hit marks
  hits.forEach((h, i) => {
    if (T >= h) text(g, '✓', 210 + i * 14, 22, 12, '#4ade80', 'center', 900);
    else text(g, '·', 210 + i * 14, 22, 12, '#334155', 'center', 900);
  });
  text(g, 'HTTP 200 ×3', 120, 22, 10, '#86efac', 'left', 800);
  text(g, 'INTERNET →', SCENE_W - 8, SCENE_H - 12, 9, 'rgba(248,113,113,0.6)', 'right', 800);
  text(g, '← BASE', 8, SCENE_H - 12, 9, 'rgba(56,189,248,0.6)', 'left', 800);
}

/* ======================= 4 · Upgrade to v2 ======================= */

function sceneUpgrade(g: G, t: number): void {
  const T = t % 3.8;
  background(g);
  const cell = 70;
  cells(g, 40, 38, 2, 1, cell);
  const dx = 40 + cell / 2;
  const dy = 38 + cell / 2 + 2;
  const up = T >= 1.7;
  defense(g, 'loadBalancer', dx, dy, t, 0.75, { level: up ? 2 : 1 });
  text(g, up ? 'v2 · dispara 2 paquetes' : 'v1', dx, 128, 10, up ? '#facc15' : '#94a3b8', 'center', 900);
  if (up && T < 2.5) {
    const k = (T - 1.7) / 0.8;
    g.strokeStyle = `rgba(250,204,21,${1 - k})`;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(dx, dy, 20 + k * 40, 0, Math.PI * 2);
    g.stroke();
  }
  // upgrade panel (opens after clicking the defense)
  const open = T > 0.9 && T < 1.75;
  if (open) {
    box(g, 162, 44, 152, 62, 8, '#0f1a33', '#38bdf8', 1.5);
    text(g, 'Load Balancer', 238, 58, 9, '#93c5fd', 'center', 800);
    box(g, 168, 70, 140, 26, 6, '#854d0e', '#facc15', 1.5);
    text(g, '⬆ Mejorar a v2 · 100 CU', 238, 83.5, 8.5, '#fef9c3', 'center', 900);
  }
  const toDef = ease(T, 0.1, 0.75);
  const toBtn = ease(T, 1.0, 1.55);
  const away = ease(T, 2.2, 3);
  const cx = lerp(lerp(lerp(300, dx + 8, toDef), 250, toBtn), 300, away);
  const cy = lerp(lerp(lerp(140, dy + 6, toDef), 86, toBtn), 140, away);
  drawPlus(g, cx, cy, (T > 0.75 && T < 0.95) || (T > 1.55 && T < 1.75));
}

/* ======================= 5 · Rollback ======================= */

function sceneRollback(g: G, t: number): void {
  const T = t % 3.8;
  background(g);
  const by = 46;
  const cell = 54;
  // service box (base) for one lane
  box(g, 6, by + 4, 50, cell - 8, 7, '#0f2a24', '#34d399', 1.5);
  text(g, 'cart', 31, by + 18, 8, '#e0e7ff', 'center', 800);
  text(g, '200 OK', 31, by + 36, 7, '#a7f3d0', 'center', 800);
  cells(g, 84, by, 5, 1, cell);
  const feet = by + cell - 4;
  const laneY = by + cell / 2;
  // the Rollback fires when the first threat reaches the base, like in the game
  const trigger = 2;
  const speed = 122;
  const rbX = T < trigger ? 70 : 70 + (T - trigger) * 260;
  const running = T >= trigger && rbX < SCENE_W + 30;
  const threats: [EnemyType, number][] = [
    ['normal', 0],
    ['scraper', 60],
  ];
  threats.forEach(([type, gap], i) => {
    const x = Math.max(90 + gap, SCENE_W + 20 + gap - T * speed);
    const gone = T >= trigger && rbX > x - 10;
    if (!gone) enemy(g, type, x, feet, t + i);
    else if (T < trigger + 1.2) {
      const when = trigger + (x - 10 - 70) / 260;
      const k = (T - when) / 0.5;
      if (k >= 0 && k < 1) poof(g, x, laneY, k, 'rgba(34,211,238,0.9)');
    }
  });
  g.save();
  drawRollback(g, rbX, laneY, running, t);
  g.restore();
  const msg = T < trigger ? 'Ctrl + Z espera junto a la base' : running ? 'Ctrl + Z barre el carril…' : 'Ctrl + Z usado: carril limpio';
  text(g, msg, SCENE_W / 2, 24, 10, '#67e8f9', 'center', 800);
}

/* ======================= 6 · Each level changes Game Over ======================= */

function sceneLevels(g: G, t: number): void {
  const P = 4;
  const p = (t % P) / P;
  background(g);
  const cross = 0.45;
  const crossed = p >= cross;
  const cols: { title: string; color: string }[] = [
    { title: 'Monolito', color: '#38bdf8' },
    { title: 'Microserv.', color: '#34d399' },
    { title: 'Kubernetes', color: '#818cf8' },
  ];
  cols.forEach((c, i) => {
    const x = 6 + i * 104;
    text(g, c.title, x + 48, 12, 9, c.color, 'center', 900);
    const top = 24;
    const lh = 30;
    for (let lane = 0; lane < 3; lane++) {
      const y = top + lane * (lh + 4);
      g.fillStyle = lane % 2 ? '#121c39' : '#0f1730';
      g.fillRect(x + 28, y, 68, lh);
      // base boxes
      let fill = '#0f2a24';
      let stroke = c.color;
      let label = 'OK';
      let labelColor = '#a7f3d0';
      if (crossed) {
        if (i === 0) {
          fill = '#450a0a';
          stroke = '#ef4444';
          label = 'DOWN';
          labelColor = '#fca5a5';
        } else if (lane === 1) {
          const restarting = i === 2 && p < 0.85;
          const back = i === 2 && p >= 0.85;
          if (back) {
            fill = '#1e1b4b';
          } else if (restarting) {
            fill = '#1c1917';
            stroke = '#f59e0b';
            label = `↻${Math.ceil((0.85 - p) * 10)}s`;
            labelColor = '#fcd34d';
          } else {
            fill = '#1f0b0b';
            stroke = '#7f1d1d';
            label = '503';
            labelColor = '#f87171';
          }
        }
      }
      if (i === 0) continue;
      box(g, x, y + 2, 24, lh - 4, 4, fill, stroke, 1.2);
      text(g, label, x + 12, y + lh / 2, 6.5, labelColor, 'center', 900);
      if (crossed && lane === 1 && (i === 1 || (i === 2 && p < 0.85))) {
        g.fillStyle = 'rgba(0,0,0,0.5)';
        g.fillRect(x + 28, y, 68, lh);
      }
    }
    if (i === 0) {
      // one single base block for the 3 lanes
      const down = crossed;
      box(g, x, top + 2, 24, 3 * lh + 8 - 4, 5, down ? '#450a0a' : '#1e293b', down ? '#ef4444' : c.color, 1.5);
      text(g, down ? 'DOWN' : 'OK', x + 12, top + 50, 6.5, down ? '#fca5a5' : '#e0f2fe', 'center', 900);
      if (down) {
        g.fillStyle = 'rgba(127,29,29,0.35)';
        g.fillRect(x + 28, top, 68, 3 * lh + 8);
      }
    }
    // a threat runs in the middle lane and crosses the limit
    if (!crossed) {
      const k = p / cross;
      const ty = top + (lh + 4) + lh / 2;
      g.fillStyle = '#ef4444';
      g.beginPath();
      g.arc(lerp(x + 92, x + 26, k), ty, 5, 0, Math.PI * 2);
      g.fill();
    }
  });
  const msg = !crossed ? 'Una amenaza cruza el límite…' : p < 0.85 ? 'Monolito: cae todo · Micro: cae 1 carril · K8s: se reinicia' : 'Kubernetes: el carril vuelve a funcionar';
  text(g, msg, SCENE_W / 2, SCENE_H - 10, 8.5, '#cbd5e1', 'center', 700);
}

export interface HowtoStep {
  title: string;
  text: string;
  draw: (g: G, t: number) => void;
}

export const HOWTO_STEPS: HowtoStep[] = [
  { title: 'Recoge Compute Units', text: 'Haz clic en los ⬢ CU que caen del cielo. Los Worker Nodes también crean CU.', draw: sceneCollect },
  { title: 'Coloca defensas', text: 'Elige una carta arriba y haz clic en una celda libre. Cuesta CU y la carta tarda en recargar.', draw: scenePlace },
  { title: 'Frena las amenazas', text: 'Las defensas disparan solas en su carril. Si una amenaza llega a la izquierda, la base cae.', draw: sceneDefend },
  { title: 'Mejora a v2', text: 'Haz clic en una defensa colocada para mejorarla. Cuesta lo mismo que la defensa.', draw: sceneUpgrade },
  { title: 'Rollback (niveles 2 y 3)', text: 'Cada carril tiene un Ctrl + Z: si una amenaza llega a la base, limpia el carril una vez.', draw: sceneRollback },
  { title: 'Cada nivel cambia el Game Over', text: 'Monolito: cae todo. Microservicios: cae un carril. Kubernetes: el carril se reinicia solo.', draw: sceneLevels },
];
