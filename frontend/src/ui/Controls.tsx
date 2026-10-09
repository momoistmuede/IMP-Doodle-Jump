import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const KEYS: [string, string][] = [
  ['← →', 'bewegen'],
  ['Leertaste', 'springen'],
  ['F', 'schießen'],
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
              py: 0.25,
              border: 1,
              borderColor: 'divider',
              borderBottomWidth: 3,
              borderRadius: 1,
              bgcolor: 'background.paper',
              fontFamily: 'inherit',
              fontSize: '0.8rem',
              fontWeight: 600,
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
