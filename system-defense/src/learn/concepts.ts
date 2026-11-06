import type { DefenseType, EnemyType } from '../config';

/** Every element that has a concept card. Botlets share the Botnet card. */
export type ConceptId = DefenseType | Exclude<EnemyType, 'botlet'> | 'rollback';

export interface Link {
  label: string;
  url: string;
}

export interface Concept {
  title: string;
  kind: 'Defensa' | 'Amenaza';
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

export const CONCEPTS: Record<ConceptId, Concept> = {
  worker: {
    title: 'Worker Node',
    kind: 'Defensa',
    real: 'Un nodo de cómputo: una máquina o un contenedor que ejecuta tu código. Más nodos dan más capacidad, y también más coste.',
    tools: ['AWS EC2', 'Contenedores Docker', 'Nodos de Kubernetes'],
    same: 'Más nodos te dan más capacidad para crecer.',
    diff: 'Un nodo real no "genera dinero": cuesta dinero cada hora que está encendido.',
    read: LINKS.primer,
  },
  loadBalancer: {
    title: 'Load Balancer',
    kind: 'Defensa',
    real: 'Reparte las peticiones entre varios servidores para que ninguno se sature. Si un servidor cae, envía el tráfico a los demás.',
    tools: ['Nginx', 'HAProxy', 'AWS Application Load Balancer'],
    same: 'Gestiona el tráfico que llega por su ruta.',
    diff: 'Un balanceador real no destruye peticiones: las reparte. "200 OK" significa una petición bien servida.',
    read: LINKS.lb,
  },
  redis: {
    title: 'Redis Cache',
    kind: 'Defensa',
    real: 'Una caché guarda en memoria las respuestas que se piden mucho. Así esas peticiones no llegan a la base de datos.',
    tools: ['Redis', 'Memcached', 'Varnish'],
    same: 'Absorbe tráfico y protege lo que tiene detrás.',
    diff: 'Una caché no bloquea peticiones: las responde rápido. Si el dato no está (cache miss), la petición sigue su camino.',
    read: LINKS.caching,
  },
  rateLimiter: {
    title: 'Rate Limiter',
    kind: 'Defensa',
    real: 'Limita cuántas peticiones puede hacer un cliente por segundo. Si se pasa, responde HTTP 429 Too Many Requests.',
    tools: ['Nginx limit_req', 'API Gateway', 'Cloudflare Rate Limiting'],
    same: 'Frena a quien envía demasiado tráfico.',
    diff: 'No hace daño: rechaza o retrasa las peticiones que sobran.',
    read: LINKS.rateLimit,
  },
  circuitBreaker: {
    title: 'Circuit Breaker',
    kind: 'Defensa',
    real: 'Si un servicio falla muchas veces, el circuito se "abre" y se dejan de enviar llamadas durante un tiempo. Así el fallo no se extiende a otros servicios.',
    tools: ['Resilience4j', 'Polly (.NET)', 'Istio / service mesh'],
    same: 'Corta de golpe un problema en una zona concreta.',
    diff: 'Un circuit breaker real NO explota ni elimina tráfico: deja de llamar a un servicio enfermo y le da tiempo a recuperarse.',
    read: LINKS.circuitBreaker,
  },
  waf: {
    title: 'WAF · Web Application Firewall',
    kind: 'Defensa',
    real: 'Revisa cada petición HTTP y bloquea ataques conocidos, como la inyección SQL o el XSS.',
    tools: ['Cloudflare WAF', 'AWS WAF', 'ModSecurity'],
    same: 'Filtra ataques que otras capas dejan pasar.',
    diff: 'Un WAF no es un muro: analiza el contenido de cada petición.',
    read: LINKS.waf,
  },
  cdn: {
    title: 'CDN Edge',
    kind: 'Defensa',
    real: 'Una red de servidores repartidos por el mundo. Sirve el contenido desde el punto más cercano al usuario y quita carga a tu servidor.',
    tools: ['Cloudflare', 'AWS CloudFront', 'Akamai'],
    same: 'Cubre varias zonas a la vez.',
    diff: 'Una CDN no dispara: entrega contenido y absorbe tráfico en el borde de la red (edge).',
    read: LINKS.cdn,
  },
  kafka: {
    title: 'Kafka · Message Queue',
    kind: 'Defensa',
    real: 'Una cola guarda mensajes y los entrega después. Así un pico de tráfico no tumba al servicio que los procesa.',
    tools: ['Apache Kafka', 'RabbitMQ', 'AWS SQS'],
    same: 'Retiene trabajo y lo suelta más tarde.',
    diff: 'Una cola real no "atrapa" atacantes: guarda trabajo legítimo para procesarlo a su ritmo.',
    read: LINKS.kafka,
  },
  rollback: {
    title: 'Rollback',
    kind: 'Defensa',
    real: 'Volver rápido a la última versión estable cuando un despliegue sale mal.',
    tools: ['Blue/green deployment', 'kubectl rollout undo', 'Feature flags'],
    same: 'Es tu salvavidas cuando todo lo demás falla, y solo sirve si lo preparas antes.',
    diff: 'Un rollback real no elimina tráfico: deshace un cambio de código o de configuración.',
    read: LINKS.blueGreen,
  },
  normal: {
    title: 'Tráfico Normal',
    kind: 'Amenaza',
    real: 'Peticiones de usuarios reales. Aunque son buenas, si llegan demasiadas a la vez también pueden tumbar un sistema.',
    tools: ['Balanceo de carga', 'Autoescalado', 'Pruebas de carga (k6)'],
    same: 'Llega en cantidad y hay que atenderlo.',
    diff: 'En la vida real no quieres eliminar a tus usuarios: quieres servirlos bien.',
    read: LINKS.overload,
  },
  scraper: {
    title: 'Scraper Bot',
    kind: 'Amenaza',
    real: 'Bots que descargan tu web de forma automática para copiar datos o precios.',
    tools: ['Rate limiting', 'Detección de bots', 'CAPTCHA'],
    same: 'Gasta tus recursos sin aportar valor.',
    diff: 'Un scraper no rompe tus servidores: los usa en exceso.',
    read: LINKS.scraping,
  },
  ddos: {
    title: 'Ataque DDoS',
    kind: 'Amenaza',
    real: 'Miles de máquinas envían tráfico a la vez para saturar tu servicio y dejarlo sin respuesta.',
    tools: ['Protección en el borde (CDN)', 'Rate limiting', 'Servicios anti-DDoS'],
    same: 'Su fuerza está en el volumen enorme.',
    diff: 'Un DDoS real llega desde muchos sitios a la vez, no como un solo bloque.',
    read: LINKS.ddos,
  },
  zeroDay: {
    title: 'Zero-Day Exploit',
    kind: 'Amenaza',
    real: 'Un fallo de seguridad que nadie conocía todavía. No hay parche, así que supera defensas que solo conocen ataques antiguos.',
    tools: ['Defensa en profundidad', 'WAF', 'Parchear rápido'],
    same: 'Supera una primera capa de defensa.',
    diff: 'No "salta" físicamente: aprovecha un error del software.',
    read: LINKS.zeroDay,
  },
  sqli: {
    title: 'SQL Injection',
    kind: 'Amenaza',
    real: 'Un atacante mete código SQL dentro de un dato (por ejemplo, en un formulario) para leer o borrar tu base de datos.',
    tools: ['Consultas parametrizadas', 'WAF', 'Validar las entradas'],
    same: 'Una caché no la detiene: hay que revisar el contenido.',
    diff: 'La defensa principal real está en tu código: usar consultas parametrizadas.',
    read: LINKS.injection,
  },
  ransomware: {
    title: 'Ransomware',
    kind: 'Amenaza',
    real: 'Un programa malicioso cifra tus datos o sistemas y pide un rescate para devolverlos.',
    tools: ['Copias de seguridad', 'Mínimos privilegios', 'Parches al día'],
    same: 'Deja inservible lo que toca.',
    diff: 'En la realidad el cifrado no dura 5 s: sin copias de seguridad, puede ser permanente.',
    read: LINKS.ransomware,
  },
  memoryLeak: {
    title: 'Memory Leak',
    kind: 'Amenaza',
    real: 'Un programa reserva memoria y no la libera. Con el tiempo usa cada vez más, hasta que el proceso cae.',
    tools: ['Monitorizar la memoria', 'Profilers', 'Reinicios controlados'],
    same: 'Al principio parece pequeño y crece con el tiempo.',
    diff: 'Es un bug de tu propio código, no un ataque externo.',
    read: LINKS.memory,
  },
  botnet: {
    title: 'Botnet',
    kind: 'Amenaza',
    real: 'Una red de miles de dispositivos infectados que un atacante controla a la vez.',
    tools: ['Protección anti-DDoS', 'Rate limiting', 'Detección de bots'],
    same: 'Al pararla, se reparte en muchos atacantes pequeños.',
    diff: 'Una botnet real ya son miles de máquinas desde el principio.',
    read: LINKS.botnet,
  },
  slowloris: {
    title: 'Slowloris',
    kind: 'Amenaza',
    real: 'Abre muchas conexiones y las mantiene vivas enviando datos muy despacio. El servidor se queda sin conexiones libres.',
    tools: ['Timeouts cortos', 'Límite de conexiones por IP', 'Proxy inverso (Nginx)'],
    same: 'Va lento y reduce la capacidad de su zona.',
    diff: 'Ataca las conexiones del servidor, no la velocidad de disparo.',
    read: LINKS.slowloris,
  },
  blackFriday: {
    title: 'Black Friday Traffic',
    kind: 'Amenaza',
    real: 'Un pico enorme de tráfico legítimo y previsible: rebajas, lanzamientos, eventos.',
    tools: ['Planificación de capacidad', 'Autoescalado', 'Pruebas de carga antes del evento'],
    same: 'Llega en un momento conocido y rompe lo que no está preparado.',
    diff: 'Son clientes reales: se trata de escalar, no de eliminarlos.',
    read: LINKS.overload,
  },
};

export function conceptOf(type: DefenseType | EnemyType): ConceptId {
  return type === 'botlet' ? 'botnet' : type;
}
