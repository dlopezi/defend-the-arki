import type { AvatarThreat } from './avatarOptions';
import type { Body2 } from './round2Options';
import { ROUND5_MAKERS, withAttack } from '../render/enemyArt';

/*
 * Threat avatars, round 5: isometric robots in the style of Design the Arki. The drawings live
 * in the game (src/render/enemyArt.ts). A = flat (chosen), B = more detail (no glow).
 * Here Black Friday and DDoS are still the round 5 versions (round 6 changed them).
 */

export interface ThreatOptionR5 {
  name: string;
  body: Body2;
}

export const THREAT_OPTIONS_R5 = Object.fromEntries(
  (Object.keys(ROUND5_MAKERS) as AvatarThreat[])
    .filter((type) => type !== ('botlet' as string))
    .map((type) => [type, { A: { name: 'Plano', body: withAttack(ROUND5_MAKERS[type](false)) }, B: { name: 'Con más detalle', body: withAttack(ROUND5_MAKERS[type](true)) } }]),
) as Record<AvatarThreat, { A: ThreatOptionR5; B: ThreatOptionR5 }>;

export const BOTLET_R5: { A: Body2; B: Body2 } = { A: withAttack(ROUND5_MAKERS.botlet(false)), B: withAttack(ROUND5_MAKERS.botlet(true)) };
