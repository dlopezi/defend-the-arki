import { DEFENSES, DEFENSE_ORDER, ENEMIES } from '../config';
import { attackPulse } from '../render/enemyArt';
import { drawCU, drawDefense, drawEnemy, drawProjectile, drawRollback } from '../render/sprites';
import type { G, Pick } from './avatarOptions';
import { DEF_OPTIONS, type DefAnim, type DefBody, type DefItem } from './defenseOptions';
import { DEF_OPTIONS_R2 } from './defenseOptions2';
import { DEF_OPTIONS_R3 } from './defenseOptions3';
import { CONCEPTS } from '../learn/concepts';
import { drawLane, setupCanvas } from './pageKit';
import { ensureRoundCss, type RoundSection } from './roundSection';

/*
 * Defense rounds of the avatar picker page: for each defense, "Mantener actual" + 3 new options.
 * Two views: Reposo (idle) and Acción (fires, makes CU, explodes, catches, sweeps),
 * with a Tráfico Normal on the right so the action reads clearly.
 * Rounds with `versions` also show the upgraded look (v1 / v2 / both side by side).
 */

const PICKS: Pick[] = ['A', 'B', 'C'];
const ORDER: DefItem[] = [...DEFENSE_ORDER, 'rollback'];
type Choice = Pick | 'keep';
type Picks = Partial<Record<DefItem, Choice>>;
type Version = 'v1' | 'v2' | 'both';
type Options = Record<DefItem, Record<Pick, { name: string; body: DefBody; ref?: string }>>;
/** The design the user liked, shown in the small card instead of "Mantener actual". */
type Base = { label: string; body: DefBody; noV2?: boolean };

interface DefRoundConfig {
  key: string;
  name: string;
  tag: string;
  title: string;
  intro: string;
  options: Options;
  versions: boolean;
  bases?: Partial<Record<DefItem, Base>>;
  /** Show the real-world line ("En la vida real") in the info column. */
  realLife?: boolean;
}

const INFO: Record<DefItem, { name: string; short: string; color: string; desc: string; upgrade: string | null }> = {
  ...(Object.fromEntries(
    DEFENSE_ORDER.map((d) => [d, { name: DEFENSES[d].name, short: DEFENSES[d].short, color: DEFENSES[d].color, desc: DEFENSES[d].desc, upgrade: DEFENSES[d].upgrade }]),
  ) as Record<(typeof DEFENSE_ORDER)[number], { name: string; short: string; color: string; desc: string; upgrade: string | null }>),
  rollback: { name: 'Rollback', short: 'Rollback', color: '#22d3ee', desc: 'Barre su carril una vez cuando una amenaza llega a la base (niveles 2 y 3)', upgrade: null },
};
const hasV2 = (item: DefItem): boolean => INFO[item].upgrade !== null;

const P = 1.6;
const SHOOTERS: DefItem[] = ['loadBalancer', 'rateLimiter', 'cdn'];
const WALLS: DefItem[] = ['redis', 'waf'];

interface View {
  item: DefItem;
  body: DefBody | null;
  /** This drawing has no v2 look (shown as v1 only). */
  noV2?: boolean;
  g: G;
  W: number;
  H: number;
}

/** Normal threat, drawn in local units (ground at y = 0). */
function threat(g: G, x: number, t: number, state: 'walk' | 'attack', extra: { flash?: number; slowed?: boolean; held?: number } = {}): void {
  const s = ENEMIES.normal;
  drawEnemy(g, 'normal', x, -s.height / 2 - 2, s.width, s.height, t, { flash: extra.flash ?? 0, slowed: extra.slowed ?? false, state, jumpHeight: 0, held: extra.held });
}

