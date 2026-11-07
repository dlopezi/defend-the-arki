import { DEFENSE_ORDER, DEFENSES, ENEMIES, ENEMY_ORDER, MODE_ORDER, MODES, type Mode } from '../config';
import { clearRecords, describeRecord, loadRecords } from '../game/records';
import { CONCEPTS, type ConceptId } from '../learn/concepts';
import { fitCanvas, loop } from './anim';
import { drawArena } from './homeArena';
import { HOWTO_STEPS, SCENE_H, SCENE_W } from './howtoScenes';
import { drawConceptIcon } from './icons';

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
  /** Bumped on every render: the animation loop of an older render stops. */
  private generation = 0;
  /** Guide items under the mouse (they act: attack, fire…). */
  private readonly active = new Set<string>();

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
    this.animate();
  }

  /**
   * Animates the canvases of the current screen (home arena, guide icons, how-to scenes)
   * while the menu is visible. With "reduce motion" on, it draws one still frame.
   */
  private animate(): void {
    const gen = ++this.generation;
    this.active.clear();
    const arena = this.el.querySelector<HTMLCanvasElement>('canvas.arena');
    const icons = [...this.el.querySelectorAll<HTMLCanvasElement>('canvas[data-icon]')];
    const scenes = [...this.el.querySelectorAll<HTMLCanvasElement>('canvas[data-scene]')];
    if (!arena && icons.length === 0 && scenes.length === 0) return;
    const frame = (t: number): void => {
      if (arena) {
        const w = arena.clientWidth;
        const h = arena.clientHeight;
        const g = w > 0 && h > 0 ? fitCanvas(arena, w, h) : null;
        if (g) drawArena(g, w, h, t);
      }
      icons.forEach((c, i) => {
        const id = c.dataset.icon as ConceptId;
        drawConceptIcon(c, id, 80, t + i * 0.37, this.active.has(id));
      });
      scenes.forEach((c) => {
        const step = HOWTO_STEPS[Number(c.dataset.scene)];
        const g = fitCanvas(c, SCENE_W, SCENE_H);
        if (step && g) step.draw(g, t);
      });
    };
    let still = false;
    try {
      still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      still = false;
    }
    if (still) {
      requestAnimationFrame(() => frame(1.2));
      return;
    }
    loop(() => gen === this.generation && this.el.isConnected && this.el.offsetParent !== null, frame);
  }

  /* ---------- Screens ---------- */

  private mainScreen(): string {
    const s = this.cb.getSuspended();
    const cont = s
      ? `<button class="menu-btn primary" data-go="continue" type="button">▶ Continuar <small>Nivel ${MODES[s.mode].level} · ${s.wave > 0 ? `Ola ${s.wave}` : 'Preparación'}</small></button>`
      : '';
    return `
      <canvas class="arena" aria-hidden="true"></canvas>
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
    return `<div class="codex">${grid}</div><p class="note">Pasa el ratón por encima para verlos en acción. Pulsa un elemento para ver su ficha: qué es en la vida real y en qué se parece al juego.</p>`;
  }

  private howtoScreen(): string {
    const steps = HOWTO_STEPS.map(
      (s, i) => `<li class="step">
          <span class="step-n">${i + 1}</span>
          <strong>${esc(s.title)}</strong>
          <canvas data-scene="${i}" aria-hidden="true"></canvas>
          <p>${esc(s.text).replace('⬢ CU', '<span class="cu-inline">⬢ CU</span>')}</p>
        </li>`,
    ).join('');
    const key = (k: string, v: string) => `<span>${k} ${v}</span>`;
    return `
      <p class="howto-goal"><b>Objetivo:</b> protege la base (izquierda) del tráfico que llega desde Internet (derecha). Sobrevive a 10 olas.</p>
      <ol class="steps">${steps}</ol>
      <div class="keys">
        <b>Teclas</b>
        ${key('<kbd>1</kbd>–<kbd>8</kbd>', 'defensas')}
        ${key('<kbd>Q</kbd>', 'quitar defensa')}
        ${key('<kbd>Esc</kbd> o clic derecho', 'cancelar')}
        ${key('<kbd>P</kbd>', 'pausa')}
        ${key('<kbd>F</kbd>', 'velocidad ×2')}
        ${key('<kbd>M</kbd>', 'sonido')}
      </div>`;
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
    this.el.querySelectorAll<HTMLButtonElement>('.codex-item').forEach((b) => {
      const id = b.dataset.concept ?? '';
      b.addEventListener('click', () => this.cb.openConcept(id as ConceptId));
      // under the mouse (or keyboard focus) the character acts
      b.addEventListener('pointerenter', () => this.active.add(id));
      b.addEventListener('pointerleave', () => this.active.delete(id));
      b.addEventListener('focus', () => this.active.add(id));
      b.addEventListener('blur', () => this.active.delete(id));
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
