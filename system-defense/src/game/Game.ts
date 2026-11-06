import { CANVAS_H, CANVAS_W, DEFENSE_ORDER, DEFENSES, FIXED_DT, type Mode, type Tool } from '../config';
import { World } from '../ecs/World';
import { RenderSystem } from '../render/RenderSystem';
import { EffectSystem, SYSTEMS } from '../systems';
import { Hud } from '../ui/Hud';
import { Overlays } from '../ui/Overlays';
import { createContext, pushBanner, type GameContext } from './GameContext';

/** Owns the ECS world, the fixed-step game loop (60 Hz) and the input bridge. */
export class Game {
  private world = new World();
  private ctx: GameContext = createContext('monolith');
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: RenderSystem;
  private readonly hud: Hud;
  private readonly overlays: Overlays;

  private last = 0;
  private acc = 0;
  private fps = 60;
  private fpsFrames = 0;
  private fpsTime = 0;
  private endShown = false;

  constructor(root: HTMLElement) {
    this.hud = new Hud({
      onSelect: (tool) => this.select(tool),
      onPause: () => this.togglePause(),
      onMenu: () => this.toMenu(),
    });
    this.overlays = new Overlays({
      onStart: (mode) => this.start(mode),
      onResume: () => this.togglePause(),
      onMenu: () => this.toMenu(),
    });

    const shell = document.createElement('main');
    shell.className = 'shell';
    const board = document.createElement('div');
    board.className = 'board';
    this.canvas = document.createElement('canvas');
    board.append(this.canvas, this.overlays.root);
    shell.append(this.hud.root, board);
    root.append(shell);

    const g = this.canvas.getContext('2d');
    if (!g) throw new Error('Canvas 2D not supported');
    this.renderer = new RenderSystem(g);
    this.resizeCanvas(g);
    window.addEventListener('resize', () => this.resizeCanvas(g));

    this.bindInput();
    requestAnimationFrame((t) => {
      this.last = t;
      requestAnimationFrame(this.frame);
    });
  }

  start(mode: Mode): void {
    this.world.clear();
    this.world = new World();
    this.ctx = createContext(mode);
    this.ctx.status = 'playing';
    this.endShown = false;
    this.acc = 0;
    pushBanner(
      this.ctx,
      mode === 'monolith' ? 'NIVEL 1 · MONOLITO' : 'NIVEL 2 · MICROSERVICIOS',
      mode === 'monolith' ? '#38bdf8' : '#34d399',
      mode === 'monolith' ? 'Un solo fallo en cualquier carril tumba todo el sistema' : 'Cada carril es un servicio independiente',
      3,
    );
    this.overlays.show('none');
  }

  private toMenu(): void {
    this.ctx.status = 'menu';
    this.ctx.selected = null;
    this.overlays.show('menu');
  }

  private togglePause(): void {
    if (this.ctx.status === 'playing') {
      this.ctx.status = 'paused';
      this.overlays.show('pause');
    } else if (this.ctx.status === 'paused') {
      this.ctx.status = 'playing';
      this.overlays.show('none');
    }
  }

  private select(tool: Tool): void {
    const ctx = this.ctx;
    if (ctx.status !== 'playing') return;
    if (ctx.selected === tool) {
      ctx.selected = null;
      return;
    }
    if (tool !== 'shovel' && (ctx.cu < DEFENSES[tool].cost || ctx.cooldowns[tool] > 0)) {
      this.hud.deny(tool);
      return;
    }
    ctx.selected = tool;
  }

  /* ---------- Game loop ---------- */

  private readonly frame = (now: number): void => {
    const real = Math.min(0.25, (now - this.last) / 1000);
    this.last = now;

    // Fixed timestep: logic always advances in 1/60 s steps, independent of display rate.
    this.acc += real;
    while (this.acc >= FIXED_DT) {
      this.step(FIXED_DT);
      this.acc -= FIXED_DT;
    }

    this.renderer.render(this.world, this.ctx, now / 1000, this.fps);
    this.hud.update(this.ctx);

    this.fpsFrames++;
    this.fpsTime += real;
    if (this.fpsTime >= 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsTime);
      this.fpsFrames = 0;
      this.fpsTime = 0;
    }
    requestAnimationFrame(this.frame);
  };

  private step(dt: number): void {
    const ctx = this.ctx;
    if (ctx.status === 'playing') {
      for (const system of SYSTEMS) {
        system.update(this.world, ctx, dt);
        if (ctx.status !== 'playing') break;
      }
      this.world.flush();
      ctx.time += dt;
    } else if (ctx.status === 'gameover' || ctx.status === 'victory') {
      // Let explosions and particles finish after the end.
      EffectSystem.update(this.world, ctx, dt);
      this.world.flush();
    }

    if ((ctx.status === 'gameover' || ctx.status === 'victory') && !this.endShown) {
      this.endShown = true;
      ctx.selected = null;
      window.setTimeout(() => {
        if (this.ctx === ctx) this.overlays.showEnd(ctx);
      }, 900);
    }
  }

  /* ---------- Input bridge: DOM events -> context queue (processed by InputSystem) ---------- */

  private toLogical(e: PointerEvent): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * CANVAS_W, y: ((e.clientY - r.top) / r.height) * CANVAS_H };
  }

  private bindInput(): void {
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.button === 2) {
        this.ctx.selected = null;
        return;
      }
      if (e.button === 0 && this.ctx.status === 'playing') this.ctx.input.clicks.push(this.toLogical(e));
    });
    this.canvas.addEventListener('pointermove', (e) => {
      this.ctx.input.hover = this.toLogical(e);
    });
    this.canvas.addEventListener('pointerleave', () => {
      this.ctx.input.hover = null;
    });

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      const def = DEFENSE_ORDER.find((d) => DEFENSES[d].hotkey === key);
      if (def) this.select(def);
      else if (key === 'q' || key === 'x') this.select('shovel');
      else if (key === 'escape') this.ctx.selected = null;
      else if (key === 'p' || key === ' ') {
        e.preventDefault();
        this.togglePause();
      }
    });
    window.addEventListener('blur', () => {
      if (this.ctx.status === 'playing') this.togglePause();
    });
  }

  private resizeCanvas(g: CanvasRenderingContext2D): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = CANVAS_W * dpr;
    this.canvas.height = CANVAS_H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}
