import type { AvatarThreat, Pick } from './avatarOptions';
import { bfCart, botletPlus, botnetPlus, ddosSwarm, normalPlus, ransomFile, scraperPlus, sqliSyringe, zeroGlitch, type Body2 } from './round2Options';
import { BOTLET_FAMILY, NEW_R3, VARIANTS } from './round3Options';
import { mountRoundSection, type RoundConfig, type RoundOption, type RoundRow, type RoundSection } from './roundSection';

/*
 * "Ronda 3 · Familias": the round 2 picks stay (marked by default) with 2 variants each,
 * grouped by family; Memory Leak and Slowloris get 3 new options.
 */

type Kept = keyof typeof VARIANTS;
const PICKED: Record<Kept, { name: string; body: Body2 }> = {
  normal: { name: 'Mejorada', body: normalPlus },
  scraper: { name: 'Mejorada', body: scraperPlus },
  botnet: { name: 'Mejorada', body: botnetPlus },
  blackFriday: { name: 'Carrito robot', body: bfCart },
  ddos: { name: 'Enjambre de flechas', body: ddosSwarm },
  zeroDay: { name: 'Cubo glitch', body: zeroGlitch },
  sqli: { name: 'Jeringa', body: sqliSyringe },
  ransomware: { name: 'Archivo encadenado', body: ransomFile },
};

function keptRow(type: Kept, extra = ''): RoundRow {
  const v = VARIANTS[type];
  const botlet = (b: Body2): Body2 | undefined => (type === 'botnet' ? b : undefined);
  return {
    type,
    featured: type === 'blackFriday',
    extra,
    options: [
      { id: 'r2', label: `Elegida (ronda 2) · ${PICKED[type].name}`, short: 'r2', what: { kind: 'body', body: PICKED[type].body, botlet: botlet(botletPlus) } },
      { id: 'v1', label: `Variante 1 · ${v.v1.name}`, short: 'v1', what: { kind: 'body', body: v.v1.body, botlet: botlet(botletPlus) } },
      { id: 'v2', label: `Variante 2 · ${v.v2.name}`, short: 'v2', what: { kind: 'body', body: v.v2.body, botlet: botlet(BOTLET_FAMILY) } },
    ],
  };
}

const keep: RoundOption = { id: 'keep', label: 'Mantener actual', short: 'actual', what: { kind: 'current' }, small: true };
function newRow(type: keyof typeof NEW_R3, extra = ''): RoundRow {
  const opts = NEW_R3[type];
  const picks: Pick[] = ['A', 'B', 'C'];
  return { type, extra, options: [keep, ...picks.map((p) => ({ id: p, label: opts[p].name, short: p, what: { kind: 'body' as const, body: opts[p].body } }))] };
}

const defaults = Object.fromEntries(Object.keys(PICKED).map((k) => [k, 'r2'])) as Partial<Record<AvatarThreat, string>>;

const config: RoundConfig = {
  key: 'system-defense:avatar-picks-r3',
  name: 'Ronda 3',
  tag: 'Ronda 3 · Primer lanzamiento',
  title: 'Familias',
  intro: 'Tus elegidas de la ronda 2 ya están marcadas ✓, con 2 variantes cada una. Las amenazas del mismo tipo comparten un rasgo para que se reconozcan como familia. Otro clic quita la selección.',
  defaults,
  groups: [
    {
      title: 'Familia Tráfico',
      note: 'Mucho volumen de peticiones. Rasgo común: la banda azul de "petición" con una etiqueta.',
      rows: [keptRow('normal'), keptRow('ddos'), keptRow('blackFriday'), newRow('slowloris')],
    },
    {
      title: 'Familia Bots',
      note: 'Programas automáticos. Rasgo común: la antena con LED rojo y el color naranja.',
      rows: [keptRow('scraper'), keptRow('botnet', '. Incluye sus bots pequeños.')],
    },
    {
      title: 'Familia Exploits',
      note: 'Código malicioso. Rasgo común: la ventana de código "</>".',
      rows: [keptRow('zeroDay'), keptRow('sqli'), keptRow('ransomware')],
    },
    {
      title: 'Fallos internos',
      note: 'El problema nace dentro del sistema. Color morado propio.',
      rows: [newRow('memoryLeak', '. La vista muestra cómo crece.')],
    },
  ],
};

export function mountRound3Section(container: HTMLElement, onChange: () => void): RoundSection {
  return mountRoundSection(container, config, onChange);
}
