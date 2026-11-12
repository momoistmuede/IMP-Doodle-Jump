import { describe, expect, it } from 'vitest';
import { PALETTE } from './palette';
import { DEFAULT_SKIN, figureSvg, GLASSES, HATS, randomSkin, recolorSvg, sanitizeSkin, SKIN_COLORS, skinColors, type FigureParts } from './skin';

const svg = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" width="1" height="1">${body}</svg>`;
const parts: FigureParts = {
  poses: { stand: svg('<rect fill="#ff00ff"/>'), jump: svg('J'), fall: svg('F'), shoot: svg('S'), dead: svg('D') },
  hats: Object.fromEntries(HATS.slice(1).map(([id]) => [id, svg(`hat-${id}`)])),
  glasses: Object.fromEntries(GLASSES.slice(1).map(([id]) => [id, svg(`glasses-${id}`)])),
  parachute: svg('canopy'),
};

describe('skin', () => {
  it('offers 12 colours per part, each with a darker partner from the palette', () => {
    expect(SKIN_COLORS).toHaveLength(12);
    const palette = Object.values(PALETTE) as string[];
    for (const [base, shadow] of SKIN_COLORS) {
      expect(palette).toContain(base);
      expect(palette).toContain(shadow);
    }
  });

  it('the default skin is the known green figure without accessories', () => {
    expect(DEFAULT_SKIN).toEqual({ body: PALETTE.lime, shirt: PALETTE.limeDark, tentacles: PALETTE.greyDark, hat: 'none', glasses: 'none' });
    expect(sanitizeSkin(DEFAULT_SKIN)).toEqual(DEFAULT_SKIN);
  });

  it('falls back to the default per part for unknown colours or accessories', () => {
    const skin = sanitizeSkin({ body: '#123456', shirt: PALETTE.red, tentacles: PALETTE.blue, hat: 'sombrero', glasses: 'nerd' });
    expect(skin).toEqual({ body: DEFAULT_SKIN.body, shirt: PALETTE.red, tentacles: PALETTE.blue, hat: 'none', glasses: 'nerd' });
    expect(sanitizeSkin(null)).toEqual(DEFAULT_SKIN);
  });

  it('chooses random skins, with accessories only about half of the time', () => {
    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const skins = Array.from({ length: 400 }, () => randomSkin(random));
    expect(skins.every((s) => sanitizeSkin(s).body === s.body)).toBe(true);
    const withHat = skins.filter((s) => s.hat !== 'none').length;
    expect(withHat).toBeGreaterThan(150);
    expect(withHat).toBeLessThan(250);
  });

  it('replaces the placeholder colours with base tone and shadow', () => {
    const colors = skinColors({ ...DEFAULT_SKIN, body: PALETTE.red });
    expect(colors.body).toEqual([PALETTE.red, PALETTE.redDark]);
    expect(recolorSvg('#ff00ff #990099 #00ffff', colors)).toBe(`${PALETTE.red} ${PALETTE.redDark} ${PALETTE.limeDark}`);
  });

  it('composes a whole figure with hat, glasses and parachute', () => {
    const figure = figureSvg(parts, { ...DEFAULT_SKIN, hat: 'krone', glasses: 'monokel' }, 'stand', true);
    expect(figure).toContain(`fill="${PALETTE.lime}"`);
    expect(figure).toContain('hat-krone');
    expect(figure).toContain('glasses-monokel');
    expect(figure).toContain('canopy');
    expect(figure.match(/<svg/g)).toHaveLength(4);
    // Every nested part has exactly one width and height (duplicate attributes make the SVG invalid).
    for (const tag of figure.match(/<svg[^>]*>/g)!) {
      expect(tag.match(/\swidth=/g), tag).toHaveLength(1);
      expect(tag.match(/\sheight=/g), tag).toHaveLength(1);
    }
    expect(figureSvg(parts, DEFAULT_SKIN)).not.toContain('hat-');
  });
});
