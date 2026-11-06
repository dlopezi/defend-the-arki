import { DEFENSE_ORDER, DEFENSES, ENEMIES, ENEMY_ORDER, MODE_ORDER, MODES, SERVICE_NAMES, TOTAL_WAVES, type Mode } from '../config';
import type { GameContext } from '../game/GameContext';
import { describeRecord, loadRecords } from '../game/records';
import { CONCEPTS, type ConceptId, type Link } from '../learn/concepts';
import { CAUSES, describeIncident, levelLessonLoss, levelLessonWin, topDefenses } from '../learn/postmortem';
import { drawDefense, drawEnemy, drawRollback } from '../render/sprites';

export interface OverlayCallbacks {
  onStart(mode: Mode): void;
  onResume(): void;
  onMenu(): void;
  getLearnEnabled(): boolean;
  setLearnEnabled(on: boolean): void;
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

function isDefense(id: ConceptId): id is (typeof DEFENSE_ORDER)[number] {
  return (DEFENSE_ORDER as string[]).includes(id);
}

/** Draws the element's sprite into a small canvas for the concept card. */
function paintConceptIcon(canvas: HTMLCanvasElement, id: ConceptId): void {
  const size = 84;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  const g = canvas.getContext('2d');
  if (!g) return;
  g.scale(dpr, dpr);
  g.translate(size / 2, size / 2);
  if (id === 'rollback') {
    g.scale(1.8, 1.8);
    drawRollback(g, 0, 0, false, 0);
  } else if (isDefense(id)) {
    g.scale(0.85, 0.85);
    drawDefense(g, id, 0, 0, 1.2);
  } else {
    const spec = ENEMIES[id];
    const k = Math.min(1, 70 / Math.max(spec.width, spec.height));
    g.scale(k, k);
    drawEnemy(g, id, 0, 0, spec.width, spec.height, 0, { flash: 0, slowed: false, state: 'attack', jumpHeight: 0 });
  }
}

/** Menu, pause, concept card and end screens, drawn as DOM over the canvas. */
export class Overlays {
  readonly root: HTMLElement;
  private readonly menu: HTMLElement;
  private readonly pause: HTMLElement;
  private readonly end: HTMLElement;
  private readonly concept: HTMLElement;
  private readonly cb: OverlayCallbacks;
  private conceptClose: (() => void) | null = null;

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

    this.concept = document.createElement('section');
    this.concept.className = 'overlay concept';

    this.root.append(this.menu, this.pause, this.end, this.concept);
    this.show('menu');
  }

  get conceptOpen(): boolean {
    return this.conceptClose !== null;
  }

  show(which: Screen): void {
    if (which === 'menu') this.renderMenu();
    this.menu.classList.toggle('visible', which === 'menu');
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
    const c = CONCEPTS[id];
    const toolsLabel = c.kind === 'Defensa' ? 'Herramientas reales' : 'Cómo se defiende en la vida real';
    this.concept.innerHTML = `
      <div class="panel concept-card ${c.kind === 'Defensa' ? 'is-defense' : 'is-threat'}" role="dialog" aria-labelledby="concept-title">
        <div class="concept-head">
          <canvas class="concept-icon"></canvas>
          <div>
            <span class="concept-kind">${c.kind}</span>
            <h2 id="concept-title">${esc(c.title)}</h2>
          </div>
        </div>
        <h3>En la vida real</h3>
        <p>${esc(c.real)}</p>
        <h3>${toolsLabel}</h3>
        <p class="tools">${c.tools.map((t) => `<span class="tool">${esc(t)}</span>`).join('')}</p>
        <h3>Juego vs realidad</h3>
        <p class="vs same">✓ <b>Igual:</b> ${esc(c.same)}</p>
        <p class="vs diff">✗ <b>Distinto:</b> ${esc(c.diff)}</p>
        <p class="read">Para leer más: ${link(c.read)}</p>
        <div class="concept-foot">
          ${opts.inGame ? '<label class="check"><input type="checkbox" data-act="disable"> No mostrar más fichas</label>' : '<span></span>'}
          <button class="btn primary" data-act="ok" type="button">Entendido (Enter)</button>
        </div>
      </div>`;
    const canvas = this.concept.querySelector<HTMLCanvasElement>('.concept-icon');
    if (canvas) paintConceptIcon(canvas, id);
    const close = () => {
      const disable = this.concept.querySelector<HTMLInputElement>('[data-act="disable"]')?.checked ?? false;
      this.conceptClose = null;
      this.concept.classList.remove('visible');
      opts.onClose(disable);
    };
    this.concept.querySelector('[data-act="ok"]')?.addEventListener('click', close);
    this.menu.classList.remove('visible');
    this.pause.classList.remove('visible');
    this.end.classList.remove('visible');
    this.concept.classList.add('visible');
    this.conceptClose = close;
    this.concept.querySelector<HTMLButtonElement>('[data-act="ok"]')?.focus();
  }

