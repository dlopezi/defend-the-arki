import type { DefenseType } from '../config';
import { defenseBody, rollbackArt } from '../render/defenseArt';
import type { DefBody, DefItem } from './defenseOptions';

/*
 * Defense avatars, round 4: the style of Design the Arki. The drawings live in the game
 * (src/render/defenseArt.ts); A = flat (chosen, now in the game), B = the same building
 * with gradients, light edges and glow.
 */

export interface DefOptionR4 {
  name: string;
  /** Real-world idea behind the drawing (shown on the card). */
  ref: string;
  body: DefBody;
}

const REF: Record<DefItem, string> = {
  worker: 'Fábrica, igual que el App Server de Design the Arki: hace el trabajo. Las ventanas se encienden mientras carga CU.',
  loadBalancer: 'Torre de señal, igual que en Design the Arki: reparte las peticiones.',
  redis: 'Cristal de energía, igual que la Cache de Design the Arki: responde rápido con lo que ya tiene.',
  rateLimiter: 'Peaje con barrera y cartel 429: deja pasar el tráfico más despacio.',
  circuitBreaker: 'Cuadro eléctrico con palanca: salta y corta todo de golpe.',
  waf: 'Muralla con ranuras de filtro y escudo: solo pasa el tráfico limpio.',
  cdn: 'Estación con globo terráqueo: sirve desde el borde, a 3 carriles.',
  kafka: 'Cinta de mensajes en cola con un arco que atrapa: guarda y espera.',
  rollback: 'Camión barredora con la flecha de deshacer (Ctrl + Z).',
};

function bodyOf(item: DefItem, rich: boolean): DefBody {
  // the picker page's "Acción" view sweeps the lane, like the game's running Rollback
  if (item === 'rollback') return (g, a) => rollbackArt(g, a.action, a.t, rich);
  const body = defenseBody(item as DefenseType, rich);
  return (g, a) => body(g, { ...a, level: a.level ?? 1 });
}

export const DEF_OPTIONS_R4: Record<DefItem, Partial<Record<'A' | 'B' | 'C', DefOptionR4>>> = Object.fromEntries(
  (Object.keys(REF) as DefItem[]).map((item) => [
    item,
    {
      A: { name: 'Plano, como Arki', ref: REF[item], body: bodyOf(item, false) },
      B: { name: 'Con luces y sombras', ref: REF[item], body: bodyOf(item, true) },
    },
  ]),
) as Record<DefItem, Partial<Record<'A' | 'B' | 'C', DefOptionR4>>>;
