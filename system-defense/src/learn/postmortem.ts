import { DEFENSES, ENEMIES, MODES, type DefenseType, type EnemyType, type Mode } from '../config';
import type { Entity, World } from '../ecs/World';
import type { GameContext } from '../game/GameContext';
import { pick, t, type Lang } from '../i18n';
import { LINKS, type Link } from './concepts';

export type CauseId =
  | 'noDefense'
  | 'wiped'
  | 'noDamage'
  | 'sqliCache'
  | 'jumped'
  | 'boss'
  | 'encrypted'
  | 'slowloris'
  | 'leak'
  | 'botnet'
  | 'overwhelmed';

/** One breach: a threat crossed the left limit of a lane. */
export interface Incident {
  wave: number;
  lane: number;
  enemy: EnemyType;
  cause: CauseId;
  time: number;
}

interface CauseText {
  root: string;
  help: string;
  lesson: string;
  read: Link;
}

const ES: Record<CauseId, CauseText> = {
  noDefense: {
    root: 'El carril no tenía ninguna defensa.',
    help: 'Pon al menos un Load Balancer en cada carril desde el principio.',
    lesson: 'Cobertura: cada ruta de entrada al sistema necesita protección. Basta un solo hueco.',
    read: LINKS.primer,
  },
  wiped: {
    root: 'Las amenazas destruyeron todas las defensas del carril.',
    help: 'Pon un muro (Redis o WAF) delante de las defensas que disparan y reemplázalo a tiempo.',
    lesson: 'Redundancia: si una pieza cae, otra debe seguir en pie.',
    read: LINKS.primer,
  },
  noDamage: {
    root: 'El carril solo tenía defensas pasivas (muros, Workers o colas). Nada dañaba a las amenazas.',
    help: 'Combina un muro con algo que dispare: Load Balancer, Rate Limiter o CDN.',
    lesson: 'Una caché o una cola dan tiempo, pero no resuelven la carga por sí solas.',
    read: LINKS.overload,
  },
  sqliCache: {
    root: 'La SQL Injection atravesó Redis: una caché no revisa el contenido de las peticiones.',
    help: 'Un WAF en ese carril habría filtrado la inyección.',
    lesson: 'Defensa en profundidad: cada capa protege de cosas distintas.',
    read: LINKS.injection,
  },
  jumped: {
    root: 'El Zero-Day saltó la primera defensa del carril.',
    help: 'Un WAF no se puede saltar. También ayuda tener más de una defensa por carril.',
    lesson: 'Defensa en profundidad: no confíes en una sola capa.',
    read: LINKS.zeroDay,
  },
  boss: {
    root: 'Black Friday destruyó las defensas de un golpe.',
    help: 'Circuit Breaker cuando se acerca, Rate Limiter para frenarlo y más daño (LB v2, CDN).',
    lesson: 'Planificación de capacidad: los picos previsibles se preparan antes, con pruebas de carga.',
    read: LINKS.overload,
  },
  encrypted: {
    root: 'El Ransomware cifró las defensas del carril y quedaron inactivas.',
    help: 'Elimínalo antes de que llegue: dispara desde lejos y ten defensas de reserva.',
    lesson: 'Resiliencia: ten copias y redundancia de lo que puede quedar fuera de servicio.',
    read: LINKS.ransomware,
  },
  slowloris: {
    root: 'Un Slowloris redujo a la mitad el ritmo de disparo del carril.',
    help: 'Elimínalo pronto: más daño en ese carril, o una CDN en un carril vecino.',
    lesson: 'Los timeouts y los límites de conexión protegen tus recursos.',
    read: LINKS.slowloris,
  },
  leak: {
    root: 'El Memory Leak creció hasta ser demasiado fuerte.',
    help: 'Ataca a los Memory Leak en cuanto aparecen, antes de que crezcan.',
    lesson: 'Monitoriza tendencias: los problemas que crecen despacio son fáciles de ignorar.',
    read: LINKS.memory,
  },
  botnet: {
    root: 'Los bots de una Botnet se repartieron y uno pasó.',
    help: 'Rate Limiter para frenarlos y disparos continuos (LB v2) para los bots pequeños.',
    lesson: 'Los ataques distribuidos necesitan defensas que escalen con el número de atacantes.',
    read: LINKS.botnet,
  },
  overwhelmed: {
    root: 'El carril tenía defensas, pero no bastaron para el volumen de tráfico.',
    help: 'Más daño (mejoras v2, CDN), Rate Limiter para ganar tiempo y más Workers al principio.',
    lesson: 'Planificación de capacidad: mide la carga y escala antes de llegar al límite.',
    read: LINKS.overload,
  },
};

