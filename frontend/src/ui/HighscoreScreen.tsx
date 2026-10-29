import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';
import type { HighscoreList } from '../App';
import type { SubmitResult } from '../api';
import { PALETTE } from '../game/palette';
import { formatScore, TOP_PLACES } from '../game/scoreboard';
import { Controls } from './Controls';
import { Title } from './Title';
import { blink } from './theme';

const TROPHY = ['#d4a017', '#9e9e9e', '#b06c2c'];
const ORDINALS = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH', '10TH'];

interface Props {
  onPlay: () => void;
  /** Result of the score just saved: highlights the player and shows how it went. */
  lastResult: SubmitResult | null;
  highscores: HighscoreList;
}

export function HighscoreScreen({ onPlay, lastResult, highscores }: Props) {
  const { entries, error } = highscores;

  // Space or Enter starts a round; a key still held from the last round does not count.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.code === 'Space' || event.code === 'Enter') && !event.repeat) {
        event.preventDefault();
        onPlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onPlay]);

  // Always all 10 places: empty ones invite others to fill them.
  const places = Array.from({ length: TOP_PLACES }, (_, i) => entries?.[i] ?? null);
  const firstEmpty = places.indexOf(null);

  return (
    <Card sx={{ width: '100%', maxWidth: 640 }}>
      <CardContent>
        <Stack spacing={3} sx={{ alignItems: 'center' }}>
          <Title />

          {lastResult && (
            <Alert severity={lastResult.newBest ? 'success' : 'info'} sx={{ width: '100%' }}>
              {lastResult.newBest
                ? `Neuer Rekord für ${lastResult.best.name}: ${lastResult.best.score} Punkte – Platz ${lastResult.rank}!`
                : `${lastResult.best.name}, dein Rekord bleibt bei ${lastResult.best.score} Punkten (Platz ${lastResult.rank}).`}
            </Alert>
          )}

          <Stack spacing={1} sx={{ width: '100%', alignItems: 'center' }}>
            <Typography variant="h2" component="h2" sx={{ color: PALETTE.yellow }}>
              ★ HIGH SCORES ★
            </Typography>
            {error && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
            )}
            {!error && !entries && <CircularProgress size={28} />}
            {entries && (
              <Table size="small" aria-label="Highscores">
                <TableBody>
                  {places.map((entry, index) => {
                    const own = entry !== null && entry.name === lastResult?.best.name;
                    const color = entry ? (TROPHY[index] ?? PALETTE.white) : PALETTE.greyDark;
                    return (
                      <TableRow key={index} sx={own ? { animation: `${blink} 1s steps(1) infinite` } : undefined}>
                        <TableCell sx={{ color, width: 88 }}>{ORDINALS[index]}</TableCell>
                        <TableCell sx={{ width: 32, px: 0 }}>
                          <Silhouette />
                        </TableCell>
                        <TableCell sx={{ color, overflowWrap: 'anywhere' }}>
                          {entry ? (
                            entry.name
                          ) : index === firstEmpty ? (
                            <Box component="span" sx={{ color: PALETTE.yellow, animation: `${blink} 1s steps(1) infinite` }}>
                              DEIN NAME?
                            </Box>
                          ) : (
                            '---------'
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ color }}>
                          {formatScore(entry?.score ?? 0)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Stack>

          <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: PALETTE.yellow, animation: `${blink} 1.2s steps(1) infinite` }}>
              ▶ PRESS SPACE TO START ◀
            </Typography>
            <Button variant="contained" size="large" startIcon={<PlayArrowIcon />} onClick={onPlay} sx={{ px: 6 }}>
              Play
            </Button>
          </Stack>
          <Controls />
        </Stack>
      </CardContent>
    </Card>
  );
}

/** Placeholder figure in front of a name, until players have a skin. */
function Silhouette() {
  return (
    <Box
      aria-hidden
      sx={{
        width: 24,
        height: 24,
        display: 'grid',
        placeItems: 'center',
        bgcolor: PALETTE.slate,
        color: PALETTE.grey,
        fontSize: 16,
        borderRadius: '12px 12px 2px 2px',
      }}
    >
      ?
    </Box>
  );
}
