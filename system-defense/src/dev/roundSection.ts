import { CELL_H, ENEMIES } from '../config';
import { drawEnemy } from '../render/sprites';
import type { AvatarThreat, G } from './avatarOptions';
import { drawLane, setupCanvas, sizeOf } from './pageKit';
import type { ProtoState } from './proto/rig';
import type { Body2 } from './round2Options';

/*
 * Generic "round" section of the avatar picker page: groups of rows, one row per threat,
 * each row with options to click. Picks are saved in localStorage under `key`.
 * Used by round 2 and round 3.
 */

export type ViewKind = { kind: 'current' } | { kind: 'body'; body: Body2; botlet?: Body2 };
export interface RoundOption {
  id: string;
  /** Text on the card (plain text). */
  label: string;
  /** Short text for the bottom bar. */
  short: string;
  what: ViewKind;
  /** Small card inside the info column ("Mantener actual"). */
  small?: boolean;
}
export interface RoundRow {
  type: AvatarThreat;
  options: RoundOption[];
  featured?: boolean;
  extra?: string;
  /** Two big options that fill the row (no empty column). */
  pair?: boolean;
}
export interface RoundGroup {
  title: string;
  note?: string;
  rows: RoundRow[];
  /** Small cards side by side, no comment box (for approved threats). */
  compact?: boolean;
}
export interface RoundConfig {
  key: string;
  tag: string;
  title: string;
  intro: string;
  /** Prefix for the bar and the copied text, e.g. "Ronda 3". */
  name: string;
  groups: RoundGroup[];
  /** Picks used the first time (nothing saved yet). */
  defaults?: Partial<Record<AvatarThreat, string>>;
}
export interface RoundSection {
  draw(t: number): void;
  clear(): void;
  summary(): string;
  copyText(): string;
}

type Picks = Partial<Record<AvatarThreat, string>>;

const css = `
.round { margin: 14px 0 22px; padding: 14px; background: var(--panel); border: 1px solid #38bdf8; border-radius: 14px; }
.round .round-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
.round .round-head h2 { margin: 2px 0 4px; font: 800 18px var(--mono); }
.round .round-head p { margin: 0; font-size: 13px; color: #cbd5e1; max-width: 680px; }
.round .tag { font: 700 10px var(--mono); text-transform: uppercase; letter-spacing: .08em; color: #38bdf8; }
.round h3 { margin: 16px 0 2px; font: 800 14px var(--mono); color: #e2e8f0; }
.round .gnote { margin: 0 0 8px; font-size: 12px; color: var(--muted); }
.round .row { background: var(--panel2); }
.round .row .opt { background: var(--panel); }
.round .row.two { grid-template-columns: 190px repeat(2, 1fr) 1fr; }
.round .row.pair { grid-template-columns: 190px repeat(2, 1fr); }
.round .minis { display: flex; gap: 10px; flex-wrap: wrap; }
.round .mini { display: flex; flex-direction: column; gap: 6px; width: 200px; padding: 10px; background: var(--panel2); border: 1px solid var(--line); border-radius: 12px; }
.round .mini strong { font-size: 14px; }
.round .note { width: 100%; min-height: 46px; resize: vertical; padding: 6px 8px; font: 12px/1.35 system-ui, sans-serif; color: var(--text); background: #070b17; border: 1px solid var(--line); border-radius: 8px; }
.round .note:focus { outline: none; border-color: #38bdf8; }
.round .note.general { min-height: 40px; margin: 0 0 4px; }
.round .general-label { display: block; margin: 0 0 4px; font: 700 12px var(--mono); color: #cbd5e1; }
@media (max-width: 820px) { .round .row.two, .round .row.pair { grid-template-columns: 1fr 1fr; } }
`;
let cssAdded = false;

/** Adds the shared round styles once (also used by the defense section). */
export function ensureRoundCss(): void {
  if (cssAdded) return;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  cssAdded = true;
}

/** Attack pulse: quick push (0 → 1), slower return. */
function attackPulse(t: number): number {
  const p = (t % 0.9) / 0.9;
  return p < 0.25 ? p / 0.25 : Math.max(0, 1 - (p - 0.25) / 0.5);
}

