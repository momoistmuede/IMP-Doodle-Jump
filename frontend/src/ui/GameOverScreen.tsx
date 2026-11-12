import ListIcon from '@mui/icons-material/List';
import PersonIcon from '@mui/icons-material/Person';
import ReplayIcon from '@mui/icons-material/Replay';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useRef, useState } from 'react';
import { submitScore, type Highscore, type SubmitResult } from '../api';
import { sound } from '../audio/sound';
import { PALETTE } from '../game/palette';
import { formatScore, placeFor } from '../game/scoreboard';
import { blink } from './theme';
import { Title } from './Title';

interface Props {
  name: string;
  score: number;
  /** The top 10 before this round, for "NEUER HIGHSCORE – PLATZ 3!". */
  highscores: Highscore[];
  /** The score was saved; the caller reloads the top list. */
  onSaved: (result: SubmitResult) => void;
  onReplay: () => void;
  onChangePlayer: () => void;
  onHighscores: () => void;
}

type SaveState = { kind: 'saving' } | { kind: 'saved'; result: SubmitResult } | { kind: 'error'; message: string };

/**
 * After the round: the score is saved automatically under the player's name (the backend keeps only
 * the best one, so a bad round does no harm). No "Continue?": whoever dies starts again.
 */
export function GameOverScreen({ name, score, highscores, onSaved, onReplay, onChangePlayer, onHighscores }: Props) {
  const [state, setState] = useState<SaveState>({ kind: 'saving' });
  const place = placeFor(
    highscores.map((h) => h.score),
    score,
  );
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;
  const started = useRef(false);

  const save = useCallback(() => {
    setState({ kind: 'saving' });
    submitScore(name, score).then(
      (result) => {
        setState({ kind: 'saved', result });
        onSavedRef.current(result);
      },
      (e: unknown) => setState({ kind: 'error', message: e instanceof Error ? e.message : String(e) }),
    );
  }, [name, score]);

  // Exactly once, also under React's StrictMode double effects.
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      save();
    }
  }, [save]);

  // After the game-over melody: a jingle for a new highscore, then the calm title loop.
  useEffect(() => {
    if (place !== null) {
      sound.play('highscore', { delay: 1.2 });
    }
    const timer = setTimeout(() => sound.playMusic('title'), 2500);
    return () => clearTimeout(timer);
  }, [place]);

  // Space = again, with the same name and skin; the key held from the last jump does not count.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        onReplay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onReplay]);

  const click = (action: () => void) => () => {
    sound.play('click');
    action();
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 520 }}>
      <CardContent>
        <Stack spacing={3} sx={{ alignItems: 'center' }}>
          <Title logo={false} />
          <Typography variant="h1" component="h2" sx={{ color: PALETTE.red, animation: `${blink} 1s steps(1) infinite` }}>
            GAME OVER
          </Typography>
          <Stack spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="h3" component="p">
              {formatScore(score)}
            </Typography>
            {place !== null && <Typography sx={{ color: PALETTE.yellow, textAlign: 'center' }}>NEUER HIGHSCORE – PLATZ {place}!</Typography>}
          </Stack>

          {state.kind === 'saving' && (
            <Typography variant="body2" color="text.secondary">
              SPEICHERE FÜR {name.toUpperCase()} …
            </Typography>
          )}
          {state.kind === 'saved' && (
            <Typography variant="body2" sx={{ textAlign: 'center', color: state.result.newBest ? PALETTE.neon : 'text.secondary' }}>
              {state.result.newBest
                ? `NEUER REKORD FÜR ${name.toUpperCase()} – PLATZ ${state.result.rank}`
                : `${name.toUpperCase()}: REKORD BLEIBT BEI ${formatScore(state.result.best.score)}`}
            </Typography>
          )}
          {state.kind === 'error' && (
            <Alert
              severity="error"
              sx={{ width: '100%' }}
              action={
                <Button color="inherit" size="small" onClick={click(save)}>
                  Erneut versuchen
                </Button>
              }
            >
              {state.message}
            </Alert>
          )}

          <Button variant="contained" size="large" startIcon={<ReplayIcon />} onClick={onReplay} fullWidth>
            Nochmal
          </Button>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'center', rowGap: 1 }}>
            <Button startIcon={<PersonIcon />} onClick={click(onChangePlayer)}>
              Spieler wechseln
            </Button>
            <Button startIcon={<ListIcon />} color="secondary" onClick={click(onHighscores)}>
              Bestenliste
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            LEERTASTE = NOCHMAL
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
