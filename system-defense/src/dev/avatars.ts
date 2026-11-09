import { CELL_H, ENEMIES, ENEMY_ORDER } from '../config';
import { drawEnemy } from '../render/sprites';
import { AVATAR_OPTIONS, BOTLET_OPTIONS, STYLE_NAMES, type AvatarThreat, type G, type Pick } from './avatarOptions';
import { drawBody, drawLane, setupCanvas, sizeOf } from './pageKit';
import { mountDefenseRound2, mountDefenseRound3, mountDefenseRound4, mountDefenseSection } from './defenseSection';
import { mountPilotSection } from './proto/pilotSection';
import { mountProtoSection } from './proto/protoSection';
import { mountRound2Section } from './round2Section';
import { mountRound3Section } from './round3Section';
import { mountRound4Section } from './round4Section';

/*
 * Dev page: compare 3 avatar options per threat, animated at game scale,
 * and pick one per threat. Open /avatars.html on the dev server.
 */

const STORAGE_KEY = 'system-defense:avatar-picks';
const PICKS: Pick[] = ['A', 'B', 'C'];
const ORDER: AvatarThreat[] = ['blackFriday', ...ENEMY_ORDER.filter((e): e is AvatarThreat => e !== 'blackFriday' && e !== 'botlet')];

/** 'keep' = keep the avatar the game has now. */
type Choice = Pick | 'keep';
type Picks = Partial<Record<AvatarThreat, Choice>>;

function loadPicks(): Picks {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Picks;
  } catch {
    return {};
  }
}
function savePicks(p: Picks): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

const css = `
:root { color-scheme: dark; --bg:#030712; --panel:#0b1224; --panel2:#0f1a33; --line:#1e2b4d; --text:#e2e8f0; --muted:#94a3b8; --blue:#38bdf8; --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
* { box-sizing: border-box; }
body { margin:0; background: radial-gradient(1200px 600px at 50% -10%, #0c1a3a 0%, var(--bg) 60%); color: var(--text); font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
main { max-width: 1100px; margin: 0 auto; padding: 16px 16px 96px; }
h1 { margin: 0; font: 900 30px var(--mono); }
h1 span { color: var(--blue); }
.intro { color: #cbd5e1; font-size: 14px; margin: 6px 0 4px; }
.sub { margin: 4px 0 6px; font: 800 16px var(--mono); color: #cbd5e1; }
.styles { display:flex; gap: 8px; flex-wrap: wrap; margin: 8px 0 18px; }
.styles span { padding: 3px 10px; border: 1px solid var(--line); border-radius: 999px; background: var(--panel2); font-size: 12px; }
.styles b { font-family: var(--mono); color: var(--blue); }
.row { display: grid; grid-template-columns: 190px repeat(3, 1fr); gap: 10px; align-items: stretch; padding: 12px; margin-bottom: 12px; background: var(--panel); border: 1px solid var(--line); border-radius: 14px; }
.row.featured { border-color: #facc15; box-shadow: 0 0 0 1px rgba(250,204,21,.3); }
.info { display:flex; flex-direction: column; gap: 4px; }
.info strong { font-size: 16px; }
.info .desc { font-size: 12px; color: var(--muted); line-height: 1.4; }
.info .tag { align-self: flex-start; font: 700 10px var(--mono); text-transform: uppercase; letter-spacing: .08em; color: #facc15; }
.current { margin-top: auto; padding: 6px; }
.current canvas { width: 100%; height: auto; aspect-ratio: 16 / 11; }
canvas { display:block; border-radius: 10px; background: #070b17; }
.opt { position: relative; display:flex; flex-direction: column; gap: 6px; padding: 8px; background: var(--panel2); border: 2px solid var(--line); border-radius: 12px; color: var(--text); cursor: pointer; text-align: left; font: inherit; }
.opt:hover { border-color: #38bdf8; }
.opt.chosen { border-color: #34d399; box-shadow: 0 0 0 2px rgba(52,211,153,.35); }
.opt .label { display:flex; justify-content: space-between; align-items: flex-start; gap: 8px; font-size: 13px; }
.opt .check { flex-shrink: 0; }
.opt .label b { font-family: var(--mono); color: var(--blue); }
.opt .check { font: 700 11px var(--mono); color: #34d399; visibility: hidden; }
.opt.chosen .check { visibility: visible; }
.opt canvas { width: 100%; height: auto; aspect-ratio: 4 / 3; }
.bar { position: fixed; left: 0; right: 0; bottom: 0; display:flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; padding: 10px 16px; background: rgba(11,18,36,.97); border-top: 1px solid var(--line); font-size: 13px; }
.bar .summary { font-family: var(--mono); color: #cbd5e1; }
.bar button { padding: 8px 16px; font: 700 13px system-ui, sans-serif; color: var(--text); background: #0369a1; border: 1px solid #38bdf8; border-radius: 8px; cursor: pointer; }
.bar button.clear { background: transparent; border-color: var(--line); }
.bar .done { color: #34d399; }
.old { margin-top: 18px; }
.old > summary { cursor: pointer; padding: 10px 14px; margin-bottom: 12px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; font: 700 14px var(--mono); color: #cbd5e1; }
@media (max-width: 820px) { .row { grid-template-columns: 1fr 1fr; } .info { grid-column: 1 / -1; } }
`;

