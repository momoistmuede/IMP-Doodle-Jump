import { PALETTE } from './palette';

/**
 * The player's look (see docs/konzept-arcade.md, 2.4): three colours and two accessories.
 *
 * The player sprites are drawn with placeholder colours, one base tone and one shadow per part.
 * A skin replaces them in the SVG source (not in the rendered image: anti-aliased edges have mixed
 * colours that a pixel-by-pixel replacement would miss).
 */
export const PLACEHOLDERS = {
  body: ['#ff00ff', '#990099'],
  shirt: ['#00ffff', '#009999'],
  tentacles: ['#ffff00', '#999900'],
} as const;

export type SkinPart = keyof typeof PLACEHOLDERS;

/** Base tone and shadow per part. */
export type SkinColors = Record<SkinPart, readonly [string, string]>;

/** As stored in the backend (PUT /api/v1/players/{name}/skin). */
export interface Skin {
  body: string;
  shirt: string;
  tentacles: string;
  hat: string;
  glasses: string;
}

/** The 12 colours per part, each with its fixed darker partner from the palette for the shadow. */
export const SKIN_COLORS: readonly (readonly [string, string])[] = [
  [PALETTE.red, PALETTE.redDark],
  [PALETTE.orange, PALETTE.orangeDark],
  [PALETTE.yellow, PALETTE.yellowDark],
  [PALETTE.lime, PALETTE.limeDark],
  [PALETTE.limeDark, PALETTE.olive],
  [PALETTE.green, PALETTE.greenDark],
  [PALETTE.teal, PALETTE.tealDark],
  [PALETTE.blue, PALETTE.blueDark],
  [PALETTE.violet, PALETTE.violetDark],
  [PALETTE.pink, PALETTE.pinkDark],
  [PALETTE.brown, PALETTE.brownDark],
  [PALETTE.greyDark, PALETTE.ink],
];

/** Accessories with their display names; "none" first. They have fixed colours and are not recoloured. */
export const HATS = [
  ['none', 'KEINER'],
  ['headset', 'HEADSET'],
  ['basecap', 'BASECAP'],
  ['zylinder', 'ZYLINDER'],
  ['partyhut', 'PARTYHUT'],
  ['bauhelm', 'BAUHELM'],
  ['krone', 'KRONE'],
] as const;

export const GLASSES = [
  ['none', 'KEINE'],
  ['nerd', 'NERDBRILLE'],
  ['sonnenbrille', 'SONNENBRILLE'],
  ['monokel', 'MONOKEL'],
  ['vr', 'VR-BRILLE'],
] as const;

export type HatId = (typeof HATS)[number][0];
export type GlassesId = (typeof GLASSES)[number][0];

/** Today's figure: light green body, dark green shirt, grey tentacles, no accessories. */
export const DEFAULT_SKIN: Skin = {
  body: PALETTE.lime,
  shirt: PALETTE.limeDark,
  tentacles: PALETTE.greyDark,
  hat: 'none',
  glasses: 'none',
};

/** A stored colour or accessory that no longer exists falls back to the default for that part. */
export function sanitizeSkin(skin: Partial<Skin> | null | undefined): Skin {
  const color = (value: string | undefined, fallback: string) => (SKIN_COLORS.some(([base]) => base === value) ? value! : fallback);
  return {
    body: color(skin?.body, DEFAULT_SKIN.body),
    shirt: color(skin?.shirt, DEFAULT_SKIN.shirt),
    tentacles: color(skin?.tentacles, DEFAULT_SKIN.tentacles),
    hat: HATS.some(([id]) => id === skin?.hat) ? skin!.hat! : 'none',
    glasses: GLASSES.some(([id]) => id === skin?.glasses) ? skin!.glasses! : 'none',
  };
}

/** Every part at random; hat and glasses are "none" half of the time, so the figure is not overloaded. */
export function randomSkin(random: () => number = Math.random): Skin {
  const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)];
  const accessory = <T extends readonly (readonly [string, string])[]>(list: T) => (random() < 0.5 ? 'none' : pick(list.slice(1))[0]);
  return {
    body: pick(SKIN_COLORS)[0],
    shirt: pick(SKIN_COLORS)[0],
    tentacles: pick(SKIN_COLORS)[0],
    hat: accessory(HATS),
    glasses: accessory(GLASSES),
  };
}