const EN: Record<CauseId, CauseText> = {
  noDefense: {
    root: 'The lane had no defense at all.',
    help: 'Put at least one Load Balancer in every lane from the start.',
    lesson: 'Coverage: every way into the system needs protection. A single gap is enough.',
    read: LINKS.primer,
  },
  wiped: {
    root: 'The threats destroyed every defense in the lane.',
    help: 'Put a wall (Redis or WAF) in front of the defenses that shoot, and replace it in time.',
    lesson: 'Redundancy: if one piece falls, another one must stay up.',
    read: LINKS.primer,
  },
  noDamage: {
    root: 'The lane only had passive defenses (walls, Workers or queues). Nothing damaged the threats.',
    help: 'Combine a wall with something that shoots: Load Balancer, Rate Limiter or CDN.',
    lesson: 'A cache or a queue buys time, but it does not handle the load by itself.',
    read: LINKS.overload,
  },
  sqliCache: {
    root: 'The SQL Injection went through Redis: a cache does not check the content of requests.',
    help: 'A WAF in that lane would have filtered the injection.',
    lesson: 'Defense in depth: each layer protects against different things.',
    read: LINKS.injection,
  },
  jumped: {
    root: 'The Zero-Day jumped over the first defense of the lane.',
    help: 'A WAF cannot be jumped. Having more than one defense per lane also helps.',
    lesson: 'Defense in depth: do not trust a single layer.',
    read: LINKS.zeroDay,
  },
  boss: {
    root: 'Black Friday destroyed the defenses in one hit.',
    help: 'Circuit Breaker when it gets close, Rate Limiter to slow it down, and more damage (LB v2, CDN).',
    lesson: 'Capacity planning: predictable peaks are prepared in advance, with load tests.',
    read: LINKS.overload,
  },
  encrypted: {
    root: 'The Ransomware encrypted the defenses of the lane and they stopped working.',
    help: 'Remove it before it arrives: shoot from far away and keep spare defenses.',
    lesson: 'Resilience: keep copies and redundancy of whatever can go out of service.',
    read: LINKS.ransomware,
  },
  slowloris: {
    root: 'A Slowloris cut the firing rate of the lane in half.',
    help: 'Remove it early: more damage in that lane, or a CDN in a lane next to it.',
    lesson: 'Timeouts and connection limits protect your resources.',
    read: LINKS.slowloris,
  },
  leak: {
    root: 'The Memory Leak grew until it was too strong.',
    help: 'Attack Memory Leaks as soon as they appear, before they grow.',
    lesson: 'Watch trends: problems that grow slowly are easy to ignore.',
    read: LINKS.memory,
  },
  botnet: {
    root: 'The bots of a Botnet spread out and one got through.',
    help: 'Rate Limiter to slow them down, and constant fire (LB v2) for the small bots.',
    lesson: 'Distributed attacks need defenses that scale with the number of attackers.',
    read: LINKS.botnet,
  },
  overwhelmed: {
    root: 'The lane had defenses, but they were not enough for the traffic volume.',
    help: 'More damage (v2 upgrades, CDN), Rate Limiter to buy time, and more Workers at the start.',
    lesson: 'Capacity planning: measure the load and scale before you reach the limit.',
    read: LINKS.overload,
  },
};

const CAUSE_TABLES: Record<Lang, Record<CauseId, CauseText>> = { en: EN, es: ES };

/** Why a threat got through, in the current language. */
export function cause(id: CauseId): CauseText {
  return pick(CAUSE_TABLES)[id];
}

