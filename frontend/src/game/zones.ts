/**
 * The zones of the climb, named after the departments: from the hotline up to the boss's chair.
 * Every zone is 1000 m high; the last one is endless.
 */
export const ZONE_HEIGHT_M = 1000;

export const ZONE_NAMES = [
  'HOTLINE',
  'PROFESSIONAL SERVICE',
  'PROJEKTMANAGEMENT',
  'DEVELOPMENT',
  'OPERATIONS',
  'VERTRIEB',
  'PRODUKTMANAGEMENT',
  'CHEFSESSEL',
] as const;

/** Index of the zone (0-based) at the given height in metres. */
export function zoneIndexAt(meters: number): number {
  return Math.min(ZONE_NAMES.length - 1, Math.max(0, Math.floor(meters / ZONE_HEIGHT_M)));
}
