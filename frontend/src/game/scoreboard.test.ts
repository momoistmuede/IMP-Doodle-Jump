import { describe, expect, it } from 'vitest';
import { formatScore, hiScore, nextTarget, placeFor } from './scoreboard';

describe('scoreboard', () => {
  it('formats scores with six digits', () => {
    expect(formatScore(0)).toBe('000000');
    expect(formatScore(1234)).toBe('001234');
    expect(formatScore(12345678)).toBe('999999');
  });

  it('shows place 1 as HI until the player beats it', () => {
    expect(hiScore([500, 300], 100)).toEqual({ score: 500, beaten: false });
    expect(hiScore([500, 300], 500)).toEqual({ score: 500, beaten: false });
    expect(hiScore([500, 300], 501)).toEqual({ score: 501, beaten: true });
    expect(hiScore([], 0)).toEqual({ score: 0, beaten: false });
  });

  it('targets the lowest place not yet overtaken', () => {
    const top = [12345, 8210, 4210, 1980];
    expect(nextTarget(top, 0)).toEqual({ rank: 4, score: 1980 });
    expect(nextTarget(top, 1980)).toEqual({ rank: 4, score: 1980 });
    expect(nextTarget(top, 1981)).toEqual({ rank: 3, score: 4210 });
    expect(nextTarget(top, 12346)).toBeNull();
  });

  it('counts empty places as overtaken', () => {
    expect(nextTarget([], 0)).toBeNull();
  });

  it('computes the place a score would reach', () => {
    const top = [500, 400, 300, 200, 100, 90, 80, 70, 60, 50];
    expect(placeFor(top, 450)).toBe(2);
    expect(placeFor(top, 55)).toBe(10);
    expect(placeFor(top, 50)).toBe(10);
    expect(placeFor(top, 49)).toBeNull();
    expect(placeFor([], 1)).toBe(1);
    expect(placeFor([], 0)).toBeNull();
  });
});
