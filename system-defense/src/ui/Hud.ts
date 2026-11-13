import {
  DEFENSE_ORDER,
  DEFENSES,
  ENEMIES,
  LANES,
  laneName,
  MODES,
  REGIONS,
  SERVICE_NAMES,
  TOTAL_WAVES,
  type DefenseType,
  type EnemyType,
  type Mode,
  type Tool,
} from '../config';
import type { GameContext } from '../game/GameContext';
import { countByType } from '../game/waves';
import { onLangChange, t } from '../i18n';
import { drawDefense } from '../render/sprites';

export interface HudCallbacks {
  onSelect(tool: Tool): void;
  onPause(): void;
  onSpeed(): void;
  onMute(): void;
  onMenu(): void;
}

export interface HudExtras {
  speed: number;
  muted: boolean;
}

interface CardRefs {
  el: HTMLButtonElement;
  cd: HTMLElement;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
}

function button(cls: string, text: string, title: string, onClick: () => void): HTMLButtonElement {
  const b = el('button', cls, text);
  b.type = 'button';
  b.title = title;
  b.addEventListener('click', onClick);
  return b;
}

/**
 * DOM HUD.
 * Row 1: Compute Units, defense cards, action buttons.
 * Row 2 (strip): level, wave progress, wave preview, lane status.
 */
export class Hud {
  readonly root: HTMLElement;
  private readonly cuValue: HTMLElement;
  private readonly modeEl: HTMLElement;
  private readonly waveEl: HTMLElement;
  private readonly waveBar: HTMLElement;
  private readonly previewLabel: HTMLElement;
  private readonly previewList: HTMLElement;
  private readonly lanesEl: HTMLElement;
  private readonly pauseBtn: HTMLButtonElement;
  private readonly speedBtn: HTMLButtonElement;
  private readonly muteBtn: HTMLButtonElement;
  private readonly menuBtn: HTMLButtonElement;
  private readonly cuBox: HTMLElement;
  private readonly shovelName: HTMLElement;
  private readonly cards = new Map<Tool, CardRefs>();
  private lastCu = -1;
  private lastPreview = '';
  /** Level the lane dots are labeled for (names and grouping change with the level). */
  private lanesMode: Mode | null = null;

  constructor(cb: HudCallbacks) {
    this.root = el('div', 'hud-wrap');
    const hud = el('header', 'hud');

    const cu = el('div', 'cu-box');
    this.cuBox = cu;
    cu.append(el('span', 'cu-icon', '⬢'));
    this.cuValue = el('span', 'cu-value', '0');
    const cuText = el('div', 'cu-text');
    cuText.append(this.cuValue, el('span', 'cu-label', 'Compute Units'));
    cu.append(cuText);

    const cards = el('div', 'cards');
    for (const type of DEFENSE_ORDER) {
      const spec = DEFENSES[type];
      const card = button('card', '', '', () => cb.onSelect(type));
      card.style.setProperty('--accent', spec.color);
      const icon = el('canvas', 'card-icon');
      this.paintIcon(icon, type);
      const cd = el('span', 'card-cd');
      card.append(el('span', 'card-key', spec.hotkey), icon, el('span', 'card-name', spec.short), el('span', 'card-cost', `${spec.cost}`), cd);
      cards.append(card);
      this.cards.set(type, { el: card, cd });
    }
    const shovel = button('card card-shovel', '', '', () => cb.onSelect('shovel'));
    shovel.style.setProperty('--accent', '#94a3b8');
    const shovelCd = el('span', 'card-cd');
    this.shovelName = el('span', 'card-name');
    shovel.append(el('span', 'card-key', 'Q'), el('span', 'shovel-icon', '✕'), this.shovelName, el('span', 'card-cost', '—'), shovelCd);
    cards.append(shovel);
    this.cards.set('shovel', { el: shovel, cd: shovelCd });

    const actions = el('div', 'actions');
    this.pauseBtn = button('btn-small', '', '', () => cb.onPause());
    this.speedBtn = button('btn-small', '×2', '', () => cb.onSpeed());
    this.muteBtn = button('btn-small', '🔊', '', () => cb.onMute());
    this.menuBtn = button('btn-small', '', '', () => cb.onMenu());
    actions.append(this.pauseBtn, this.speedBtn, this.muteBtn, this.menuBtn);

    hud.append(cu, cards, actions);

    const strip = el('div', 'strip');
    this.modeEl = el('div', 'mode');
    this.waveEl = el('div', 'wave');
    const bar = el('div', 'wave-track');
    this.waveBar = el('div', 'wave-fill');
    bar.append(this.waveBar);
    const preview = el('div', 'preview');
    this.previewLabel = el('span', 'preview-label');
    this.previewList = el('span', 'preview-list');
    preview.append(this.previewLabel, this.previewList);
    this.lanesEl = el('div', 'lanes');
    for (let i = 0; i < LANES; i++) {
      const dot = el('span', 'lane-dot');
      dot.title = SERVICE_NAMES[i];
      this.lanesEl.append(dot);
    }
    strip.append(this.modeEl, this.waveEl, bar, preview, this.lanesEl);

    this.root.append(hud, strip);
    this.relabel();
    onLangChange(() => this.relabel());
  }

