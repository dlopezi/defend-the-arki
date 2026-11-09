import { DEFENSE_ORDER, DEFENSES, ENEMIES, ENEMY_ORDER, MODE_ORDER, MODES, TOTAL_WAVES, type Mode } from '../config';
import type { SoundName } from '../game/GameContext';
import { clearRecords, describeRecord, loadRecords } from '../game/records';
import { lang, setLang, t, type Lang } from '../i18n';
import { concept, type ConceptId } from '../learn/concepts';
import { fitCanvas, loop } from './anim';
import { drawArena } from './homeArena';
import { HOWTO_STEPS, SCENE_H, SCENE_W } from './howtoScenes';
import { mountFeedbackForm } from './FeedbackForm';
import { drawConceptIcon } from './icons';

export type HomeScreen = 'main' | 'levels' | 'guide' | 'howto' | 'options' | 'feedback';

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
  playSound(name: SoundName): void;
}

/** Public repository, linked from the title screen footer. */
export const REPO_URL = 'https://github.com/dlopezi/defend-the-arki';

/** Version (to its GitHub Release), source link and copyright, for the title screen footer. */
export function creditsLine(version: string): string {
  const out = 'target="_blank" rel="noopener noreferrer"';
  return `<span class="credits"><a href="${REPO_URL}/releases/tag/v${version}" ${out}>v${version}</a> · <a href="${REPO_URL}" ${out}>GitHub ↗</a> · © 2026 thearki</span>`;
}

/** "Press start" was already passed in this browser tab. */
const STARTED_KEY = 'defend-the-arki:started';
function readStarted(): boolean {
  try {
    return sessionStorage.getItem(STARTED_KEY) === '1';
  } catch {
    return false;
  }
}

/** Buttons that the arrow keys move between, on each screen. */
const NAV = '.main-menu .menu-btn, .levels .level, .codex .codex-item, .screen-head .back, .tabs .tab';

function screenTitle(screen: Exclude<HomeScreen, 'main'>): string {
  switch (screen) {
    case 'levels':
      return t('Choose a level', 'Elige un nivel');
    case 'guide':
      return t('Guide', 'Guía');
    case 'howto':
      return t('How to play', 'Cómo jugar');
    case 'options':
      return t('Options', 'Opciones');
    case 'feedback':
      return 'Feedback';
  }
}

/** EN | ES switch. The labels are the same in both languages, so anyone can find it. */
function langSwitch(): string {
  const btn = (l: Lang, label: string) =>
    `<button class="${lang() === l ? 'active' : ''}" data-lang="${l}" type="button" aria-pressed="${lang() === l}">${label}</button>`;
  return `<div class="seg lang-seg" role="group" aria-label="Language · Idioma">${btn('en', 'EN')}${btn('es', 'ES')}</div>`;
}

function soundLabel(muted: boolean): string {
  return muted ? t('🔇 Sound: off', '🔇 Sonido: no') : t('🔊 Sound: on', '🔊 Sonido: sí');
}

function esc(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);
}

