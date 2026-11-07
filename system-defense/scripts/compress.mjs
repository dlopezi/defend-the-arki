#!/usr/bin/env node
/*
 * Pre-compresses the build (dist/) once, so the web server does not gzip on every request.
 * nginx serves these files with `gzip_static on` (see nginx/default.conf).
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { constants, gzipSync } from 'node:zlib';

const root = new URL('../dist/', import.meta.url).pathname;
const exts = ['.js', '.css', '.html', '.svg', '.json', '.txt'];
let count = 0;
let before = 0;
let after = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      walk(path);
      continue;
    }
    if (!exts.some((e) => name.endsWith(e))) continue;
    const data = readFileSync(path);
    if (data.length < 1024) continue;
    const gz = gzipSync(data, { level: constants.Z_BEST_COMPRESSION });
    writeFileSync(`${path}.gz`, gz);
    count++;
    before += data.length;
    after += gz.length;
  }
}

walk(root);
console.log(`compress: ${count} files, ${(before / 1024).toFixed(1)} kB -> ${(after / 1024).toFixed(1)} kB (gzip)`);
