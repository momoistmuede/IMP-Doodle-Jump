import { deDE } from '@mui/material/locale';
import { createTheme } from '@mui/material/styles';

/** IMP brand colours (same as imp-chat). */
export const brand = {
  red: '#c30827',
  grey: '#9d9e9e',
};

export const theme = createTheme(
  {
    palette: {
      primary: { main: brand.red, contrastText: '#ffffff' },
      secondary: { main: '#7d7e7e', contrastText: '#ffffff' },
      background: { default: '#f3efe2' },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    },
  },
  deDE,
);
