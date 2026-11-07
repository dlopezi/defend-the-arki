# System Defense

Tower defense de arquitectura de sistemas (estilo Plants vs Zombies). Defiendes la base con
Load Balancers, Redis, Rate Limiters, WAF, CDN y Kafka contra DDoS, bots, Zero-Day y Black Friday.

- Juego estático: HTML + JS + CSS. **No hay servidor de juego ni base de datos.**
  Los récords y opciones se guardan en el navegador (localStorage).
- Motor: TypeScript sin frameworks, patrón ECS, bucle fijo a 60 Hz, Canvas 2D.
- Tamaño de producción: unos **47 kB comprimidos** (index.html + 1 JS + 1 CSS + icono).

## Móvil

- El juego se juega **en horizontal**. En horizontal, el tablero ocupa todo el alto de la pantalla:
  las defensas van en una columna a la izquierda y la barra de la ola arriba.
- En un móvil en vertical, la partida se pausa y aparece "Gira el móvil".
- "Añadir a pantalla de inicio" (iPhone y Android) abre el juego sin las barras del navegador
  (`public/manifest.webmanifest` y los iconos de `public/icons/`).
- Para ver los FPS en producción, abre la URL con `?debug`.

## Requisitos

- Node.js 22 y npm.
- Docker (solo para la opción de despliegue con Docker).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias (solo herramientas de desarrollo). |
| `npm run dev` | Juego en modo desarrollo: http://localhost:5173 |
| `npm test` | Todas las pruebas automáticas (unos 12 s). |
| `npm run check` | Tipos + pruebas + build. **Ejecútalo antes de cada despliegue.** |
| `npm run build` | Build de producción en `dist/` (y archivos `.gz` ya comprimidos). |
| `npm run preview` | Sirve `dist/` con las mismas cabeceras de seguridad que producción: http://localhost:4173 |
| `npm run loadtest -- --url http://localhost:4173` | Prueba de carga HTTP (ver abajo). |

## Pruebas

`npm test` ejecuta 40 pruebas sobre el motor real (sin pantalla):

- **Reglas del juego** (`tests/rules.test.ts`): costes de las defensas, CU del Worker y del cielo,
  Load Balancer, Rate Limiter (−50 %), Circuit Breaker (3×3 tras 1 s), Redis como muro,
  SQL Injection atraviesa Redis, Kafka atrapa, mejora a v2, Zero-Day salta la primera defensa
  (no el WAF), Black Friday destruye de un golpe, Botnet se divide, y la regla de Game Over de
  cada nivel (Monolito, Microservicios con Rollback, Kubernetes que se reinicia a los 30 s, victoria).
- **Básicas** (`tests/core.test.ts`): mundo ECS, configuración, olas cada vez más difíciles,
  Black Friday en las olas 5, 8 y 10, y que cada elemento tenga dibujo y ficha.
- **Partidas completas y carga** (`tests/soak.test.ts`): un bot juega 9 partidas enteras
  (3 niveles × 3 semillas, una en modo "caos" con clics al azar). Comprueba que no hay errores,
  ni valores NaN, ni fugas de entidades. Otra prueba mantiene **500 amenazas + 45 defensas**
  y mide el tiempo de cada paso del motor.

### Resultados (7 nov 2026, MacBook, Chrome)

| Prueba | Resultado |
|---|---|
| 40 pruebas automáticas | ✅ todas pasan |
| 9 partidas completas del bot | 8 victorias, 1 derrota en la ola 10 (Monolito). 0 errores. Máx. ~240 entidades |
| Motor con 500 amenazas + 45 defensas | 0,5 ms por paso de media, 0,9 ms p99 (presupuesto: 16,7 ms) |
| Navegador con 300 amenazas + 45 defensas | 60 FPS estables, peor frame 18,7 ms |
| Memoria en el navegador (40 s bajo carga) | estable en ~23 MB (sin fugas) |
| CSP en todas las pantallas | 0 violaciones, 0 errores en consola |
| Carga HTTP, `vite preview`, 400 clientes | ~4.170 peticiones/s, p99 225 ms, 0 errores |
| Carga HTTP, Docker + nginx, 1.000 clientes | ~3.500–5.000 peticiones/s, **0 errores**, nginx al 11–43 % de 1 CPU |

En la prueba de Docker, el límite fue el generador de carga (Node en el mismo portátil), no nginx.
Un jugador descarga unos 47 kB una sola vez; después el juego funciona sin servidor.

## Despliegue

### Producción: Firebase Hosting (Google Cloud)

