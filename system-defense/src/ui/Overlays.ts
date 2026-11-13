import { laneName, MODE_ORDER, MODES, REGIONS, type Mode } from '../config';
import type { GameContext, SoundName } from '../game/GameContext';
import { onLangChange, t } from '../i18n';
import { concept, kindLabel, toolsLabel, type ConceptId, type Link } from '../learn/concepts';
import { cause, describeIncident, levelLessonLoss, levelLessonWin, providerLesson, topDefenses, type Incident } from '../learn/postmortem';
import { focusFeedback, mountFeedbackForm, type FeedbackGameInfo } from './FeedbackForm';
import { HomeMenu } from './HomeMenu';
import { loop } from './anim';
import { drawConceptIcon, paintConceptIcon } from './icons';

export interface OverlayCallbacks {
  onStart(mode: Mode): void;
  onResume(): void;
  onMenu(): void;
  getLearnEnabled(): boolean;
  setLearnEnabled(on: boolean): void;
  /** Game left paused by the "Menu" button, if any. */
  getSuspended(): { mode: Mode; wave: number } | null;
  onContinue(): void;
  getMuted(): boolean;
  toggleMute(): void;
  resetSeen(): void;
  playSound(name: SoundName): void;
  /** Level, wave and result of the current game, for Feedback. */
  getGameInfo(): FeedbackGameInfo;
}

type Screen = 'menu' | 'pause' | 'end' | 'concept' | 'feedback' | 'none';
/** Where Feedback was opened: the title menu, or the pause / end screen of a game. */
type FeedbackFrom = 'menu' | 'pause' | 'end';

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}

function esc(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);
}

function link(l: Link): string {
  return `<a href="${l.url}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a>`;
}

/**
 * Screens.
 * - `home`: start view, shown instead of the HUD and board.
 * - `root`: pause and end screens, drawn over the board.
 * - `concept`: concept card, fixed over the whole page (works in both views).
 * - `feedback`: Feedback modal, fixed over the whole page (from the menu, pause or end).
 */
export class Overlays {
  readonly root: HTMLElement;
  readonly home: HTMLElement;
  readonly concept: HTMLElement;
  readonly feedback: HTMLElement;
  private readonly homeMenu: HomeMenu;
  private readonly pause: HTMLElement;
  private readonly end: HTMLElement;
  /** Screen to go back to when Feedback closes, or null when closed. */
  private feedbackReturn: FeedbackFrom | null = null;
  private readonly cb: OverlayCallbacks;
  private conceptClose: (() => void) | null = null;

  constructor(cb: OverlayCallbacks) {
    this.cb = cb;
    this.root = document.createElement('div');
    this.root.className = 'overlays';

    this.homeMenu = new HomeMenu({
      onStart: (m) => cb.onStart(m),
      onContinue: () => cb.onContinue(),
      getSuspended: () => cb.getSuspended(),
      getLearnEnabled: () => cb.getLearnEnabled(),
      setLearnEnabled: (on) => cb.setLearnEnabled(on),
      getMuted: () => cb.getMuted(),
      toggleMute: () => cb.toggleMute(),
      resetSeen: () => cb.resetSeen(),
      playSound: (name) => cb.playSound(name),
      openFeedback: () => this.openFeedback('menu'),
    });
    this.home = this.homeMenu.el;

    this.pause = document.createElement('section');
    this.pause.className = 'overlay pause';
    this.renderPause();
    onLangChange(() => this.renderPause());

    this.end = document.createElement('section');
    this.end.className = 'overlay end';

    this.feedback = document.createElement('section');
    this.feedback.className = 'overlay feedback-overlay';

    this.concept = document.createElement('section');
    this.concept.className = 'overlay concept';

    this.root.append(this.pause, this.end);
    this.show('menu');
  }

  private renderPause(): void {
    this.pause.innerHTML = `<div class="panel small"><h2>${t('Paused', 'Pausa')}</h2><p>${t('The update loop is stopped.', 'El bucle de actualización está detenido.')}</p><div class="row"><button class="btn primary" data-act="resume" type="button">${t('Resume', 'Seguir')}</button><button class="btn" data-act="menu" type="button">${t('Menu', 'Menú')}</button><button class="btn" data-act="feedback" type="button">Feedback</button></div></div>`;
    this.pause.querySelector('[data-act="resume"]')?.addEventListener('click', () => this.cb.onResume());
    this.pause.querySelector('[data-act="menu"]')?.addEventListener('click', () => this.cb.onMenu());
    this.pause.querySelector('[data-act="feedback"]')?.addEventListener('click', () => this.openFeedback('pause'));
  }

