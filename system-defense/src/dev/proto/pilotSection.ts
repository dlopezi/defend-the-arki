import { CANVAS_H, CELL_H, CELL_W, ENEMIES, LANES } from '../../config';
import { drawDefense } from '../../render/sprites';
import { drawBlackFridaySvg, loadSvgParts } from './bfSvg';
import { drawDdosSvg, loadDdosSvg } from './ddosSvg';
import { drawNormalSvg, loadNormalSvg } from './normalSvg';
import { bfPose, type G, type ProtoState } from './rig';

/*
 * "Piloto · Técnica C" section: Black Friday, Tráfico Normal and DDoS in SVG,
 * plus a performance test that draws many of them at real game size.
 */

type Who = 'blackFriday' | 'normal' | 'ddos';

const W = 340;
const H = 300;
const ZOOM: Record<Who, number> = { blackFriday: 1.75, normal: 3, ddos: 2.4 };
const FEET: Record<Who, number> = {
  blackFriday: 60,
  normal: ENEMIES.normal.height / 2,
  ddos: ENEMIES.ddos.height / 2,
};
const CARDS: { who: Who; title: string; concept: string }[] = [
  { who: 'blackFriday', title: 'Black Friday Traffic', concept: '"Cart Juggernaut": carrito monstruo, mandíbula enorme, etiqueta "-70%".' },
  { who: 'normal', title: 'Tráfico Normal', concept: '"Request Runner": petición con prisa, gorra de mensajero, sobre "GET /".' },
  { who: 'ddos', title: 'Ataque DDoS', concept: '"Swarm Colossus": coloso de paquetes, puño gigante, grieta "10⁶" que brilla.' },
];

const css = `
.pilot { margin: 0 0 22px; padding: 14px; background: var(--panel); border: 1px solid #34d399; border-radius: 14px; }
.pilot .tag.ok { color: #34d399; }
.pilot-card { display: flex; flex-direction: column; gap: 6px; padding: 8px; background: var(--panel2); border: 2px solid var(--line); border-radius: 12px; }
.pilot-card strong { font-size: 14px; }
.pilot-card canvas { width: 100%; height: auto; aspect-ratio: ${W} / ${H}; }
.pilot-card .pc { margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.4; }
.stress { margin-top: 14px; padding: 10px; background: var(--panel2); border: 1px solid var(--line); border-radius: 12px; }
.stress-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
.stress-head strong { font-size: 14px; }
.stress-head p { margin: 2px 0 0; font-size: 12px; color: var(--muted); }
.stress-stats { font: 700 13px var(--mono); color: #34d399; }
.stress-stats.warn { color: #fbbf24; }
.stress-stats.bad { color: #f87171; }
.stress canvas { display: block; width: 100%; height: auto; border-radius: 10px; }
.btns { display: flex; gap: 6px; flex-wrap: wrap; }
.btns button { padding: 6px 12px; font: 700 12px system-ui, sans-serif; color: var(--text); background: #0f1a33; border: 1px solid var(--line); border-radius: 8px; cursor: pointer; }
.btns button.active { background: #0369a1; border-color: #38bdf8; }
`;

function setupCanvas(c: HTMLCanvasElement, w: number, h: number): G {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = w * dpr;
  c.height = h * dpr;
  const g = c.getContext('2d');
  if (!g) throw new Error('no 2d context');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return g;
}

function drawCells(g: G, w: number, h: number, top: number): void {
  g.fillStyle = '#070b17';
  g.fillRect(0, 0, w, h);
  for (let lane = 0; lane * CELL_H < h; lane++) {
    for (let col = 0; col * CELL_W < w; col++) {
      g.fillStyle = (lane + col) % 2 ? '#121c39' : '#0f1730';
      g.fillRect(col * CELL_W, top + lane * CELL_H, CELL_W, CELL_H);
    }
  }
}

/** Draws one threat with its feet on groundY. */
function drawWho(g: G, who: Who, x: number, groundY: number, scale: number, t: number, state: ProtoState): void {
  g.save();
  g.translate(x, groundY - FEET[who] * scale);
  g.scale(scale, scale);
  g.fillStyle = 'rgba(0,0,0,0.38)';
  g.beginPath();
  const shadowW = who === 'blackFriday' ? 62 : who === 'ddos' ? 36 : 18;
  g.ellipse(0, FEET[who], shadowW, who === 'normal' ? 4 : 6, 0, 0, Math.PI * 2);
  g.fill();
  if (who === 'blackFriday') drawBlackFridaySvg(g, bfPose(t, state), t);
  else if (who === 'normal') drawNormalSvg(g, t, state);
  else drawDdosSvg(g, t, state);
  g.restore();
}

interface StressItem {
  who: Who;
  lane: number;
  x: number;
  offset: number;
  state: ProtoState;
}

export interface PilotSection {
  draw(t: number): void;
}

