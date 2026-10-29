import type { Track } from './synth';

/**
 * Chiptune loops (see docs/konzept-arcade.md, 6.2): two pulse voices, triangle bass, noise drums.
 * One line per bar of 16 steps.
 */
export const TRACKS = {
  /** Calm loop for the start and game-over screens. */
  title: {
    bpm: 100,
    lead: `
      E5 - - - G5 - - - C6 - - - G5 - - -
      A5 - - - G5 - E5 - C5 - - - E5 - - -
      F5 - - - A5 - - - C6 - A5 - F5 - - -
      G5 - - - - - B5 - D6 - - - B5 - G5 -`,
    harmony: `
      C4 - E4 - G4 - E4 - C4 - E4 - G4 - E4 -
      A3 - C4 - E4 - C4 - A3 - C4 - E4 - C4 -
      F3 - A3 - C4 - A3 - F3 - A3 - C4 - A3 -
      G3 - B3 - D4 - B3 - G3 - B3 - D4 - B3 -`,
    bass: `
      C3 - . . C3 - . . G2 - . . C3 - . .
      A2 - . . A2 - . . E2 - . . A2 - . .
      F2 - . . F2 - . . C3 - . . F2 - . .
      G2 - . . G2 - . . D3 - . . G2 - . .`,
    drums: `
      k . . . h . . . s . . . h . . .
      k . . . h . . . s . . . h . . .
      k . . . h . . . s . . . h . . .
      k . . . h . . . s . . . h . h .`,
  },
  /** Zone 1, hotline: cheerful hold music. */
  hotline: {
    bpm: 120,
    lead: `
      C5 - F5 - A5 - F5 - C6 - A5 - F5 - - -
      D5 - F5 - Bb5 - F5 - D6 - Bb5 - F5 - - -
      E5 - G5 - C6 - G5 - E5 - G5 - C6 - E6 -
      F6 - - - C6 - A5 - F5 - - - . . . .`,
    harmony: `
      . . A4 . . . A4 . . . A4 . . . A4 .
      . . Bb4 . . . Bb4 . . . Bb4 . . . Bb4 .
      . . G4 . . . G4 . . . G4 . . . G4 .
      . . A4 . . . A4 . . . A4 . . . C5 .`,
    bass: `
      F2 - F3 - F2 - F3 - F2 - F3 - F2 - F3 -
      Bb1 - Bb2 - Bb1 - Bb2 - Bb1 - Bb2 - Bb1 - Bb2 -
      C2 - C3 - C2 - C3 - C2 - C3 - C2 - C3 -
      F2 - F3 - F2 - F3 - C2 - C3 - E2 - E3 -`,
    drums: `
      k . h . s . h . k . h . s . h .
      k . h . s . h . k . h . s . h .
      k . h . s . h . k . h . s . h .
      k . h . s . h . k . k . s . s s`,
  },
} satisfies Record<string, Track>;

export type TrackName = keyof typeof TRACKS;
