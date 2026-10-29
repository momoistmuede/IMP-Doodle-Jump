import { deDE } from '@mui/material/locale';
import { createTheme, keyframes } from '@mui/material/styles';
import { PALETTE } from '../game/palette';

/** IMP brand colours (same as imp-chat). */
export const brand = {
  red: '#c30827',
  grey: '#9d9e9e',
};

export const ARCADE_FONT = '"Press Start 2P", monospace';

/** On/off blinking for arcade texts such as "DEIN NAME?" or "GAME OVER". */
export const blink = keyframes`
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
`;

/**
 * Arcade look: dark background, pixel-style font in multiples of 8 px, colours from the game
 * palette, square frames without shadows.
 */
export const theme = createTheme(
  {
    palette: {
      mode: 'dark',
      primary: { main: brand.red, contrastText: PALETTE.white },
      secondary: { main: PALETTE.grey, contrastText: PALETTE.black },
      background: { default: PALETTE.black, paper: PALETTE.night },
      text: { primary: PALETTE.white, secondary: PALETTE.grey },
      divider: PALETTE.slate,
    },
    shape: { borderRadius: 0 },
    shadows: Array(25).fill('none') as ReturnType<typeof createTheme>['shadows'],
    typography: {
      fontFamily: ARCADE_FONT,
      fontSize: 12,
      h1: { fontSize: 32, lineHeight: 1.25 },
      h2: { fontSize: 16, lineHeight: 1.5 },
      h3: { fontSize: 32, lineHeight: 1.25 },
      body1: { fontSize: 16, lineHeight: 1.5 },
      body2: { fontSize: 8, lineHeight: 2 },
      button: { fontSize: 16, textTransform: 'uppercase' },
      overline: { fontSize: 8, lineHeight: 2, letterSpacing: 0 },
      caption: { fontSize: 8, lineHeight: 2 },
    },
    components: {
      MuiCard: { styleOverrides: { root: { border: `4px solid ${PALETTE.slate}`, backgroundImage: 'none' } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { padding: '12px 16px' } } },
      MuiAlert: { styleOverrides: { root: { fontSize: 8, lineHeight: 2, alignItems: 'center' } } },
      MuiTableCell: { styleOverrides: { root: { fontSize: 16, borderBottom: 'none', padding: '2px 8px', lineHeight: 1.5 } } },
      MuiInputBase: { styleOverrides: { root: { fontSize: 16 } } },
      MuiFormHelperText: { styleOverrides: { root: { fontSize: 8 } } },
      MuiInputLabel: { styleOverrides: { root: { fontSize: 12 } } },
    },
  },
  deDE,
);
