import ReplayIcon from '@mui/icons-material/Replay';
import SaveIcon from '@mui/icons-material/Save';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState, type FormEvent } from 'react';
import { MAX_NAME_LENGTH, submitScore, type SubmitResult } from '../api';
import { loadLastName, saveLastName } from './lastName';

interface Props {
  score: number;
  onSaved: (result: SubmitResult) => void;
  onSkip: () => void;
  onReplay: () => void;
}

export function GameOverScreen({ score, onSaved, onSkip, onReplay }: Props) {
  const [name, setName] = useState(loadLastName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = name.trim();

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!trimmed || saving) {
      return;
    }
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
    <Card sx={{ width: '100%', maxWidth: 420 }} elevation={4}>
      <CardContent>
        <Stack component="form" onSubmit={save} spacing={3} sx={{ alignItems: 'center' }}>
          <Typography variant="h4" component="h1" color="primary" sx={{ fontWeight: 800 }}>
            Game Over
          </Typography>
          <Stack sx={{ alignItems: 'center' }}>
            <Typography variant="overline" color="text.secondary">
              Deine Punkte
            </Typography>
            <Typography variant="h3" component="p" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {score.toLocaleString('de-DE')}
            </Typography>
          </Stack>
          <TextField
            label="Dein Name für die Highscores"
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
          <Stack direction="row" spacing={1}>
            <Button onClick={onReplay} startIcon={<ReplayIcon />}>
              Nochmal spielen
            </Button>
            <Button onClick={onSkip} color="secondary">
              Ohne Speichern zurück
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
