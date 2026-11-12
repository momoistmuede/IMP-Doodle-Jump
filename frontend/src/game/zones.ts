import type { TrackName } from '../audio/music';
import { PALETTE } from './palette';

/**
 * The zones of the climb, named after the departments: from the hotline up to the boss's chair
 * (see docs/konzept-arcade.md, 4). Every zone is 1000 m high; the last one is endless. All values
 * are starting points for fine-tuning.
 */
export const ZONE_HEIGHT_M = 1000;
/** 10 px = 1 m. */
export const PIXELS_PER_METER = 10;
const ZONE_HEIGHT_PX = ZONE_HEIGHT_M * PIXELS_PER_METER;

/** Generation parameters; a zone's values apply at its start and rise within it. */
export interface ZoneParams {
  /** Vertical distance between chain platforms, px. */
  minGap: number;
  maxGap: number;
  /** Share of moving chain platforms, and their speed in px/s. */
  movingShare: number;
  movingSpeed: number;
  springChance: number;
  /** Share of special chain platforms (vanishing, crumbling, vertical, short). */
  specialShare: number;
  monsterChance: number;
  /** Share of spiked platforms among the decoys between chain platforms. */
  spikeShare: number;
}

/** Special chain platforms; each zone adds new ones and keeps the earlier ones. */
export type SpecialPlatform = 'vanishing' | 'crumbling' | 'vertical' | 'short';

export interface Zone {
  name: string;
  /** Placeholder background until the pixel-art picture exists; stays as base tone and for the transition. */
  background: string;
  track: TrackName;
  /** Motif of the points power-up in this zone, and its placeholder colour. */
  pointsSkin: string;
  pointsColor: string;
  specials: readonly SpecialPlatform[];
  params: ZoneParams;
}

const p = (
  minGap: number,
  maxGap: number,
  movingShare: number,
  movingSpeed: number,
  springChance: number,
  specialShare: number,
  monsterChance: number,
  spikeShare = 0,
): ZoneParams => ({ minGap, maxGap, movingShare, movingSpeed, springChance, specialShare, monsterChance, spikeShare });

const ALL_SPECIALS: readonly SpecialPlatform[] = ['vanishing', 'crumbling', 'vertical', 'short'];

export const ZONES: readonly Zone[] = [
  { name: 'HOTLINE', background: PALETTE.paper, track: 'hotline', pointsSkin: 'ticket', pointsColor: PALETTE.teal, specials: [], params: p(40, 90, 0.1, 90, 0.06, 0, 0.04) },
  { name: 'PROFESSIONAL SERVICE', background: PALETTE.sky, track: 'service', pointsSkin: 'acceptance', pointsColor: PALETTE.red, specials: ['vanishing'], params: p(55, 110, 0.15, 110, 0.05, 0.15, 0.06) },
  { name: 'PROJEKTMANAGEMENT', background: PALETTE.apricot, track: 'projekt', pointsSkin: 'milestone', pointsColor: PALETTE.violetDark, specials: ['vanishing', 'crumbling', 'vertical'], params: p(70, 125, 0.2, 130, 0.05, 0.2, 0.08) },
  { name: 'DEVELOPMENT', background: PALETTE.night, track: 'development', pointsSkin: 'green-build', pointsColor: PALETTE.neon, specials: ALL_SPECIALS, params: p(80, 135, 0.3, 150, 0.04, 0.25, 0.11) },
  { name: 'OPERATIONS', background: PALETTE.slate, track: 'operations', pointsSkin: 'uptime', pointsColor: PALETTE.yellow, specials: ALL_SPECIALS, params: p(90, 145, 0.35, 170, 0.04, 0.25, 0.13, 0.3) },
  { name: 'VERTRIEB', background: PALETTE.ochre, track: 'vertrieb', pointsSkin: 'contract', pointsColor: PALETTE.navyDark, specials: ALL_SPECIALS, params: p(95, 155, 0.4, 180, 0.03, 0.3, 0.15, 0.4) },
  { name: 'PRODUKTMANAGEMENT', background: PALETTE.violet, track: 'produkt', pointsSkin: 'idea', pointsColor: PALETTE.cream, specials: ALL_SPECIALS, params: p(100, 160, 0.45, 190, 0.03, 0.3, 0.17, 0.5) },
  { name: 'CHEFSESSEL', background: PALETTE.wood, track: 'chefsessel', pointsSkin: 'bonus-check', pointsColor: PALETTE.gold, specials: ALL_SPECIALS, params: p(105, 165, 0.5, 200, 0.03, 0.3, 0.19, 0.55) },
];

/** From 8000 m on: the game gets no harder, only longer. */
export const CAP: ZoneParams = p(110, 170, 0.6, 230, 0.03, 0.35, 0.22, 0.6);

/** Within a zone the values rise halfway to the next zone; the rest is the jump at the zone change. */
const RISE_WITHIN_ZONE = 0.5;

export const ZONE_NAMES = ZONES.map((z) => z.name);

/** Index of the zone (0-based) at the given height in metres. */
export function zoneIndexAt(meters: number): number {
  return Math.min(ZONES.length - 1, Math.max(0, Math.floor(meters / ZONE_HEIGHT_M)));
}

/** Zone index at a height in px above the start. */
export function zoneIndexAtPx(heightPx: number): number {
  return zoneIndexAt(heightPx / PIXELS_PER_METER);
}

/**
 * Parameters at a height in px. Within a zone they rise towards the next zone; the endless last
 * zone rises linearly to the cap up to 8000 m and stays there.
 */
export function zoneParams(heightPx: number): ZoneParams {
  const index = zoneIndexAtPx(heightPx);
  const last = index === ZONES.length - 1;
  const within = Math.min(1, Math.max(0, heightPx - index * ZONE_HEIGHT_PX) / ZONE_HEIGHT_PX);
  const from = ZONES[index].params;
  const to = last ? CAP : ZONES[index + 1].params;
  const t = last ? within : within * RISE_WITHIN_ZONE;
  const result = { ...from };
  for (const key of Object.keys(from) as (keyof ZoneParams)[]) {
    result[key] = from[key] + (to[key] - from[key]) * t;
  }
  return result;
}
