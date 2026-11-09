/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig({
  define: {
    // Shown on the title screen.
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    // Only index.html is built: the dev pages (avatars.html) stay out of production.
    target: 'es2022',
    sourcemap: false,
    assetsInlineLimit: 4096,
  },
  // `vite preview` sends the same security headers as production (firebase.json and
  // nginx/security-headers.conf), so the CSP can be tested locally on the built game.
  preview: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.web3forms.com; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'",
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 120_000,
  },
});
