import { ENEMY_ORDER } from '../config';
import { AVATAR_OPTIONS, BOTLET_OPTIONS, type AvatarThreat, type Pick } from './avatarOptions';
import { IMPROVED, IMPROVED_BOTLET, NEW_OPTIONS, type Body2 } from './round2Options';
import { mountRoundSection, type RoundConfig, type RoundOption, type RoundSection } from './roundSection';

/*
 * "Ronda 2 · Estilo tecnológico simple": threats chosen in round 1 show "Antes" vs "Mejorada";
 * the others show "Mantener actual" plus 3 new options.
 */

const PICKS: Pick[] = ['A', 'B', 'C'];
const IMPROVED_ORDER: AvatarThreat[] = ['normal', 'scraper', 'botnet'];
const NEW_ORDER: AvatarThreat[] = ['blackFriday', ...ENEMY_ORDER.filter((e): e is AvatarThreat => e !== 'blackFriday' && e !== 'botlet' && !IMPROVED_ORDER.includes(e as AvatarThreat))];

/* Round 1 "A" botnet, shown as "Antes". */
const botnetRound1: Body2 = (g, a) => AVATAR_OPTIONS.botnet.A(g, a);
const botletRound1: Body2 = (g, a) => BOTLET_OPTIONS.A(g, a);

const keep: RoundOption = { id: 'keep', label: 'Mantener actual', short: 'actual', what: { kind: 'current' }, small: true };

const config: RoundConfig = {
  key: 'system-defense:avatar-picks-r2',
  name: 'Ronda 2',
  tag: 'Ronda 2 · Primer lanzamiento',
  title: 'Estilo tecnológico simple',
  intro: 'Máquinas y aparatos, no monstruos: formas planas, una pantalla con ojos LED y un símbolo claro por amenaza. Haz clic en una opción para elegirla; otro clic la quita.',
  groups: [
    {
      title: 'Te gustaron → versión mejorada',
      rows: IMPROVED_ORDER.map((type) => ({
        type,
        extra: type === 'botnet' ? '. Incluye sus bots pequeños.' : '',
        options: [
          type === 'botnet'
            ? { id: 'before', label: 'Antes (A de ronda 1)', short: 'antes', what: { kind: 'body', body: botnetRound1, botlet: botletRound1 } }
            : { id: 'before', label: 'Antes (actual)', short: 'antes', what: { kind: 'current' } },
          { id: 'improved', label: 'Mejorada', short: 'mejorada', what: { kind: 'body', body: IMPROVED[type] as Body2, botlet: type === 'botnet' ? IMPROVED_BOTLET : undefined } },
        ],
      })),
    },
    {
      title: 'Sin elegir → 3 opciones nuevas',
      rows: NEW_ORDER.map((type) => {
        const opts = NEW_OPTIONS[type];
        return {
          type,
          featured: type === 'blackFriday',
          extra: type === 'memoryLeak' ? '. La vista muestra cómo crece.' : '',
          options: [keep, ...PICKS.map((p) => ({ id: p, label: opts?.[p].name ?? p, short: p, what: { kind: 'body' as const, body: opts?.[p].body as Body2 } }))],
        };
      }),
    },
  ],
};

export function mountRound2Section(container: HTMLElement, onChange: () => void): RoundSection {
  return mountRoundSection(container, config, onChange);
}
