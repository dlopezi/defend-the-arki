# Defend the Arki

Tower defense de arquitectura de sistemas (estilo Plants vs Zombies). Defiendes la base con
Load Balancers, Redis, Rate Limiters, WAF, CDN y Kafka contra DDoS, bots, Zero-Day y Black Friday.

- Juego estático: HTML + JS + CSS. **No hay servidor de juego ni base de datos.**
  Los récords y opciones se guardan en el navegador (localStorage).
  La única salida a Internet es el formulario de **Feedback** (ver abajo).
- Motor: TypeScript sin frameworks, patrón ECS, bucle fijo a 60 Hz, Canvas 2D.
- Tamaño de producción: unos **56 kB comprimidos** con gzip (index.html + 1 JS + 1 CSS + icono), con los dos idiomas.

## Idiomas

- **Inglés por defecto.** El switch **EN | ES** cambia a español: está en la pantalla de título
  (abajo, junto al botón de sonido) y en *Options*, primera fila ("Language · Idioma").
- La elección se guarda en el navegador (`localStorage`, clave `defend-the-arki:lang`).
- Código: `src/i18n.ts`. Cada texto se escribe en los dos idiomas: `t('Play', 'Jugar')`.
  Los textos largos (fichas de concepto, post-mortem) tienen una tabla por idioma en
  `src/learn/concepts.ts` y `src/learn/postmortem.ts`. Una prueba comprueba que las dos tablas
  tienen las mismas fichas.
- Todo lo que el juego guarda en el navegador (récords, idioma, sonido, fichas vistas) usa claves
  que empiezan por `defend-the-arki:`.

## Móvil

- El juego se juega **en horizontal**. En horizontal, el tablero ocupa todo el alto de la pantalla:
  las defensas van en una columna a la izquierda y la barra de la ola arriba.
- En un móvil en vertical, la partida se pausa y aparece "Turn your phone" ("Gira el móvil").
- "Añadir a pantalla de inicio" (iPhone y Android) abre el juego sin las barras del navegador
  (`public/manifest.webmanifest` y los iconos de `public/icons/`).
- Para ver los FPS en producción, abre la URL con `?debug`.

## Feedback

- Los jugadores escriben un mensaje (bugs, ideas, lo que sea) y llega por email al dueño.
- Dónde está: botón **Feedback** en el menú de título, en el menú de pausa y
  **Send feedback** en la pantalla de fin de partida.
- Con el mensaje se envían datos técnicos: versión, idioma, nivel, ola, resultado,
  navegador y tamaño de pantalla. No identifican a nadie. El formulario lo avisa en una línea.