/** Animation state of the defense itself (no threat, no projectiles). */
function animFor(item: DefItem, t: number, action: boolean, level: 1 | 2): DefAnim {
  const p = (t % P) / P;
  const a: DefAnim = { t, action, kick: 0, charge: (t * 0.3) % 1, hp: 1, ready: 1, busy: false, level };
  if (!action) return a;
  if (item === 'worker') a.charge = p;
  else if (SHOOTERS.includes(item)) a.kick = p < 0.12 ? 1 - p / 0.12 : 0;
  else if (WALLS.includes(item)) {
    a.kick = attackPulse(t + 1) > 0.85 ? 1 : 0;
    a.hp = 1 - ((t * 0.12) % 1);
  } else if (item === 'circuitBreaker' && p < 0.65) a.fuse = 1 - p / 0.65;
  else if (item === 'kafka') {
    a.busy = true;
    a.ready = 0;
  }
  return a;
}

/** Full scene: the defense acting on a Tráfico Normal. Local units, ground at y = 0. */
function fullScene(g: G, LW: number, item: DefItem, body: DefBody | null, t: number, action: boolean, level: 1 | 2): void {
  const defX = 46;
  const p = (t % P) / P;
  const a = animFor(item, t, action, level);
  let defY = item === 'rollback' ? -20 : -35;
  let hideDef = false;
  const after: (() => void)[] = [];

  if (action) {
    if (item === 'worker') {
      if (p < 0.5) {
        after.push(() => drawCU(g, defX + 50, -46 - p * 30, 25, t, 1 - p / 0.5));
        // v2 makes double CU
        if (level === 2) after.push(() => drawCU(g, defX + 78, -40 - p * 30, 25, t + 0.3, 1 - p / 0.5));
      }
    } else if (SHOOTERS.includes(item)) {
      const ex = LW - 30;
      const k = Math.min(1, p / 0.75);
      const hit = p > 0.75 && p < 0.9;
      threat(g, ex, t, 'walk', { flash: hit ? 0.08 : 0, slowed: item === 'rateLimiter' });
      if (p < 0.75) {
        const x0 = defX + 40;
        const px = x0 + (ex - 24 - x0) * k;
        after.push(() => {
          drawProjectile(g, px, -39, item === 'rateLimiter');
          // v2 of LB and Rate Limiter fires 2 packets
          if (level === 2 && item !== 'cdn' && px - 34 > x0) drawProjectile(g, px - 34, -39, item === 'rateLimiter');
          if (item === 'cdn') {
            // the other 2 lanes (above and below)
            g.globalAlpha = 1 - k;
            drawProjectile(g, px, -39 - k * 40, false);
            drawProjectile(g, px, -39 + k * 40, false);
            g.globalAlpha = 1;
          }
        });
      }
    } else if (WALLS.includes(item)) {
      after.push(() => threat(g, defX + 56, t, 'attack'));
    } else if (item === 'circuitBreaker') {
      const ex = defX + 80;
      if (p < 0.65) threat(g, ex, t, 'walk');
      else {
        hideDef = true;
        const k = (p - 0.65) / 0.35;
        if (k < 0.25) threat(g, ex, t, 'walk', { flash: 0.1 });
        after.push(() => {
          g.globalAlpha = 1 - k;
          g.fillStyle = '#fde047';
          g.beginPath();
          g.arc(defX, -35, 20 + k * 90, 0, Math.PI * 2);
          g.fill();
          g.globalAlpha = 1;
        });
      }
    } else if (item === 'kafka') {
      // shifted right so the defense stays visible in the preview
      after.push(() => threat(g, defX + 34, t, 'walk', { held: 1 - p }));
    } else if (item === 'rollback') {
      const ex = LW * 0.68;
      const rx = defX + (LW + 20 - defX) * p;
      if (rx < ex - 10) threat(g, ex, t, 'walk');
      defY = -20;
      if (body) {
        // trail behind the sweep (the current one draws its own)
        const grad = g.createLinearGradient(rx - 90, 0, rx, 0);
        grad.addColorStop(0, 'rgba(34,211,238,0)');
        grad.addColorStop(1, 'rgba(34,211,238,0.45)');
        g.fillStyle = grad;
        g.fillRect(rx - 90, -60, 90, 80);
      }
      drawItem(g, body, item, rx, defY, a, true);
      return;
    }
  }
  if (!hideDef) drawItem(g, body, item, defX, defY, a, false);
  after.forEach((f) => f());
}