/**
 * Start view, organized like a game menu:
 * main title screen -> Play (levels) · Guide (codex) · How to play · Options · Feedback.
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
  /** Title screen: "press start" passed (once per browser tab). */
  private started = readStarted();
  /** When the title screen was shown (seconds): the characters walk in from there. */
  private introStart = -1;

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
    // The intro plays when the title screen opens, not when it only redraws.
    if (screen === 'main' && (this.screen !== 'main' || this.introStart < 0)) this.introStart = performance.now() / 1000;
    this.screen = screen;
    this.render();
    this.el.querySelector<HTMLButtonElement>('.press-start, .menu-btn, .back')?.focus({ preventScroll: true });
  }

  /** Esc / "Back". Returns false when already on the main screen. */
  back(): boolean {
    if (this.screen === 'main') return false;
    this.cb.playSound('menuMove');
    this.show('main');
    return true;
  }

  /**
   * Keys on the home view: any key passes "press start"; arrows move between buttons;
   * Esc goes back. Returns true if the key was used.
   */
  key(key: string): boolean {
    if (this.screen === 'main' && !this.started) {
      if (key === 'Tab' || key === 'Shift' || key === 'Meta' || key === 'Alt' || key === 'Control') return false;
      this.pressStart();
      return true;
    }
    if (key === 'Escape') return this.back();
    const dir = key === 'ArrowDown' || key === 'ArrowRight' ? 1 : key === 'ArrowUp' || key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return false;
    const items = [...this.el.querySelectorAll<HTMLButtonElement>(NAV)];
    if (items.length === 0) return false;
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = items[(i + dir + items.length) % items.length];
    next.focus();
    this.cb.playSound('menuMove');
    return true;
  }

  private pressStart(): void {
    this.started = true;
    try {
      sessionStorage.setItem(STARTED_KEY, '1');
    } catch {
      /* ignore */
    }
    this.cb.playSound('start');
    this.render();
    this.el.querySelector<HTMLButtonElement>('.menu-btn')?.focus({ preventScroll: true });
  }

  private render(): void {
    const body = this.screen === 'main' ? this.mainScreen() : this.subScreen(this.screen);
    this.el.innerHTML = `<div class="panel home-panel screen-${this.screen}">${body}</div>`;
    const feedback = this.el.querySelector<HTMLElement>('.feedback-host');
    if (feedback) {
      mountFeedbackForm(feedback, {
        getGameInfo: () => {
          // A game left paused with "Menu" is the one the player talks about.
          const s = this.cb.getSuspended();
          if (!s) return { level: 'none' };
          const spec = MODES[s.mode];
          return { level: `Level ${spec.level} · ${spec.name}`, wave: `${s.wave}/${TOTAL_WAVES}` };
        },
        doneLabel: t('Back to the menu', 'Volver al menú'),
        onDone: () => this.show('main'),
      });
    }
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
    let still = false;
    let noHover = false;
    try {
      still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      noHover = window.matchMedia('(hover: none)').matches;
    } catch {
      still = false;
    }
    const frame = (t: number): void => {
      if (arena) {
        const w = arena.clientWidth;
        const h = arena.clientHeight;
        const g = w > 0 && h > 0 ? fitCanvas(arena, w, h) : null;
        if (g) drawArena(g, w, h, t, still ? 99 : t - this.introStart);
      }
      icons.forEach((c, i) => {
        const id = c.dataset.icon as ConceptId;
        // Touch screens have no hover, so every character moves.
        drawConceptIcon(c, id, 80, t + i * 0.37, noHover || this.active.has(id));
      });
      scenes.forEach((c) => {
        const step = HOWTO_STEPS[Number(c.dataset.scene)];
        const g = fitCanvas(c, SCENE_W, SCENE_H);
        if (step && g) step.draw(g, t);
      });
    };
    if (still) {
      requestAnimationFrame(() => frame(1.2));
      return;
    }
    loop(() => gen === this.generation && this.el.isConnected && this.el.offsetParent !== null, frame);
  }

  /* ---------- Screens ---------- */

  private mainScreen(): string {
    const s = this.cb.getSuspended();
    const items: [string, string, string][] = [
      ...(s
        ? ([['continue', t('Continue', 'Continuar'), `${t('Level', 'Nivel')} ${MODES[s.mode].level} · ${s.wave > 0 ? `${t('Wave', 'Ola')} ${s.wave}` : t('Setup', 'Preparación')}`]] as [string, string, string][])
        : []),
      ['levels', t('Play', 'Jugar'), ''],
      ['guide', t('Guide', 'Guía'), ''],
      ['howto', t('How to play', 'Cómo jugar'), ''],
      ['options', t('Options', 'Opciones'), ''],
      ['feedback', 'Feedback', ''],
    ];
    const menu = items
      .map(
        ([go, label, sub], i) =>
          `<button class="menu-btn${i === 0 ? ' primary' : ''}" data-go="${go}" type="button" style="--i:${i}">${label}${sub ? `<small>${esc(sub)}</small>` : ''}</button>`,
      )
      .join('');
    const actions = this.started
      ? `<nav class="main-menu" aria-label="${t('Main menu', 'Menú principal')}">${menu}</nav>`
      : `<button class="press-start" data-go="press" type="button">${t('Press to start', 'Pulsa para empezar')}<small><span class="no-touch">${t('click or any key', 'clic o cualquier tecla')}</span><span class="touch-only">${t('tap the screen', 'toca la pantalla')}</span></small></button>`;
    const muted = this.cb.getMuted();
    return `
      <canvas class="arena" aria-hidden="true"></canvas>
      <div class="title-screen">
        <p class="eyebrow">${t('Systems architecture tower defense', 'Tower defense de arquitectura de sistemas')}</p>
        <h1 class="logo"><span class="logo-a">Defend the</span><span class="logo-b">Arki</span></h1>
        <p class="tagline">${t('Defend your architecture from hostile traffic.', 'Defiende tu arquitectura del tráfico hostil.')}</p>
        ${actions}
      </div>
      <footer class="title-foot">
        <span class="best">${esc(this.bestLine())}</span>
        <span class="hint">${this.started ? t('↑ ↓ choose · Enter select · Esc back', '↑ ↓ elegir · Enter aceptar · Esc volver') : ''}</span>
        <span class="foot-right">
          ${langSwitch()}
          <button class="icon-btn" data-opt="quickSound" type="button" aria-pressed="${!muted}">${soundLabel(muted)}</button>
          ${creditsLine(__APP_VERSION__)}
        </span>
      </footer>`;
  }

  /** Best result in any level, for the title screen. */
  private bestLine(): string {
    const records = loadRecords();
    let best: { mode: Mode; wave: number; won: boolean } | null = null;
    for (const m of MODE_ORDER) {
      const r = records[m];
      if (r.bestWave === 0 && !r.won) continue;
      const score = (r.won ? 100 : 0) + r.bestWave;
      const bestScore = best ? (best.won ? 100 : 0) + best.wave : -1;
      if (score > bestScore || (score === bestScore && MODES[m].level > MODES[best!.mode].level)) best = { mode: m, wave: r.bestWave, won: r.won };
    }
    if (!best) return t('🏆 No records yet: play your first game!', '🏆 Sin récords todavía: ¡juega tu primera partida!');
    const spec = MODES[best.mode];
    return best.won
      ? t(`🏆 Best: won Level ${spec.level} · ${spec.name}`, `🏆 Mejor: victoria en Nivel ${spec.level} · ${spec.name}`)
      : t(`🏆 Best: Level ${spec.level} · ${spec.name} · wave ${best.wave}`, `🏆 Mejor: Nivel ${spec.level} · ${spec.name} · ola ${best.wave}`);
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
            <button class="tab ${this.guideTab === 'defenses' ? 'active' : ''}" data-tab="defenses" type="button" role="tab">${t('Defenses', 'Defensas')}</button>
            <button class="tab ${this.guideTab === 'threats' ? 'active' : ''}" data-tab="threats" type="button" role="tab">${t('Threats', 'Amenazas')}</button>
          </div>`;
        content = this.guideScreen();
        break;
      case 'howto':
        content = this.howtoScreen();
        break;
      case 'options':
        content = this.optionsScreen();
        break;
      case 'feedback':
        content = '<div class="feedback-host"></div>';
        break;
    }
    return `
      <header class="screen-head">
        <button class="back" data-go="main" type="button">← ${t('Back', 'Volver')}</button>
        <h2>${screenTitle(screen)}</h2>
        <div class="head-right">${right}</div>
      </header>
      <div class="screen-body">${content}</div>`;
  }

  private levelsScreen(): string {
    const records = loadRecords();
    const cards = MODE_ORDER.map((m) => {
      const spec = MODES[m];
      return `<button class="level" data-mode="${m}" type="button" style="--accent:${spec.color}">
          <span class="level-tag">${t('Level', 'Nivel')} ${spec.level}</span>
          <strong>${spec.name}</strong>
          <span>${spec.rule}</span>
          <span class="record">${describeRecord(records[m])}</span>
        </button>`;
    }).join('');
    const warn = this.cb.getSuspended()
      ? `<p class="note warn">${t('You have a paused game. If you choose a level, that game ends.', 'Tienes una partida en pausa. Si eliges un nivel, esa partida termina.')}</p>`
      : '';
    return `<div class="levels">${cards}</div>${warn}`;
  }

  private guideScreen(): string {
    const items: { id: ConceptId; name: string; sub: string; color: string; hotkey?: string }[] =
      this.guideTab === 'defenses'
        ? [
            ...DEFENSE_ORDER.map((d) => ({ id: d as ConceptId, name: DEFENSES[d].name, sub: `${DEFENSES[d].cost} CU`, hotkey: DEFENSES[d].hotkey, color: DEFENSES[d].color })),
            { id: 'rollback', name: 'Rollback', sub: t('Free · levels 2 and 3', 'Gratis · niveles 2 y 3'), color: '#22d3ee' },
          ]
        : ENEMY_ORDER.map((e) => ({ id: e as ConceptId, name: ENEMIES[e].name, sub: ENEMIES[e].desc, color: ENEMIES[e].color }));
    const grid = items
      .map(
        (it) => `<button class="codex-item" data-concept="${it.id}" type="button" style="--accent:${it.color}" title="${esc(concept(it.id).real)}">
          <canvas class="codex-icon" data-icon="${it.id}"></canvas>
          <strong>${esc(it.name)}</strong>
          <span>${esc(it.sub)}${it.hotkey ? `<span class="no-touch"> · ${t('key', 'tecla')} ${esc(it.hotkey)}</span>` : ''}</span>
        </button>`,
      )
      .join('');
    return `<div class="codex">${grid}</div><p class="note"><span class="no-touch">${t('Hover over them to see them in action. ', 'Pasa el ratón por encima para verlos en acción. ')}</span>${t(
      'Press an element to see its card: what it is in real life and how it compares to the game.',
      'Pulsa un elemento para ver su ficha: qué es en la vida real y en qué se parece al juego.',
    )}</p>`;
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
      <p class="howto-goal"><b>${t('Goal:', 'Objetivo:')}</b> ${t(
        'protect the base (left) from the traffic that comes from the Internet (right). Survive 10 waves.',
        'protege la base (izquierda) del tráfico que llega desde Internet (derecha). Sobrevive a 10 olas.',
      )}</p>
      <ol class="steps">${steps}</ol>
      <div class="keys">
        <b>${t('Keys', 'Teclas')}</b>
        ${key('<kbd>1</kbd>–<kbd>8</kbd>', t('defenses', 'defensas'))}
        ${key('<kbd>Q</kbd>', t('remove defense', 'quitar defensa'))}
        ${key(`<kbd>Esc</kbd> ${t('or right click', 'o clic derecho')}`, t('cancel', 'cancelar'))}
        ${key('<kbd>P</kbd>', t('pause', 'pausa'))}
        ${key('<kbd>F</kbd>', t('speed ×2', 'velocidad ×2'))}
        ${key('<kbd>M</kbd>', t('sound', 'sonido'))}
      </div>`;
  }

  private optionsScreen(): string {
    const seg = (key: string, on: boolean) =>
      `<div class="seg" role="group">
        <button class="${on ? 'active' : ''}" data-opt="${key}" data-val="1" type="button">${t('Yes', 'Sí')}</button>
        <button class="${on ? '' : 'active'}" data-opt="${key}" data-val="0" type="button">No</button>
      </div>`;
    return `<div class="options">
      <div class="opt"><div><strong>Language · Idioma</strong><span>${t('Texts of the whole game.', 'Textos de todo el juego.')}</span></div>${langSwitch()}</div>
      <div class="opt"><div><strong>${t('Concept cards during the game', 'Fichas de concepto durante la partida')}</strong><span>${t(
        'The first time an element appears, the game pauses and explains what it is.',
        'La primera vez que aparece un elemento, el juego se pausa y explica qué es.',
      )}</span></div>${seg('learn', this.cb.getLearnEnabled())}</div>
      <div class="opt"><div><strong>${t('Sound', 'Sonido')}</strong><span>${t('Game sound effects.', 'Efectos de sonido del juego.')}</span></div>${seg('sound', !this.cb.getMuted())}</div>
      <div class="opt"><div><strong>${t('See all cards again', 'Ver de nuevo todas las fichas')}</strong><span>${t(
        'The cards will show up again during the game.',
        'Las fichas volverán a salir durante la partida.',
      )}</span></div><button class="btn" data-opt="resetSeen" type="button">${t('Reset', 'Reiniciar')}</button></div>
      <div class="opt"><div><strong>${t('Clear records', 'Borrar récords')}</strong><span>${t(
        'Clears the records of the 3 levels in this browser.',
        'Borra los récords de los 3 niveles en este navegador.',
      )}</span></div><button class="btn ${this.confirmClear ? 'danger' : ''}" data-opt="clearRecords" type="button">${
        this.confirmClear ? t('Sure? Press again', '¿Seguro? Pulsa otra vez') : t('Clear', 'Borrar')
      }</button></div>
      ${this.notice ? `<p class="note ok">${esc(this.notice)}</p>` : ''}
    </div>`;
  }

  /* ---------- Events ---------- */

  private bind(): void {
    // "Press to start": a click anywhere on the title screen also starts.
    if (this.screen === 'main' && !this.started) {
      this.el.querySelector('.home-panel')?.addEventListener('click', (e) => {
        if (!(e.target as Element).closest('button, a')) this.pressStart();
      });
    }
    this.el.querySelectorAll<HTMLButtonElement>('[data-go]').forEach((b) => {
      b.addEventListener('click', () => {
        const go = b.dataset.go;
        if (go === 'press') {
          this.pressStart();
          return;
        }
        this.cb.playSound('menuSelect');
        if (go === 'continue') this.cb.onContinue();
        else this.show(go as HomeScreen);
      });
    });
    this.el.querySelectorAll<HTMLButtonElement>('.level').forEach((b) => {
      b.addEventListener('click', () => {
        this.cb.playSound('start');
        this.cb.onStart(b.dataset.mode as Mode);
      });
    });
    // Mouse over a menu button selects it, like the arrow keys.
    this.el.querySelectorAll<HTMLButtonElement>('.main-menu .menu-btn, .levels .level').forEach((b) => {
      b.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse' || document.activeElement === b) return;
        b.focus({ preventScroll: true });
        this.cb.playSound('menuMove');
      });
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
    this.el.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((b) => {
      b.addEventListener('click', () => this.changeLang(b.dataset.lang === 'es' ? 'es' : 'en'));
    });
  }

  /** Redraws the current screen in the new language and keeps the focus on the switch. */
  private changeLang(next: Lang): void {
    if (next === lang()) return;
    setLang(next);
    this.cb.playSound('menuSelect');
    this.notice = '';
    this.render();
    this.el.querySelector<HTMLButtonElement>(`[data-lang="${next}"]`)?.focus({ preventScroll: true });
  }

  private option(key: string, on: boolean): void {
    if (key === 'quickSound') {
      // title screen button: no full redraw (the intro would play again)
      this.cb.toggleMute();
      const muted = this.cb.getMuted();
      const b = this.el.querySelector<HTMLButtonElement>('[data-opt="quickSound"]');
      if (b) {
        b.textContent = soundLabel(muted);
        b.setAttribute('aria-pressed', String(!muted));
      }
      if (!muted) this.cb.playSound('menuSelect');
      return;
    }
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
        this.notice = t('Done: the cards will show up again during the game.', 'Hecho: las fichas volverán a salir durante la partida.');
        break;
      case 'clearRecords':
        if (!this.confirmClear) {
          this.confirmClear = true;
        } else {
          clearRecords();
          this.confirmClear = false;
          this.notice = t('Records cleared.', 'Récords borrados.');
        }
        break;
    }
    this.render();
  }
}