export function mountPilotSection(container: HTMLElement): PilotSection {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  loadSvgParts();
  loadNormalSvg();
  loadDdosSvg();

  let anim: ProtoState = 'walk';
  let zoomed = false;

  const section = document.createElement('section');
  section.className = 'pilot';
  section.innerHTML = `
    <div class="proto-head">
      <div>
        <span class="tag ok">Piloto · Técnica C elegida</span>
        <h2>Ilustración SVG · 3 amenazas</h2>
        <p>Sin brillos durante el juego (se preparan una vez al cargar) y con pocas partículas: humo 2, polvo 3–4 por personaje.</p>
      </div>
      <div class="proto-controls">
        <div class="seg" data-group="anim"><button data-v="walk" class="active" type="button">Caminar</button><button data-v="attack" type="button">Atacar</button></div>
        <div class="seg" data-group="zoom"><button data-v="0" class="active" type="button">Tamaño real</button><button data-v="1" type="button">Zoom</button></div>
      </div>
    </div>
    <div class="proto-grid"></div>
    <div class="stress">
      <div class="stress-head">
        <div>
          <strong>Prueba de rendimiento</strong>
          <p>Dibuja muchas amenazas a tamaño real en un tablero de 5 carriles y mide la velocidad en este navegador.</p>
        </div>
        <div class="btns">
          <button data-n="30" type="button">30 enemigos</button>
          <button data-n="100" type="button">100</button>
          <button data-n="200" type="button">200</button>
          <button data-n="0" type="button">Parar</button>
        </div>
        <span class="stress-stats">Parada</span>
      </div>
      <canvas class="stress-canvas"></canvas>
    </div>`;
  container.append(section);

  const grid = section.querySelector<HTMLElement>('.proto-grid');
  const views: { who: Who; g: G }[] = [];
  for (const card of CARDS) {
    const el = document.createElement('div');
    el.className = 'pilot-card';
    el.innerHTML = `<strong style="color:${ENEMIES[card.who].color}">${card.title}</strong>`;
    const c = document.createElement('canvas');
    el.append(c);
    const p = document.createElement('p');
    p.className = 'pc';
    p.textContent = card.concept;
    el.append(p);
    grid?.append(el);
    views.push({ who: card.who, g: setupCanvas(c, W, H) });
  }

  section.querySelectorAll<HTMLElement>('.seg').forEach((seg) => {
    seg.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
      b.addEventListener('click', () => {
        seg.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
        if (seg.dataset.group === 'anim') anim = b.dataset.v as ProtoState;
        else zoomed = b.dataset.v === '1';
      });
    });
  });

  /* ---------- Performance test ---------- */
  const SW = 1040;
  const SH = CANVAS_H;
  const stressCanvas = section.querySelector<HTMLCanvasElement>('.stress-canvas');
  const sg = stressCanvas ? setupCanvas(stressCanvas, SW, SH) : null;
  if (stressCanvas) stressCanvas.style.aspectRatio = `${SW} / ${SH}`;
  const stats = section.querySelector<HTMLElement>('.stress-stats');
  let items: StressItem[] = [];
  let frames = 0;
  let drawMs = 0;
  let windowStart = performance.now();

  const start = (n: number): void => {
    items = Array.from({ length: n }, (_, i) => {
      const r = (i * 9301 + 49297) % 233280 / 233280;
      const who: Who = r < 0.1 ? 'blackFriday' : r < 0.65 ? 'normal' : 'ddos';
      return { who, lane: i % LANES, x: 60 + ((i * 137) % (SW - 80)), offset: i * 0.37, state: i % 5 === 0 ? 'attack' : 'walk' };
    });
    frames = 0;
    drawMs = 0;
    windowStart = performance.now();
    if (stats) stats.textContent = n ? `${n} enemigos · midiendo…` : 'Parada';
    if (!n && sg) drawCells(sg, SW, SH, 0);
  };
  section.querySelectorAll<HTMLButtonElement>('.btns button').forEach((b) => {
    b.addEventListener('click', () => {
      section.querySelectorAll('.btns button').forEach((x) => x.classList.toggle('active', x === b && b.dataset.n !== '0'));
      start(Number(b.dataset.n));
    });
  });
  if (sg) drawCells(sg, SW, SH, 0);

  const drawStress = (t: number): void => {
    if (!sg || items.length === 0) return;
    const t0 = performance.now();
    drawCells(sg, SW, SH, 0);
    // Draw lane by lane (back to front), like the game.
    for (let lane = 0; lane < LANES; lane++) {
      for (const it of items) {
        if (it.lane !== lane) continue;
        if (it.state === 'walk') it.x -= 0.25;
        if (it.x < 40) it.x = SW - 40;
        drawWho(sg, it.who, it.x, lane * CELL_H + CELL_H - 12, 1, t + it.offset, it.state);
      }
    }
    drawMs += performance.now() - t0;
    frames++;
    const elapsed = performance.now() - windowStart;
    if (elapsed >= 1000 && stats) {
      const fps = Math.round((frames * 1000) / elapsed);
      const ms = drawMs / frames;
      stats.textContent = `${items.length} enemigos · ${fps} FPS · dibujo ${ms.toFixed(1)} ms por cuadro`;
      stats.classList.toggle('warn', fps < 55 && fps >= 40);
      stats.classList.toggle('bad', fps < 40);
      frames = 0;
      drawMs = 0;
      windowStart = performance.now();
    }
  };

  return {
    draw(t: number) {
      for (const v of views) {
        const g = v.g;
        drawCells(g, W, H, 20);
        const groundY = H - 24;
        if (zoomed) {
          drawWho(g, v.who, W / 2 + (v.who === 'blackFriday' ? 12 : 0), groundY, ZOOM[v.who], t, anim);
        } else {
          drawDefense(g, 'loadBalancer', 70, groundY - 37, t);
          drawWho(g, v.who, 225, groundY, 1, t, anim);
        }
      }
      drawStress(t);
    },
  };
}
