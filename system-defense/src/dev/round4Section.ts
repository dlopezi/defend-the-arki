import type { AvatarThreat, Pick } from './avatarOptions';
import { botletPlus, normalPlus, scraperPlus, type Body2 } from './round2Options';
import { NEW_R3, ransomStack, VARIANTS } from './round3Options';
import { R4 } from './round4Options';
import { mountRoundSection, type RoundConfig, type RoundOption, type RoundRow, type RoundSection } from './roundSection';

/*
 * "Ronda 4 · Ajustes": applies the comments on round 3.
 * Approved threats in a compact strip, rows with changes, and new options.
 */

const PICKS: Pick[] = ['A', 'B', 'C'];
const keep: RoundOption = { id: 'keep', label: 'Mantener actual', short: 'actual', what: { kind: 'current' }, small: true };

type NewSet = { readonly [P in Pick]: { readonly name: string; readonly body: Body2 } };
function newRow(type: AvatarThreat, set: NewSet, featured = false): RoundRow {
  return { type, featured, options: [keep, ...PICKS.map((p) => ({ id: p, label: set[p].name, short: p, what: { kind: 'body' as const, body: set[p].body } }))] };
}

const config: RoundConfig = {
  key: 'system-defense:avatar-picks-r4',
  name: 'Ronda 4',
  tag: 'Ronda 4 · Primer lanzamiento',
  title: 'Ajustes',
  intro: 'Apliqué tus comentarios. Reglas nuevas: los Exploits flotan, los Bots van sobre ruedas u orugas, el rojo es tráfico falso. Lo que ya elegiste o pediste está marcado ✓. Otro clic quita la selección.',
  defaults: { normal: 'ok', memoryLeak: 'ok', ddos: 'red', botnet: 'r3', ransomware: 'r3' },
  groups: [
    {
      title: 'Ya elegidos',
      compact: true,
      rows: [
        { type: 'normal', options: [{ id: 'ok', label: 'Mejorada (ronda 2)', short: 'ok', what: { kind: 'body', body: normalPlus } }] },
        { type: 'memoryLeak', options: [{ id: 'ok', label: 'Chip que se calienta', short: 'ok', what: { kind: 'body', body: NEW_R3.memoryLeak.A.body } }] },
      ],
    },
    {
      title: 'Con cambios',
      note: 'Lo que pediste en tus comentarios, al lado de la versión anterior.',
      rows: [
        {
          type: 'ddos',
          options: [
            { id: 'before', label: 'Antes · mini peticiones', short: 'antes', what: { kind: 'body', body: VARIANTS.ddos.v1.body } },
            { id: 'red', label: 'Rojo · tráfico falso', short: 'rojo', what: { kind: 'body', body: R4.ddosRed } },
          ],
        },
        {
          type: 'scraper',
          options: [
            { id: 'before', label: 'Antes · con patas', short: 'antes', what: { kind: 'body', body: scraperPlus } },
            { id: 'A', label: 'Orugas', short: 'A', what: { kind: 'body', body: R4.scraperTreads } },
            { id: 'B', label: 'Orugas + escáner arriba', short: 'B', what: { kind: 'body', body: R4.scraperTall } },
          ],
        },
        {
          type: 'botnet',
          extra: '. Incluye sus bots pequeños.',
          options: [
            { id: 'r3', label: 'Elegida · Nube central', short: 'elegida', what: { kind: 'body', body: VARIANTS.botnet.v1.body, botlet: botletPlus } },
            { id: 'wheels', label: 'Con ruedas (familia Bots)', short: 'ruedas', what: { kind: 'body', body: R4.botnetWheels, botlet: R4.botletWheels } },
          ],
        },
        {
          type: 'ransomware',
          options: [
            { id: 'r3', label: 'Elegida · Archivos apilados', short: 'elegida', what: { kind: 'body', body: ransomStack } },
            { id: 'float', label: 'Flotando (familia Exploits)', short: 'flota', what: { kind: 'body', body: R4.ransomFloat } },
          ],
        },
      ],
    },
    {
      title: 'Nuevas opciones',
      note: 'Black Friday sin cabeza; Zero-Day y SQL Injection flotan; Slowloris sin patas.',
      rows: [newRow('blackFriday', R4.bf, true), newRow('zeroDay', R4.zeroDay), newRow('sqli', R4.sqli), newRow('slowloris', R4.slowloris)],
    },
  ],
};

export function mountRound4Section(container: HTMLElement, onChange: () => void): RoundSection {
  return mountRoundSection(container, config, onChange);
}