export function skinColors(skin: Skin): SkinColors {
  const pair = (base: string) => SKIN_COLORS.find(([b]) => b === base)!;
  const safe = sanitizeSkin(skin);
  return { body: pair(safe.body), shirt: pair(safe.shirt), tentacles: pair(safe.tentacles) };
}

/** Replaces the placeholder colours in an SVG source. */
export function recolorSvg(svg: string, colors: SkinColors): string {
  let result = svg;
  for (const part of Object.keys(PLACEHOLDERS) as SkinPart[]) {
    PLACEHOLDERS[part].forEach((placeholder, i) => {
      result = result.replaceAll(placeholder, colors[part][i]);
    });
  }
  return result;
}

export type Pose = 'stand' | 'jump' | 'fall' | 'shoot' | 'dead';

/**
 * Where hat and glasses sit for each pose, relative to the player position (facing right): the hat
 * stands on `hat`, the glasses are centred on `glasses`. While shooting the snout points up, so the
 * hat moves aside.
 */
export const ACCESSORY_ANCHORS: Record<Pose, { hat: { x: number; y: number }; glasses: { x: number; y: number } }> = {
  stand: { hat: { x: 20, y: 7 }, glasses: { x: 27, y: 12 } },
  jump: { hat: { x: 20, y: 7 }, glasses: { x: 27, y: 12 } },
  fall: { hat: { x: 20, y: 7 }, glasses: { x: 27, y: 12 } },
  dead: { hat: { x: 20, y: 7 }, glasses: { x: 27, y: 12 } },
  shoot: { hat: { x: 31, y: 9 }, glasses: { x: 20, y: 13 } },
};

/** Boxes of the accessory sprites relative to their anchor. */
export const HAT_BOX = { x: -16, y: -20, width: 32, height: 24 };
export const GLASSES_BOX = { x: -10, y: -4, width: 20, height: 8 };
/** Box of the player sprites relative to the player position (see sprites.ts). */
const PLAYER_BOX = { x: -10, y: -12, width: 60, height: 58 };

/** SVG sources needed to compose a figure. */
export interface FigureParts {
  poses: Record<Pose, string>;
  hats: Record<string, string>;
  glasses: Record<string, string>;
  parachute: string;
}

/**
 * One SVG of the whole figure in a skin, with hat and glasses (and the parachute if wanted), e.g. for
 * the mini figures in the top list. Used as a data: URL, so it stays sharp at any size.
 */
export function figureSvg(parts: FigureParts, skin: Skin, pose: Pose = 'stand', parachute = false): string {
  const safe = sanitizeSkin(skin);
  const anchors = ACCESSORY_ANCHORS[pose];
  const top = parachute ? -62 : PLAYER_BOX.y;
  // Nested <svg> elements keep their viewBox; their own width and height give way to the box.
  const nested = (svg: string, x: number, y: number, box: { width: number; height: number }) =>
    svg.replace(/<svg([^>]*)>/, (_, attributes: string) => {
      const rest = attributes.replace(/\s(width|height)="[^"]*"/g, '');
      return `<svg x="${x}" y="${y}" width="${box.width}" height="${box.height}"${rest}>`;
    });
  let content = inner(recolorSvg(parts.poses[pose], skinColors(safe)));
  if (safe.glasses !== 'none') {
    content += nested(parts.glasses[safe.glasses], anchors.glasses.x + GLASSES_BOX.x, anchors.glasses.y + GLASSES_BOX.y, GLASSES_BOX);
  }
  if (safe.hat !== 'none') {
    content += nested(parts.hats[safe.hat], anchors.hat.x + HAT_BOX.x, anchors.hat.y + HAT_BOX.y, HAT_BOX);
  }
  if (parachute) {
    content = nested(parts.parachute, -12, -50, { width: 64, height: 56 }) + content;
  }
  const height = PLAYER_BOX.height + (PLAYER_BOX.y - top);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${PLAYER_BOX.x} ${top} ${PLAYER_BOX.width} ${height}" width="${PLAYER_BOX.width}" height="${height}">${content}</svg>`;
}

function inner(svg: string): string {
  return svg.replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}
