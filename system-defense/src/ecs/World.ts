import type { ComponentMap } from '../components';

/** An entity is only an id. All data lives in component stores. */
export type Entity = number;
export type ComponentKey = keyof ComponentMap;

/**
 * Minimal ECS world.
 * - Components are plain data objects stored per type (one Map per component key).
 * - Systems query entities by the set of components they need.
 * - Destruction is deferred until `flush()` so systems can safely iterate.
 */
export class World {
  private nextId = 1;
  private readonly entities = new Set<Entity>();
  private readonly stores = new Map<ComponentKey, Map<Entity, unknown>>();
  private readonly pendingDestroy = new Set<Entity>();

  create(): Entity {
    const e = this.nextId++;
    this.entities.add(e);
    return e;
  }

  add<K extends ComponentKey>(e: Entity, key: K, data: ComponentMap[K]): ComponentMap[K] {
    this.storeOf(key).set(e, data);
    return data;
  }

  get<K extends ComponentKey>(e: Entity, key: K): ComponentMap[K] | undefined {
    return this.storeOf(key).get(e);
  }

  /** Get a component that must exist (use after a query that includes it). */
  req<K extends ComponentKey>(e: Entity, key: K): ComponentMap[K] {
    const c = this.storeOf(key).get(e);
    if (c === undefined) throw new Error(`Entity ${e} has no component "${key}"`);
    return c;
  }

  has(e: Entity, key: ComponentKey): boolean {
    return this.storeOf(key).has(e);
  }

  remove(e: Entity, key: ComponentKey): void {
    this.storeOf(key).delete(e);
  }

  isAlive(e: Entity): boolean {
    return this.entities.has(e) && !this.pendingDestroy.has(e);
  }

  /** Mark an entity for removal. It is removed at the end of the tick. */
  destroy(e: Entity): void {
    if (this.entities.has(e)) this.pendingDestroy.add(e);
  }

  flush(): void {
    if (this.pendingDestroy.size === 0) return;
    for (const e of this.pendingDestroy) {
      for (const store of this.stores.values()) store.delete(e);
      this.entities.delete(e);
    }
    this.pendingDestroy.clear();
  }

  /** All live entities that have every listed component. */
  query(...keys: ComponentKey[]): Entity[] {
    const out: Entity[] = [];
    if (keys.length === 0) return out;
    let smallest = this.storeOf(keys[0]);
    for (const k of keys) {
      const s = this.storeOf(k);
      if (s.size < smallest.size) smallest = s;
    }
    outer: for (const e of smallest.keys()) {
      if (this.pendingDestroy.has(e)) continue;
      for (const k of keys) {
        if (!this.storeOf(k).has(e)) continue outer;
      }
      out.push(e);
    }
    return out;
  }

  get size(): number {
    return this.entities.size - this.pendingDestroy.size;
  }

  clear(): void {
    this.entities.clear();
    this.stores.clear();
    this.pendingDestroy.clear();
  }

  private storeOf<K extends ComponentKey>(key: K): Map<Entity, ComponentMap[K]> {
    let s = this.stores.get(key);
    if (!s) {
      s = new Map();
      this.stores.set(key, s);
    }
    return s as Map<Entity, ComponentMap[K]>;
  }
}