  /** Closes the open concept card (Enter / Escape). */
  closeConcept(): void {
    this.conceptClose?.();
  }

  /* ---------- Menu ---------- */

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
    const conceptLink = (id: ConceptId, label: string, color: string) =>
      `<button class="concept-link" data-concept="${id}" type="button" style="color:${color}" title="Abrir la ficha de concepto">${esc(label)}</button>`;
    this.menu.innerHTML = `
      <div class="panel">
        <p class="eyebrow">Tower defense de arquitectura de sistemas</p>
        <h1>System<span>Defense</span></h1>
        <p class="lead">El tráfico hostil llega desde Internet (derecha). Coloca defensas en la cuadrícula de 5 carriles × 9 columnas y protege tu base (izquierda). Haz clic en una defensa colocada para mejorarla a v2.</p>
        <div class="levels">${levels}</div>
        <details class="guide">
          <summary>Guía: defensas y amenazas (pulsa un nombre para ver su ficha)</summary>
          <div class="legend">
            <div>
              <h3>Defensas</h3>
              <ul>${DEFENSE_ORDER.map((d) => `<li>${conceptLink(d, `${DEFENSES[d].hotkey} · ${DEFENSES[d].name}`, DEFENSES[d].color)} <em>${DEFENSES[d].cost} CU</em> — ${DEFENSES[d].desc}</li>`).join('')}
              <li>${conceptLink('rollback', '↺ Rollback', '#22d3ee')} <em>gratis</em> — Niveles 2 y 3: uno por carril, limpia el carril una vez</li></ul>
            </div>
            <div>
              <h3>Amenazas</h3>
              <ul>${ENEMY_ORDER.map((e) => `<li>${conceptLink(e === 'botlet' ? 'botnet' : e, ENEMIES[e].name, ENEMIES[e].color)} — ${ENEMIES[e].desc}</li>`).join('')}</ul>
            </div>
          </div>
        </details>
        <label class="check menu-check"><input type="checkbox" data-act="learn" ${this.cb.getLearnEnabled() ? 'checked' : ''}> Mostrar fichas de concepto durante la partida</label>
        <p class="controls">Teclas <kbd>1</kbd>–<kbd>8</kbd> defensas · clic en <span class="cu-inline">⬢ CU</span> para recoger · <kbd>Q</kbd> desmantelar · <kbd>Esc</kbd>/clic derecho cancelar · <kbd>P</kbd> pausa · <kbd>F</kbd> ×2 · <kbd>M</kbd> sonido</p>
      </div>`;
    this.menu.querySelectorAll<HTMLButtonElement>('.level').forEach((b) => {
      b.addEventListener('click', () => this.cb.onStart(b.dataset.mode as Mode));
    });
    this.menu.querySelectorAll<HTMLButtonElement>('.concept-link').forEach((b) => {
      b.addEventListener('click', () => {
        const details = this.menu.querySelector('details');
        const wasOpen = details?.open ?? false;
        this.showConcept(b.dataset.concept as ConceptId, {
          inGame: false,
          onClose: () => {
            this.show('menu');
            const d = this.menu.querySelector('details');
            if (d) d.open = wasOpen;
          },
        });
      });
    });
    this.menu.querySelector<HTMLInputElement>('[data-act="learn"]')?.addEventListener('change', (e) => {
      this.cb.setLearnEnabled((e.target as HTMLInputElement).checked);
    });
  }

  /* ---------- End screen: post-mortem or retrospective ---------- */

  showEnd(ctx: GameContext, newRecord: boolean): void {
    const win = ctx.status === 'victory';
    const spec = MODES[ctx.mode];
    const alive = ctx.lanesAlive.filter(Boolean).length;
    const services = ctx.mode !== 'monolith' ? `<div><span>Servicios en pie</span><b>${alive}/5</b></div>` : '';
    const nextMode = MODE_ORDER[MODE_ORDER.indexOf(ctx.mode) + 1];
    const nextBtn = nextMode ? `<button class="btn" data-act="next" type="button">Ir al Nivel ${MODES[nextMode].level}</button>` : '';
    const report = win ? this.retrospective(ctx) : this.postmortem(ctx);

    this.end.innerHTML = `
      <div class="panel medium ${win ? 'win' : 'lose'}">
        <p class="eyebrow">Nivel ${spec.level} · ${spec.name}</p>
        <h2>${win ? 'Sistema escalado' : 'SYSTEM DOWN'}</h2>
        ${newRecord ? '<p class="new-record">¡Nuevo récord!</p>' : ''}
        <div class="stats">
          <div><span>Ola</span><b>${ctx.wave.number}/${TOTAL_WAVES}</b></div>
          <div><span>Amenazas eliminadas</span><b>${ctx.kills}</b></div>
          <div><span>Uptime</span><b>${fmtTime(ctx.time)}</b></div>
          ${services}
        </div>
        ${report}
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
    this.end.scrollTop = 0;
  }

  private postmortem(ctx: GameContext): string {
    const last = ctx.incidents[ctx.incidents.length - 1];
    const level = levelLessonLoss(ctx.mode);
    if (!last) {
      return `<section class="report"><h3>Post-mortem</h3><p>${esc(ctx.endReason)}</p><p class="lesson"><b>Lección:</b> ${esc(level.text)} ${link(level.read)}</p></section>`;
    }
    const cause = CAUSES[last.cause];
    const timeline =
      ctx.incidents.length > 1
        ? `<h4>Cronología</h4><ol class="timeline">${ctx.incidents
            .map((i) => `<li><span>${fmtTime(i.time)}</span> ${esc(SERVICE_NAMES[i.lane])}: ${esc(describeIncident(i))} <em>${esc(CAUSES[i.cause].root)}</em></li>`)
            .join('')}</ol>`
        : '';
    return `
      <section class="report">
        <h3>Post-mortem</h3>
        <dl>
          <dt>Incidente</dt><dd>${esc(describeIncident(last))}</dd>
          <dt>Causa raíz</dt><dd>${esc(cause.root)}</dd>
          <dt>Qué habría ayudado</dt><dd>${esc(cause.help)}</dd>
          <dt>Lección</dt><dd>${esc(cause.lesson)} ${link(cause.read)}</dd>
          <dt>Arquitectura</dt><dd>${esc(level.text)} ${link(level.read)}</dd>
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
        <h3>Retrospectiva</h3>
        <dl>
          <dt>Lo que más usaste</dt><dd>${top.length ? esc(top.join(' · ')) : 'Ninguna defensa'}</dd>
          <dt>Servicios caídos</dt><dd>${lost}</dd>
          <dt>Lección</dt><dd>${esc(level.text)} ${link(level.read)}</dd>
        </dl>
      </section>`;
  }
}
