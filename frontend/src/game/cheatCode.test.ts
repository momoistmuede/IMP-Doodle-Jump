import { describe, expect, it } from 'vitest';
import { cheatCodeKey, createCheatCode } from './cheatCode';

/** Feeds the keys at the given times (ms) and returns the results. */
function press(keys: [string, number][]): boolean[] {
  const code = createCheatCode();
  return keys.map(([key, now]) => cheatCodeKey(code, key, now));
}

describe('cheat code', () => {
  it('is complete after three Ü in a row', () => {
    expect(press([['ü', 0], ['ü', 300], ['ü', 600]])).toEqual([false, false, true]);
  });

  it('accepts a capital Ü', () => {
    expect(press([['Ü', 0], ['ü', 300], ['Ü', 600]])).toEqual([false, false, true]);
  });

  it('starts over after another key', () => {
    expect(press([['ü', 0], ['ü', 300], ['ArrowLeft', 400], ['ü', 500], ['ü', 600]])).toEqual([false, false, false, false, false]);
  });

  it('starts over after more than a second without Ü', () => {
    expect(press([['ü', 0], ['ü', 500], ['ü', 1600], ['ü', 2000], ['ü', 2500]])).toEqual([false, false, false, false, true]);
  });

  it('needs three new presses after a complete code', () => {
    expect(press([['ü', 0], ['ü', 100], ['ü', 200], ['ü', 300], ['ü', 400], ['ü', 500]])).toEqual([false, false, true, false, false, true]);
  });
});
