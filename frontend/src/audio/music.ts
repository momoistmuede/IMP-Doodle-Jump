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
  /** Zone 2, professional service: on the road to the customer. */
  service: {
    bpm: 130,
    lead: `
      G5 - B5 - D6 - B5 - G5 - - - D5 - - -
      A5 - C6 - E6 - C6 - A5 - - - E5 - - -
      B5 - D6 - G6 - D6 - B5 - A5 - G5 - - -
      F#5 - A5 - D6 - - - C6 - B5 - A5 - - -`,
    harmony: `
      . . B4 . . . B4 . . . B4 . . . B4 .
      . . C5 . . . C5 . . . C5 . . . C5 .
      . . B4 . . . B4 . . . B4 . . . B4 .
      . . A4 . . . A4 . . . F#4 . . . F#4 .`,
    bass: `
      G2 - G3 - G2 - G3 - G2 - G3 - G2 - G3 -
      A2 - A3 - A2 - A3 - A2 - A3 - A2 - A3 -
      E2 - E3 - E2 - E3 - G2 - G3 - G2 - G3 -
      D2 - D3 - D2 - D3 - D2 - D3 - D2 - D3 -`,
    drums: `
      k . h . s . h k k . h . s . h .
      k . h . s . h k k . h . s . h .
      k . h . s . h k k . h . s . h .
      k . h . s . h k k . s . s s s s`,
  },
  /** Zone 3, project management: driving, minor key. */
  projekt: {
    bpm: 140,
    lead: `
      A4 - C5 - E5 - A5 - G5 - E5 - C5 - D5 -
      E5 - - - - - D5 - C5 - - - B4 - - -
      F5 - E5 - D5 - C5 - D5 - E5 - F5 - G5 -
      E5 - - - - - - - . . E5 . G#5 - - -`,
    harmony: `
      A4 . E4 . A4 . E4 . A4 . E4 . A4 . E4 .
      A4 . E4 . A4 . E4 . A4 . E4 . A4 . E4 .
      F4 . C4 . F4 . C4 . G4 . D4 . G4 . D4 .
      E4 . B3 . E4 . B3 . E4 . G#4 . E4 . B3 .`,
    bass: `
      A2 - A2 - A3 - A2 - A2 - A2 - A3 - A2 -
      A2 - A2 - A3 - A2 - A2 - A2 - A3 - A2 -
      F2 - F2 - F3 - F2 - G2 - G2 - G3 - G2 -
      E2 - E2 - E3 - E2 - E2 - E2 - E3 - E2 -`,
    drums: `
      k . h h s . h . k k h . s . h h
      k . h h s . h . k k h . s . h h
      k . h h s . h . k k h . s . h h
      k . h h s . h . k k s . s s s s`,
  },
  /** Zone 4, development: electronic arpeggios. */
  development: {
    bpm: 145,
    lead: `
      D5 F5 A5 D6 A5 F5 D5 F5 A5 D6 A5 F5 D5 F5 A5 F5
      Bb4 D5 F5 Bb5 F5 D5 Bb4 D5 F5 Bb5 F5 D5 Bb4 D5 F5 D5
      C5 E5 G5 C6 G5 E5 C5 E5 G5 C6 G5 E5 C5 E5 G5 E5
      A4 C#5 E5 A5 E5 C#5 A4 C#5 E5 A5 E5 C#5 A5 - - -`,
    harmony: `
      D5 - - - - - - - F5 - - - - - - -
      F5 - - - - - - - D5 - - - - - - -
      E5 - - - - - - - G5 - - - - - - -
      E5 - - - - - - - C#5 - - - - - - -`,
    bass: `
      D2 - . D2 D3 . D2 - . D2 - . D3 - D2 .
      Bb1 - . Bb1 Bb2 . Bb1 - . Bb1 - . Bb2 - Bb1 .
      C2 - . C2 C3 . C2 - . C2 - . C3 - C2 .
      A1 - . A1 A2 . A1 - . A1 - . A2 - A1 .`,
    drums: `
      k . h . s . h . k . h k s . h h
      k . h . s . h . k . h k s . h h
      k . h . s . h . k . h k s . h h
      k . h . s . h . k . h k s s s s`,
  },
  /** Zone 5, operations: pulsing like a server room. */
  operations: {
    bpm: 150,
    lead: `
      E5 - - E5 - - G5 - - - E5 - D5 - B4 -
      E5 - - E5 - - G5 - - - A5 - G5 - E5 -
      C5 - - C5 - - E5 - - - C5 - B4 - G4 -
      D5 - - D5 - - F#5 - - - A5 - - - F#5 -`,
    harmony: `
      E4 . E4 . E4 . E4 . E4 . E4 . E4 . E4 .
      E4 . E4 . E4 . E4 . E4 . E4 . E4 . E4 .
      C4 . C4 . C4 . C4 . C4 . C4 . C4 . C4 .
      D4 . D4 . D4 . D4 . D4 . D4 . D4 . D4 .`,
    bass: `
      E2 - E2 - E2 - E2 - E2 - E2 - E2 - E2 -
      E2 - E2 - E2 - E2 - E2 - E2 - E2 - E2 -
      C2 - C2 - C2 - C2 - C2 - C2 - C2 - C2 -
      D2 - D2 - D2 - D2 - D2 - D2 - D2 - D2 -`,
    drums: `
      k . h . k s h . k . h . k s h .
      k . h . k s h . k . h . k s h .
      k . h . k s h . k . h . k s h .
      k . h . k s h . k . h . k s s s`,
  },
  /** Zone 6, sales: upbeat and catchy. */
  vertrieb: {
    bpm: 155,
    lead: `
      C6 - G5 - E5 - G5 - A5 - G5 - E5 - C5 -
      D5 - E5 - F5 - G5 - A5 - - - G5 - - -
      C6 - G5 - E5 - G5 - A5 - C6 - D6 - E6 -
      D6 - - - C6 - B5 - C6 - - - . . . .`,
    harmony: `
      . . E5 . . . E5 . . . E5 . . . E5 .
      . . F5 . . . F5 . . . F5 . . . F5 .
      . . E5 . . . E5 . . . E5 . . . E5 .
      . . F5 . . . F5 . . . E5 . . . E5 .`,
    bass: `
      C3 - . E3 G3 - . E3 C3 - . E3 G3 - . E3
      F2 - . A2 C3 - . A2 G2 - . B2 D3 - . B2
      A2 - . C3 E3 - . C3 F2 - . A2 C3 - . A2
      G2 - . B2 D3 - . B2 C3 - . . C3 - . .`,
    drums: `
      k . h . s . h k . k h . s . h .
      k . h . s . h k . k h . s . h .
      k . h . s . h k . k h . s . h .
      k . h . s . h k . k s . s s s s`,
  },
  /** Zone 7, product management: hectic. */
  produkt: {
    bpm: 160,
    lead: `
      B5 A5 F#5 A5 B5 A5 F#5 A5 D6 C#6 B5 A5 F#5 - - -
      G5 F#5 E5 F#5 G5 F#5 E5 F#5 B5 A5 G5 F#5 E5 - - -
      F#5 E5 D5 E5 F#5 E5 D5 E5 A5 G5 F#5 E5 D5 - - -
      E5 F#5 G5 A5 B5 C#6 D6 E6 F#6 - E6 - C#6 - A5 -`,
    harmony: `
      B4 - - - - - - - D5 - - - - - - -
      G4 - - - - - - - B4 - - - - - - -
      F#4 - - - - - - - A4 - - - - - - -
      A4 - - - - - - - C#5 - - - - - - -`,
    bass: `
      B1 - B2 - B1 - B2 - B1 - B2 - B1 - B2 -
      G1 - G2 - G1 - G2 - G1 - G2 - G1 - G2 -
      D2 - D3 - D2 - D3 - D2 - D3 - D2 - D3 -
      F#1 - F#2 - F#1 - F#2 - F#1 - F#2 - F#1 - F#2 -`,
    drums: `
      k h h h s h h h k h k h s h s s
      k h h h s h h h k h k h s h s s
      k h h h s h h h k h k h s h s s
      k h h h s h h h k h k h s s s s`,
  },
  /** Zone 8, the boss's chair: triumphant fanfare. */
  chefsessel: {
    bpm: 165,
    lead: `
      D5 - - D5 D5 - A5 - - - - - F#5 - A5 -
      D6 - - - - - C#6 - B5 - A5 - G5 - F#5 -
      G5 - - G5 G5 - B5 - - - D6 - B5 - G5 -
      A5 - - - A5 - B5 - C#6 - - - D6 - - -`,
    harmony: `
      F#4 - - - - - - - A4 - - - - - - -
      A4 - - - - - - - F#4 - - - - - - -
      B4 - - - - - - - G4 - - - - - - -
      C#5 - - - - - - - E5 - - - - - - -`,
    bass: `
      D2 - D3 - D2 - D3 - D2 - D3 - D2 - D3 -
      B1 - B2 - B1 - B2 - F#1 - F#2 - F#1 - F#2 -
      G1 - G2 - G1 - G2 - G1 - G2 - G1 - G2 -
      A1 - A2 - A1 - A2 - A1 - A2 - A1 - A2 -`,
    drums: `
      k . s . k . s . k . s . k s s s
      k . s . k . s . k . s . k s s s
      k . s . k . s . k . s . k s s s
      k . s . k . s . s s s s s s s s`,
  },
} satisfies Record<string, Track>;

export type TrackName = keyof typeof TRACKS;