function drawItem(g: G, body: DefBody | null, item: DefItem, x: number, y: number, a: DefAnim, running: boolean): void {
  if (item === 'rollback') {
    if (!body) {
      drawRollback(g, x, y, running, a.t);
      return;
    }
    g.save();
    g.translate(x, y);
    body(g, a);
    g.restore();
    return;
  }
  if (!body) {
    drawDefense(g, item, x, y, a.t, { charge: a.charge, fuse: a.fuse, hpRatio: a.hp, trapReady: a.ready, trapBusy: a.busy, level: a.level });
    return;
  }
  g.save();
  g.translate(x, y);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath();
  g.ellipse(0, 37, 30, 6, 0, 0, Math.PI * 2);
  g.fill();
  body(g, a);
  g.restore();
}

function caption(g: G, s: string, x: number, y: number, color: string): void {
  g.font = '800 11px ui-monospace, Menlo, monospace';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(s, x, y);
}

function drawScene(v: View, t: number, action: boolean, version: Version): void {
  const { g, W, H, item, body } = v;
  drawLane(g, W, H, t);
  const v2ok = hasV2(item) && !v.noV2;
  const both = version === 'both' && v2ok;
  const s = Math.min(both ? 1.3 : 1.5, (H - 34) / 88);
  const LW = W / s;
  g.save();
  g.translate(0, H - 18);
  g.scale(s, s);
  if (both) {
    // v1 and v2 side by side: the defenses only, no threat
    const xs = [LW * 0.27, LW * 0.74];
    xs.forEach((x, i) => {
      const a = animFor(item, t, action, i === 0 ? 1 : 2);
      const y = item === 'rollback' ? -20 : -35;
      drawItem(g, body, item, x, y, a, false);
    });
    g.restore();
    caption(g, 'v1', xs[0] * s, H - 8, '#94a3b8');
    caption(g, 'v2', xs[1] * s, H - 8, '#facc15');
    return;
  }
  const level = version === 'v2' && v2ok ? 2 : 1;
  fullScene(g, LW, item, body, t, action, level);
  g.restore();
  if (version !== 'v1' && !v2ok) caption(g, hasV2(item) ? 'solo v1' : 'sin mejora en el juego', W / 2, 12, '#94a3b8');
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const css = `.round .opt .ref { font-size: 11px; line-height: 1.35; color: var(--muted); }`;
let cssAdded = false;

function mountDefenseRound(container: HTMLElement, cfg: DefRoundConfig, onChange: () => void): RoundSection {
  ensureRoundCss();
  if (!cssAdded) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.append(style);
    cssAdded = true;
  }
  let picks: Picks = {};
  try {
    picks = JSON.parse(localStorage.getItem(cfg.key) ?? '{}') as Picks;
  } catch {
    picks = {};
  }
  const save = (): void => {
    try {
      localStorage.setItem(cfg.key, JSON.stringify(picks));
    } catch {
      /* ignore */
    }
  };
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
      if (ta.value.trim()) notes[id] = ta.value;
      else delete notes[id];
      saveNotes();
      onChange();
    });
    return ta;
  };

  let action = false;
  let version: Version = cfg.versions ? 'both' : 'v1';
  const views: View[] = [];
  const buttons = new Map<DefItem, { id: Choice; btn: HTMLButtonElement }[]>();

  const section = document.createElement('section');
  section.className = 'round';
  const versionSeg = cfg.versions
    ? '<div class="seg" data-group="version"><button data-v="v1" type="button">v1</button><button data-v="v2" type="button">v2</button><button data-v="both" class="active" type="button">Ambas</button></div>'
    : '';
  section.innerHTML = `
    <div class="round-head">
      <div>
        <span class="tag">${cfg.tag}</span>
        <h2>${cfg.title}</h2>
        <p>${cfg.intro}</p>
      </div>
      <div class="segs" style="display:flex;gap:8px;flex-wrap:wrap">
        <div class="seg" data-group="anim"><button data-v="idle" class="active" type="button">Reposo</button><button data-v="action" type="button">Acción</button></div>
        ${versionSeg}
      </div>
    </div>`;
  container.append(section);
  const gl = document.createElement('label');
  gl.className = 'general-label';
  gl.textContent = 'Comentario general';
  gl.append(noteBox('_general', 'Notas para todas las defensas (ej.: "más grandes", "v2 más brillante"…)', ' general'));
  section.append(gl);
  section.querySelectorAll<HTMLElement>('.seg').forEach((seg) => {
    seg.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
      b.addEventListener('click', () => {
        seg.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
        if (seg.dataset.group === 'anim') action = b.dataset.v === 'action';
        else version = b.dataset.v as Version;
      });
    });
  });

  const choose = (item: DefItem, id: Choice): void => {
    const off = picks[item] === id;
    if (off) delete picks[item];
    else picks[item] = id;
    save();
    buttons.get(item)?.forEach((x) => x.btn.classList.toggle('chosen', !off && x.id === id));
    onChange();
  };
  const makeOpt = (item: DefItem, id: Choice, label: string, body: DefBody | null, small: boolean, ref?: string, noV2?: boolean): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `opt${small ? ' current' : ''}${picks[item] === id ? ' chosen' : ''}`;
    const title = id === 'keep' ? esc(label) : `<b>${id}</b> · ${esc(label)}`;
    b.innerHTML = `<span class="label"><span>${title}</span><span class="check">✓${small ? '' : ' Elegida'}</span></span>${ref ? `<span class="ref">${esc(ref)}</span>` : ''}`;
    const c = document.createElement('canvas');
    b.append(c);
    b.addEventListener('click', () => choose(item, id));
    const list = buttons.get(item) ?? [];
    list.push({ id, btn: b });
    buttons.set(item, list);
    const [W, H] = small ? [160, 110] : [240, 180];
    views.push({ item, body, noV2, g: setupCanvas(c, W, H), W, H });
    return b;
  };

  for (const item of ORDER) {
    const info = INFO[item];
    const row = document.createElement('div');
    row.className = 'row';
    const col = document.createElement('div');
    col.className = 'info';
    const up = cfg.versions ? (info.upgrade ? `<span class="desc"><b style="color:#facc15">v2:</b> ${esc(info.upgrade)}</span>` : '<span class="desc">Sin v2 en el juego.</span>') : '';
    const real = cfg.realLife ? `<span class="desc"><b style="color:#e2e8f0">Vida real:</b> ${esc(CONCEPTS[item].real.split('. ')[0].replace(/\.$/, ''))}.</span>` : '';
    col.innerHTML = `<strong style="color:${info.color}">${info.name}</strong><span class="desc">${info.desc}</span>${up}${real}`;
    col.append(noteBox(item, 'Comentario…'));
    const base = cfg.bases?.[item];
    col.append(makeOpt(item, 'keep', base ? `Tu base: ${base.label}` : 'Mantener actual', base?.body ?? null, true, undefined, base?.noV2));
    row.append(col);
    for (const p of PICKS) row.append(makeOpt(item, p, cfg.options[item][p].name, cfg.options[item][p].body, false, cfg.options[item][p].ref));
    section.append(row);
  }

  const label = (item: DefItem): string | undefined => {
    const c = picks[item];
    if (!c) return undefined;
    if (c === 'keep') return cfg.bases?.[item] ? `Base (${cfg.bases[item]?.label})` : 'Mantener actual';
    return `${c} (${cfg.options[item][c].name})`;
  };

  return {
    summary() {
      const n = ORDER.filter((i) => picks[i]).length;
      const c = Object.keys(notes).length;
      const keepShort = (i: DefItem): string => (cfg.bases?.[i] ? 'base' : 'actual');
      return `${cfg.name} · Elegidas ${n}/${ORDER.length}${c ? ` · ${c} comentario${c > 1 ? 's' : ''}` : ''} · ${ORDER.map((i) => `${INFO[i].short}:${picks[i] === 'keep' ? keepShort(i) : (picks[i] ?? '—')}`).join(' ')}`;
    },
    copyText() {
      const q = (v: string): string => `"${v.trim().replace(/\s+/g, ' ')}"`;
      const lines = ORDER.map((i) => `- ${INFO[i].name}=${label(i) ?? '—'}${notes[i] ? ` — ${q(notes[i])}` : ''}`);
      const general = notes._general ? [`Comentario general: ${q(notes._general)}`] : [];
      return [`${cfg.name} · Avatares de defensas:`, ...general, ...lines].join('\n');
    },
    clear() {
      picks = {};
      save();
      buttons.forEach((list) => list.forEach((x) => x.btn.classList.remove('chosen')));
    },
    draw(t: number) {
      for (const v of views) drawScene(v, t, action, version);
    },
  };
}

