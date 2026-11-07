import type { DefenseType, EnemyType } from '../config';
import { pick, type Lang } from '../i18n';

/** Every element that has a concept card. Botlets share the Botnet card. */
export type ConceptId = DefenseType | Exclude<EnemyType, 'botlet'> | 'rollback';

export interface Link {
  label: string;
  url: string;
}

export interface Concept {
  title: string;
  kind: 'defense' | 'threat';
  /** What it is in real systems. */
  real: string;
  /** Real tools (defenses) or real countermeasures (threats). */
  tools: string[];
  /** Where the game metaphor is accurate. */
  same: string;
  /** Where the game metaphor is NOT accurate. */
  diff: string;
  read: Link;
}

export const LINKS = {
  primer: { label: 'System Design Primer (GitHub)', url: 'https://github.com/donnemartin/system-design-primer' },
  overload: { label: 'Google SRE Book · Handling Overload', url: 'https://sre.google/sre-book/handling-overload/' },
  lb: { label: 'Cloudflare · What is load balancing?', url: 'https://www.cloudflare.com/learning/performance/what-is-load-balancing/' },
  caching: { label: 'AWS · Caching overview', url: 'https://aws.amazon.com/caching/' },
  rateLimit: { label: 'Cloudflare · What is rate limiting?', url: 'https://www.cloudflare.com/learning/bots/what-is-rate-limiting/' },
  circuitBreaker: { label: 'Martin Fowler · CircuitBreaker', url: 'https://martinfowler.com/bliki/CircuitBreaker.html' },
  waf: { label: 'Cloudflare · What is a WAF?', url: 'https://www.cloudflare.com/learning/ddos/glossary/web-application-firewall-waf/' },
  cdn: { label: 'Cloudflare · What is a CDN?', url: 'https://www.cloudflare.com/learning/cdn/what-is-a-cdn/' },
  kafka: { label: 'Apache Kafka · Introduction', url: 'https://kafka.apache.org/intro' },
  blueGreen: { label: 'Martin Fowler · BlueGreenDeployment', url: 'https://martinfowler.com/bliki/BlueGreenDeployment.html' },
  scraping: { label: 'Cloudflare · What is data scraping?', url: 'https://www.cloudflare.com/learning/bots/what-is-data-scraping/' },
  ddos: { label: 'Cloudflare · What is a DDoS attack?', url: 'https://www.cloudflare.com/learning/ddos/what-is-a-ddos-attack/' },
  zeroDay: { label: 'Cloudflare · What is a zero-day exploit?', url: 'https://www.cloudflare.com/learning/security/threats/zero-day-exploit/' },
  injection: { label: 'OWASP Top 10 · Injection', url: 'https://owasp.org/Top10/A03_2021-Injection/' },
  ransomware: { label: 'CISA · Stop Ransomware', url: 'https://www.cisa.gov/stopransomware' },
  memory: { label: 'MDN · Memory management', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management' },
  botnet: { label: 'Cloudflare · What is a DDoS botnet?', url: 'https://www.cloudflare.com/learning/ddos/what-is-a-ddos-botnet/' },
  slowloris: { label: 'Cloudflare · Slowloris DDoS attack', url: 'https://www.cloudflare.com/learning/ddos/ddos-attack-tools/slowloris/' },
  bulkhead: { label: 'Microsoft · Bulkhead pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead' },
  pods: { label: 'Kubernetes · Pod lifecycle', url: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/' },
} satisfies Record<string, Link>;

const ES: Record<ConceptId, Concept> = {
  worker: {
    title: 'Worker Node',
    kind: 'defense',
    real: 'Un nodo de cómputo: una máquina o un contenedor que ejecuta tu código. Más nodos dan más capacidad, y también más coste.',
    tools: ['AWS EC2', 'Contenedores Docker', 'Nodos de Kubernetes'],
    same: 'Más nodos te dan más capacidad para crecer.',
    diff: 'Un nodo real no "genera dinero": cuesta dinero cada hora que está encendido.',
    read: LINKS.primer,
  },
  loadBalancer: {
    title: 'Load Balancer',
    kind: 'defense',
    real: 'Reparte las peticiones entre varios servidores para que ninguno se sature. Si un servidor cae, envía el tráfico a los demás.',
    tools: ['Nginx', 'HAProxy', 'AWS Application Load Balancer'],
    same: 'Gestiona el tráfico que llega por su ruta.',
    diff: 'Un balanceador real no destruye peticiones: las reparte. "200 OK" significa una petición bien servida.',
    read: LINKS.lb,
  },
  redis: {
    title: 'Redis Cache',
    kind: 'defense',
    real: 'Una caché guarda en memoria las respuestas que se piden mucho. Así esas peticiones no llegan a la base de datos.',
    tools: ['Redis', 'Memcached', 'Varnish'],
    same: 'Absorbe tráfico y protege lo que tiene detrás.',
    diff: 'Una caché no bloquea peticiones: las responde rápido. Si el dato no está (cache miss), la petición sigue su camino.',
    read: LINKS.caching,
  },
  rateLimiter: {
    title: 'Rate Limiter',
    kind: 'defense',
    real: 'Limita cuántas peticiones puede hacer un cliente por segundo. Si se pasa, responde HTTP 429 Too Many Requests.',
    tools: ['Nginx limit_req', 'API Gateway', 'Cloudflare Rate Limiting'],
    same: 'Frena a quien envía demasiado tráfico.',
    diff: 'No hace daño: rechaza o retrasa las peticiones que sobran.',
    read: LINKS.rateLimit,
  },
  circuitBreaker: {
    title: 'Circuit Breaker',
    kind: 'defense',
    real: 'Si un servicio falla muchas veces, el circuito se "abre" y se dejan de enviar llamadas durante un tiempo. Así el fallo no se extiende a otros servicios.',
    tools: ['Resilience4j', 'Polly (.NET)', 'Istio / service mesh'],
    same: 'Corta de golpe un problema en una zona concreta.',
    diff: 'Un circuit breaker real NO explota ni elimina tráfico: deja de llamar a un servicio enfermo y le da tiempo a recuperarse.',
    read: LINKS.circuitBreaker,
  },
  waf: {
    title: 'WAF · Web Application Firewall',
    kind: 'defense',
    real: 'Revisa cada petición HTTP y bloquea ataques conocidos, como la inyección SQL o el XSS.',
    tools: ['Cloudflare WAF', 'AWS WAF', 'ModSecurity'],
    same: 'Filtra ataques que otras capas dejan pasar.',
    diff: 'Un WAF no es un muro: analiza el contenido de cada petición.',
    read: LINKS.waf,
  },
  cdn: {
    title: 'CDN Edge',
    kind: 'defense',
    real: 'Una red de servidores repartidos por el mundo. Sirve el contenido desde el punto más cercano al usuario y quita carga a tu servidor.',
    tools: ['Cloudflare', 'AWS CloudFront', 'Akamai'],
    same: 'Cubre varias zonas a la vez.',
    diff: 'Una CDN no dispara: entrega contenido y absorbe tráfico en el borde de la red (edge).',
    read: LINKS.cdn,
  },
  kafka: {
    title: 'Kafka · Message Queue',
    kind: 'defense',
    real: 'Una cola guarda mensajes y los entrega después. Así un pico de tráfico no tumba al servicio que los procesa.',
    tools: ['Apache Kafka', 'RabbitMQ', 'AWS SQS'],
    same: 'Retiene trabajo y lo suelta más tarde.',
    diff: 'Una cola real no "atrapa" atacantes: guarda trabajo legítimo para procesarlo a su ritmo.',
    read: LINKS.kafka,
  },
  rollback: {
    title: 'Rollback',
    kind: 'defense',
    real: 'Volver rápido a la última versión estable cuando un despliegue sale mal.',
    tools: ['Blue/green deployment', 'kubectl rollout undo', 'Feature flags'],
    same: 'Es tu salvavidas cuando todo lo demás falla, y solo sirve si lo preparas antes.',
    diff: 'Un rollback real no elimina tráfico: deshace un cambio de código o de configuración.',
    read: LINKS.blueGreen,
  },
  normal: {
    title: 'Tráfico Normal',
    kind: 'threat',
    real: 'Peticiones de usuarios reales. Aunque son buenas, si llegan demasiadas a la vez también pueden tumbar un sistema.',
    tools: ['Balanceo de carga', 'Autoescalado', 'Pruebas de carga (k6)'],
    same: 'Llega en cantidad y hay que atenderlo.',
    diff: 'En la vida real no quieres eliminar a tus usuarios: quieres servirlos bien.',
    read: LINKS.overload,
  },
  scraper: {
    title: 'Scraper Bot',
    kind: 'threat',
    real: 'Bots que descargan tu web de forma automática para copiar datos o precios.',
    tools: ['Rate limiting', 'Detección de bots', 'CAPTCHA'],
    same: 'Gasta tus recursos sin aportar valor.',
    diff: 'Un scraper no rompe tus servidores: los usa en exceso.',
    read: LINKS.scraping,
  },
  ddos: {
    title: 'Ataque DDoS',
    kind: 'threat',
    real: 'Miles de máquinas envían tráfico a la vez para saturar tu servicio y dejarlo sin respuesta.',
    tools: ['Protección en el borde (CDN)', 'Rate limiting', 'Servicios anti-DDoS'],
    same: 'Su fuerza está en el volumen enorme.',
    diff: 'Un DDoS real llega desde muchos sitios a la vez, no como un solo bloque.',
    read: LINKS.ddos,
  },
  zeroDay: {
    title: 'Zero-Day Exploit',
    kind: 'threat',
    real: 'Un fallo de seguridad que nadie conocía todavía. No hay parche, así que supera defensas que solo conocen ataques antiguos.',
    tools: ['Defensa en profundidad', 'WAF', 'Parchear rápido'],
    same: 'Supera una primera capa de defensa.',
    diff: 'No "salta" físicamente: aprovecha un error del software.',
    read: LINKS.zeroDay,
  },
  sqli: {
    title: 'SQL Injection',
    kind: 'threat',
    real: 'Un atacante mete código SQL dentro de un dato (por ejemplo, en un formulario) para leer o borrar tu base de datos.',
    tools: ['Consultas parametrizadas', 'WAF', 'Validar las entradas'],
    same: 'Una caché no la detiene: hay que revisar el contenido.',
    diff: 'La defensa principal real está en tu código: usar consultas parametrizadas.',
    read: LINKS.injection,
  },
  ransomware: {
    title: 'Ransomware',
    kind: 'threat',
    real: 'Un programa malicioso cifra tus datos o sistemas y pide un rescate para devolverlos.',
    tools: ['Copias de seguridad', 'Mínimos privilegios', 'Parches al día'],
    same: 'Deja inservible lo que toca.',
    diff: 'En la realidad el cifrado no dura 5 s: sin copias de seguridad, puede ser permanente.',
    read: LINKS.ransomware,
  },
  memoryLeak: {
    title: 'Memory Leak',
    kind: 'threat',
    real: 'Un programa reserva memoria y no la libera. Con el tiempo usa cada vez más, hasta que el proceso cae.',
    tools: ['Monitorizar la memoria', 'Profilers', 'Reinicios controlados'],
    same: 'Al principio parece pequeño y crece con el tiempo.',
    diff: 'Es un bug de tu propio código, no un ataque externo.',
    read: LINKS.memory,
  },
  botnet: {
    title: 'Botnet',
    kind: 'threat',
    real: 'Una red de miles de dispositivos infectados que un atacante controla a la vez.',
    tools: ['Protección anti-DDoS', 'Rate limiting', 'Detección de bots'],
    same: 'Al pararla, se reparte en muchos atacantes pequeños.',
    diff: 'Una botnet real ya son miles de máquinas desde el principio.',
    read: LINKS.botnet,
  },
  slowloris: {
    title: 'Slowloris',
    kind: 'threat',
    real: 'Abre muchas conexiones y las mantiene vivas enviando datos muy despacio. El servidor se queda sin conexiones libres.',
    tools: ['Timeouts cortos', 'Límite de conexiones por IP', 'Proxy inverso (Nginx)'],
    same: 'Va lento y reduce la capacidad de su zona.',
    diff: 'Ataca las conexiones del servidor, no la velocidad de disparo.',
    read: LINKS.slowloris,
  },
  blackFriday: {
    title: 'Black Friday Traffic',
    kind: 'threat',
    real: 'Un pico enorme de tráfico legítimo y previsible: rebajas, lanzamientos, eventos.',
    tools: ['Planificación de capacidad', 'Autoescalado', 'Pruebas de carga antes del evento'],
    same: 'Llega en un momento conocido y rompe lo que no está preparado.',
    diff: 'Son clientes reales: se trata de escalar, no de eliminarlos.',
    read: LINKS.overload,
  },
};

const EN: Record<ConceptId, Concept> = {
  worker: {
    title: 'Worker Node',
    kind: 'defense',
    real: 'A compute node: a machine or a container that runs your code. More nodes give more capacity, and also more cost.',
    tools: ['AWS EC2', 'Docker containers', 'Kubernetes nodes'],
    same: 'More nodes give you more capacity to grow.',
    diff: 'A real node does not "make money": it costs money every hour it is on.',
    read: LINKS.primer,
  },
  loadBalancer: {
    title: 'Load Balancer',
    kind: 'defense',
    real: 'Spreads requests across several servers so none of them is overloaded. If a server goes down, it sends the traffic to the others.',
    tools: ['Nginx', 'HAProxy', 'AWS Application Load Balancer'],
    same: 'It handles the traffic that comes down its route.',
    diff: 'A real load balancer does not destroy requests: it spreads them. "200 OK" means a request served well.',
    read: LINKS.lb,
  },
  redis: {
    title: 'Redis Cache',
    kind: 'defense',
    real: 'A cache keeps the most requested answers in memory. So those requests never reach the database.',
    tools: ['Redis', 'Memcached', 'Varnish'],
    same: 'It absorbs traffic and protects what is behind it.',
    diff: 'A cache does not block requests: it answers them fast. If the data is not there (cache miss), the request goes on.',
    read: LINKS.caching,
  },
  rateLimiter: {
    title: 'Rate Limiter',
    kind: 'defense',
    real: 'Limits how many requests a client can make per second. Above the limit, it answers HTTP 429 Too Many Requests.',
    tools: ['Nginx limit_req', 'API Gateway', 'Cloudflare Rate Limiting'],
    same: 'It slows down whoever sends too much traffic.',
    diff: 'It does no damage: it rejects or delays the extra requests.',
    read: LINKS.rateLimit,
  },
  circuitBreaker: {
    title: 'Circuit Breaker',
    kind: 'defense',
    real: 'If a service fails many times, the circuit "opens" and calls stop for a while. So the failure does not spread to other services.',
    tools: ['Resilience4j', 'Polly (.NET)', 'Istio / service mesh'],
    same: 'It cuts a problem in one area all at once.',
    diff: 'A real circuit breaker does NOT explode or remove traffic: it stops calling a sick service and gives it time to recover.',
    read: LINKS.circuitBreaker,
  },
  waf: {
    title: 'WAF · Web Application Firewall',
    kind: 'defense',
    real: 'Checks every HTTP request and blocks known attacks, such as SQL injection or XSS.',
    tools: ['Cloudflare WAF', 'AWS WAF', 'ModSecurity'],
    same: 'It filters attacks that other layers let through.',
    diff: 'A WAF is not a wall: it looks at the content of each request.',
    read: LINKS.waf,
  },
  cdn: {
    title: 'CDN Edge',
    kind: 'defense',
    real: 'A network of servers spread around the world. It serves content from the point closest to the user and takes load off your server.',
    tools: ['Cloudflare', 'AWS CloudFront', 'Akamai'],
    same: 'It covers several areas at once.',
    diff: 'A CDN does not shoot: it delivers content and absorbs traffic at the edge of the network.',
    read: LINKS.cdn,
  },
  kafka: {
    title: 'Kafka · Message Queue',
    kind: 'defense',
    real: 'A queue stores messages and delivers them later. So a traffic peak does not bring down the service that processes them.',
    tools: ['Apache Kafka', 'RabbitMQ', 'AWS SQS'],
    same: 'It holds work and releases it later.',
    diff: 'A real queue does not "trap" attackers: it stores legitimate work to process it at its own pace.',
    read: LINKS.kafka,
  },
  rollback: {
    title: 'Rollback',
    kind: 'defense',
    real: 'Going back fast to the last stable version when a deployment goes wrong.',
    tools: ['Blue/green deployment', 'kubectl rollout undo', 'Feature flags'],
    same: 'It is your lifeline when everything else fails, and it only works if you prepare it first.',
    diff: 'A real rollback does not remove traffic: it undoes a code or configuration change.',
    read: LINKS.blueGreen,
  },
  normal: {
    title: 'Normal Traffic',
    kind: 'threat',
    real: 'Requests from real users. They are good, but if too many arrive at once they can also bring a system down.',
    tools: ['Load balancing', 'Autoscaling', 'Load testing (k6)'],
    same: 'It arrives in large numbers and must be served.',
    diff: 'In real life you do not want to remove your users: you want to serve them well.',
    read: LINKS.overload,
  },
  scraper: {
    title: 'Scraper Bot',
    kind: 'threat',
    real: 'Bots that download your website automatically to copy data or prices.',
    tools: ['Rate limiting', 'Bot detection', 'CAPTCHA'],
    same: 'It uses up your resources without adding value.',
    diff: 'A scraper does not break your servers: it overuses them.',
    read: LINKS.scraping,
  },
  ddos: {
    title: 'DDoS Attack',
    kind: 'threat',
    real: 'Thousands of machines send traffic at the same time to overload your service and leave it unable to answer.',
    tools: ['Edge protection (CDN)', 'Rate limiting', 'Anti-DDoS services'],
    same: 'Its strength is the huge volume.',
    diff: 'A real DDoS comes from many places at once, not as one single block.',
    read: LINKS.ddos,
  },
  zeroDay: {
    title: 'Zero-Day Exploit',
    kind: 'threat',
    real: 'A security bug that nobody knew about yet. There is no patch, so it gets past defenses that only know old attacks.',
    tools: ['Defense in depth', 'WAF', 'Patch fast'],
    same: 'It gets past a first layer of defense.',
    diff: 'It does not physically "jump": it uses a bug in the software.',
    read: LINKS.zeroDay,
  },
  sqli: {
    title: 'SQL Injection',
    kind: 'threat',
    real: 'An attacker puts SQL code inside a piece of data (for example, in a form) to read or delete your database.',
    tools: ['Parameterized queries', 'WAF', 'Input validation'],
    same: 'A cache does not stop it: the content must be checked.',
    diff: 'The main real defense is in your code: use parameterized queries.',
    read: LINKS.injection,
  },
  ransomware: {
    title: 'Ransomware',
    kind: 'threat',
    real: 'Malicious software encrypts your data or systems and asks for a ransom to give them back.',
    tools: ['Backups', 'Least privilege', 'Up-to-date patches'],
    same: 'It makes whatever it touches useless.',
    diff: 'In reality the encryption does not last 5 s: without backups, it can be permanent.',
    read: LINKS.ransomware,
  },
  memoryLeak: {
    title: 'Memory Leak',
    kind: 'threat',
    real: 'A program takes memory and never frees it. Over time it uses more and more, until the process crashes.',
    tools: ['Memory monitoring', 'Profilers', 'Planned restarts'],
    same: 'It looks small at first and grows over time.',
    diff: 'It is a bug in your own code, not an outside attack.',
    read: LINKS.memory,
  },
  botnet: {
    title: 'Botnet',
    kind: 'threat',
    real: 'A network of thousands of infected devices that an attacker controls at the same time.',
    tools: ['Anti-DDoS protection', 'Rate limiting', 'Bot detection'],
    same: 'When you stop it, it splits into many small attackers.',
    diff: 'A real botnet is thousands of machines from the start.',
    read: LINKS.botnet,
  },
  slowloris: {
    title: 'Slowloris',
    kind: 'threat',
    real: 'Opens many connections and keeps them alive by sending data very slowly. The server runs out of free connections.',
    tools: ['Short timeouts', 'Connection limit per IP', 'Reverse proxy (Nginx)'],
    same: 'It is slow and reduces the capacity of its area.',
    diff: 'It attacks the server connections, not the firing rate.',
    read: LINKS.slowloris,
  },
  blackFriday: {
    title: 'Black Friday Traffic',
    kind: 'threat',
    real: 'A huge, predictable peak of legitimate traffic: sales, launches, events.',
    tools: ['Capacity planning', 'Autoscaling', 'Load tests before the event'],
    same: 'It arrives at a known time and breaks whatever is not ready.',
    diff: 'They are real customers: the job is to scale, not to remove them.',
    read: LINKS.overload,
  },
};

/** One table per language. Both must have every concept (checked by the tests). */
export const CONCEPT_TABLES: Record<Lang, Record<ConceptId, Concept>> = { en: EN, es: ES };

/** The concept card in the current language. */
export function concept(id: ConceptId): Concept {
  return pick(CONCEPT_TABLES)[id];
}

export function conceptOf(type: DefenseType | EnemyType): ConceptId {
  return type === 'botlet' ? 'botnet' : type;
}