  /** Fixed labels and tooltips, in the current language. */
  private relabel(): void {
    this.cuBox.title = t('Compute Units: click the CU hexagons to collect them', 'Compute Units: haz clic en los hexágonos CU para recogerlos');
    for (const type of DEFENSE_ORDER) {
      const spec = DEFENSES[type];
      const card = this.cards.get(type);
      if (card) card.el.title = `${spec.name} — ${spec.desc} (${t('key', 'tecla')} ${spec.hotkey})`;
    }
    const shovel = this.cards.get('shovel');
    if (shovel) shovel.el.title = t('Dismantle a defense (key Q)', 'Desmantelar una defensa (tecla Q)');
    this.shovelName.textContent = t('Dismantle', 'Desmantelar');
    this.pauseBtn.title = t('Pause (P)', 'Pausa (P)');
    this.speedBtn.title = t('Double speed (F)', 'Velocidad doble (F)');
    this.muteBtn.title = t('Sound (M)', 'Sonido (M)');
    this.menuBtn.textContent = t('Menu', 'Menú');
    this.menuBtn.title = t('Back to the menu', 'Volver al menú');
    this.lastPreview = '';
  }

  /** Small red shake on a card that cannot be used now. */
  deny(tool: Tool): void {
    const c = this.cards.get(tool);
    if (!c) return;
    c.el.classList.remove('denied');
    void c.el.offsetWidth; // restart CSS animation
    c.el.classList.add('denied');
  }

  update(ctx: GameContext, extras: HudExtras): void {
    const cu = Math.floor(ctx.cu);
    if (cu !== this.lastCu) {
      this.cuValue.textContent = String(cu);
      this.lastCu = cu;
    }

    for (const type of DEFENSE_ORDER) {
      const spec = DEFENSES[type];
      const ref = this.cards.get(type);
      if (!ref) continue;
      const cd = ctx.cooldowns[type];
      ref.cd.style.height = `${(cd / spec.cooldown) * 100}%`;
      ref.el.classList.toggle('poor', ctx.cu < spec.cost);
      ref.el.classList.toggle('cooling', cd > 0);
      ref.el.classList.toggle('selected', ctx.selected === type);
    }
    this.cards.get('shovel')?.el.classList.toggle('selected', ctx.selected === 'shovel');

    const mode = MODES[ctx.mode];
    this.modeEl.textContent = `${t('Level', 'Nivel')} ${mode.level} · ${mode.name}`;
    this.modeEl.style.color = mode.color;

    const w = ctx.wave;
    let text: string;
    let progress: number;
    let previewQueue = w.next.queue;
    let previewLabel = t('Next wave:', 'Próxima ola:');
    if (w.phase === 'prep') {
      text = t(`Wave 1/${TOTAL_WAVES} in ${Math.ceil(w.timer)} s`, `Ola 1/${TOTAL_WAVES} en ${Math.ceil(w.timer)} s`);
      progress = 0;
    } else if (w.phase === 'break') {
      text = t(`Wave ${w.number + 1}/${TOTAL_WAVES} in ${Math.ceil(w.timer)} s`, `Ola ${w.number + 1}/${TOTAL_WAVES} en ${Math.ceil(w.timer)} s`);
      progress = w.number / TOTAL_WAVES;
    } else {
      text = `${t('Wave', 'Ola')} ${w.number}/${TOTAL_WAVES}`;
      progress = (w.number - 1 + w.spawned / Math.max(1, w.total)) / TOTAL_WAVES;
      previewQueue = w.queue.slice(w.spawned);
      previewLabel = previewQueue.length > 0 ? t('Coming:', 'Por llegar:') : t('Wave in progress', 'Ola en curso');
    }
    this.waveEl.textContent = text;
    this.waveBar.style.width = `${Math.min(100, progress * 100)}%`;
    this.renderPreview(previewLabel, previewQueue);

    const showLanes = ctx.mode !== 'monolith';
    this.lanesEl.style.display = showLanes ? '' : 'none';
    const dots = this.lanesEl.querySelectorAll<HTMLElement>('.lane-dot');
    if (this.lanesMode !== ctx.mode) {
      // Multi-region: region names and a gap between the regions (3 + 2)
      this.lanesMode = ctx.mode;
      const regionEnds = REGIONS.slice(0, -1).map((r) => r.lanes[r.lanes.length - 1]);
      dots.forEach((d, i) => {
        d.title = laneName(ctx.mode, i);
        d.classList.toggle('region-end', ctx.mode === 'multiRegion' && regionEnds.includes(i));
      });
    }
    dots.forEach((d, i) => {
      const restarting = !ctx.lanesAlive[i] && ctx.laneRestart[i] > 0;
      d.classList.toggle('down', !ctx.lanesAlive[i] && !restarting);
      d.classList.toggle('restarting', restarting);
    });

    this.pauseBtn.textContent = ctx.status === 'paused' ? t('Resume', 'Seguir') : t('Pause', 'Pausa');
    this.speedBtn.classList.toggle('active', extras.speed > 1);
    this.muteBtn.textContent = extras.muted ? '🔇' : '🔊';
  }

  private renderPreview(label: string, queue: readonly EnemyType[]): void {
    const key = label + queue.join(',');
    if (key === this.lastPreview) return;
    this.lastPreview = key;
    this.previewLabel.textContent = label;
    this.previewList.replaceChildren();
    for (const { type, count } of countByType(queue)) {
      const spec = ENEMIES[type];
      const chip = el('span', 'chip', `${count}× ${spec.tag}`);
      chip.style.setProperty('--chip', spec.color);
      chip.title = `${spec.name}: ${spec.desc}`;
      this.previewList.append(chip);
    }
  }

  private paintIcon(canvas: HTMLCanvasElement, type: DefenseType): void {
    const size = 44;
    const dpr = window.devicePixelRatio || 1;
    // The CSS size is set in style.css (smaller on phones in landscape).
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const g = canvas.getContext('2d');
    if (!g) return;
    g.scale(dpr, dpr);
    g.translate(size / 2, size / 2 - 2);
    g.scale(0.5, 0.5);
    drawDefense(g, type, 0, 0, 1.2);
  }
}
