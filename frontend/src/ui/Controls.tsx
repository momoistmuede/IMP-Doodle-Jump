import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { PALETTE } from '../game/palette';

const KEYS: [string, string][] = [
  ['← →', 'bewegen'],
  ['Leertaste', 'springen'],
  ['F', 'schießen'],
  ['M', 'Ton an/aus'],
];

/** Legend of the keyboard controls. */
export function Controls() {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', flexWrap: 'wrap', rowGap: 1 }}>
      {KEYS.map(([key, action]) => (
        <Stack key={key} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <Box
            component="kbd"
            sx={{
              px: 1,
              py: 0.5,
              border: 2,
              borderColor: PALETTE.slate,
              borderBottomWidth: 4,
              bgcolor: PALETTE.black,
              fontFamily: 'inherit',
              fontSize: 8,
            }}
          >
            {key}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {action}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
