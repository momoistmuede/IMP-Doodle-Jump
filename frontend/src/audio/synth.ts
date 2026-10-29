/**
 * A tiny 8-bit synthesizer in the spirit of sfxr: square, triangle, saw and noise waves with pitch
 * glides and simple envelopes. Effects and music are rendered once into sample arrays; the
 * SoundManager turns them into AudioBuffers. Pure functions, so they are testable without a browser.
 */

export type Wave = 'square' | 'triangle' | 'saw' | 'sine' | 'noise';

export interface Tone {
  wave: Wave;
  /** Frequency in Hz; for noise the rate of new random values (low = rumbling, high = hissing). */
  freq: number;
  /** End frequency; the pitch glides exponentially from `freq` to `to`. */
  to?: number;
  /** Seconds. */
  duration: number;
  /** Start in seconds; by default right after the previous tone. */
  at?: number;
  /** 0..1, default 0.5. */
  volume?: number;
  /** Pulse width of square waves, default 0.5. */
  duty?: number;
  /** 'fade' (default) decays over the whole tone, 'hold' keeps the volume and releases at the end. */
  envelope?: 'fade' | 'hold';
  /** Vibrato: depth in semitones and rate in Hz. */
  vibrato?: { depth: number; rate: number };
}

const ATTACK = 0.004;
const RELEASE = 0.03;

/** Renders tones (mixed where they overlap) into mono samples in -1..1. */
export function renderTones(tones: readonly Tone[], sampleRate: number, seed = 1): Float32Array {
  let cursor = 0;
  const placed = tones.map((tone) => {
    const start = tone.at ?? cursor;
    cursor = start + tone.duration;
    return { tone, start };
  });
  const length = Math.ceil(Math.max(0, ...placed.map((p) => p.start + p.tone.duration)) * sampleRate);
  const out = new Float32Array(length);
  const random = lcg(seed);
  for (const { tone, start } of placed) {
    addTone(out, tone, Math.round(start * sampleRate), sampleRate, random);
  }
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.tanh(out[i]); // soft clipping where tones overlap
  }
  return out;
}

function addTone(out: Float32Array, tone: Tone, offset: number, sampleRate: number, random: () => number) {
  const samples = Math.round(tone.duration * sampleRate);
  const volume = tone.volume ?? 0.5;
  const duty = tone.duty ?? 0.5;
  const to = tone.to ?? tone.freq;
  let phase = 0;
  let noise = random() * 2 - 1;
  for (let i = 0; i < samples && offset + i < out.length; i++) {
    const t = i / sampleRate;
    const progress = i / samples;
    let freq = tone.freq * Math.pow(to / tone.freq, progress);
    if (tone.vibrato) {
      freq *= Math.pow(2, (tone.vibrato.depth * Math.sin(2 * Math.PI * tone.vibrato.rate * t)) / 12);
    }
    const previous = phase;
    phase += freq / sampleRate;
    const p = phase % 1;
    let value: number;
    switch (tone.wave) {
      case 'square':
        value = p < duty ? 1 : -1;
        break;
      case 'triangle':
        value = 4 * Math.abs(p - 0.5) - 1;
        break;
      case 'saw':
        value = 2 * p - 1;
        break;
      case 'sine':
        value = Math.sin(2 * Math.PI * p);
        break;
      case 'noise':
        if (Math.floor(phase) !== Math.floor(previous)) {
          noise = random() * 2 - 1;
        }
        value = noise;
        break;
    }
    out[offset + i] += value * volume * envelope(tone, t, progress);
  }
}

function envelope(tone: Tone, t: number, progress: number): number {
  const attack = Math.min(1, t / ATTACK);
  if (tone.envelope === 'hold') {
    const left = tone.duration - t;
    return attack * Math.min(1, left / RELEASE);
  }
  return attack * (1 - progress) * (1 - progress);
}

/** Deterministic pseudo random numbers, so a sound is the same every time. */
function lcg(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Frequency of a note like "C4", "F#5" or "Bb2" (A4 = 440 Hz). */
export function noteFrequency(note: string): number {
  const match = /^([A-G])([#b]?)(-?\d)$/.exec(note);
  if (!match) {
    throw new Error(`Unbekannte Note: ${note}`);
  }
  const semitone = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[match[1] as 'C'] + (match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0);
  const midi = (Number(match[3]) + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * A chiptune loop with at most four voices like on the NES: two pulse channels, triangle bass and
 * noise drums. Every channel is a string of 16th steps separated by spaces:
 * a note ("C5") starts a tone, "-" holds it, "." is a rest. Drums: "k" kick, "s" snare, "h" hi-hat.
 */
export interface Track {
  bpm: number;
  lead: string;
  harmony?: string;
  bass: string;
  drums?: string;
}

const DRUMS: Record<string, Omit<Tone, 'at'>> = {
  k: { wave: 'triangle', freq: 160, to: 45, duration: 0.12, volume: 0.8 },
  s: { wave: 'noise', freq: 6000, duration: 0.12, volume: 0.3 },
  h: { wave: 'noise', freq: 14000, duration: 0.035, volume: 0.12 },
};

/** Renders one loop of a track; its length is exactly the number of steps, so it loops seamlessly. */
export function renderTrack(track: Track, sampleRate: number): Float32Array {
  const step = 60 / track.bpm / 4;
  const steps = tokens(track.lead).length;
  const tones: Tone[] = [
    ...channelTones(track.lead, step, { wave: 'square', duty: 0.5, volume: 0.22 }),
    ...(track.harmony ? channelTones(track.harmony, step, { wave: 'square', duty: 0.25, volume: 0.1 }) : []),
    ...channelTones(track.bass, step, { wave: 'triangle', volume: 0.45 }),
  ];
  if (track.drums) {
    tokens(track.drums).forEach((token, i) => {
      if (DRUMS[token]) {
        tones.push({ ...DRUMS[token], at: i * step });
      }
    });
  }
  const rendered = renderTones(tones, sampleRate);
  const loop = new Float32Array(Math.round(steps * step * sampleRate));
  loop.set(rendered.subarray(0, loop.length));
  return loop;
}

function tokens(channel: string): string[] {
  return channel.trim().split(/\s+/);
}

function channelTones(channel: string, step: number, voice: Pick<Tone, 'wave' | 'duty' | 'volume'>): Tone[] {
  const list = tokens(channel);
  const tones: Tone[] = [];
  list.forEach((token, i) => {
    if (token === '-' || token === '.') {
      return;
    }
    let length = 1;
    while (list[i + length] === '-') {
      length++;
    }
    tones.push({ ...voice, freq: noteFrequency(token), duration: length * step * 0.95, at: i * step, envelope: 'hold' });
  });
  return tones;
}
