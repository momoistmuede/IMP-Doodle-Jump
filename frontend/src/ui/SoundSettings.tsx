import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useState, useSyncExternalStore } from 'react';
import { sound } from '../audio/sound';

/** Speaker button with the sound settings: on/off (also key M), music and effects volume. */
export function SoundSettings() {
  const settings = useSyncExternalStore(sound.subscribe, () => sound.current);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <IconButton aria-label="Ton-Einstellungen" onClick={(e) => setAnchor(e.currentTarget)} sx={{ color: 'text.secondary' }}>
        {settings.muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
      </IconButton>
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Stack spacing={1.5} sx={{ p: 2, width: 240, border: 4, borderColor: 'divider' }}>
          <FormControlLabel
            control={<Switch checked={!settings.muted} onChange={(e) => sound.update({ muted: !e.target.checked })} />}
            label={<Typography variant="body2">TON (M)</Typography>}
          />
          <Typography variant="body2">MUSIK</Typography>
          <Slider
            size="small"
            aria-label="Lautstärke Musik"
            value={settings.music}
            min={0}
            max={1}
            step={0.05}
            onChange={(_, value) => sound.update({ music: value })}
          />
          <Typography variant="body2">EFFEKTE</Typography>
          <Slider
            size="small"
            aria-label="Lautstärke Effekte"
            value={settings.effects}
            min={0}
            max={1}
            step={0.05}
            onChange={(_, value) => sound.update({ effects: value })}
            onChangeCommitted={() => sound.play('click')}
          />
        </Stack>
      </Popover>
    </>
  );
}
