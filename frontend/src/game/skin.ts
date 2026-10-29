import { PALETTE } from './palette';

/**
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

/** Today's figure: light green body, dark green shirt, grey tentacles. */
export const DEFAULT_COLORS: SkinColors = {
  body: [PALETTE.lime, PALETTE.limeDark],
  shirt: [PALETTE.limeDark, PALETTE.olive],
  tentacles: [PALETTE.greyDark, PALETTE.ink],
};

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
