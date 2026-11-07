import { CELL_W } from '../../config';
import { drawDefense } from '../../render/sprites';
import { drawBlackFridayCartoon } from './bfCartoon';
import { PixelBlackFriday } from './bfPixel';
import { drawBlackFridaySvg, loadSvgParts } from './bfSvg';
import { bfPose, type G, type ProtoState } from './rig';

/*
 * "Prototipo Black Friday · 3 técnicas" section of the avatar picker page.
 * Same character drawn with three techniques, side by side.
 */

export type Technique = 'A' | 'B' | 'C';

const STORAGE_KEY = 'system-defense:proto-technique';
const W = 340;
const H = 300;

const TECHNIQUES: { id: Technique; name: string; pros: string; cons: string }[] = [
  {
    id: 'A',
    name: 'Dibujo vectorial animado (cartoon rig)',
    pros: 'Nítido a cualquier tamaño. Animación muy fluida. Fácil de cambiar en código.',
    cons: 'Estilo más limpio y plano que una ilustración.',
  },
  {
    id: 'B',
    name: 'Pixel art',
    pros: 'Estilo retro con mucho carácter. Se lee bien de lejos.',
    cons: 'No encaja con el HUD y las defensas, que son vectoriales. Animación a saltos.',
  },
  {
    id: 'C',
    name: 'Ilustración SVG',
    pros: 'El más detallado: degradados, brillos, textura. Archivos editables en Figma/Inkscape.',
    cons: 'Más lento de crear y de cambiar.',
  },
];

const css = `
.proto { margin: 0 0 22px; padding: 14px; background: var(--panel); border: 1px solid #facc15; border-radius: 14px; }
.proto-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.proto-head h2 { margin: 2px 0 4px; font: 900 22px var(--mono); }
.proto-head p { margin: 0; font-size: 13px; color: #cbd5e1; max-width: 620px; }
.proto-head .tag { font: 700 10px var(--mono); text-transform: uppercase; letter-spacing: .08em; color: #facc15; }
.proto-controls { display: flex; gap: 8px; flex-wrap: wrap; }
.seg { display: inline-flex; padding: 3px; background: #070b17; border: 1px solid var(--line); border-radius: 10px; }
.seg button { padding: 6px 12px; font: 600 12px system-ui, sans-serif; color: var(--muted); background: none; border: none; border-radius: 7px; cursor: pointer; }
.seg button.active { color: var(--text); background: #0369a1; }
.proto-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.proto-opt canvas { aspect-ratio: ${W} / ${H}; }
.proto-opt .pc { margin: 0; font-size: 12px; line-height: 1.4; color: #cbd5e1; }
.proto-opt .pc.minus { color: var(--muted); }
@media (max-width: 820px) { .proto-grid { grid-template-columns: 1fr; } }
`;

function loadTech(): Technique | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'A' || v === 'B' || v === 'C' ? v : null;
  } catch {
    return null;
  }
}

function setupCanvas(c: HTMLCanvasElement): G {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = W * dpr;
  c.height = H * dpr;
  const g = c.getContext('2d');
  if (!g) throw new Error('no 2d context');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return g;
}

function drawGround(g: G, t: number): void {
  g.fillStyle = '#070b17';
  g.fillRect(0, 0, W, H);
  const cw = CELL_W;
  for (let i = 0; i * cw < W; i++) {
    g.fillStyle = i % 2 ? '#121c39' : '#0f1730';
    g.fillRect(i * cw, 20, cw, H - 32);
  }
  g.strokeStyle = 'rgba(56,189,248,0.12)';
  g.lineWidth = 2;
  g.setLineDash([6, 10]);
  g.lineDashOffset = t * 30;
  g.beginPath();
  g.moveTo(0, H - 24);
  g.lineTo(W, H - 24);
  g.stroke();
  g.setLineDash([]);
}