export function mountDefenseSection(container: HTMLElement, onChange: () => void): RoundSection {
  return mountDefenseRound(
    container,
    {
      key: 'system-defense:defense-picks-r1',
      name: 'Defensas R1',
      tag: 'Defensas · Ronda 1',
      title: 'Estilo de equipo',
      intro:
        'Mismo estilo que las amenazas: formas planas y un símbolo claro. Rasgo de equipo: todas están sobre una base con un LED verde de "OK". La opción A tiene una pantalla con ojos que miran a las amenazas; B y C son máquinas sin cara. Haz clic para elegir; otro clic quita la selección.',
      options: DEF_OPTIONS,
      versions: false,
    },
    onChange,
  );
}

export function mountDefenseRound2(container: HTMLElement, onChange: () => void): RoundSection {
  return mountDefenseRound(
    container,
    {
      key: 'system-defense:defense-picks-r2',
      name: 'Defensas R2',
      tag: 'Defensas · Ronda 2',
      title: 'Sin cara + v2',
      intro:
        'Todas sin cara: máquinas y objetos. Cada opción tiene su v2: añade piezas que muestran la mejora real (2 cañones = 2 paquetes, blindaje = más vida…) y una franja dorada. "Ambas" muestra v1 y v2 juntas; elige v1 o v2 con "Acción" para verlas trabajar. Otro clic quita la selección.',
      options: DEF_OPTIONS_R2,
      versions: true,
    },
    onChange,
  );
}

