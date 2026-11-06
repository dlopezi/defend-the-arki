import { DEFENSE_ORDER, DEFENSES, ENEMIES, ENEMY_ORDER, MODE_ORDER, MODES, type Mode } from '../config';
import { clearRecords, describeRecord, loadRecords } from '../game/records';
import { CONCEPTS, type ConceptId } from '../learn/concepts';
import { paintConceptIcon } from './icons';

export type HomeScreen = 'main' | 'levels' | 'guide' | 'howto' | 'options';

export interface HomeCallbacks {
  onStart(mode: Mode): void;
  onContinue(): void;
  getSuspended(): { mode: Mode; wave: number } | null;
  getLearnEnabled(): boolean;
  setLearnEnabled(on: boolean): void;
  getMuted(): boolean;
  toggleMute(): void;
  resetSeen(): void;
  openConcept(id: ConceptId): void;
}

const TITLES: Record<Exclude<HomeScreen, 'main'>, string> = {
  levels: 'Elige un nivel',
  guide: 'Guía',
  howto: 'Cómo jugar',
  options: 'Opciones',
};

function esc(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);
}

/**
 * Start view, organized like a game menu:
 * main title screen -> Jugar (levels) · Guía (codex) · Cómo jugar · Opciones.
 */
export class HomeMenu {
  readonly el: HTMLElement;
  private readonly cb: HomeCallbacks;
  private screen: HomeScreen = 'main';
  private guideTab: 'defenses' | 'threats' = 'defenses';
  private confirmClear = false;
  private notice = '';

  constructor(cb: HomeCallbacks) {
    this.cb = cb;
    this.el = document.createElement('section');
    this.el.className = 'home';
  }

  show(screen: HomeScreen = 'main'): void {
    if (screen !== this.screen) {
      this.confirmClear = false;
      this.notice = '';
    }
    this.screen = screen;
    this.render();
    this.el.querySelector<HTMLButtonElement>('.menu-btn, .back')?.focus({ preventScroll: true });
  }

  /** Esc / "Volver". Returns false when already on the main screen. */
  back(): boolean {
    if (this.screen === 'main') return false;
    this.show('main');
    return true;
  }

  private render(): void {
    const body = this.screen === 'main' ? this.mainScreen() : this.subScreen(this.screen);
    this.el.innerHTML = `<div class="panel home-panel screen-${this.screen}">${body}</div>`;
    this.bind();
  }

  /* ---------- Screens ---------- */

  private mainScreen(): string {
    const s = this.cb.getSuspended();
    const cont = s
      ? `<button class="menu-btn primary" data-go="continue" type="button">▶ Continuar <small>Nivel ${MODES[s.mode].level} · ${s.wave > 0 ? `Ola ${s.wave}` : 'Preparación'}</small></button>`
      : '';
    return `
      <div class="title-screen">
        <p class="eyebrow">Tower defense de arquitectura de sistemas</p>
        <h1 class="logo">System<span>Defense</span></h1>
        <p class="tagline">Defiende tu arquitectura del tráfico hostil.</p>
        <nav class="main-menu" aria-label="Menú principal">
          ${cont}
          <button class="menu-btn ${s ? '' : 'primary'}" data-go="levels" type="button">Jugar</button>
          <button class="menu-btn" data-go="guide" type="button">Guía</button>
          <button class="menu-btn" data-go="howto" type="button">Cómo jugar</button>
          <button class="menu-btn" data-go="options" type="button">Opciones</button>
        </nav>
      </div>`;
  }

  private subScreen(screen: Exclude<HomeScreen, 'main'>): string {
    let right = '';
    let content = '';
    switch (screen) {
      case 'levels':
        content = this.levelsScreen();
        break;
      case 'guide':
        right = `<div class="tabs" role="tablist">
            <button class="tab ${this.guideTab === 'defenses' ? 'active' : ''}" data-tab="defenses" type="button" role="tab">Defensas</button>
            <button class="tab ${this.guideTab === 'threats' ? 'active' : ''}" data-tab="threats" type="button" role="tab">Amenazas</button>
          </div>`;
        content = this.guideScreen();
        break;
      case 'howto':
        content = this.howtoScreen();
        break;
      case 'options':
        content = this.optionsScreen();
        break;
    }
    return `
      <header class="screen-head">
        <button class="back" data-go="main" type="button">← Volver</button>
        <h2>${TITLES[screen]}</h2>
        <div class="head-right">${right}</div>
      </header>
      <div class="screen-body">${content}</div>`;
  }

  private levelsScreen(): string {
    const records = loadRecords();
    const cards = MODE_ORDER.map((m) => {
      const spec = MODES[m];
      return `<button class="level" data-mode="${m}" type="button" style="--accent:${spec.color}">
          <span class="level-tag">Nivel ${spec.level}</span>
          <strong>${spec.name}</strong>
          <span>${spec.rule}</span>
          <span class="record">${describeRecord(records[m])}</span>
        </button>`;
    }).join('');
    const warn = this.cb.getSuspended()
      ? '<p class="note warn">Tienes una partida en pausa. Si eliges un nivel, esa partida termina.</p>'
      : '';
    return `<div class="levels">${cards}</div>${warn}`;
  }