export interface ProtoSection {
  draw(t: number): void;
  technique(): Technique | null;
  /** Removes the chosen technique. */
  clear(): void;
}

/** Builds the section at the top of `container`. `onChange` runs when the chosen technique changes. */
export function mountProtoSection(container: HTMLElement, onChange: () => void): ProtoSection {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  loadSvgParts();

  let anim: ProtoState = 'walk';
  let zoom = 1;
  let chosen = loadTech();
  const pixel = new PixelBlackFriday();

  const section = document.createElement('section');
  section.className = 'proto';
  section.innerHTML = `
    <div class="proto-head">
      <div>
        <span class="tag">Prototipo · Jefe</span>
        <h2>Black Friday · 3 técnicas</h2>
        <p>El mismo diseño ("Cart Juggernaut") dibujado con 3 técnicas distintas. Elige la técnica: se usará después para todas las amenazas.</p>
      </div>
      <div class="proto-controls">
        <div class="seg" data-group="anim"><button data-v="walk" class="active" type="button">Caminar</button><button data-v="attack" type="button">Atacar</button></div>
        <div class="seg" data-group="zoom"><button data-v="1" class="active" type="button">Tamaño real</button><button data-v="1.75" type="button">Zoom</button></div>
      </div>
    </div>
    <div class="proto-grid"></div>`;
  const grid = section.querySelector<HTMLElement>('.proto-grid');
  const views: { id: Technique; g: G; btn: HTMLButtonElement }[] = [];
  const setChosen = (id: Technique | null): void => {
    chosen = id;
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    views.forEach((v) => v.btn.classList.toggle('chosen', v.id === id));
    onChange();
  };

  for (const tech of TECHNIQUES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `opt proto-opt${chosen === tech.id ? ' chosen' : ''}`;
    btn.innerHTML = `<span class="label"><span><b>${tech.id}</b> · ${tech.name}</span><span class="check">✓ Elegida</span></span>`;
    const canvas = document.createElement('canvas');
    btn.append(canvas);
    const pros = document.createElement('p');
    pros.className = 'pc';
    pros.textContent = `✓ ${tech.pros}`;
    const cons = document.createElement('p');
    cons.className = 'pc minus';
    cons.textContent = `✗ ${tech.cons}`;
    btn.append(pros, cons);
    // Click the chosen technique again to unselect it.
    btn.addEventListener('click', () => setChosen(chosen === tech.id ? null : tech.id));
    grid?.append(btn);
    views.push({ id: tech.id, g: setupCanvas(canvas), btn });
  }

  section.querySelectorAll<HTMLElement>('.seg').forEach((seg) => {
    seg.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
      b.addEventListener('click', () => {
        seg.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
        if (seg.dataset.group === 'anim') anim = b.dataset.v as ProtoState;
        else zoom = Number(b.dataset.v);
      });
    });
  });

  container.append(section);

  return {
    technique: () => chosen,
    clear: () => setChosen(null),
    draw(t: number) {
      for (const v of views) {
        const g = v.g;
        drawGround(g, t);
        const groundY = H - 24;
        const cx = zoom === 1 ? 225 : W / 2 + 12;
        if (zoom === 1) {
          // A Load Balancer next to it, at real game size, for scale.
          drawDefense(g, 'loadBalancer', 70, groundY - 37, t);
        }
        g.save();
        g.translate(cx, groundY - 60 * zoom);
        g.scale(zoom, zoom);
        g.fillStyle = 'rgba(0,0,0,0.4)';
        g.beginPath();
        g.ellipse(0, 60, 62, 7, 0, 0, Math.PI * 2);
        g.fill();
        const pose = bfPose(t, anim);
        if (v.id === 'A') drawBlackFridayCartoon(g, pose, t);
        else if (v.id === 'B') pixel.draw(g, t, anim);
        else drawBlackFridaySvg(g, pose, t);
        g.restore();
      }
    },
  };
}
