import { DEFENSE_ORDER, DEFENSES, ENEMIES, ENEMY_ORDER, MODE_ORDER, MODES, TOTAL_WAVES, type Mode } from '../config';
import type { GameContext } from '../game/GameContext';
import { describeRecord, loadRecords } from '../game/records';

export interface OverlayCallbacks {
  onStart(mode: Mode): void;
  onResume(): void;
  onMenu(): void;
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}

/** Menu, pause and end screens, drawn as DOM over the canvas. */
export class Overlays {
  readonly root: HTMLElement;
  private readonly menu: HTMLElement;
  private readonly pause: HTMLElement;
  private readonly end: HTMLElement;
  private readonly cb: OverlayCallbacks;

  constructor(cb: OverlayCallbacks) {
    this.cb = cb;
    this.root = document.createElement('div');
    this.root.className = 'overlays';

    this.menu = document.createElement('section');
    this.menu.className = 'overlay menu';

    this.pause = document.createElement('section');
    this.pause.className = 'overlay pause';
    this.pause.innerHTML = `<div class="panel small"><h2>Pausa</h2><p>El bucle de actualización está detenido.</p><div class="row"><button class="btn primary" data-act="resume" type="button">Seguir</button><button class="btn" data-act="menu" type="button">Menú</button></div></div>`;
    this.pause.querySelector('[data-act="resume"]')?.addEventListener('click', () => cb.onResume());
    this.pause.querySelector('[data-act="menu"]')?.addEventListener('click', () => cb.onMenu());

    this.end = document.createElement('section');
    this.end.className = 'overlay end';

    this.root.append(this.menu, this.pause, this.end);
    this.show('menu');
  }

  show(which: 'menu' | 'pause' | 'end' | 'none'): void {
    if (which === 'menu') this.renderMenu();
    this.menu.classList.toggle('visible', which === 'menu');
    this.pause.classList.toggle('visible', which === 'pause');
    this.end.classList.toggle('visible', which === 'end');
  }

  private renderMenu(): void {
    const records = loadRecords();
    const levels = MODE_ORDER.map((m) => {
      const spec = MODES[m];
      return `<button class="level" data-mode="${m}" type="button" style="--accent:${spec.color}">
          <span class="level-tag">Nivel ${spec.level}</span>
          <strong>${spec.name}</strong>
          <span>${spec.rule}</span>
          <span class="record">${describeRecord(records[m])}</span>
        </button>`;
    }).join('');
    this.menu.innerHTML = `
      <div class="panel">
        <p class="eyebrow">Tower defense de arquitectura de sistemas</p>
        <h1>System<span>Defense</span></h1>
        <p class="lead">El tráfico hostil llega desde Internet (derecha). Coloca defensas en la cuadrícula de 5 carriles × 9 columnas y protege tu base (izquierda). Haz clic en una defensa colocada para mejorarla a v2.</p>
        <div class="levels">${levels}</div>
        <details class="guide">
          <summary>Guía: defensas y amenazas</summary>
          <div class="legend">
            <div>
              <h3>Defensas</h3>
              <ul>${DEFENSE_ORDER.map((d) => `<li><b style="color:${DEFENSES[d].color}">${DEFENSES[d].hotkey} · ${DEFENSES[d].name}</b> <em>${DEFENSES[d].cost} CU</em> — ${DEFENSES[d].desc}</li>`).join('')}
              <li><b style="color:#22d3ee">↺ Rollback</b> <em>gratis</em> — Niveles 2 y 3: uno por carril, limpia el carril una vez</li></ul>
            </div>
            <div>
              <h3>Amenazas</h3>
              <ul>${ENEMY_ORDER.map((e) => `<li><b style="color:${ENEMIES[e].color}">${ENEMIES[e].name}</b> — ${ENEMIES[e].desc}</li>`).join('')}</ul>
            </div>
          </div>
        </details>
        <p class="controls">Teclas <kbd>1</kbd>–<kbd>8</kbd> defensas · clic en <span class="cu-inline">⬢ CU</span> para recoger · <kbd>Q</kbd> desmantelar · <kbd>Esc</kbd>/clic derecho cancelar · <kbd>P</kbd> pausa · <kbd>F</kbd> ×2 · <kbd>M</kbd> sonido</p>
      </div>`;
    this.menu.querySelectorAll<HTMLButtonElement>('.level').forEach((b) => {
      b.addEventListener('click', () => this.cb.onStart(b.dataset.mode as Mode));
    });
  }

  showEnd(ctx: GameContext, newRecord: boolean): void {
    const win = ctx.status === 'victory';
    const spec = MODES[ctx.mode];
    const alive = ctx.lanesAlive.filter(Boolean).length;
    const services = ctx.mode !== 'monolith' ? `<div><span>Servicios en pie</span><b>${alive}/5</b></div>` : '';
    const nextMode = MODE_ORDER[MODE_ORDER.indexOf(ctx.mode) + 1];
    let tip = '';
    if (!win && ctx.mode === 'monolith') tip = 'Consejo: prueba el Nivel 2. Con microservicios, un fallo no tumba todo el sistema.';
    if (!win && ctx.mode === 'microservices') tip = 'Consejo: en el Nivel 3, Kubernetes reinicia solo los servicios caídos.';
    const nextBtn = nextMode ? `<button class="btn" data-act="next" type="button">Ir al Nivel ${MODES[nextMode].level}</button>` : '';
    this.end.innerHTML = `
      <div class="panel small ${win ? 'win' : 'lose'}">
        <p class="eyebrow">Nivel ${spec.level} · ${spec.name}</p>
        <h2>${win ? 'Sistema escalado' : 'SYSTEM DOWN'}</h2>
        ${newRecord ? '<p class="new-record">¡Nuevo récord!</p>' : ''}
        <p>${ctx.endReason}</p>
        <div class="stats">
          <div><span>Ola</span><b>${ctx.wave.number}/${TOTAL_WAVES}</b></div>
          <div><span>Amenazas eliminadas</span><b>${ctx.kills}</b></div>
          <div><span>Uptime</span><b>${fmtTime(ctx.time)}</b></div>
          ${services}
        </div>
        ${tip ? `<p class="tip">${tip}</p>` : ''}
        <div class="row">
          <button class="btn primary" data-act="retry" type="button">Reintentar</button>
          ${nextBtn}
          <button class="btn" data-act="menu" type="button">Menú</button>
        </div>
      </div>`;
    this.end.querySelector('[data-act="retry"]')?.addEventListener('click', () => this.cb.onStart(ctx.mode));
    if (nextMode) this.end.querySelector('[data-act="next"]')?.addEventListener('click', () => this.cb.onStart(nextMode));
    this.end.querySelector('[data-act="menu"]')?.addEventListener('click', () => this.cb.onMenu());
    this.show('end');
  }
}