- El juego no tiene servidor: el envío lo hace [Web3Forms](https://web3forms.com)
  (gratis, 250 mensajes al mes). Por eso la CSP permite `connect-src https://api.web3forms.com`.
- La clave de Web3Forms está en `src/feedback.ts` (`WEB3FORMS_KEY`). **Es pública a propósito**:
  viaja en el JS del juego y solo sirve para mandar correos al dueño. Si está vacía, el
  formulario muestra "Could not send".
- Anti-spam: un campo oculto que solo rellenan los bots, mensajes de 5 a 2000 caracteres
  y un mensaje por minuto en cada navegador (`localStorage`, clave `defend-the-arki:feedback-sent`).
- Mientras se escribe, las teclas del juego (1–8, P, F, M, Q, flechas) no hacen nada. Esc cierra.

## Versiones

- La versión sale de `package.json` y se ve abajo a la derecha de la pantalla de título.
  También va en cada Feedback.
- Para publicar una versión: subir `version` en `package.json` en una rama, llevarla a `main`,
  y crear el tag y la Release en GitHub (`gh release create vX.Y.Z --generate-notes`).
- Nivel nuevo o función nueva: sube el número del medio (1.0.0 → 1.1.0). Solo arreglos: el
  último (1.1.0 → 1.1.1).

## Requisitos

- Node.js 22 y npm.
- Docker (solo para la opción de despliegue con Docker).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias (solo herramientas de desarrollo). |
| `npm run dev` | Juego en modo desarrollo: http://localhost:5173 |
| `npm test` | Todas las pruebas automáticas (unos 12 s). |
| `npm run test:soak` | Solo las partidas del bot, con su tabla de resultados por nivel. |
| `npm run check` | Tipos + pruebas + build. **Ejecútalo antes de cada despliegue.** |
| `npm run build` | Build de producción en `dist/` (y archivos `.gz` ya comprimidos). |
| `npm run preview` | Sirve `dist/` con las mismas cabeceras de seguridad que producción: http://localhost:4173 |
| `npm run loadtest -- --url http://localhost:4173` | Prueba de carga HTTP (ver abajo). |

## Pruebas

`npm test` ejecuta todas las pruebas sobre el motor real (sin pantalla). El número exacto lo da `npm test`:

- **Reglas del juego** (`tests/rules.test.ts`): costes de las defensas, CU del Worker y del cielo,
  Load Balancer, Rate Limiter (−50 %), Circuit Breaker (3×3 tras 1 s), Redis como muro,
  SQL Injection atraviesa Redis, Kafka atrapa, mejora a v2, Zero-Day salta la primera defensa
  (no el WAF), Black Friday destruye de un golpe, Botnet se divide, y la regla de Game Over de
  cada nivel (Monolito, Microservicios con Rollback, Kubernetes que se reinicia a los 30 s,
  Multi-región: cae la región entera, failover a la otra y vuelve a los 45 s; victoria).
- **Provider failure** (`tests/provider.test.ts`): en los niveles 2–4, aviso en la pausa antes de la ola 3
  y, al empezar la ola 3, cae el carril con más defensas (eu-west en Multi-región). Nunca tumba lo
  último en pie y no existe en el Monolito.
- **Récords** (`tests/records.test.ts`) y **Guía** (`tests/guide.test.ts`).
- **Básicas** (`tests/core.test.ts`): mundo ECS, configuración, olas cada vez más difíciles,
  8 olas en el Nivel 1 y 5 en los demás (todas las amenazas salen en cada nivel), Black Friday
  como jefe de la última ola (y de la ola 4 en el Nivel 1), y que cada elemento tenga dibujo y ficha.
- **Idiomas** (`tests/i18n.test.ts`): falla si un texto en español de `src/` no está dentro de
  `t('English', 'Español')` o de una tabla en español (`const ES` o clave `es`).
- **Partidas completas y carga** (`tests/soak.test.ts`): un bot juega 13 partidas enteras
  (4 niveles × 3 semillas, una en modo "caos" con clics al azar, y una más del Nivel 4 sin defender
  us-east, para que las regiones caigan y vuelvan). En el Nivel 4 debe ganar al menos una. Comprueba que no hay errores,
  ni valores NaN, ni fugas de entidades. Otra prueba mantiene **500 amenazas + 45 defensas**
  y mide el tiempo de cada paso del motor.

### Resultados (7 nov 2026, MacBook, Chrome)

| Prueba | Resultado |
|---|---|
| Pruebas automáticas | ✅ todas pasan |
| 13 partidas completas del bot | 13 victorias. Duración (tiempo de juego a ×1): Nivel 1 ~12 min (8 olas); Niveles 2–4 entre 6,5 y 10,5 min (5 olas). En todas las partidas de los niveles 2–4 cayó algo (el Provider failure como mínimo), así que la regla del nivel siempre se ve. 0 errores. Máx. ~310 entidades |
| Motor con 500 amenazas + 45 defensas | 0,5 ms por paso de media, 0,9 ms p99 (presupuesto: 16,7 ms) |
| Navegador con 300 amenazas + 45 defensas | 60 FPS estables, peor frame 18,7 ms |
| Memoria en el navegador (40 s bajo carga) | estable en ~23 MB (sin fugas) |
| CSP en todas las pantallas | 0 violaciones, 0 errores en consola |
| Carga HTTP, `vite preview`, 400 clientes | ~4.170 peticiones/s, p99 225 ms, 0 errores |
| Carga HTTP, Docker + nginx, 1.000 clientes | ~3.500–5.000 peticiones/s, **0 errores**, nginx al 11–43 % de 1 CPU |

En la prueba de Docker, el límite fue el generador de carga (Node en el mismo portátil), no nginx.
Un jugador descarga unos 54 kB una sola vez; después el juego funciona sin servidor.

## Despliegue

### Producción: Firebase Hosting (Google Cloud)

- **Dirección:** https://defend.thearki.com (copia gratis de Firebase: https://defend-the-arki.web.app).
- **Proyecto GCP:** `defend-the-arki`, **sin cuenta de facturación** (plan Spark): no puede generar cobros.
- **Coste:** 0. El plan gratis da 10 GB de almacenamiento y 360 MB/día de tráfico
  (unos 6.600 jugadores nuevos al día con 54 kB cada uno). Si se pasa, el sitio puede dejar de
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
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.web3forms.com; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'
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
   - pantalla de título → "Press to start" → menú; el switch **EN | ES** cambia todos los textos;
   - Play → Level 1 → colocar una defensa;
   - Feedback → enviar un mensaje de prueba → llega al correo;
   - en un móvil: en horizontal se ve todo el tablero; en vertical sale "Turn your phone";
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