/** Works out why a threat got through. Called by BreachSystem before the lane is cleared. */
export function diagnose(world: World, ctx: GameContext, lane: number, enemy: Entity): CauseId {
  const type = world.req(enemy, 'enemy').type;
  if (type === 'blackFriday') return 'boss';

  const defs = ctx.grid[lane].filter((e): e is Entity => e !== null && world.isAlive(e));
  if (defs.length === 0) return ctx.laneLosses[lane] > 0 ? 'wiped' : 'noDefense';

  const types = defs.map((e) => world.req(e, 'defense').type);
  const has = (t: DefenseType) => types.includes(t);
  if (type === 'sqli' && has('redis') && !has('waf')) return 'sqliCache';
  if (type === 'zeroDay' && world.get(enemy, 'jumper')?.jumped && !has('waf')) return 'jumped';

  const shooters = defs.filter((e) => world.has(e, 'shooter'));
  if (shooters.length > 0 && shooters.every((e) => world.has(e, 'encrypted'))) return 'encrypted';
  if (ctx.laneThrottled[lane]) return 'slowloris';
  if (type === 'memoryLeak') return 'leak';
  if (type === 'botlet') return 'botnet';

  const cdnNearby = [lane - 1, lane + 1].some((l) =>
    (ctx.grid[l] ?? []).some((e) => e !== null && world.get(e, 'defense')?.type === 'cdn'),
  );
  if (shooters.length === 0 && !cdnNearby) return 'noDamage';
  return 'overwhelmed';
}

export function describeIncident(i: Incident): string {
  const name = ENEMIES[i.enemy].name;
  if (i.wave > 0) return t(`"${name}" crossed lane ${i.lane + 1} in wave ${i.wave}.`, `"${name}" cruzó el carril ${i.lane + 1} en la ola ${i.wave}.`);
  return t(`"${name}" crossed lane ${i.lane + 1} before the first wave.`, `"${name}" cruzó el carril ${i.lane + 1} antes de la primera ola.`);
}

/** Architecture lesson of the level, after losing. */
export function levelLessonLoss(mode: Mode): { text: string; read: Link } {
  switch (mode) {
    case 'monolith':
      return {
        text: t(
          'In a monolith, this one failure brought the whole system down (Single Point of Failure). In Level 2, only one service would have fallen.',
          'En un monolito, este único fallo tumbó todo el sistema (Single Point of Failure). En el Nivel 2, solo habría caído un servicio.',
        ),
        read: LINKS.primer,
      };
    case 'microservices':
      return {
        text: t(
          'The isolated services held the failures one by one (Bulkhead pattern), but in the end they all fell.',
          'Los servicios aislados aguantaron los fallos uno a uno (patrón Bulkhead), pero al final cayeron todos.',
        ),
        read: LINKS.bulkhead,
      };
    case 'kubernetes':
      return {
        text: t(
          'Self-healing restarts fallen pods, but it does not help if they all fall at once. You need spare capacity.',
          'Self-healing reinicia los pods caídos, pero no sirve si todos caen a la vez. Hace falta capacidad de sobra.',
        ),
        read: LINKS.pods,
      };
  }
}

/** Architecture lesson of the level, after winning. */
export function levelLessonWin(mode: Mode, lanesLost: number): { text: string; read: Link } {
  switch (mode) {
    case 'monolith':
      return {
        text: t(
          `You won with a single point of failure (${MODES.monolith.name}). In real systems it is risky: one error brings everything down.`,
          `Ganaste con un único punto de fallo (${MODES.monolith.name}). En sistemas reales es arriesgado: un solo error lo tumba todo.`,
        ),
        read: LINKS.primer,
      };
    case 'microservices':
      return {
        text:
          lanesLost > 0
            ? t(
                `${lanesLost} service(s) fell and the rest kept working: that is failure isolation (Bulkhead pattern).`,
                `Cayeron ${lanesLost} servicio(s) y el resto siguió funcionando: eso es aislamiento de fallos (patrón Bulkhead).`,
              )
            : t(
                'No service fell. With microservices, a failure would have hit only one lane (Bulkhead pattern).',
                'No cayó ningún servicio. Con microservicios, un fallo habría afectado solo a un carril (patrón Bulkhead).',
              ),
        read: LINKS.bulkhead,
      };
    case 'kubernetes':
      return {
        text:
          lanesLost > 0
            ? t(`${lanesLost} pod(s) fell and came back by themselves: that is self-healing.`, `${lanesLost} pod(s) cayeron y volvieron solos: eso es self-healing.`)
            : t(
                'No pod fell. If one had, Kubernetes would have restarted it by itself (self-healing).',
                'Ningún pod cayó. Si hubiera caído alguno, Kubernetes lo habría reiniciado solo (self-healing).',
              ),
        read: LINKS.pods,
      };
  }
}

/** Most placed defenses, for the retrospective. */
export function topDefenses(placed: Record<DefenseType, number>, n = 3): string[] {
  return (Object.entries(placed) as [DefenseType, number][])
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([t, c]) => `${DEFENSES[t].name} ×${c}`);
}