  /* ---------- Feedback modal (from the title menu, pause and end screens) ---------- */

  get feedbackOpen(): boolean {
    return this.feedbackReturn !== null;
  }

  /**
   * Opens the Feedback modal. From the menu, the title screen stays behind it; in a game,
   * it replaces the pause or end screen and the game stays paused or ended.
   */
  openFeedback(from: FeedbackFrom): void {
    this.feedback.innerHTML = `
      <div class="panel small feedback-panel" role="dialog" aria-labelledby="feedback-title">
        <div class="feedback-head">
          <h2 id="feedback-title">Feedback</h2>
          <button class="btn" data-act="close" type="button">${t('Close', 'Cerrar')}</button>
        </div>
        <div class="feedback-host"></div>
      </div>`;
    mountFeedbackForm(this.feedback.querySelector<HTMLElement>('.feedback-host')!, {
      getGameInfo: () => (from === 'menu' ? this.menuGameInfo() : this.cb.getGameInfo()),
      doneLabel: t('Close', 'Cerrar'),
      onDone: () => this.closeFeedback(),
    });
    this.feedback.querySelector('[data-act="close"]')?.addEventListener('click', () => this.closeFeedback());
    if (from === 'menu') {
      this.feedback.classList.add('visible');
      // Keyboard focus stays in the modal: the title screen behind it does not react.
      this.home.inert = true;
    } else this.show('feedback');
    this.feedbackReturn = from;
    focusFeedback(this.feedback);
  }

  closeFeedback(): void {
    const back = this.feedbackReturn;
    if (!back) return;
    if (back === 'menu') {
      this.feedback.classList.remove('visible');
      this.feedbackReturn = null;
      this.home.inert = false;
      this.home.querySelector<HTMLButtonElement>('[data-go="feedback"]')?.focus({ preventScroll: true });
      return;
    }
    this.show(back);
  }

  /** From the menu: a game left paused with "Menu" is the one the player talks about. */
  private menuGameInfo(): FeedbackGameInfo {
    const s = this.cb.getSuspended();
    if (!s) return { level: 'none' };
    const spec = MODES[s.mode];
    return { level: `Level ${spec.level} · ${spec.name}`, wave: `${s.wave}/${spec.waves}` };
  }

  /** A key pressed on the home view (menu navigation). Returns true if it was used. */
  homeKey(key: string): boolean {
    return this.homeMenu.key(key);
  }

  get conceptOpen(): boolean {
    return this.conceptClose !== null;
  }

  show(which: Screen): void {
    if (which === 'menu') this.homeMenu.show('main');
    this.home.classList.toggle('visible', which === 'menu');
    this.pause.classList.toggle('visible', which === 'pause');
    this.end.classList.toggle('visible', which === 'end');
    this.concept.classList.toggle('visible', which === 'concept');
    this.feedback.classList.toggle('visible', which === 'feedback');
    if (which !== 'concept') this.conceptClose = null;
    if (which !== 'feedback') this.feedbackReturn = null;
    this.home.inert = false;
  }

  /* ---------- Concept card ---------- */

