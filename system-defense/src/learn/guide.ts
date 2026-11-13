import { DEFENSE_ORDER, DEFENSES, ENEMIES, ENEMY_ORDER, MODE_ORDER, MODES, PROVIDER_COLOR, PROVIDER_FAILURE_WAVE, REGIONS } from '../config';
import { t } from '../i18n';
import { concept, type ConceptId } from './concepts';

export type GuideTab = 'defenses' | 'threats';

/** One element of the Guide: a row in the list and the data of its card. */
export interface GuideEntry {
  id: ConceptId;
  kind: 'defense' | 'threat' | 'event';
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

/** "levels 2 to 4" / "levels 2 and 3" / "level 2". The levels come from the level rules, so they stay true. */
function levelsText(levels: number[]): string {
  const first = levels[0];
  const last = levels[levels.length - 1];
  const inARow = levels.every((l, i) => l === first + i);
  let list: string;
  if (levels.length > 2 && inARow) list = `${first} ${t('to', 'a')} ${last}`;
  else if (levels.length > 1) list = `${levels.slice(0, -1).join(', ')} ${t('and', 'y')} ${last}`;
  else list = String(first ?? '');
  return t(`level${levels.length > 1 ? 's' : ''} ${list}`, `nivel${levels.length > 1 ? 'es' : ''} ${list}`);
}

const levelsWhere = (has: (m: (typeof MODE_ORDER)[number]) => boolean) => MODE_ORDER.filter(has).map((m) => MODES[m].level);

/** "Free · levels 2 to 4". */
function rollbackLevels(): string {
  return `${t('Free', 'Gratis')} · ${levelsText(levelsWhere((m) => MODES[m].rollback))}`;
}

/** The Provider failure, last in the Threats tab: it is an event, not a threat. */
function providerEntry(): GuideEntry {
  const levels = levelsText(levelsWhere((m) => MODES[m].providerFailure));
  return {
    id: 'providerFailure',
    kind: 'event',
    name: 'Provider failure',
    color: PROVIDER_COLOR,
    sub: `${levels.charAt(0).toUpperCase()}${levels.slice(1)} · ${t('wave', 'ola')} ${PROVIDER_FAILURE_WAVE}`,
    play: t(
      `At the start of wave ${PROVIDER_FAILURE_WAVE}, the game takes down the lane with most defenses (${REGIONS[0].name}, the larger region, in Multi-region), after a warning. It never takes down the last part still up.`,
      `Al empezar la ola ${PROVIDER_FAILURE_WAVE}, el juego tumba el carril con más defensas (${REGIONS[0].name}, la región grande, en Multi-región), tras un aviso. Nunca tumba lo último que queda en pie.`,
    ),
  };
}

/** Elements of a Guide tab, in the order of the list. Texts are in the current language. */
export function guideEntries(tab: GuideTab): GuideEntry[] {
  if (tab === 'threats') {
    const threats: GuideEntry[] = ENEMY_ORDER.map((e) => ({ id: e as ConceptId, kind: 'threat', name: ENEMIES[e].name, color: ENEMIES[e].color, play: ENEMIES[e].desc }));
    return [...threats, providerEntry()];
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
