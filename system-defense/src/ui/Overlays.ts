import { MODE_ORDER, MODES, SERVICE_NAMES, TOTAL_WAVES, type Mode } from '../config';
import type { GameContext, SoundName } from '../game/GameContext';
import { onLangChange, t } from '../i18n';
import { concept, type ConceptId, type Link } from '../learn/concepts';
import { cause, describeIncident, levelLessonLoss, levelLessonWin, topDefenses } from '../learn/postmortem';
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
}

type Screen = 'menu' | 'pause' | 'end' | 'concept' | 'none';

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
 */
export class Overlays {
  readonly root: HTMLElement;
  readonly home: HTMLElement;
  readonly concept: HTMLElement;
  private readonly homeMenu: HomeMenu;
  private readonly pause: HTMLElement;
  private readonly end: HTMLElement;
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
      // The card opens over the home view; closing it just hides the card.
      openConcept: (id) => this.showConcept(id, { inGame: false, onClose: () => undefined }),
    });
    this.home = this.homeMenu.el;

    this.pause = document.createElement('section');
    this.pause.className = 'overlay pause';
    this.renderPause();
    onLangChange(() => this.renderPause());

    this.end = document.createElement('section');
    this.end.className = 'overlay end';

    this.concept = document.createElement('section');
    this.concept.className = 'overlay concept';

    this.root.append(this.pause, this.end);
    this.show('menu');
  }

  private renderPause(): void {
    this.pause.innerHTML = `<div class="panel small"><h2>${t('Paused', 'Pausa')}</h2><p>${t('The update loop is stopped.', 'El bucle de actualización está detenido.')}</p><div class="row"><button class="btn primary" data-act="resume" type="button">${t('Resume', 'Seguir')}</button><button class="btn" data-act="menu" type="button">${t('Menu', 'Menú')}</button></div></div>`;
    this.pause.querySelector('[data-act="resume"]')?.addEventListener('click', () => this.cb.onResume());
    this.pause.querySelector('[data-act="menu"]')?.addEventListener('click', () => this.cb.onMenu());
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
    if (which !== 'concept') this.conceptClose = null;
  }

  /* ---------- Concept card ---------- */

  /**
   * Opens a concept card. In game, it offers "do not show more cards".
   * `onClose(disableAll)` runs when the player closes it.
   */
  showConcept(id: ConceptId, opts: { inGame: boolean; onClose(disableAll: boolean): void }): void {
    const c = concept(id);
    const isDefense = c.kind === 'defense';
    const toolsLabel = isDefense ? t('Real tools', 'Herramientas reales') : t('How it is stopped in real life', 'Cómo se defiende en la vida real');
    this.concept.innerHTML = `
      <div class="panel concept-card ${isDefense ? 'is-defense' : 'is-threat'}" role="dialog" aria-labelledby="concept-title">
        <div class="concept-head">
          <canvas class="concept-icon"></canvas>
          <div>
            <span class="concept-kind">${isDefense ? t('Defense', 'Defensa') : t('Threat', 'Amenaza')}</span>
            <h2 id="concept-title">${esc(c.title)}</h2>
          </div>
        </div>
        <h3>${t('In real life', 'En la vida real')}</h3>
        <p>${esc(c.real)}</p>
        <h3>${toolsLabel}</h3>
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
    const services = ctx.mode !== 'monolith' ? `<div><span>${t('Services up', 'Servicios en pie')}</span><b>${alive}/5</b></div>` : '';
    const nextMode = MODE_ORDER[MODE_ORDER.indexOf(ctx.mode) + 1];
    const nextBtn = nextMode ? `<button class="btn" data-act="next" type="button">${t('Go to Level', 'Ir al Nivel')} ${MODES[nextMode].level}</button>` : '';
    const report = win ? this.retrospective(ctx) : this.postmortem(ctx);

    this.end.innerHTML = `
      <div class="panel medium ${win ? 'win' : 'lose'}">
        <p class="eyebrow">${t('Level', 'Nivel')} ${spec.level} · ${spec.name}</p>
        <h2>${win ? t('System scaled', 'Sistema escalado') : 'SYSTEM DOWN'}</h2>
        ${newRecord ? `<p class="new-record">${t('New record!', '¡Nuevo récord!')}</p>` : ''}
        <div class="stats">
          <div><span>${t('Wave', 'Ola')}</span><b>${ctx.wave.number}/${TOTAL_WAVES}</b></div>
          <div><span>${t('Threats removed', 'Amenazas eliminadas')}</span><b>${ctx.kills}</b></div>
          <div><span>Uptime</span><b>${fmtTime(ctx.time)}</b></div>
          ${services}
        </div>
        ${report}
        <div class="row">
          <button class="btn primary" data-act="retry" type="button">${t('Retry', 'Reintentar')}</button>
          ${nextBtn}
          <button class="btn" data-act="menu" type="button">${t('Menu', 'Menú')}</button>
        </div>
      </div>`;
    this.end.querySelector('[data-act="retry"]')?.addEventListener('click', () => this.cb.onStart(ctx.mode));
    if (nextMode) this.end.querySelector('[data-act="next"]')?.addEventListener('click', () => this.cb.onStart(nextMode));
    this.end.querySelector('[data-act="menu"]')?.addEventListener('click', () => this.cb.onMenu());
    this.show('end');
    this.end.scrollTop = 0;
  }

  private postmortem(ctx: GameContext): string {
    const last = ctx.incidents[ctx.incidents.length - 1];
    const level = levelLessonLoss(ctx.mode);
    if (!last) {
      return `<section class="report"><h3>Post-mortem</h3><p>${esc(ctx.endReason)}</p><p class="lesson"><b>${t('Lesson:', 'Lección:')}</b> ${esc(level.text)} ${link(level.read)}</p></section>`;
    }
    const why = cause(last.cause);
    const timeline =
      ctx.incidents.length > 1
        ? `<h4>${t('Timeline', 'Cronología')}</h4><ol class="timeline">${ctx.incidents
            .map((i) => `<li><span>${fmtTime(i.time)}</span> ${esc(SERVICE_NAMES[i.lane])}: ${esc(describeIncident(i))} <em>${esc(cause(i.cause).root)}</em></li>`)
            .join('')}</ol>`
        : '';
    return `
      <section class="report">
        <h3>Post-mortem</h3>
        <dl>
          <dt>${t('Incident', 'Incidente')}</dt><dd>${esc(describeIncident(last))}</dd>
          <dt>${t('Root cause', 'Causa raíz')}</dt><dd>${esc(why.root)}</dd>
          <dt>${t('What would have helped', 'Qué habría ayudado')}</dt><dd>${esc(why.help)}</dd>
          <dt>${t('Lesson', 'Lección')}</dt><dd>${esc(why.lesson)} ${link(why.read)}</dd>
          <dt>${t('Architecture', 'Arquitectura')}</dt><dd>${esc(level.text)} ${link(level.read)}</dd>
        </dl>
        ${timeline}
      </section>`;
  }

  private retrospective(ctx: GameContext): string {
    const lost = ctx.incidents.length;
    const level = levelLessonWin(ctx.mode, lost);
    const top = topDefenses(ctx.placed);
    return `
      <section class="report">
        <h3>${t('Retrospective', 'Retrospectiva')}</h3>
        <dl>
          <dt>${t('What you used most', 'Lo que más usaste')}</dt><dd>${top.length ? esc(top.join(' · ')) : t('No defense', 'Ninguna defensa')}</dd>
          <dt>${t('Services down', 'Servicios caídos')}</dt><dd>${lost}</dd>
          <dt>${t('Lesson', 'Lección')}</dt><dd>${esc(level.text)} ${link(level.read)}</dd>
        </dl>
      </section>`;
  }
}
