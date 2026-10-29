/**
 * The fixed colour palette of imp@jump (see docs/konzept-arcade.md, "Name und Stil").
 * Backgrounds, sprites, HUD and menus only use these colours, so everything fits together.
 * Most colours come in pairs of a base tone and a darker shadow partner.
 */
export const PALETTE = {
  // Ramps: base tone and shadow.
  red: '#e63946',
  redDark: '#c30827',
  orange: '#f39c12',
  orangeDark: '#b9650f',
  yellow: '#f1c40f',
  yellowDark: '#b7950b',
  lime: '#cfe25b',
  limeDark: '#9fb53a',
  olive: '#6b7d24',
  green: '#6fbf3a',
  greenDark: '#3e7d1f',
  teal: '#2a9d8f',
  tealDark: '#1d6b62',
  blue: '#4aa3df',
  blueDark: '#1d6fa5',
  navy: '#3d5a99',
  navyDark: '#1d3557',
  violet: '#8e7cc3',
  violetDark: '#6a4c93',
  pink: '#ff77a8',
  pinkDark: '#c2457a',
  brown: '#a0703c',
  brownDark: '#6b4423',
  grey: '#9d9e9e',
  greyDark: '#5f5f5f',
  // Neutrals and backgrounds.
  black: '#1a1a1a',
  ink: '#3b3a2f',
  night: '#1e1e2e',
  slate: '#34495e',
  wood: '#4a2c1a',
  white: '#ffffff',
  paper: '#f8f4e6',
  paperLine: '#e6dfc8',
  sky: '#a8d8ea',
  apricot: '#ffd6a5',
  ochre: '#e8b04a',
  gold: '#ffd700',
  neon: '#50fa7b',
  cream: '#fefae0',
} as const;

export type PaletteColor = (typeof PALETTE)[keyof typeof PALETTE];
