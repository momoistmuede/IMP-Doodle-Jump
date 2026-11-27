/**
 * The cheat code for the debug mode: Ü three times in a row, each press at most a second after the
 * previous one. Any other key in between starts over.
 */
const PRESSES = 3;
const WINDOW_MS = 1000;

export interface CheatCode {
  count: number;
  /** Time of the last Ü, in ms. */
  last: number;
}

export function createCheatCode(): CheatCode {
  return { count: 0, last: -Infinity };
}

/**
 * Feeds one key press (`KeyboardEvent.key`, without key repeats) at time `now` in ms.
 * Returns true when it completes the code; the next code then starts from scratch.
 */
export function cheatCodeKey(code: CheatCode, key: string, now: number): boolean {
  if (key.toLowerCase() !== 'ü') {
    code.count = 0;
    return false;
  }
  code.count = now - code.last <= WINDOW_MS ? code.count + 1 : 1;
  code.last = now;
  if (code.count < PRESSES) {
    return false;
  }
  code.count = 0;
  return true;
}
