import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState, type FormEvent } from 'react';
import { MAX_NAME_LENGTH } from '../api';
import { sound } from '../audio/sound';
import { PALETTE } from '../game/palette';
import { loadLastName } from './lastName';
import { Title } from './Title';

/** Trims and collapses inner whitespace, like the backend (PlayerName). */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

interface Props {
  /** Called with the normalized name; the caller loads the skin, `loading` shows that. */
  onSubmit: (name: string) => void;
  onBack: () => void;
  loading: boolean;
}

/** Before the round: who is playing? Prefilled with the last name used in this browser. */
export function NameScreen({ onSubmit, onBack, loading }: Props) {
  const [name, setName] = useState(loadLastName);
  const normalized = normalizeName(name);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (normalized && !loading) {
      sound.play('click');
      onSubmit(normalized);
    }
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 520 }}>
      <CardContent>
        <Stack component="form" onSubmit={submit} spacing={3} sx={{ alignItems: 'center' }}>
          <Title />
          <Typography variant="h2" component="h2" sx={{ color: PALETTE.yellow }}>
            DEIN NAME?
          </Typography>
          <TextField
            aria-label="Dein Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            // The key that opened this screen may still be held: no auto-repeated spaces.
            onKeyDown={(e) => {
              if (e.repeat && e.key === ' ') e.preventDefault();
            }}
            autoFocus
            fullWidth
            slotProps={{ htmlInput: { maxLength: MAX_NAME_LENGTH } }}
            helperText={`${name.length}/${MAX_NAME_LENGTH}`}
          />
          <Button type="submit" variant="contained" size="large" endIcon={<ArrowForwardIcon />} disabled={!normalized} loading={loading} fullWidth>
            Weiter
          </Button>
          <Button
            color="secondary"
            onClick={() => {
              sound.play('click');
              onBack();
            }}
          >
            Zur Bestenliste
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
