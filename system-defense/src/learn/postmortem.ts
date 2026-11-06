import { DEFENSES, ENEMIES, MODES, type DefenseType, type EnemyType, type Mode } from '../config';
import type { Entity, World } from '../ecs/World';
import type { GameContext } from '../game/GameContext';
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

export const CAUSES: Record<CauseId, CauseText> = {
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
  const when = i.wave > 0 ? `en la ola ${i.wave}` : 'antes de la primera ola';
  return `"${ENEMIES[i.enemy].name}" cruzó el carril ${i.lane + 1} ${when}.`;
}

/** Architecture lesson of the level, after losing. */
export function levelLessonLoss(mode: Mode): { text: string; read: Link } {
  switch (mode) {
    case 'monolith':
      return {
        text: 'En un monolito, este único fallo tumbó todo el sistema (Single Point of Failure). En el Nivel 2, solo habría caído un servicio.',
        read: LINKS.primer,
      };
    case 'microservices':
      return {
        text: 'Los servicios aislados aguantaron los fallos uno a uno (patrón Bulkhead), pero al final cayeron todos.',
        read: LINKS.bulkhead,
      };
    case 'kubernetes':
      return {
        text: 'Self-healing reinicia los pods caídos, pero no sirve si todos caen a la vez. Hace falta capacidad de sobra.',
        read: LINKS.pods,
      };
  }
}

/** Architecture lesson of the level, after winning. */
export function levelLessonWin(mode: Mode, lanesLost: number): { text: string; read: Link } {
  switch (mode) {
    case 'monolith':
      return {
        text: `Ganaste con un único punto de fallo (${MODES.monolith.name}). En sistemas reales es arriesgado: un solo error lo tumba todo.`,
        read: LINKS.primer,
      };
    case 'microservices':
      return {
        text:
          lanesLost > 0
            ? `Cayeron ${lanesLost} servicio(s) y el resto siguió funcionando: eso es aislamiento de fallos (patrón Bulkhead).`
            : 'No cayó ningún servicio. Con microservicios, un fallo habría afectado solo a un carril (patrón Bulkhead).',
        read: LINKS.bulkhead,
      };
    case 'kubernetes':
      return {
        text:
          lanesLost > 0
            ? `${lanesLost} pod(s) cayeron y volvieron solos: eso es self-healing.`
            : 'Ningún pod cayó. Si hubiera caído alguno, Kubernetes lo habría reiniciado solo (self-healing).',
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