- **Dirección:** https://defend.thearki.com (copia gratis de Firebase: https://defend-the-arki.web.app).
- **Proyecto GCP:** `defend-the-arki`, **sin cuenta de facturación** (plan Spark): no puede generar cobros.
- **Coste:** 0. El plan gratis da 10 GB de almacenamiento y 360 MB/día de tráfico
  (unos 7.600 jugadores nuevos al día con 47 kB cada uno). Si se pasa, el sitio puede dejar de
  responder hasta que se renueve la cuota: entonces hay que pasar a Blaze (pago por uso,
  0,15 USD/GB) con una alerta de presupuesto.
- **Rendimiento:** CDN global de Google, compresión automática, HTTP/3, HTTPS gratis.
- **Configuración:** `firebase.json` (cabeceras y caché, iguales que `nginx/`) y `.firebaserc`.

**Cómo se publica:** cada push a `main` ejecuta el CI (`.github/workflows/system-defense.yml`):
`check` (tipos, pruebas, build, carga) → `docker` → `deploy`. El job `deploy` publica **los mismos
archivos que pasaron las pruebas** y después comprueba la URL. GitHub entra en Google Cloud con
Workload Identity Federation: no hay ninguna clave guardada.

**Volver atrás:** consola de Firebase → Hosting → historial de versiones → *Rollback*.
También sirve `git revert` + push.

**Configuración inicial (una sola vez):**

1. `gcloud projects create defend-the-arki --name="Defend the Arki"` (sin facturación).
2. Consola de Firebase → *Add project* → elegir `defend-the-arki` (sin Google Analytics).
3. `scripts/setup-gcp.sh`: activa las APIs, crea el acceso de GitHub (solo la rama `main` de
   este repo puede publicar) y guarda las variables del repo `GCP_PROJECT_ID`, `GCP_WIF_PROVIDER`
   y `GCP_DEPLOY_SA`.
4. Dominio (`thearki.com`, comprado en Cloudflare): Firebase → Hosting → *Add custom domain* →
   `defend.thearki.com`. Copiar los registros que muestra Firebase en el DNS de Cloudflare como
   **"DNS only" (nube gris)**. Después: `gh variable set PRODUCTION_URL --body https://defend.thearki.com`
   para que el CI también compruebe el dominio.

**Probar `firebase.json` en local:** `npm run build` y después
`npx firebase-tools emulators:start --only hosting --project demo-test`.
En macOS el puerto 5000 lo usa AirPlay: cambia el puerto con `emulators.hosting.port` en una
copia de `firebase.json`.

### Opción A: Docker (nginx)

```bash
docker build -t system-defense:1.0.0 .     # instala, pasa todas las pruebas y hace el build
docker run -d -p 8080:8080 --name system-defense system-defense:1.0.0
# abrir http://localhost:8080
```

- nginx sin root, puerto 8080, con `HEALTHCHECK`.
- Si una prueba falla, **la imagen no se construye**.
- Configuración en `nginx/default.conf` y `nginx/security-headers.conf`.

### Opción B: hosting estático (Netlify, Vercel, Cloudflare Pages, S3 + CloudFront…)

- Comando de build: `npm run build`
- Carpeta a publicar: `dist/`
- Configura en el hosting las mismas cabeceras y caché que `nginx/`:

| Ruta | Cache-Control |
|---|---|
| `/assets/*` | `public, max-age=31536000, immutable` (los nombres cambian en cada versión) |
| `/` e `index.html` | `no-cache` |
| `/manifest.webmanifest` | `no-cache` y `Content-Type: application/manifest+json` |

Cabeceras de seguridad para todas las respuestas:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

Activa la compresión (gzip o brotli) en el hosting. Casi todos lo hacen solos.

## Lista para el lanzamiento

1. `npm ci && npm run check` en verde.
2. Construir y publicar (Docker u hosting estático).
3. Abrir la URL de producción y comprobar:
   - pantalla de título → "Pulsa para empezar" → menú;
   - Jugar → Nivel 1 → colocar una defensa;
   - en un móvil: en horizontal se ve todo el tablero; en vertical sale "Gira el móvil";
   - consola del navegador sin errores;
   - cabeceras: `curl -sI https://TU-DOMINIO/ | grep -i content-security`.
4. (Opcional) `npm run loadtest -- --url https://TU-DOMINIO --connections 100 --duration 15`
   **solo contra un servidor tuyo** y con permiso del proveedor.
5. Si algo sale mal: volver a publicar la versión anterior (imagen Docker anterior o el
   despliegue anterior del hosting). No hay datos en el servidor que migrar.

## Desarrollo

- `avatars.html` es una página solo de desarrollo para elegir avatares. **No entra en el build.**
- En modo desarrollo, `window.game` da acceso al motor desde la consola (no existe en producción).
- La versión que se ve en la pantalla de título sale de `package.json`.
