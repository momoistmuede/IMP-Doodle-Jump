import { noteFrequency as n, type Tone } from './synth';

/**
 * All sound effects as 8-bit tone recipes (see docs/konzept-arcade.md, 6.1). They are rendered once
 * at start-up; nothing is loaded from the network.
 */
export const EFFECTS = {
  /** The most frequent sound: short and quiet. */
  jump: [{ wave: 'square', freq: 280, to: 620, duration: 0.09, volume: 0.18, duty: 0.25 }],
  spring: [{ wave: 'square', freq: 180, to: 900, duration: 0.35, volume: 0.3, vibrato: { depth: 2, rate: 18 } }],
  shoot: [{ wave: 'square', freq: 1400, to: 300, duration: 0.12, volume: 0.25, duty: 0.25 }],
  /** Hit, but not dead yet. */
  monsterHit: [
    { wave: 'noise', freq: 3000, duration: 0.03, volume: 0.4 },
    { wave: 'square', freq: 220, to: 160, duration: 0.06, volume: 0.3 },
  ],
  killShot: [
    { wave: 'noise', freq: 2400, to: 300, duration: 0.45, volume: 0.6 },
    { wave: 'square', freq: 200, to: 50, duration: 0.25, volume: 0.25, at: 0 },
  ],
  killStomp: [
    { wave: 'saw', freq: 300, to: 60, duration: 0.18, volume: 0.4 },
    { wave: 'noise', freq: 900, duration: 0.12, volume: 0.3, at: 0 },
  ],
  hurt: [
    { wave: 'square', freq: 700, to: 250, duration: 0.18, volume: 0.35 },
    { wave: 'triangle', freq: 110, to: 70, duration: 0.3, volume: 0.6 },
  ],
  /** Falling whistle when dropping below the screen. */
  fall: [{ wave: 'triangle', freq: 1800, to: 300, duration: 0.7, volume: 0.35, envelope: 'hold' }],
  /** Fabric opening. */
  parachuteOpen: [{ wave: 'noise', freq: 500, to: 200, duration: 0.3, volume: 0.6 }],
  parachuteLand: [{ wave: 'noise', freq: 700, duration: 0.08, volume: 0.45 }],
  break: [
    { wave: 'noise', freq: 4000, duration: 0.05, volume: 0.5 },
    { wave: 'noise', freq: 1500, duration: 0.12, volume: 0.4 },
  ],
  heart: arpeggio(['C5', 'E5', 'G5', 'C6'], 0.07, 'square', 0.25),
  /** Coin "kling". */
  heartBonus: [
    { wave: 'square', freq: n('B5'), duration: 0.06, volume: 0.25, envelope: 'hold' },
    { wave: 'square', freq: n('E6'), duration: 0.3, volume: 0.25 },
  ],
  warn: [{ wave: 'square', freq: 880, duration: 0.09, volume: 0.25, envelope: 'hold', duty: 0.25 }],
  /** NEXT moved on: a place was overtaken. */
  overtake: [
    { wave: 'triangle', freq: n('E6'), duration: 0.08, volume: 0.5, envelope: 'hold' },
    { wave: 'triangle', freq: n('A6'), duration: 0.2, volume: 0.5 },
  ],
  /** The phone imp is about to appear: a ringing trill. */
  ring: Array.from({ length: 10 }, (_, i): Tone => ({ wave: 'square', freq: i % 2 ? 1300 : 1050, duration: 0.035, volume: 0.15, envelope: 'hold', duty: 0.25 })),
  gameOver: [
    ...arpeggio(['G4', 'F#4', 'F4'], 0.2, 'square', 0.3, 'hold'),
    { wave: 'square', freq: n('E4'), to: n('C4'), duration: 0.7, volume: 0.3, vibrato: { depth: 0.4, rate: 6 } },
  ],
  highscore: [
    ...arpeggio(['C5', 'E5', 'G5'], 0.1, 'square', 0.25, 'hold'),
    ...arpeggio(['C6', 'G5', 'C6'], 0.1, 'square', 0.25, 'hold'),
    { wave: 'square', freq: n('E6'), duration: 0.5, volume: 0.25, vibrato: { depth: 0.3, rate: 7 } },
  ],
  insertCoin: [
    { wave: 'square', freq: n('B5'), duration: 0.07, volume: 0.25, envelope: 'hold' },
    { wave: 'square', freq: n('E6'), duration: 0.25, volume: 0.25 },
    ...arpeggio(['G5', 'C6', 'E6', 'G6'], 0.05, 'triangle', 0.4),
  ],
  click: [{ wave: 'square', freq: 1200, duration: 0.025, volume: 0.15, duty: 0.25 }],
} satisfies Record<string, Tone[]>;

export type SoundName = keyof typeof EFFECTS;

function arpeggio(notes: string[], step: number, wave: Tone['wave'], volume: number, envelope: Tone['envelope'] = 'fade'): Tone[] {
  return notes.map((note) => ({ wave, freq: n(note), duration: step, volume, envelope }));
}
