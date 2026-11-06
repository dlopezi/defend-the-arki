import { DEFENSE_ORDER, DEFENSES, LANES, SERVICE_NAMES, TOTAL_WAVES, type Tool } from '../config';
import type { GameContext } from '../game/GameContext';
import { drawDefense } from '../render/sprites';

export interface HudCallbacks {
  onSelect(tool: Tool): void;
  onPause(): void;
  onMenu(): void;
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

/** DOM HUD: Compute Units, defense cards, wave and architecture status. */
export class Hud {
  readonly root: HTMLElement;
  private readonly cuValue: HTMLElement;
  private readonly modeEl: HTMLElement;
  private readonly waveEl: HTMLElement;
  private readonly waveBar: HTMLElement;
  private readonly lanesEl: HTMLElement;
  private readonly pauseBtn: HTMLButtonElement;
  private readonly cards = new Map<Tool, CardRefs>();
  private lastCu = -1;

  constructor(cb: HudCallbacks) {
    this.root = el('header', 'hud');

    const cu = el('div', 'cu-box');
    cu.title = 'Compute Units: haz clic en los hexágonos CU para recogerlos';
    cu.append(el('span', 'cu-icon', '⬢'));
    this.cuValue = el('span', 'cu-value', '0');
    const cuText = el('div', 'cu-text');
    cuText.append(this.cuValue, el('span', 'cu-label', 'Compute Units'));
    cu.append(cuText);

    const cards = el('div', 'cards');
    for (const type of DEFENSE_ORDER) {
      const spec = DEFENSES[type];
      const card = el('button', 'card');
      card.type = 'button';
      card.title = `${spec.name} — ${spec.desc} (tecla ${spec.hotkey})`;
      card.style.setProperty('--accent', spec.color);
      const icon = el('canvas', 'card-icon');
      this.paintIcon(icon, type);
      const cd = el('span', 'card-cd');
      card.append(el('span', 'card-key', spec.hotkey), icon, el('span', 'card-name', spec.short), el('span', 'card-cost', `${spec.cost}`), cd);
      card.addEventListener('click', () => cb.onSelect(type));
      cards.append(card);
      this.cards.set(type, { el: card, cd });
    }
    const shovel = el('button', 'card card-shovel');
    shovel.type = 'button';
    shovel.title = 'Desmantelar una defensa (tecla Q)';
    shovel.style.setProperty('--accent', '#94a3b8');
    const sIcon = el('span', 'shovel-icon', '✕');
    shovel.append(el('span', 'card-key', 'Q'), sIcon, el('span', 'card-name', 'Desmantelar'), el('span', 'card-cost', '—'), el('span', 'card-cd'));
    shovel.addEventListener('click', () => cb.onSelect('shovel'));
    cards.append(shovel);
    this.cards.set('shovel', { el: shovel, cd: shovel.lastElementChild as HTMLElement });

    const status = el('div', 'status-box');
    this.modeEl = el('div', 'mode');
    this.waveEl = el('div', 'wave');
    const bar = el('div', 'wave-track');
    this.waveBar = el('div', 'wave-fill');
    bar.append(this.waveBar);
    this.lanesEl = el('div', 'lanes');
    for (let i = 0; i < LANES; i++) {
      const dot = el('span', 'lane-dot');
      dot.title = SERVICE_NAMES[i];
      this.lanesEl.append(dot);
    }
    status.append(this.modeEl, this.waveEl, bar, this.lanesEl);

    const actions = el('div', 'actions');
    this.pauseBtn = el('button', 'btn-small', 'Pausa');
    this.pauseBtn.type = 'button';
    this.pauseBtn.title = 'Pausa (P)';
    this.pauseBtn.addEventListener('click', () => cb.onPause());
    const menu = el('button', 'btn-small', 'Menú');
    menu.type = 'button';
    menu.addEventListener('click', () => cb.onMenu());
    actions.append(this.pauseBtn, menu);

    this.root.append(cu, cards, status, actions);
  }

  /** Small red pulse on a card that cannot be used now. */
  deny(tool: Tool): void {
    const c = this.cards.get(tool);
    if (!c) return;
    c.el.classList.remove('denied');
    void c.el.offsetWidth; // restart CSS animation
    c.el.classList.add('denied');
  }

  update(ctx: GameContext): void {
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

    this.modeEl.textContent = ctx.mode === 'monolith' ? 'Nivel 1 · Monolito' : 'Nivel 2 · Microservicios';
    this.modeEl.dataset.mode = ctx.mode;

    const w = ctx.wave;
    let text: string;
    let progress: number;
    if (w.phase === 'prep') {
      text = `Primera ola en ${Math.ceil(w.timer)} s`;
      progress = 0;
    } else if (w.phase === 'break') {
      text = `Ola ${w.number + 1}/${TOTAL_WAVES} en ${Math.ceil(w.timer)} s`;
      progress = w.number / TOTAL_WAVES;
    } else {
      text = `Ola ${w.number}/${TOTAL_WAVES}`;
      progress = (w.number - 1 + w.spawned / Math.max(1, w.total)) / TOTAL_WAVES;
    }
    this.waveEl.textContent = text;
    this.waveBar.style.width = `${Math.min(100, progress * 100)}%`;

    this.lanesEl.style.display = ctx.mode === 'microservices' ? '' : 'none';
    this.lanesEl.querySelectorAll<HTMLElement>('.lane-dot').forEach((d, i) => d.classList.toggle('down', !ctx.lanesAlive[i]));

    this.pauseBtn.textContent = ctx.status === 'paused' ? 'Seguir' : 'Pausa';
  }

  private paintIcon(canvas: HTMLCanvasElement, type: (typeof DEFENSE_ORDER)[number]): void {
    const size = 52;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const g = canvas.getContext('2d');
    if (!g) return;
    g.scale(dpr, dpr);
    g.translate(size / 2, size / 2 - 2);
    g.scale(0.6, 0.6);
    drawDefense(g, type, 0, 0, 1.2);
  }
}
