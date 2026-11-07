#!/usr/bin/env node
/*
 * HTTP load test for the production build (no extra dependencies: Node 18+ fetch).
 *
 *   npm run build && npx vite preview --port 4173 &
 *   npm run loadtest -- --url http://localhost:4173 --connections 200 --duration 20
 *
 * It loads the page, finds every file it needs (JS, CSS, icon), then many parallel
 * "players" request them again and again. It prints requests per second, latency
 * percentiles and errors, and exits with code 1 if any request failed or p99 is too slow.
 */

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .join(' ')
    .split('--')
    .filter(Boolean)
    .map((s) => s.trim().split(/\s+/))
    .map(([k, v]) => [k, v ?? 'true']),
);
const base = (args.url ?? 'http://localhost:4173').replace(/\/$/, '');
const connections = Number(args.connections ?? 100);
const duration = Number(args.duration ?? 15);
const maxP99 = Number(args.maxP99 ?? 500);

async function discover() {
  const res = await fetch(`${base}/`);
  if (!res.ok) throw new Error(`GET / -> ${res.status}`);
  const html = await res.text();
  const urls = new Set(['/']);
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (m[1].startsWith('/') && !m[1].startsWith('//')) urls.add(m[1]);
  }
  return [...urls];
}

function percentile(sorted, p) {
  return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0;
}

async function main() {
  const urls = await discover();
  console.log(`Target ${base} · ${urls.length} files: ${urls.join(', ')}`);
  console.log(`${connections} parallel clients for ${duration} s…`);
  const latencies = [];
  const errors = new Map();
  let bytes = 0;
  const end = Date.now() + duration * 1000;

  async function client(id) {
    let i = id;
    while (Date.now() < end) {
      const url = urls[i++ % urls.length];
      const t0 = performance.now();
      try {
        const res = await fetch(base + url, { headers: { 'accept-encoding': 'gzip, br' } });
        const body = await res.arrayBuffer();
        latencies.push(performance.now() - t0);
        bytes += body.byteLength;
        if (!res.ok || body.byteLength === 0) errors.set(`${res.status} ${url}`, (errors.get(`${res.status} ${url}`) ?? 0) + 1);
      } catch (err) {
        errors.set(String(err.cause?.code ?? err.message), (errors.get(String(err.cause?.code ?? err.message)) ?? 0) + 1);
      }
    }
  }

  const started = performance.now();
  await Promise.all(Array.from({ length: connections }, (_, i) => client(i)));
  const seconds = (performance.now() - started) / 1000;
  latencies.sort((a, b) => a - b);
  const failed = [...errors.values()].reduce((s, n) => s + n, 0);
  const report = {
    requests: latencies.length + failed,
    'req/s': Math.round(latencies.length / seconds),
    'MB/s': Math.round((bytes / seconds / 1e6) * 10) / 10,
    'p50 ms': Math.round(percentile(latencies, 0.5) * 10) / 10,
    'p90 ms': Math.round(percentile(latencies, 0.9) * 10) / 10,
    'p99 ms': Math.round(percentile(latencies, 0.99) * 10) / 10,
    'max ms': Math.round((latencies.at(-1) ?? 0) * 10) / 10,
    errors: failed,
  };
  console.table(report);
  if (failed) console.log('Errors:', Object.fromEntries(errors));
  const ok = failed === 0 && report['p99 ms'] <= maxP99;
  console.log(ok ? 'PASS' : `FAIL (errors ${failed}, p99 ${report['p99 ms']} ms > ${maxP99} ms?)`);
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
