import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * Every player-facing text has both languages: t('English', 'Español') (tr is the same
 * function), or lives in a Spanish table: a `const ES` or an `es` key (pick({ en, es })).
 * This test finds string literals with Spanish letters that are outside those places.
 * Comments are ignored. Dev-only pages (src/dev) are not translated on purpose.
 */

const SRC = join(import.meta.dirname, '..', 'src');
const SKIP_DIRS = ['dev'];
const SPANISH = /[áéíóúüñ¿¡ÁÉÍÓÚÜÑ]/;
const TRANSLATED_CALLS = new Set(['t', 'tr']);
const SPANISH_KEYS = new Set(['es', 'ES']);

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return SKIP_DIRS.includes(d.name) ? [] : files(p);
    return d.name.endsWith('.ts') ? [p] : [];
  });
}

/** Name before a '(' (call) or the object key before a '{' (`es: {`), if any. */
function nameBefore(src: string, at: number, open: '(' | '{'): string {
  let i = at - 1;
  while (i >= 0 && /\s/.test(src[i])) i--;
  if (open === '{') {
    // `const ES: Record<…> = {`
    const decl = /(?:const|let|var)\s+([\w$]+)[^=;{}]*=\s*$/.exec(src.slice(Math.max(0, at - 200), at));
    if (decl) return decl[1];
    if (src[i] !== ':' && src[i] !== '=') return '';
    i--;
    while (i >= 0 && /\s/.test(src[i])) i--;
  }
  let j = i;
  while (j >= 0 && /[\w$]/.test(src[j])) j--;
  return src.slice(j + 1, i + 1);
}

/** String literals (and template text) with Spanish letters outside t()/tr() and `es` tables. */
export function untranslated(src: string): { line: number; text: string }[] {
  const found: { line: number; text: string }[] = [];
  // frames: '(' / '{' with a name, or '${' for a template expression
  const stack: { kind: string; name: string }[] = [];
  const covered = () => stack.some((f) => (f.kind === '(' && TRANSLATED_CALLS.has(f.name)) || (f.kind === '{' && SPANISH_KEYS.has(f.name)));
  const report = (start: number, end: number) => {
    const text = src.slice(start, end);
    if (SPANISH.test(text) && !covered()) found.push({ line: src.slice(0, start).split('\n').length, text: text.slice(0, 80) });
  };
  let i = 0;
  let last = ''; // last significant code char, to tell a regex from a division
  const readTemplate = (from: number): number => {
    // from = index after the opening backtick or after a closing '}' of ${...}
    let k = from;
    while (k < src.length) {
      if (src[k] === '\\') k += 2;
      else if (src[k] === '`') {
        report(from, k);
        return k + 1;
      } else if (src[k] === '$' && src[k + 1] === '{') {
        report(from, k);
        stack.push({ kind: '${', name: '' });
        return k + 2;
      } else k++;
    }
    return k;
  };
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') i = src.indexOf('\n', i) === -1 ? src.length : src.indexOf('\n', i);
    else if (c === '/' && src[i + 1] === '*') i = src.indexOf('*/', i + 2) + 2;
    else if (c === '/' && (last === '' || '(,=:[!&|?{};'.includes(last))) {
      let k = i + 1;
      let inClass = false;
      while (k < src.length && (inClass || src[k] !== '/')) {
        if (src[k] === '\\') k++;
        else if (src[k] === '[') inClass = true;
        else if (src[k] === ']') inClass = false;
        k++;
      }
      i = k + 1;
      last = '/';
    } else if (c === "'" || c === '"') {
      let k = i + 1;
      while (k < src.length && src[k] !== c) k += src[k] === '\\' ? 2 : 1;
      report(i + 1, k);
      i = k + 1;
      last = c;
    } else if (c === '`') {
      i = readTemplate(i + 1);
      last = '`';
    } else if (c === '(' || c === '{') {
      stack.push({ kind: c, name: nameBefore(src, i, c) });
      i++;
      last = c;
    } else if (c === ')' || c === '}') {
      const top = stack.pop();
      i++;
      if (c === '}' && top?.kind === '${') i = readTemplate(i);
      last = c;
    } else {
      if (!/\s/.test(c)) last = c;
      i++;
    }
  }
  return found;
}

describe('i18n', () => {
  it('finds a Spanish text outside t() (self-check)', () => {
    expect(untranslated(`const a = 'Región';`)).toHaveLength(1);
    expect(untranslated(`const a = t('Region', 'Región'); // ñandú`)).toHaveLength(0);
    expect(untranslated('const a = `${t(`Back in ${n} s`, `Vuelve en ${n} s`)} · caída`;')).toHaveLength(1);
    expect(untranslated(`const T = { en: { a: 'x' }, es: { a: 'Sí' } };`)).toHaveLength(0);
    expect(untranslated(`const ES: Record<Id, Text> = { a: { b: 'Sí' } };`)).toHaveLength(0);
    expect(untranslated(`const OTHER: Record<Id, Text> = { a: 'Sí' };`)).toHaveLength(1);
  });

  it('every Spanish text in src/ has an English version', () => {
    const problems = files(SRC).flatMap((f) => untranslated(readFileSync(f, 'utf8')).map((p) => `${relative(SRC, f)}:${p.line}  ${p.text}`));
    expect(problems, 'wrap these texts in t(english, español)').toEqual([]);
  });
});