export function mountDefenseRound3(container: HTMLElement, onChange: () => void): RoundSection {
  return mountDefenseRound(
    container,
    {
      key: 'system-defense:defense-picks-r3',
      name: 'Defensas R3',
      tag: 'Defensas · Ronda 3',
      title: 'Desde lo que te gustó',
      intro:
        'Cada defensa parte de la base que elegiste (tarjeta pequeña de la izquierda). Sin caras, con v2, y cada opción explica su referencia en la vida real. "Ambas" muestra v1 y v2 juntas; elige v1 o v2 con "Acción" para verlas trabajar. Otro clic quita la selección.',
      options: DEF_OPTIONS_R3,
      versions: true,
      realLife: true,
      bases: {
        worker: { label: 'Chip CPU (ronda 1 C)', body: DEF_OPTIONS.worker.C.body, noV2: true },
        circuitBreaker: { label: 'Cuadro de interruptores (ronda 2 A)', body: DEF_OPTIONS_R2.circuitBreaker.A.body },
        waf: { label: 'Capas de filtros (ronda 2 B)', body: DEF_OPTIONS_R2.waf.B.body },
        rollback: { label: 'Teclas Ctrl + Z (ronda 2 B)', body: DEF_OPTIONS_R2.rollback.B.body },
      },
    },
    onChange,
  );
}
