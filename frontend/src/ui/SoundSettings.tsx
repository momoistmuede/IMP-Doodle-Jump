import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ButtonBase from '@mui/material/ButtonBase';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import { useState, useSyncExternalStore } from 'react';
import { sound } from '../audio/sound';
import { PALETTE } from '../game/palette';

interface Props {
  /**
   * In the game the canvas draws the speaker itself (hud.ts, top left): the button is then only an
   * invisible clickable area over it, placed with `sx`.
   */
  overlay?: boolean;
  sx?: SxProps<Theme>;
  /** The settings opened or closed, e.g. to pause the game meanwhile. */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Speaker button with the sound settings: on/off (also key M), music and effects volume. It sits at
 * the top left, on the start screen as in the game.
 */
export function SoundSettings({ overlay = false, sx, onOpenChange }: Props) {
  const settings = useSyncExternalStore(sound.subscribe, () => sound.current);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = (element: HTMLElement | null) => {
    setAnchor(element);
    onOpenChange?.(element !== null);
  };

  return (
    <>
      {overlay ? (
        <ButtonBase
          aria-label="Ton-Einstellungen"
          onClick={(e) => open(e.currentTarget)}
          sx={[{ '&.Mui-focusVisible': { outline: `2px solid ${PALETTE.yellow}` } }, ...(Array.isArray(sx) ? sx : [sx])]}
        />
      ) : (
        <IconButton aria-label="Ton-Einstellungen" onClick={(e) => open(e.currentTarget)} sx={[{ color: 'text.secondary' }, ...(Array.isArray(sx) ? sx : [sx])]}>
          {settings.muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </IconButton>
      )}
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => open(null)}
        // In the game Space jumps: the focus must not go back to the button, or Space would reopen it.
        disableRestoreFocus={overlay}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
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
