# System Defense

Tower defense de arquitectura de sistemas (estilo Plants vs Zombies). Defiendes la base con
Load Balancers, Redis, Rate Limiters, WAF, CDN y Kafka contra DDoS, bots, Zero-Day y Black Friday.

- Juego estático: HTML + JS + CSS. **No hay servidor de juego ni base de datos.**
  Los récords y opciones se guardan en el navegador (localStorage).
- Motor: TypeScript sin frameworks, patrón ECS, bucle fijo a 60 Hz, Canvas 2D.
- Tamaño de producción: unos **47 kB comprimidos** (index.html + 1 JS + 1 CSS + icono).

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
