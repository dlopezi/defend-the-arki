/**
 * Game language. English by default; the player's choice is saved in this browser.
 *
 * Texts are picked when they are drawn (`t('Play', 'Jugar')`), so after a change the next
 * render shows the new language. Parts built once (HUD, pause panel) listen to `onLangChange`.
 */
export type Lang = 'en' | 'es';

const KEY = 'system-defense:lang';

function load(): Lang {
  try {
    return localStorage.getItem(KEY) === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
}

let current: Lang = load();
const listeners = new Set<() => void>();

export function lang(): Lang {
  return current;
}

/** The text in the current language. */
export function t(en: string, es: string): string {
  return current === 'es' ? es : en;
}

/** One of two tables, for long texts kept as one table per language. */
export function pick<T>(tables: Record<Lang, T>): T {
  return tables[current];
}

export function setLang(next: Lang): void {
  if (next === current) return;
  current = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* ignore: the choice lasts until the page closes */
  }
  syncDocument();
  for (const fn of listeners) fn();
}

/** Runs `fn` after every language change. */
export function onLangChange(fn: () => void): void {
  listeners.add(fn);
}

/** `<html lang>` and the tab title follow the language. */
export function syncDocument(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = current;
  document.title = t(
    'Defend the Arki · Systems architecture tower defense',
    'Defend the Arki · Tower defense de arquitectura de sistemas',
  );
}
