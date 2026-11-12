import { DEFENSE_ORDER, DEFENSES, ENEMIES, ENEMY_ORDER, MODE_ORDER, MODES } from '../config';
import { t } from '../i18n';
import { concept, type ConceptId } from './concepts';

export type GuideTab = 'defenses' | 'threats';

/** One element of the Guide: a row in the list and the data of its card. */
export interface GuideEntry {
  id: ConceptId;
  kind: 'defense' | 'threat';
  name: string;
  color: string;
  /** Short line under the name: cost (defenses) or when it exists (Rollback). */
  sub?: string;
  hotkey?: string;
  /** What it does in the game. */
  play: string;
  /** What the upgrade adds (defenses that have one). */
  upgrade?: string;
}

const ROLLBACK_COLOR = '#22d3ee';

/** "Free · levels 2 and 3": the levels come from the level rules, so they stay true. */
function rollbackLevels(): string {
  const levels = MODE_ORDER.filter((m) => MODES[m].rollback).map((m) => MODES[m].level);
  const list = levels.length > 1 ? `${levels.slice(0, -1).join(', ')} ${t('and', 'y')} ${levels[levels.length - 1]}` : String(levels[0] ?? '');
  return t(`Free · level${levels.length > 1 ? 's' : ''} ${list}`, `Gratis · nivel${levels.length > 1 ? 'es' : ''} ${list}`);
}

/** Elements of a Guide tab, in the order of the list. Texts are in the current language. */
export function guideEntries(tab: GuideTab): GuideEntry[] {
  if (tab === 'threats') {
    return ENEMY_ORDER.map((e) => ({ id: e as ConceptId, kind: 'threat', name: ENEMIES[e].name, color: ENEMIES[e].color, play: ENEMIES[e].desc }));
  }
  const defenses: GuideEntry[] = DEFENSE_ORDER.map((d) => {
    const spec = DEFENSES[d];
    return {
      id: d,
      kind: 'defense',
      name: spec.name,
      color: spec.color,
      sub: `${spec.cost} CU`,
      hotkey: spec.hotkey,
      play: spec.desc,
      upgrade: spec.upgrade ?? undefined,
    };
  });
  const rollback: GuideEntry = {
    id: 'rollback',
    kind: 'defense',
    name: concept('rollback').title,
    color: ROLLBACK_COLOR,
    sub: rollbackLevels(),
    play: t(
      'One per lane, next to the base. When a threat reaches it, it sweeps the lane once and removes every threat it touches.',
      'Uno por carril, junto a la base. Cuando una amenaza llega, barre el carril una vez y elimina todas las amenazas que toca.',
    ),
  };
  return [...defenses, rollback];
}
