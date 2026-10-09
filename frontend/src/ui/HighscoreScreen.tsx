import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { fetchHighscores, type Highscore, type SubmitResult } from '../api';
import { Controls } from './Controls';
import { Logo } from './Logo';

const TROPHY = ['#d4a017', '#9e9e9e', '#b06c2c'];

interface Props {
  onPlay: () => void;
  /** Result of the score just saved: highlights the player and shows how it went. */
  lastResult: SubmitResult | null;
}

export function HighscoreScreen({ onPlay, lastResult }: Props) {
  const [highscores, setHighscores] = useState<Highscore[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHighscores().then(setHighscores, (e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <Card sx={{ width: '100%', maxWidth: 480 }} elevation={4}>
      <CardContent>
        <Stack spacing={3} sx={{ alignItems: 'center' }}>
          <Stack spacing={1} sx={{ alignItems: 'center' }}>
            <Logo height={48} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
              Doodle Jump
            </Typography>
          </Stack>

          {lastResult && (
            <Alert severity={lastResult.newBest ? 'success' : 'info'} sx={{ width: '100%' }}>
              {lastResult.newBest
                ? `Neuer Rekord für ${lastResult.best.name}: ${lastResult.best.score} Punkte – Platz ${lastResult.rank}!`
                : `${lastResult.best.name}, dein Rekord bleibt bei ${lastResult.best.score} Punkten (Platz ${lastResult.rank}).`}
            </Alert>
          )}

          <Stack spacing={1} sx={{ width: '100%' }}>
            <Typography variant="overline" color="text.secondary" component="h2">
              Highscores
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {!error && !highscores && <CircularProgress size={28} sx={{ alignSelf: 'center' }} />}
            {highscores && highscores.length === 0 && (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Noch keine Highscores – sei der Erste!
              </Typography>
            )}
            {highscores && highscores.length > 0 && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 56 }}>Platz</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Punkte</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {highscores.map((entry, index) => (
                    <TableRow key={entry.name} selected={entry.name === lastResult?.best.name}>
                      <TableCell>
                        {index < TROPHY.length ? (
                          <EmojiEventsIcon fontSize="small" sx={{ color: TROPHY[index], verticalAlign: 'middle' }} aria-label={`Platz ${index + 1}`} />
                        ) : (
                          index + 1
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: index === 0 ? 700 : undefined }}>{entry.name}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {entry.score.toLocaleString('de-DE')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Stack>

          <Button variant="contained" size="large" startIcon={<PlayArrowIcon />} onClick={onPlay} autoFocus sx={{ px: 6, py: 1.5, fontSize: '1.2rem' }}>
            Play
          </Button>
          <Controls />
        </Stack>
      </CardContent>
    </Card>
  );
}