interface View {
  type: AvatarThreat;
  pick: Pick | 'current';
  g: G;
  W: number;
  H: number;
}

function main(): void {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);

  const picks = loadPicks();
  const root = document.querySelector<HTMLDivElement>('#app');
  if (!root) return;
  const main = document.createElement('main');
  main.innerHTML = `
    <h1>Avatares de <span>defensas</span></h1>
    <p class="intro">Ronda 4 de defensas: estilo Design the Arki. Las rondas 1 a 3 y los avatares de amenazas (ya en el juego) están plegados al final.</p>
`;
  root.append(main);
  // Current round: defenses, round 4. Rounds 3, 2 and 1 stay folded below (not drawn while closed).
  const defense = mountDefenseRound4(main, () => updateBar());
  const defOld = document.createElement('details');
  defOld.className = 'old';
  defOld.innerHTML = '<summary>Defensas · rondas 3, 2 y 1</summary>';
  main.append(defOld);
  const defense3 = mountDefenseRound3(defOld, () => updateBar());
  const defense2 = mountDefenseRound2(defOld, () => updateBar());
  const defense1 = mountDefenseSection(defOld, () => updateBar());
  // Threat avatars are done: all their rounds stay available, folded (and not drawn while closed).
  const threats = document.createElement('details');
  threats.className = 'old';
  threats.innerHTML = '<summary>Avatares de amenazas (terminado) · rondas 1 a 4</summary>';
  main.append(threats);
  const round4 = mountRound4Section(threats, () => updateBar());
  const old = document.createElement('details');
  old.className = 'old';
  old.innerHTML = '<summary>Rondas anteriores · rondas 3 y 2, piloto SVG, 3 técnicas y ronda 1</summary>';
  threats.append(old);
  const round3 = mountRound3Section(old, () => updateBar());
  const round2 = mountRound2Section(old, () => updateBar());
  const pilot = mountPilotSection(old);
  const proto = mountProtoSection(old, () => updateBar());
  const styles = document.createElement('div');
  styles.innerHTML = `<h2 class="sub">Primera ronda · opciones simples</h2><div class="styles">${PICKS.map((p) => `<span><b>${p}</b> · ${STYLE_NAMES[p]}</span>`).join('')}</div>`;
  old.append(styles);

  const views: View[] = [];
  const optButtons = new Map<AvatarThreat, HTMLButtonElement[]>();
  // Click the chosen option again to unselect it.
  const choose = (type: AvatarThreat, c: Choice, btn: HTMLButtonElement): void => {
    const off = picks[type] === c;
    if (off) delete picks[type];
    else picks[type] = c;
    savePicks(picks);
    optButtons.get(type)?.forEach((x) => x.classList.toggle('chosen', !off && x === btn));
    updateBar();
  };
  // "Quitar selección" clears the current round only (defenses); threat picks are kept.
  const clearAll = (): void => {
    defense.clear();
    updateBar();
  };

  for (const type of ORDER) {
    const spec = ENEMIES[type];
    const row = document.createElement('section');
    row.className = `row${type === 'blackFriday' ? ' featured' : ''}`;
    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML = `${type === 'blackFriday' ? '<span class="tag">Jefe · destacado</span>' : ''}
      <strong style="color:${spec.color}">${spec.name}</strong>
      <span class="desc">${spec.desc}${type === 'botnet' ? '. Incluye sus bots pequeños.' : ''}${type === 'memoryLeak' ? '. La vista muestra cómo crece.' : ''}</span>
`;
    const buttons: HTMLButtonElement[] = [];
    // "Keep current" is an option like A, B and C.
    const keep = document.createElement('button');
    keep.type = 'button';
    keep.className = `opt current${picks[type] === 'keep' ? ' chosen' : ''}`;
    keep.innerHTML = `<span class="label"><span>Mantener actual</span><span class="check">✓</span></span>`;
    const cur = document.createElement('canvas');
    keep.append(cur);
    keep.addEventListener('click', () => choose(type, 'keep', keep));
    buttons.push(keep);
    info.append(keep);
    views.push({ type, pick: 'current', g: setupCanvas(cur, 160, 110), W: 160, H: 110 });
    row.append(info);

    for (const p of PICKS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `opt${picks[type] === p ? ' chosen' : ''}`;
      b.innerHTML = `<span class="label"><span><b>${p}</b> · ${STYLE_NAMES[p]}</span><span class="check">✓ Elegida</span></span>`;
      const c = document.createElement('canvas');
      b.append(c);
      b.addEventListener('click', () => choose(type, p, b));
      buttons.push(b);
      row.append(b);
      views.push({ type, pick: p, g: setupCanvas(c, 240, 180), W: 240, H: 180 });
    }
    optButtons.set(type, buttons);
    old.append(row);
  }

  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.innerHTML = `<span class="summary"></span><button type="button" class="copy">Copiar selección</button><button type="button" class="clear">Quitar selección</button><span class="done"></span>`;
  document.body.append(bar);
  const summary = bar.querySelector<HTMLElement>('.summary');
  const done = bar.querySelector<HTMLElement>('.done');
  // The bar shows the current round: defenses.
  const text = () => defense.copyText();
  function updateBar(): void {
    if (summary) summary.textContent = defense.summary();
    if (done) done.textContent = '';
  }
  bar.querySelector('.clear')?.addEventListener('click', clearAll);
  bar.querySelector('.copy')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text());
      if (done) done.textContent = 'Copiado. Pégalo en el chat.';
    } catch {
      if (done) done.textContent = text();
    }
  });
  updateBar();

  // Dev aid: ?t=0.8 freezes the animation at that time (for exact screenshots).
  const frozen = new URLSearchParams(location.search).get('t');
  const frame = (now: number) => {
    const t = frozen !== null ? Number(frozen) : now / 1000;
    defense.draw(t);
    if (defOld.open) {
      defense3.draw(t);
      defense2.draw(t);
      defense1.draw(t);
    }
    if (!threats.open) {
      requestAnimationFrame(frame);
      return;
    }
    round4.draw(t);
    if (!old.open) {
      requestAnimationFrame(frame);
      return;
    }
    round3.draw(t);
    round2.draw(t);
    pilot.draw(t);
    proto.draw(t);
    for (const v of views) {
      const { g, W, H, type } = v;
      drawLane(g, W, H, t);
      const { w, h } = sizeOf(type, t);
      const scale = Math.min(1.5, (H - 40) / Math.max(ENEMIES[type].height * (type === 'memoryLeak' ? 1.9 : 1), CELL_H * 0.5));
      const groundY = H - 24;
      const cx = type === 'botnet' ? W * 0.4 : W / 2;
      if (v.pick === 'current') {
        g.save();
        g.translate(cx, groundY - (h / 2) * scale);
        g.scale(scale, scale);
        drawEnemy(g, type, 0, 0, w, h, t, { flash: 0, slowed: false, state: 'walk', jumpHeight: 0 });
        if (type === 'botnet') {
          const b = ENEMIES.botlet;
          drawEnemy(g, 'botlet', w * 0.75 + 10, h / 2 - b.height / 2, b.width, b.height, t, { flash: 0, slowed: false, state: 'walk', jumpHeight: 0 });
        }
        g.restore();
        continue;
      }
      drawBody(g, AVATAR_OPTIONS[type][v.pick], cx, groundY - (h / 2) * scale, w, h, t, scale);
      if (type === 'botnet') {
        const b = ENEMIES.botlet;
        for (let i = 0; i < 2; i++) {
          const bx = cx + (w / 2 + 22 + i * 30) * scale;
          drawBody(g, BOTLET_OPTIONS[v.pick], bx, groundY - (b.height / 2) * scale, b.width, b.height, t + i, scale);
        }
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

main();
