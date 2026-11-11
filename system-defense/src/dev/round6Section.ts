import { mountRoundSection, type RoundConfig, type RoundSection } from './roundSection';
import { THREAT_OPTIONS_R5 } from './threatOptionsR5';
import { THREAT_R6 } from './threatOptionsR6';

/*
 * "Ronda 6 · Ajustes": the comments on round 5 (A = flat chosen for all threats).
 * Black Friday and SQL Injection get two new designs; DDoS goes down to 4 robots.
 * The round 5 design stays in the small card on the left, to compare.
 */

const r5 = (type: 'blackFriday' | 'sqli' | 'ddos') =>
  ({ id: 'r5', label: 'Ronda 5 (A)', short: 'r5', what: { kind: 'body' as const, body: THREAT_OPTIONS_R5[type].A.body }, small: true });

const config: RoundConfig = {
  key: 'system-defense:avatar-picks-r6',
  name: 'Amenazas R6',
  tag: 'Amenazas · Ronda 6',
  title: 'Ajustes',
  intro:
    'Tus comentarios de la ronda 5. Black Friday: ahora se ve como un carrito de supermercado (rejilla abierta con los pedidos dentro, ruedas en las 4 esquinas y asa para empujar). SQL Injection: una jeringa clásica (aguja, cuerpo con marcas, agarre y émbolo). DDoS: 4 robots. La tarjeta pequeña de la izquierda es el diseño de la ronda 5. Otro clic quita la selección.',
  defaults: { ddos: 'four' },
  groups: [
    {
      title: 'Nuevos diseños',
      rows: [
        {
          type: 'blackFriday',
          featured: true,
          pair: true,
          options: [
            r5('blackFriday'),
            { id: 'A', label: THREAT_R6.blackFriday.A.name, short: 'A', what: { kind: 'body', body: THREAT_R6.blackFriday.A.body } },
            { id: 'B', label: THREAT_R6.blackFriday.B.name, short: 'B', what: { kind: 'body', body: THREAT_R6.blackFriday.B.body } },
          ],
        },
        {
          type: 'sqli',
          pair: true,
          options: [
            r5('sqli'),
            { id: 'A', label: THREAT_R6.sqli.A.name, short: 'A', what: { kind: 'body', body: THREAT_R6.sqli.A.body } },
            { id: 'B', label: THREAT_R6.sqli.B.name, short: 'B', what: { kind: 'body', body: THREAT_R6.sqli.B.body } },
          ],
        },
      ],
    },
    {
      title: 'Con cambios',
      note: 'Lo que pediste, al lado de la versión anterior.',
      rows: [
        {
          type: 'ddos',
          pair: true,
          options: [
            { id: 'six', label: 'Antes · 6 robots', short: '6', what: { kind: 'body', body: THREAT_OPTIONS_R5.ddos.A.body } },
            { id: 'four', label: 'Ahora · 4 robots', short: '4', what: { kind: 'body', body: THREAT_R6.ddos4 } },
          ],
        },
      ],
    },
  ],
};

export function mountRound6Section(container: HTMLElement, onChange: () => void): RoundSection {
  return mountRoundSection(container, config, onChange);
}
