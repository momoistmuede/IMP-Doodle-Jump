import { EFFECTS, type SoundName } from './effects';
import { TRACKS, type TrackName } from './music';
import { renderTones, renderTrack } from './synth';

/**
 * Plays the effects and the music via the Web Audio API (see docs/konzept-arcade.md, 6.3).
 * Browsers only allow audio after a user action, so `unlock` must be called from a click or key
 * press; until then every call is silently ignored. All effects are rendered once on unlock and play
 * without delay, also several at once.
 */
export interface SoundSettings {
  muted: boolean;
  /** 0..1 */
  music: number;
  /** 0..1 */
  effects: number;
}

const STORAGE_KEY = 'imp-jump.sound';
const DEFAULT_SETTINGS: SoundSettings = { muted: false, music: 0.6, effects: 0.8 };
const SAMPLE_RATE = 22050;
/** Low-pass cut-off while the music is muffled (parachute). */
const MUFFLED_HZ = 700;

interface PlayOptions {
  /** Pitch change in cents. */
  detune?: number;
  /** 0..1, on top of the effects volume. */
  volume?: number;
  /** Seconds from now. */
  delay?: number;
}

interface Playing {
  name: TrackName;
  source: AudioBufferSourceNode;
  gain: GainNode;
}

export class SoundManager {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private effectsGain!: GainNode;
  private musicGain!: GainNode;
  private musicFilter!: BiquadFilterNode;
  private readonly effectBuffers = new Map<SoundName, AudioBuffer>();
  private readonly trackBuffers = new Map<TrackName, AudioBuffer>();
  private music: Playing | null = null;
  /** Wanted track; remembered before unlock, so the title music starts with the first key press. */
  private wanted: TrackName | null = null;
  private settings: SoundSettings = loadSettings();
  private readonly listeners = new Set<() => void>();

  /** Creates the AudioContext; call from a user action. */
  unlock() {
    if (!this.ctx) {
      const ctx = new AudioContext();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.connect(ctx.destination);
      this.effectsGain = ctx.createGain();
      this.effectsGain.connect(this.master);
      this.musicFilter = ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 20000;
      this.musicGain = ctx.createGain();
      this.musicFilter.connect(this.musicGain).connect(this.master);
      for (const name of Object.keys(EFFECTS) as SoundName[]) {
        this.effectBuffers.set(name, this.buffer(renderTones(EFFECTS[name], SAMPLE_RATE)));
      }
      this.applySettings();
      if (this.wanted) {
        const track = this.wanted;
        this.wanted = null;
        this.playMusic(track);
      }
    }
    void this.ctx.resume();
  }

  /** Plays an effect; returns a function that stops it early (e.g. the wind when the intro is skipped). */
  play(name: SoundName, options: PlayOptions = {}): () => void {
    const ctx = this.ctx;
    const buffer = this.effectBuffers.get(name);
    if (!ctx || !buffer) {
      return () => {};
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = Math.pow(2, (options.detune ?? 0) / 1200);
    const gain = ctx.createGain();
    gain.gain.value = options.volume ?? 1;
    source.connect(gain).connect(this.effectsGain);
    source.start(ctx.currentTime + (options.delay ?? 0));
    return () => {
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      source.stop(ctx.currentTime + 0.3);
    };
  }

  /** Cross-fades to a looping track; does nothing if it is already playing. */
  playMusic(name: TrackName, fadeSeconds = 2) {
    const ctx = this.ctx;
    if (!ctx) {
      this.wanted = name;
      return;
    }
    if (this.music?.name === name) {
      return;
    }
    this.stopMusic(fadeSeconds);
    let buffer = this.trackBuffers.get(name);
    if (!buffer) {
      buffer = this.buffer(renderTrack(TRACKS[name], SAMPLE_RATE));
      this.trackBuffers.set(name, buffer);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(fadeSeconds > 0 ? 0 : 1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + fadeSeconds);
    source.connect(gain).connect(this.musicFilter);
    source.start();
    this.music = { name, source, gain };
  }

  stopMusic(fadeSeconds = 0) {
    this.wanted = null;
    const ctx = this.ctx;
    const music = this.music;
    if (!ctx || !music) {
      return;
    }
    this.music = null;
    music.gain.gain.cancelScheduledValues(ctx.currentTime);
    music.gain.gain.setValueAtTime(music.gain.gain.value, ctx.currentTime);
    music.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeSeconds);
    music.source.stop(ctx.currentTime + fadeSeconds + 0.05);
  }

  /** Quieter and dull music, e.g. on the parachute. */
  setMuffled(muffled: boolean) {
    if (!this.ctx) {
      return;
    }
    this.musicFilter.frequency.setTargetAtTime(muffled ? MUFFLED_HZ : 20000, this.ctx.currentTime, 0.2);
    this.musicFilter.Q.value = 0.7;
    this.musicGain.gain.setTargetAtTime(this.settings.music * (muffled ? 0.5 : 1), this.ctx.currentTime, 0.2);
  }

  get current(): SoundSettings {
    return this.settings;
  }

  update(change: Partial<SoundSettings>) {
    this.settings = { ...this.settings, ...change };
    saveSettings(this.settings);
    this.applySettings();
    this.listeners.forEach((listener) => listener());
  }

  toggleMute() {
    this.update({ muted: !this.settings.muted });
  }

  /** For React's useSyncExternalStore. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private applySettings() {
    if (!this.ctx) {
      return;
    }
    this.master.gain.value = this.settings.muted ? 0 : 1;
    this.effectsGain.gain.value = this.settings.effects;
    this.musicGain.gain.value = this.settings.music;
  }

  private buffer(samples: Float32Array): AudioBuffer {
    const buffer = this.ctx!.createBuffer(1, Math.max(1, samples.length), SAMPLE_RATE);
    buffer.copyToChannel(samples as Float32Array<ArrayBuffer>, 0);
    return buffer;
  }
}

function loadSettings(): SoundSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<SoundSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: SoundSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore: only a convenience
  }
}

export const sound = new SoundManager();
