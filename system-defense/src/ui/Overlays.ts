import { DEFENSE_ORDER, DEFENSES, ENEMIES, ENEMY_ORDER, TOTAL_WAVES, type Mode } from '../config';
import type { GameContext } from '../game/GameContext';

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
    this.menu.innerHTML = `
      <div class="panel">
        <p class="eyebrow">Tower defense de arquitectura de sistemas</p>
        <h1>System<span>Defense</span></h1>
        <p class="lead">El tráfico hostil llega desde Internet (derecha). Coloca defensas en la cuadrícula de 5 carriles × 9 columnas y protege tu base (izquierda).</p>
        <div class="levels">
          <button class="level" data-mode="monolith" type="button">
            <span class="level-tag">Nivel 1</span>
            <strong>Arquitectura Monolítica</strong>
            <span>Una sola base. Si una amenaza cruza el límite en <b>cualquier</b> carril, cae todo el sistema. Single Point of Failure.</span>
          </button>
          <button class="level" data-mode="microservices" type="button">
            <span class="level-tag">Nivel 2</span>
            <strong>Microservicios</strong>
            <span>5 servicios independientes. Si cruza una amenaza, solo cae ese carril y sus defensas. Game Over cuando caen los 5.</span>
          </button>
        </div>
        <div class="legend">
          <div>
            <h3>Defensas</h3>
            <ul>${DEFENSE_ORDER.map((d) => `<li><b style="color:${DEFENSES[d].color}">${DEFENSES[d].hotkey} · ${DEFENSES[d].name}</b> <em>${DEFENSES[d].cost} CU</em> — ${DEFENSES[d].desc}</li>`).join('')}</ul>
          </div>
          <div>
            <h3>Amenazas</h3>
            <ul>${ENEMY_ORDER.map((e) => `<li><b>${ENEMIES[e].name}</b> — ${ENEMIES[e].desc}</li>`).join('')}</ul>
          </div>
        </div>
        <p class="controls">Clic en carta o teclas <kbd>1</kbd>–<kbd>5</kbd> · clic en celda para colocar · clic en <span class="cu-inline">⬢ CU</span> para recoger · <kbd>Q</kbd> desmantelar · <kbd>Esc</kbd>/clic derecho cancelar · <kbd>P</kbd> pausa</p>
      </div>`;
    this.menu.querySelectorAll<HTMLButtonElement>('.level').forEach((b) => {
      b.addEventListener('click', () => cb.onStart(b.dataset.mode as Mode));
    });

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
    this.menu.classList.toggle('visible', which === 'menu');
    this.pause.classList.toggle('visible', which === 'pause');
    this.end.classList.toggle('visible', which === 'end');
  }

  showEnd(ctx: GameContext): void {
    const win = ctx.status === 'victory';
    const alive = ctx.lanesAlive.filter(Boolean).length;
    const services = ctx.mode === 'microservices' ? `<div><span>Servicios en pie</span><b>${alive}/5</b></div>` : '';
    const tip =
      !win && ctx.mode === 'monolith'
        ? '<p class="tip">Consejo: prueba el Nivel 2. Con microservicios, un fallo no tumba todo el sistema.</p>'
        : '';
    this.end.innerHTML = `
      <div class="panel small ${win ? 'win' : 'lose'}">
        <p class="eyebrow">${ctx.mode === 'monolith' ? 'Nivel 1 · Monolito' : 'Nivel 2 · Microservicios'}</p>
        <h2>${win ? 'Sistema escalado' : 'SYSTEM DOWN'}</h2>
        <p>${ctx.endReason}</p>
        <div class="stats">
          <div><span>Ola</span><b>${ctx.wave.number}/${TOTAL_WAVES}</b></div>
          <div><span>Amenazas eliminadas</span><b>${ctx.kills}</b></div>
          <div><span>Uptime</span><b>${fmtTime(ctx.time)}</b></div>
          ${services}
        </div>
        ${tip}
        <div class="row">
          <button class="btn primary" data-act="retry" type="button">Reintentar</button>
          ${!win && ctx.mode === 'monolith' ? '<button class="btn" data-act="micro" type="button">Ir al Nivel 2</button>' : ''}
          ${win && ctx.mode === 'monolith' ? '<button class="btn" data-act="micro" type="button">Migrar a Microservicios</button>' : ''}
          <button class="btn" data-act="menu" type="button">Menú</button>
        </div>
      </div>`;
    this.end.querySelector('[data-act="retry"]')?.addEventListener('click', () => this.cb.onStart(ctx.mode));
    this.end.querySelector('[data-act="micro"]')?.addEventListener('click', () => this.cb.onStart('microservices'));
    this.end.querySelector('[data-act="menu"]')?.addEventListener('click', () => this.cb.onMenu());
    this.show('end');
  }
}
