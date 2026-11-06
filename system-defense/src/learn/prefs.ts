import type { ConceptId } from './concepts';

const SEEN_KEY = 'system-defense:seen-concepts';
const ENABLED_KEY = 'system-defense:concepts-enabled';

/** Concept cards already shown in this browser. */
export function loadSeen(): Set<ConceptId> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as ConceptId[]) : []);
  } catch {
    return new Set();
  }
}

export function saveSeen(seen: Set<ConceptId>): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    /* ignore */
  }
}

export function loadEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) !== '0';
  } catch {
    return true;
  }
}

export function saveEnabled(on: boolean): void {
  try {
    localStorage.setItem(ENABLED_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}
