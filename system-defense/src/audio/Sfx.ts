import type { SoundName } from '../game/GameContext';

const STORAGE_KEY = 'system-defense:muted';
/** Minimum seconds between two plays of the same sound. */
const THROTTLE: Partial<Record<SoundName, number>> = { shoot: 0.09, collect: 0.05, capture: 0.1, split: 0.1, menuMove: 0.06 };

/** Small synthesizer with Web Audio: no audio files needed. */
export class Sfx {
  muted: boolean;
  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly last = new Map<SoundName, number>();

  constructor() {
    let muted = false;
    try {
      muted = localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      /* storage blocked: default to sound on */
    }
    this.muted = muted;
  }

  /**
   * Browsers only allow audio after a user gesture. Call this from input handlers.
   * On a phone, only the END of a touch counts (pointerup, touchend, click), not pointerdown.
   */
  unlock(): void {
    try {
      if (!this.ac) {
        this.ac = new AudioContext();
        this.master = this.ac.createGain();
        this.master.gain.value = 0.22;
        this.master.connect(this.ac.destination);
      }
      // 'suspended' before the first gesture; on iPhone also 'interrupted' after a call,
      // the lock screen or an app switch. Any state but 'running' needs a resume.
      if ((this.ac.state as string) !== 'running' && this.ac.state !== 'closed') {
        this.ac.resume().catch(() => undefined);
        // Older iPhones only unlock when a sound starts inside the gesture: a silent one.
        const src = this.ac.createBufferSource();
        src.buffer = this.ac.createBuffer(1, 1, 22050);
        src.connect(this.ac.destination);
        src.start();
      }
    } catch {
      this.ac = null;
    }
  }

  toggle(): void {
    this.muted = !this.muted;
    try {
      localStorage.setItem(STORAGE_KEY, this.muted ? '1' : '0');
    } catch {
      /* ignore */
    }
  }

  play(name: SoundName): void {
    if (this.muted || !this.ac || !this.master || this.ac.state !== 'running') return;
    const now = this.ac.currentTime;
    const gap = THROTTLE[name] ?? 0.03;
    if (now - (this.last.get(name) ?? -1) < gap) return;
    this.last.set(name, now);

    switch (name) {
      case 'shoot':
        this.tone(880, 0.05, 'square', 0.12, 1320);
        break;
      case 'place':
        this.tone(220, 0.08, 'triangle', 0.5, 330);
        break;
      case 'collect':
        this.tone(988, 0.07, 'sine', 0.4);
        this.tone(1319, 0.1, 'sine', 0.4, undefined, 0.06);
        break;
      case 'upgrade':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.09, 'triangle', 0.45, undefined, i * 0.07));
        break;
      case 'deny':
        this.tone(160, 0.12, 'sawtooth', 0.25, 120);
        break;
      case 'explode':
        this.noise(0.5, 0.9, 900);
        this.tone(110, 0.4, 'sine', 0.6, 40);
        break;
      case 'smash':
        this.noise(0.25, 0.8, 500);
        this.tone(70, 0.25, 'square', 0.4, 40);
        break;
      case 'laneDown':
        this.tone(440, 0.5, 'sawtooth', 0.35, 110);
        break;
      case 'laneUp':
        this.tone(330, 0.3, 'triangle', 0.4, 660);
        break;
      case 'gameOver':
        [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.28, 'sawtooth', 0.35, undefined, i * 0.22));
        break;
      case 'victory':
        [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.45, undefined, i * 0.12));
        break;
      case 'wave':
        this.tone(660, 0.12, 'square', 0.25);
        this.tone(660, 0.12, 'square', 0.25, undefined, 0.18);
        break;
      case 'rollback':
        this.tone(200, 0.45, 'sawtooth', 0.35, 1200);
        break;
      case 'capture':
        this.tone(300, 0.15, 'triangle', 0.4, 600);
        break;
      case 'encrypt':
        this.tone(1200, 0.06, 'square', 0.25);
        this.tone(800, 0.06, 'square', 0.25, undefined, 0.07);
        this.tone(400, 0.12, 'square', 0.25, undefined, 0.14);
        break;
      case 'split':
        this.tone(500, 0.06, 'square', 0.25, 900);
        this.tone(600, 0.06, 'square', 0.25, 1000, 0.05);
        break;
      case 'menuMove':
        this.tone(1480, 0.03, 'square', 0.08);
        break;
      case 'menuSelect':
        this.tone(660, 0.06, 'square', 0.18);
        this.tone(990, 0.09, 'square', 0.18, undefined, 0.05);
        break;
      case 'start':
        this.tone(220, 0.35, 'sawtooth', 0.22, 880);
        [523, 784, 1047].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.35, undefined, 0.25 + i * 0.08));
        break;
    }
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, delay = 0): void {
    const ac = this.ac;
    const master = this.master;
    if (!ac || !master) return;
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noise(dur: number, vol: number, cutoff: number): void {
    const ac = this.ac;
    const master = this.master;
    if (!ac || !master) return;
    const len = Math.floor(ac.sampleRate * dur);
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = ac.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(master);
    src.start();
  }
}
