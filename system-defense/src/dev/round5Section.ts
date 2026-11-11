import { ENEMY_ORDER } from '../config';
import type { AvatarThreat } from './avatarOptions';
import { mountRoundSection, type RoundConfig, type RoundRow, type RoundSection } from './roundSection';
import { BOTLET_R5, THREAT_OPTIONS_R5 } from './threatOptionsR5';

/*
 * "Ronda 5 · Estilo Design the Arki": every threat as an isometric robot, the same line as the
 * round 4 defenses. A = flat, B = more detail (no glow). "Mantener actual" is the game avatar now.
 */

const ORDER: AvatarThreat[] = ['blackFriday', ...ENEMY_ORDER.filter((e): e is AvatarThreat => e !== 'blackFriday' && e !== 'botlet')];

function row(type: AvatarThreat): RoundRow {
  const o = THREAT_OPTIONS_R5[type];
  const botlet = (p: 'A' | 'B') => (type === 'botnet' ? BOTLET_R5[p] : undefined);
  return {
    type,
    pair: true,
    featured: type === 'blackFriday',
    extra: type === 'botnet' ? '. Incluye sus bots pequeños.' : type === 'memoryLeak' ? '. La vista muestra cómo crece.' : '',
    options: [
      { id: 'keep', label: 'Mantener actual', short: 'actual', what: { kind: 'current' }, small: true },
      { id: 'A', label: o.A.name, short: 'A', what: { kind: 'body', body: o.A.body, botlet: botlet('A') } },
      { id: 'B', label: o.B.name, short: 'B', what: { kind: 'body', body: o.B.body, botlet: botlet('B') } },
    ],
  };
}

const config: RoundConfig = {
  key: 'system-defense:avatar-picks-r5',
  name: 'Amenazas R5',
  tag: 'Amenazas · Ronda 5',
  title: 'Estilo Design the Arki',
  intro:
    'Misma línea que las defensas de la ronda 4: cada amenaza es un robot isométrico, plano, con su cara en el lado izquierdo (caminan hacia la base). Se mantienen las familias: Tráfico con banda azul (rojo = tráfico falso), Bots naranjas con antena y LED rojo, Exploits que flotan, Fallos internos en morado. A es plano; B es el mismo robot con más detalle (juntas, tornillos, rejillas), sin brillo. Otro clic quita la selección.',
  groups: [{ title: 'Amenazas', rows: ORDER.map(row) }],
};

export function mountRound5Section(container: HTMLElement, onChange: () => void): RoundSection {
  return mountRoundSection(container, config, onChange);
}