/** Draws a body like the game: shadow, walking bob, lean when attacking. */
export function drawBody2(g: G, body: Body2, x: number, y: number, w: number, h: number, t: number, scale: number, state: ProtoState): void {
  const walking = state === 'walk';
  const step = walking ? Math.sin(t * 9 + x * 0.13) : 0;
  const atk = walking ? 0 : attackPulse(t);
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath();
  g.ellipse(0, h / 2 + 2, w * 0.45, 6, 0, 0, Math.PI * 2);
  g.fill();
  g.translate(0, step * 2);
  g.translate(0, h / 2);
  g.rotate(-0.08 * atk);
  g.translate(0, -h / 2);
  body(g, { w, h, t, step, atk });
  g.restore();
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

interface View {
  type: AvatarThreat;
  what: ViewKind;
  g: G;
  W: number;
  H: number;
}

export function mountRoundSection(container: HTMLElement, cfg: RoundConfig, onChange: () => void): RoundSection {
  ensureRoundCss();

  let picks: Picks;
  try {
    const raw = localStorage.getItem(cfg.key);
    picks = raw === null ? { ...cfg.defaults } : (JSON.parse(raw) as Picks);
  } catch {
    picks = { ...cfg.defaults };
  }
  const save = (): void => {
    try {
      localStorage.setItem(cfg.key, JSON.stringify(picks));
    } catch {
      /* ignore */
    }
  };

  // Comments per threat ("_general" = for the whole round). Kept when picks are cleared.
  const notesKey = `${cfg.key}:notes`;
  let notes: Record<string, string> = {};
  try {
    notes = JSON.parse(localStorage.getItem(notesKey) ?? '{}') as Record<string, string>;
  } catch {
    notes = {};
  }
  const saveNotes = (): void => {
    try {
      localStorage.setItem(notesKey, JSON.stringify(notes));
    } catch {
      /* ignore */
    }
  };
  const noteBox = (id: string, placeholder: string, extraClass = ''): HTMLTextAreaElement => {
    const ta = document.createElement('textarea');
    ta.className = `note${extraClass}`;
    ta.placeholder = placeholder;
    ta.value = notes[id] ?? '';
    ta.addEventListener('input', () => {
      const v = ta.value.trim();
      if (v) notes[id] = ta.value;
      else delete notes[id];
      saveNotes();
      onChange();
    });
    return ta;
  };

  const rows = cfg.groups.flatMap((gr) => gr.rows);
  const order = rows.map((r) => r.type);
  let anim: ProtoState = 'walk';
  const views: View[] = [];
  const buttons = new Map<AvatarThreat, { id: string; btn: HTMLButtonElement }[]>();

  const section = document.createElement('section');
  section.className = 'round';
  section.innerHTML = `
    <div class="round-head">
      <div>
        <span class="tag">${cfg.tag}</span>
        <h2>${cfg.title}</h2>
        <p>${cfg.intro}</p>
      </div>
      <div class="seg" data-group="anim"><button data-v="walk" class="active" type="button">Caminar</button><button data-v="attack" type="button">Atacar</button></div>
    </div>`;
  container.append(section);
  const gl = document.createElement('label');
  gl.className = 'general-label';
  gl.textContent = 'Comentario general';
  gl.append(noteBox('_general', 'Notas para todos los personajes (ej.: "más colores", "todos más pequeños"…)', ' general'));
  section.append(gl);

  section.querySelectorAll<HTMLButtonElement>('.seg button').forEach((b) => {
    b.addEventListener('click', () => {
      section.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('active', x === b));
      anim = b.dataset.v as ProtoState;
    });
  });

  const choose = (type: AvatarThreat, id: string): void => {
    const off = picks[type] === id;
    if (off) delete picks[type];
    else picks[type] = id;
    save();
    buttons.get(type)?.forEach((x) => x.btn.classList.toggle('chosen', !off && x.id === id));
    onChange();
  };

  const makeOpt = (type: AvatarThreat, o: RoundOption): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `opt${o.small ? ' current' : ''}${picks[type] === o.id ? ' chosen' : ''}`;
    const title = /^[ABC]$/.test(o.id) ? `<b>${o.id}</b> · ${esc(o.label)}` : esc(o.label);
    b.innerHTML = `<span class="label"><span>${title}</span><span class="check">✓${o.small ? '' : ' Elegida'}</span></span>`;
    const c = document.createElement('canvas');
    b.append(c);
    b.addEventListener('click', () => choose(type, o.id));
    const list = buttons.get(type) ?? [];
    list.push({ id: o.id, btn: b });
    buttons.set(type, list);
    const [W, H] = o.small ? [160, 110] : [240, 180];
    views.push({ type, what: o.what, g: setupCanvas(c, W, H), W, H });
    return b;
  };

  for (const gr of cfg.groups) {
    const h = document.createElement('h3');
    h.textContent = gr.title;
    section.append(h);
    if (gr.note) {
      const n = document.createElement('p');
      n.className = 'gnote';
      n.textContent = gr.note;
      section.append(n);
    }
    if (gr.compact) {
      // Approved threats: one small card each, side by side.
      const strip = document.createElement('div');
      strip.className = 'minis';
      for (const r of gr.rows) {
        const spec = ENEMIES[r.type];
        const card = document.createElement('div');
        card.className = 'mini';
        card.innerHTML = `<strong style="color:${spec.color}">${spec.name}</strong>`;
        for (const o of r.options) card.append(makeOpt(r.type, { ...o, small: true }));
        strip.append(card);
      }
      section.append(strip);
      continue;
    }
    for (const r of gr.rows) {
      const spec = ENEMIES[r.type];
      const big = r.options.filter((o) => !o.small);
      const row = document.createElement('div');
      row.className = `row${r.featured ? ' featured' : ''}${r.pair ? ' pair' : big.length === 2 ? ' two' : ''}`;
      const info = document.createElement('div');
      info.className = 'info';
      info.innerHTML = `<strong style="color:${spec.color}">${spec.name}</strong><span class="desc">${spec.desc}${r.extra ?? ''}</span>`;
      info.append(noteBox(r.type, 'Comentario…'));
      for (const o of r.options) if (o.small) info.append(makeOpt(r.type, o));
      row.append(info);
      for (const o of big) row.append(makeOpt(r.type, o));
      section.append(row);
    }
  }

  const optOf = (t: AvatarThreat): RoundOption | undefined => rows.find((r) => r.type === t)?.options.find((o) => o.id === picks[t]);

  return {
    summary() {
      const n = order.filter((t) => picks[t]).length;
      const c = Object.keys(notes).length;
      return `${cfg.name} · Elegidas ${n}/${order.length}${c ? ` · ${c} comentario${c > 1 ? 's' : ''}` : ''} · ${order.map((t) => `${ENEMIES[t].tag}:${optOf(t)?.short ?? '—'}`).join(' ')}`;
    },
    copyText() {
      const q = (v: string): string => `"${v.trim().replace(/\s+/g, ' ')}"`;
      const lines = order.map((t) => {
        const o = optOf(t);
        const pick = o ? (/^[ABC]$/.test(o.id) ? `${o.id} (${o.label})` : o.label) : '—';
        return `- ${ENEMIES[t].name}=${pick}${notes[t] ? ` — ${q(notes[t])}` : ''}`;
      });
      const general = notes._general ? [`Comentario general: ${q(notes._general)}`] : [];
      return [`${cfg.name} · Avatares:`, ...general, ...lines].join('\n');
    },
    clear() {
      picks = {};
      save();
      buttons.forEach((list) => list.forEach((x) => x.btn.classList.remove('chosen')));
    },
    draw(t: number) {
      for (const v of views) {
        const { g, W, H, type } = v;
        drawLane(g, W, H, t);
        const { w, h } = sizeOf(type, t);
        const scale = Math.min(1.5, (H - 40) / Math.max(ENEMIES[type].height * (type === 'memoryLeak' ? 1.9 : 1), CELL_H * 0.5));
        const groundY = H - 24;
        const cx = type === 'botnet' ? W * 0.4 : W / 2;
        const y = groundY - (h / 2) * scale;
        if (v.what.kind === 'current') {
          g.save();
          g.translate(cx, y);
          g.scale(scale, scale);
          drawEnemy(g, type, 0, 0, w, h, t, { flash: 0, slowed: false, state: anim, jumpHeight: 0 });
          g.restore();
          continue;
        }
        drawBody2(g, v.what.body, cx, y, w, h, t, scale, anim);
        if (type === 'botnet' && v.what.botlet) {
          const b = ENEMIES.botlet;
          for (let i = 0; i < 2; i++) {
            const bx = cx + (w / 2 + 22 + i * 30) * scale;
            drawBody2(g, v.what.botlet, bx, groundY - (b.height / 2) * scale, b.width, b.height, t + i, scale, anim);
          }
        }
      }
    },
  };
}