  private guideScreen(): string {
    const items: { id: ConceptId; name: string; sub: string; color: string }[] =
      this.guideTab === 'defenses'
        ? [
            ...DEFENSE_ORDER.map((d) => ({ id: d as ConceptId, name: DEFENSES[d].name, sub: `${DEFENSES[d].cost} CU · tecla ${DEFENSES[d].hotkey}`, color: DEFENSES[d].color })),
            { id: 'rollback', name: 'Rollback', sub: 'Gratis · niveles 2 y 3', color: '#22d3ee' },
          ]
        : ENEMY_ORDER.map((e) => ({ id: e as ConceptId, name: ENEMIES[e].name, sub: ENEMIES[e].desc, color: ENEMIES[e].color }));
    const grid = items
      .map(
        (it) => `<button class="codex-item" data-concept="${it.id}" type="button" style="--accent:${it.color}" title="${esc(CONCEPTS[it.id].real)}">
          <canvas class="codex-icon" data-icon="${it.id}"></canvas>
          <strong>${esc(it.name)}</strong>
          <span>${esc(it.sub)}</span>
        </button>`,
      )
      .join('');
    return `<div class="codex">${grid}</div><p class="note">Pulsa un elemento para ver su ficha: qué es en la vida real y en qué se parece al juego.</p>`;
  }

  private howtoScreen(): string {
    const row = (k: string, v: string) => `<dt>${k}</dt><dd>${v}</dd>`;
    return `<dl class="howto">
      ${row('Objetivo', 'Protege la base (izquierda) del tráfico que llega desde Internet (derecha). Sobrevive a 10 olas.')}
      ${row('Recursos', 'Haz clic en los hexágonos <span class="cu-inline">⬢ CU</span> para recogerlos. Caen del cielo y los generan los Worker Nodes.')}
      ${row('Defensas', 'Elige una carta (arriba) y haz clic en una celda libre del tablero. Cada carta tarda un poco en recargarse.')}
      ${row('Mejoras', 'Haz clic en una defensa ya colocada para mejorarla a v2. Cuesta lo mismo que la defensa.')}
      ${row('Rollback', 'En los niveles 2 y 3, cada carril tiene un ↺ Rollback: limpia el carril una sola vez.')}
      ${row('Niveles', 'Cada nivel cambia la regla de Game Over: Monolito, Microservicios y Kubernetes.')}
      ${row('Teclas', '<kbd>1</kbd>–<kbd>8</kbd> defensas · <kbd>Q</kbd> quitar defensa · <kbd>Esc</kbd> o clic derecho cancelar · <kbd>P</kbd> pausa · <kbd>F</kbd> velocidad ×2 · <kbd>M</kbd> sonido')}
    </dl>`;
  }

  private optionsScreen(): string {
    const seg = (key: string, on: boolean) =>
      `<div class="seg" role="group">
        <button class="${on ? 'active' : ''}" data-opt="${key}" data-val="1" type="button">Sí</button>
        <button class="${on ? '' : 'active'}" data-opt="${key}" data-val="0" type="button">No</button>
      </div>`;
    return `<div class="options">
      <div class="opt"><div><strong>Fichas de concepto durante la partida</strong><span>La primera vez que aparece un elemento, el juego se pausa y explica qué es.</span></div>${seg('learn', this.cb.getLearnEnabled())}</div>
      <div class="opt"><div><strong>Sonido</strong><span>Efectos de sonido del juego.</span></div>${seg('sound', !this.cb.getMuted())}</div>
      <div class="opt"><div><strong>Ver de nuevo todas las fichas</strong><span>Las fichas volverán a salir durante la partida.</span></div><button class="btn" data-opt="resetSeen" type="button">Reiniciar</button></div>
      <div class="opt"><div><strong>Borrar récords</strong><span>Borra los récords de los 3 niveles en este navegador.</span></div><button class="btn ${this.confirmClear ? 'danger' : ''}" data-opt="clearRecords" type="button">${this.confirmClear ? '¿Seguro? Pulsa otra vez' : 'Borrar'}</button></div>
      ${this.notice ? `<p class="note ok">${esc(this.notice)}</p>` : ''}
    </div>`;
  }

  /* ---------- Events ---------- */

  private bind(): void {
    this.el.querySelectorAll<HTMLButtonElement>('[data-go]').forEach((b) => {
      b.addEventListener('click', () => {
        const go = b.dataset.go;
        if (go === 'continue') this.cb.onContinue();
        else this.show(go as HomeScreen);
      });
    });
    this.el.querySelectorAll<HTMLButtonElement>('.level').forEach((b) => {
      b.addEventListener('click', () => this.cb.onStart(b.dataset.mode as Mode));
    });
    this.el.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => {
      b.addEventListener('click', () => {
        this.guideTab = b.dataset.tab as 'defenses' | 'threats';
        this.render();
      });
    });
    this.el.querySelectorAll<HTMLCanvasElement>('canvas[data-icon]').forEach((c) => paintConceptIcon(c, c.dataset.icon as ConceptId, 64));
    this.el.querySelectorAll<HTMLButtonElement>('.codex-item').forEach((b) => {
      b.addEventListener('click', () => this.cb.openConcept(b.dataset.concept as ConceptId));
    });
    this.el.querySelectorAll<HTMLButtonElement>('[data-opt]').forEach((b) => {
      b.addEventListener('click', () => this.option(b.dataset.opt ?? '', b.dataset.val === '1'));
    });
  }

  private option(key: string, on: boolean): void {
    this.notice = '';
    if (key !== 'clearRecords') this.confirmClear = false;
    switch (key) {
      case 'learn':
        this.cb.setLearnEnabled(on);
        break;
      case 'sound':
        if (on === this.cb.getMuted()) this.cb.toggleMute();
        break;
      case 'resetSeen':
        this.cb.resetSeen();
        this.notice = 'Hecho: las fichas volverán a salir durante la partida.';
        break;
      case 'clearRecords':
        if (!this.confirmClear) {
          this.confirmClear = true;
        } else {
          clearRecords();
          this.confirmClear = false;
          this.notice = 'Récords borrados.';
        }
        break;
    }
    this.render();
  }
}
