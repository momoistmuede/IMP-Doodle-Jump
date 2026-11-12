import { describe, expect, it } from 'vitest';
import { CAP, ZONES, zoneIndexAt, zoneParams } from './zones';

const M = 10; // px per metre

describe('zones', () => {
  it('has 8 zones of 1000 m, the last one endless', () => {
    expect(ZONES).toHaveLength(8);
    expect(zoneIndexAt(0)).toBe(0);
    expect(zoneIndexAt(999)).toBe(0);
    expect(zoneIndexAt(1000)).toBe(1);
    expect(zoneIndexAt(7000)).toBe(7);
    expect(zoneIndexAt(50000)).toBe(7);
    expect(zoneIndexAt(-300)).toBe(0); // below the start after a parachute fall
  });

  it('starts every zone with its own values', () => {
    ZONES.forEach((zone, i) => expect(zoneParams(i * 1000 * M)).toEqual(zone.params));
  });

  it('gets harder within a zone and jumps at the zone change', () => {
    const start = zoneParams(1000 * M);
    const end = zoneParams(1999 * M);
    const next = zoneParams(2000 * M);
    expect(end.maxGap).toBeGreaterThan(start.maxGap);
    expect(next.maxGap).toBeGreaterThan(end.maxGap);
    expect(end.monsterChance).toBeGreaterThan(start.monsterChance);
  });

  it('rises linearly in the boss chair up to 8000 m, then stays at the cap', () => {
    const chair = ZONES[7].params;
    expect(zoneParams(7500 * M).minGap).toBeCloseTo((chair.minGap + CAP.minGap) / 2);
    expect(zoneParams(8000 * M)).toEqual(CAP);
    expect(zoneParams(20000 * M)).toEqual(CAP);
  });

  it('never allows gaps beyond what a jump can reach', () => {
    for (let m = 0; m <= 9000; m += 100) {
      expect(zoneParams(m * M).maxGap).toBeLessThanOrEqual(170);
    }
  });
});