  /**
   * Opens a concept card. In game, it offers "do not show more cards".
   * `onClose(disableAll)` runs when the player closes it.
   */
  showConcept(id: ConceptId, opts: { inGame: boolean; onClose(disableAll: boolean): void }): void {
    const c = concept(id);
    this.concept.innerHTML = `
      <div class="panel concept-card is-${c.kind}" role="dialog" aria-labelledby="concept-title">
        <div class="concept-head">
          <canvas class="concept-icon"></canvas>
          <div>
            <span class="concept-kind">${kindLabel(c.kind)}</span>
            <h2 id="concept-title">${esc(c.title)}</h2>
          </div>
        </div>
        <h3>${t('In real life', 'En la vida real')}</h3>
        <p>${esc(c.real)}</p>
        <h3>${toolsLabel(c.kind)}</h3>
        <p class="tools">${c.tools.map((t) => `<span class="tool">${esc(t)}</span>`).join('')}</p>
        <h3>${t('Game vs reality', 'Juego vs realidad')}</h3>
        <p class="vs same">✓ <b>${t('Same:', 'Igual:')}</b> ${esc(c.same)}</p>
        <p class="vs diff">✗ <b>${t('Different:', 'Distinto:')}</b> ${esc(c.diff)}</p>
        <p class="read">${t('Read more:', 'Para leer más:')} ${link(c.read)}</p>
        <div class="concept-foot">
          ${opts.inGame ? `<label class="check"><input type="checkbox" data-act="disable"> ${t('Do not show more cards', 'No mostrar más fichas')}</label>` : '<span></span>'}
          <button class="btn primary" data-act="ok" type="button">${t('Got it', 'Entendido')}<span class="no-touch"> (Enter)</span></button>
        </div>
      </div>`;
    const canvas = this.concept.querySelector<HTMLCanvasElement>('.concept-icon');
    if (canvas) {
      // The character moves while the card is open (one still frame with "reduce motion").
      let still = false;
      try {
        still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch {
        still = false;
      }
      if (still) paintConceptIcon(canvas, id);
      else loop(() => canvas.isConnected && this.concept.classList.contains('visible'), (t) => drawConceptIcon(canvas, id, 84, t));
    }
    const close = () => {
      const disable = this.concept.querySelector<HTMLInputElement>('[data-act="disable"]')?.checked ?? false;
      this.conceptClose = null;
      this.concept.classList.remove('visible');
      opts.onClose(disable);
    };
    this.concept.querySelector('[data-act="ok"]')?.addEventListener('click', close);
    this.pause.classList.remove('visible');
    this.end.classList.remove('visible');
    this.concept.classList.add('visible');
    this.conceptClose = close;
    // Focus the button for the keyboard, but keep the card scrolled to its title (short screens).
    this.concept.querySelector<HTMLButtonElement>('[data-act="ok"]')?.focus({ preventScroll: true });
    this.concept.scrollTop = 0;
  }

  /** Closes the open concept card (Enter / Escape). */
  closeConcept(): void {
    this.conceptClose?.();
  }

  /* ---------- End screen: post-mortem or retrospective ---------- */

  showEnd(ctx: GameContext, newRecord: boolean): void {
    const win = ctx.status === 'victory';
    const spec = MODES[ctx.mode];
    const alive = ctx.lanesAlive.filter(Boolean).length;
    const regionsUp = REGIONS.filter((r) => r.lanes.every((lane) => ctx.lanesAlive[lane])).length;
    const services =
      ctx.mode === 'multiRegion'
        ? `<div><span>${t('Regions up', 'Regiones en pie')}</span><b>${regionsUp}/${REGIONS.length}</b></div>`
        : ctx.mode !== 'monolith'
          ? `<div><span>${t('Services up', 'Servicios en pie')}</span><b>${alive}/5</b></div>`
          : '';
    const nextMode = MODE_ORDER[MODE_ORDER.indexOf(ctx.mode) + 1];
    const nextBtn = nextMode ? `<button class="btn" data-act="next" type="button">${t('Go to Level', 'Ir al Nivel')} ${MODES[nextMode].level}</button>` : '';
    const report = win ? this.retrospective(ctx) : this.postmortem(ctx);

    this.end.innerHTML = `
      <div class="panel medium ${win ? 'win' : 'lose'}">
        <p class="eyebrow">${t('Level', 'Nivel')} ${spec.level} · ${spec.name}</p>
        <h2>${win ? t('System scaled', 'Sistema escalado') : 'SYSTEM DOWN'}</h2>
        ${newRecord ? `<p class="new-record">${t('New record!', '¡Nuevo récord!')}</p>` : ''}
        <div class="stats">
          <div><span>${t('Wave', 'Ola')}</span><b>${ctx.wave.number}/${spec.waves}</b></div>
          <div><span>${t('Threats removed', 'Amenazas eliminadas')}</span><b>${ctx.kills}</b></div>
          <div><span>Uptime</span><b>${fmtTime(ctx.time)}</b></div>
          ${services}
        </div>
        ${report}
        <div class="row">
          <button class="btn primary" data-act="retry" type="button">${t('Retry', 'Reintentar')}</button>
          ${nextBtn}
          <button class="btn" data-act="menu" type="button">${t('Menu', 'Menú')}</button>
          <button class="btn" data-act="feedback" type="button">${t('Send feedback', 'Enviar feedback')}</button>
        </div>
      </div>`;
    this.end.querySelector('[data-act="retry"]')?.addEventListener('click', () => this.cb.onStart(ctx.mode));
    if (nextMode) this.end.querySelector('[data-act="next"]')?.addEventListener('click', () => this.cb.onStart(nextMode));
    this.end.querySelector('[data-act="menu"]')?.addEventListener('click', () => this.cb.onMenu());
    this.end.querySelector('[data-act="feedback"]')?.addEventListener('click', () => this.openFeedback('end'));
    this.show('end');
    this.end.scrollTop = 0;
  }

  private postmortem(ctx: GameContext): string {
    // The game ends on a breach (a Provider failure never takes down the last part still up).
    const last = ctx.incidents.findLast((i) => i.kind === 'breach');
    const level = levelLessonLoss(ctx.mode);
    const provider = ctx.incidents.some((i) => i.kind === 'provider') ? ` ${providerLesson(ctx.mode, false)}` : '';
    if (!last || last.kind !== 'breach') {
      return `<section class="report"><h3>Post-mortem</h3><p>${esc(ctx.endReason)}</p><p class="lesson"><b>${t('Lesson:', 'Lección:')}</b> ${esc(level.text + provider)} ${link(level.read)}</p></section>`;
    }
    const why = cause(last.cause);
    const note = (i: Incident) => (i.kind === 'breach' ? cause(i.cause).root : t('Not caused by a threat.', 'No la causó una amenaza.'));
    const timeline =
      ctx.incidents.length > 1
        ? `<h4>${t('Timeline', 'Cronología')}</h4><ol class="timeline">${ctx.incidents
            .map((i) => `<li class="${i.kind}"><span>${fmtTime(i.time)}</span> ${esc(laneName(ctx.mode, i.lane))}: ${esc(describeIncident(i, ctx.mode))} <em>${esc(note(i))}</em></li>`)
            .join('')}</ol>`
        : '';
    return `
      <section class="report">
        <h3>Post-mortem</h3>
        <dl>
          <dt>${t('Incident', 'Incidente')}</dt><dd>${esc(describeIncident(last, ctx.mode))}</dd>
          <dt>${t('Root cause', 'Causa raíz')}</dt><dd>${esc(why.root)}</dd>
          <dt>${t('What would have helped', 'Qué habría ayudado')}</dt><dd>${esc(why.help)}</dd>
          <dt>${t('Lesson', 'Lección')}</dt><dd>${esc(why.lesson)} ${link(why.read)}</dd>
          <dt>${t('Architecture', 'Arquitectura')}</dt><dd>${esc(level.text + provider)} ${link(level.read)}</dd>
        </dl>
        ${timeline}
      </section>`;
  }

  private retrospective(ctx: GameContext): string {
    const lost = ctx.incidents.length;
    const level = levelLessonWin(ctx.mode, lost);
    const top = topDefenses(ctx.placed);
    const survived = ctx.incidents.some((i) => i.kind === 'provider');
    return `
      <section class="report">
        <h3>${t('Retrospective', 'Retrospectiva')}</h3>
        <dl>
          <dt>${t('What you used most', 'Lo que más usaste')}</dt><dd>${top.length ? esc(top.join(' · ')) : t('No defense', 'Ninguna defensa')}</dd>
          <dt>${ctx.mode === 'multiRegion' ? t('Regions down', 'Regiones caídas') : t('Services down', 'Servicios caídos')}</dt><dd>${lost}</dd>
          <dt>${t('Lesson', 'Lección')}</dt><dd>${esc(level.text)} ${link(level.read)}</dd>
          ${survived ? `<dt>Provider failure</dt><dd>${esc(providerLesson(ctx.mode, true))}</dd>` : ''}
        </dl>
      </section>`;
  }
}
