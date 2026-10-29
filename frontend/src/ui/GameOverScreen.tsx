import ReplayIcon from '@mui/icons-material/Replay';
import SaveIcon from '@mui/icons-material/Save';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState, type FormEvent } from 'react';
import { MAX_NAME_LENGTH, submitScore, type Highscore, type SubmitResult } from '../api';
import { sound } from '../audio/sound';
import { PALETTE } from '../game/palette';
import { formatScore, placeFor } from '../game/scoreboard';
import { loadLastName, saveLastName } from './lastName';
import { blink } from './theme';
import { Title } from './Title';

interface Props {
  score: number;
  /** The top 10 before this round, for "NEUER HIGHSCORE – PLATZ 3!". */
  highscores: Highscore[];
  onSaved: (result: SubmitResult) => void;
  onSkip: () => void;
  onReplay: () => void;
}

export function GameOverScreen({ score, highscores, onSaved, onSkip, onReplay }: Props) {
  const [name, setName] = useState(loadLastName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = name.trim();
  const place = placeFor(
    highscores.map((h) => h.score),
    score,
  );

  // After the game-over melody: a jingle for a new highscore, then the calm title loop.
  useEffect(() => {
    if (place !== null) {
      sound.play('highscore', { delay: 1.2 });
    }
    const timer = setTimeout(() => sound.playMusic('title'), 2500);
    return () => clearTimeout(timer);
  }, [place]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!trimmed || saving) {
      return;
    }
    sound.play('click');
    setSaving(true);
    setError(null);
    try {
      const result = await submitScore(trimmed, score);
      saveLastName(trimmed);
      onSaved(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 520 }}>
      <CardContent>
        <Stack component="form" onSubmit={save} spacing={3} sx={{ alignItems: 'center' }}>
          <Title logo={false} />
          <Typography variant="h1" component="h2" sx={{ color: PALETTE.red, animation: `${blink} 1s steps(1) infinite` }}>
            GAME OVER
          </Typography>
          <Stack spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="h3" component="p">
              {formatScore(score)}
            </Typography>
            {place !== null && (
              <Typography sx={{ color: PALETTE.yellow, textAlign: 'center' }}>NEUER HIGHSCORE – PLATZ {place}!</Typography>
            )}
          </Stack>
          <TextField
            placeholder="DEIN NAME?"
            aria-label="Dein Name für die Highscores"
            value={name}
            onChange={(e) => setName(e.target.value)}
            // The space bar may still be held from the last jump: no auto-repeated spaces.
            onKeyDown={(e) => {
              if (e.repeat && e.key === ' ') e.preventDefault();
            }}
            autoFocus
            fullWidth
            slotProps={{ htmlInput: { maxLength: MAX_NAME_LENGTH } }}
            helperText={`${name.length}/${MAX_NAME_LENGTH}`}
          />
          {error && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          )}
          <Button type="submit" variant="contained" size="large" startIcon={<SaveIcon />} disabled={!trimmed} loading={saving} fullWidth>
            Speichern
          </Button>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'center', rowGap: 1 }}>
            <Button onClick={onReplay} startIcon={<ReplayIcon />}>
              Nochmal
            </Button>
            <Button
              onClick={() => {
                sound.play('click');
                onSkip();
              }}
              color="secondary"
            >
              Ohne Speichern zurück
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
