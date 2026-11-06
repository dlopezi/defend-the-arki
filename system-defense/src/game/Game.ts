import { Sfx } from '../audio/Sfx';
import { CANVAS_H, CANVAS_W, DEFENSE_ORDER, DEFENSES, FIXED_DT, LANES, MODES, type Mode, type Tool } from '../config';
import { World } from '../ecs/World';
import { RenderSystem } from '../render/RenderSystem';
import { EffectSystem, SYSTEMS } from '../systems';
import { Hud } from '../ui/Hud';
import { Overlays } from '../ui/Overlays';
import { createRollback } from './factories';
import { createContext, pushBanner, type GameContext } from './GameContext';
import { saveResult } from './records';
import { loadEnabled, loadSeen, saveEnabled, saveSeen } from '../learn/prefs';

/** Max fixed steps per frame, so a slow frame cannot freeze the page. */
const MAX_STEPS = 12;

/** Owns the ECS world, the fixed-step game loop (60 Hz), sound and the input bridge. */
export class Game {
  private world = new World();
  private ctx: GameContext = createContext('monolith');
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: RenderSystem;
  private readonly hud: Hud;
  private readonly overlays: Overlays;
  private readonly sfx = new Sfx();
  private speed = 1;
  private learnEnabled = loadEnabled();
  private readonly shell: HTMLElement;
  /** True when the player left a running game with the "Menú" button. */
  private suspended = false;

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
      onSpeed: () => this.toggleSpeed(),
      onMute: () => this.sfx.toggle(),
      onMenu: () => this.toMenu(),
    });
    this.overlays = new Overlays({
      onStart: (mode) => this.start(mode),
      onResume: () => this.togglePause(),
      onMenu: () => this.toMenu(),
      getLearnEnabled: () => this.learnEnabled,
      setLearnEnabled: (on) => this.setLearnEnabled(on),
      getSuspended: () => (this.suspended ? { mode: this.ctx.mode, wave: this.ctx.wave.number } : null),
      onContinue: () => this.resumeFromMenu(),
      getMuted: () => this.sfx.muted,
      toggleMute: () => this.sfx.toggle(),
      resetSeen: () => {
        saveSeen(new Set());
        this.ctx.seen.clear();
      },
    });

    const shell = document.createElement('main');
    this.shell = shell;
    const board = document.createElement('div');
    board.className = 'board';
    this.canvas = document.createElement('canvas');
    this.canvas.style.aspectRatio = `${CANVAS_W} / ${CANVAS_H}`;
    board.append(this.canvas, this.overlays.root);
    shell.append(this.overlays.home, this.hud.root, board, this.overlays.concept);
    root.append(shell);
    this.setView('home');

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
    this.sfx.unlock();
    this.world.clear();
    this.world = new World();
    this.ctx = createContext(mode);
    this.ctx.status = 'playing';
    this.ctx.learnEnabled = this.learnEnabled;
    this.ctx.seen = loadSeen();
    this.endShown = false;
    this.acc = 0;
    const spec = MODES[mode];
    if (spec.rollback) for (let lane = 0; lane < LANES; lane++) createRollback(this.world, lane);
    const subs: Record<Mode, string> = {
      monolith: 'Un solo fallo en cualquier carril tumba todo el sistema',
      microservices: 'Cada carril es un servicio independiente',
      kubernetes: 'Los carriles caídos se reinician solos',
    };
    pushBanner(this.ctx, `NIVEL ${spec.level} · ${spec.name.toUpperCase()}`, spec.color, subs[mode], 3);
    this.suspended = false;
    this.overlays.show('none');
    this.setView('game');
  }

  /** Home view shows the menu; game view shows HUD + board. */
  private setView(view: 'home' | 'game'): void {
    this.shell.className = `shell view-${view}`;
  }

  /** "Menú": a running game is paused and kept, so it can be continued. */
  private toMenu(): void {
    const ctx = this.ctx;
    const running = ctx.status === 'playing' || ctx.status === 'paused';
    this.suspended = running;
    ctx.status = running ? 'paused' : 'menu';
    ctx.selected = null;
    ctx.inspect = null;
    ctx.input.hover = null;
    this.overlays.show('menu');
    this.setView('home');
  }

  private resumeFromMenu(): void {
    if (!this.suspended) return;
    this.suspended = false;
    this.ctx.status = 'playing';
    this.acc = 0;
    this.overlays.show('none');
    this.setView('game');
  }

  private setLearnEnabled(on: boolean): void {
    this.learnEnabled = on;
    this.ctx.learnEnabled = on;
    saveEnabled(on);
    if (!on) this.ctx.conceptQueue.length = 0;
  }

  /** Pauses the game and shows the next concept card in the queue. */
  private openNextConcept(): void {
    const ctx = this.ctx;
    const id = ctx.conceptQueue.shift();
    if (!id) return;
    saveSeen(ctx.seen);
    ctx.status = 'paused';
    this.overlays.showConcept(id, {
      inGame: true,
      onClose: (disableAll) => {
        if (this.ctx !== ctx || ctx.status !== 'paused') return;
        if (disableAll) this.setLearnEnabled(false);
        if (ctx.conceptQueue.length > 0) {
          this.openNextConcept();
          return;
        }
        ctx.status = 'playing';
        this.overlays.show('none');
      },
    });
  }

  private togglePause(): void {
    if (this.overlays.conceptOpen) {
      this.overlays.closeConcept();
      return;
    }
    if (this.ctx.status === 'playing') {
      this.ctx.status = 'paused';
      this.overlays.show('pause');
    } else if (this.ctx.status === 'paused') {
      this.ctx.status = 'playing';
      this.overlays.show('none');
    }
  }

  private toggleSpeed(): void {
    this.speed = this.speed === 1 ? 2 : 1;
  }

  private select(tool: Tool): void {
    const ctx = this.ctx;
    if (ctx.status !== 'playing') return;
    ctx.inspect = null;
    if (ctx.selected === tool) {
      ctx.selected = null;
      return;
    }
    const firstTime = tool !== 'shovel' && ctx.learnEnabled && !ctx.seen.has(tool);
    const usable = tool === 'shovel' || (ctx.cu >= DEFENSES[tool].cost && ctx.cooldowns[tool] <= 0);
    if (usable) ctx.selected = tool;
    else if (!firstTime) {
      this.hud.deny(tool);
      this.sfx.play('deny');
    }
    // The concept card helps decide whether to use this defense, so it shows on selection,
    // even when the player cannot afford it yet. The selection stays after closing it.
    if (firstTime) {
      ctx.seen.add(tool);
      ctx.conceptQueue.unshift(tool);
      this.openNextConcept();
    }
  }

  /* ---------- Game loop ---------- */

  private readonly frame = (now: number): void => {
    const real = Math.min(0.25, (now - this.last) / 1000);
    this.last = now;

    // Fixed timestep: logic always advances in 1/60 s steps, independent of display rate.
    // ×2 speed runs two logic steps per 1/60 s of real time.
    this.acc += real * this.speed;
    let steps = 0;
    while (this.acc >= FIXED_DT && steps < MAX_STEPS) {
      this.step(FIXED_DT);
      this.acc -= FIXED_DT;
      steps++;
    }
    if (steps === MAX_STEPS) this.acc = 0;

    if (this.ctx.status === 'playing' && this.ctx.conceptQueue.length > 0 && !this.overlays.conceptOpen) {
      this.openNextConcept();
    }

    for (const name of this.ctx.sfx) this.sfx.play(name);
    this.ctx.sfx.length = 0;

    this.renderer.render(this.world, this.ctx, now / 1000, this.fps);
    this.hud.update(this.ctx, { speed: this.speed, muted: this.sfx.muted });

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
      ctx.inspect = null;
      const newRecord = saveResult(ctx.mode, ctx.wave.number, ctx.status === 'victory', ctx.kills);
      window.setTimeout(() => {
        if (this.ctx === ctx) this.overlays.showEnd(ctx, newRecord);
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
      this.sfx.unlock();
      if (e.button === 2) {
        this.ctx.selected = null;
        this.ctx.inspect = null;
        return;
      }
      if (e.button === 0 && this.ctx.status === 'playing') {
        const pos = this.toLogical(e);
        this.ctx.input.clicks.push(pos);
        // Touch has no hover: the tap position works as the pointer position.
        this.ctx.input.hover = pos;
      }
    });
    this.canvas.addEventListener('pointermove', (e) => {
      this.ctx.input.hover = this.toLogical(e);
    });
    this.canvas.addEventListener('pointerleave', (e) => {
      // A finger "leaves" right after every tap; only a mouse really leaves the board.
      if (e.pointerType === 'mouse') this.ctx.input.hover = null;
    });

    window.addEventListener('pointerdown', () => this.sfx.unlock());
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.sfx.unlock();
      const key = e.key.toLowerCase();
      if (this.overlays.conceptOpen) {
        if (key === 'enter' || key === 'escape') {
          e.preventDefault();
          this.overlays.closeConcept();
        }
        return;
      }
      if (this.shell.classList.contains('view-home')) {
        if (key === 'escape') this.overlays.homeBack();
        return;
      }
      const def = DEFENSE_ORDER.find((d) => DEFENSES[d].hotkey === key);
      if (def) this.select(def);
      else if (key === 'q' || key === 'x') this.select('shovel');
      else if (key === 'f') this.toggleSpeed();
      else if (key === 'm') this.sfx.toggle();
      else if (key === 'escape') {
        this.ctx.selected = null;
        this.ctx.inspect = null;
      } else if (key === 'p' || key === ' ') {
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
