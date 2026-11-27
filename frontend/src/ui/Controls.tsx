import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Fragment } from 'react';
import { PALETTE } from '../game/palette';
import { Arrow } from './Arrow';

/** An action and the keys that do it, in groups ("← →" or "A D"); arrows are drawn with `Arrow`. */
export interface KeyLegendEntry {
  groups: string[][];
  action: string;
}

/** The game controls, on the start screen. */
const GAME_KEYS: KeyLegendEntry[] = [
  { groups: [['←', '→'], ['A', 'D']], action: 'bewegen' },
  { groups: [['Leertaste'], ['↑'], ['W']], action: 'springen' },
  { groups: [['F']], action: 'schießen' },
  { groups: [['M']], action: 'Ton an/aus' },
];

const ARROWS = { '←': 'left', '→': 'right', '↑': 'up', '↓': 'down' } as const;

/** One key cap. */
function Key({ name }: { name: string }) {
  const arrow = ARROWS[name as keyof typeof ARROWS];
  return (
    <Box
      component="kbd"
      sx={{
        minWidth: 24,
        px: 1,
        py: 0.5,
        border: 2,
        borderColor: PALETTE.slate,
        borderBottomWidth: 4,
        bgcolor: PALETTE.black,
        fontFamily: 'inherit',
        fontSize: 8,
        textAlign: 'center',
      }}
    >
      {arrow ? <Arrow direction={arrow} /> : name}
    </Box>
  );
}

/** Legend of the game controls. */
export function Controls() {
  return <KeyLegend entries={GAME_KEYS} />;
}

/** Key caps with what they do, in rows that wrap. */
export function KeyLegend({ entries }: { entries: KeyLegendEntry[] }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', flexWrap: 'wrap', rowGap: 1 }}>
      {entries.map(({ groups, action }) => (
        <Stack key={action} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          {groups.map((keys, i) => (
            <Fragment key={keys.join()}>
              {i > 0 && (
                <Typography variant="body2" color="text.secondary">
                  /
                </Typography>
              )}
              <Stack direction="row" spacing={0.5}>
                {keys.map((name) => (
                  <Key key={name} name={name} />
                ))}
              </Stack>
            </Fragment>
          ))}
          <Typography variant="body2" color="text.secondary">
            {action}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
