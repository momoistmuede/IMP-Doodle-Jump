import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { sound } from '../audio/sound';
import { PALETTE } from '../game/palette';
import { DEFAULT_SKIN, GLASSES, HATS, randomSkin, SKIN_COLORS, type Pose, type Skin } from '../game/skin';
import { Figure } from './Figure';

type ColorRow = { kind: 'color'; part: 'body' | 'shirt' | 'tentacles'; label: string };
type AccessoryRow = { kind: 'accessory'; part: 'hat' | 'glasses'; label: string; options: readonly (readonly [string, string])[] };

const ROWS: (ColorRow | AccessoryRow)[] = [
  { kind: 'color', part: 'body', label: 'KÖRPER' },
  { kind: 'color', part: 'shirt', label: 'T-SHIRT' },
  { kind: 'color', part: 'tentacles', label: 'TENTAKEL' },
  { kind: 'accessory', part: 'hat', label: 'HUT', options: HATS },
  { kind: 'accessory', part: 'glasses', label: 'BRILLE', options: GLASSES },
];

/** The preview changes its pose now and then, so the skin can be seen in every situation. */
const PREVIEW_POSES: { pose: Pose; parachute?: boolean }[] = [{ pose: 'stand' }, { pose: 'jump' }, { pose: 'shoot' }, { pose: 'stand', parachute: true }];
const PREVIEW_SIZE = 232; // 4 × the figure

interface Props {
  name: string;
  /** Preselected skin: the saved one, or the default. */
  initial: Skin;
  /** Whether the name already had a saved skin. */
  returning: boolean;
  onStart: (skin: Skin) => void;
}

/** Colours for body, shirt and tentacles plus hat and glasses; keyboard or mouse. */
export function SkinScreen({ name, initial, returning, onStart }: Props) {
  const [skin, setSkin] = useState(initial);
  const [row, setRow] = useState(0);
  const [poseIndex, setPoseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setPoseIndex((i) => (i + 1) % PREVIEW_POSES.length), 2500);
    return () => clearInterval(timer);
  }, []);

  const change = (next: Skin) => {
    sound.play('click');
    setSkin(next);
  };

  // ↑ ↓ choose the row, ← → the colour or accessory, Enter or Space = LOS, R = random.
  useEffect(() => {
    const step = (current: Skin, index: number, delta: number): Skin => {
      const r = ROWS[index];
      if (r.kind === 'color') {
        const position = SKIN_COLORS.findIndex(([base]) => base === current[r.part]);
        return { ...current, [r.part]: SKIN_COLORS[(position + delta + SKIN_COLORS.length) % SKIN_COLORS.length][0] };
      }
      const position = r.options.findIndex(([id]) => id === current[r.part]);
      return { ...current, [r.part]: r.options[(position + delta + r.options.length) % r.options.length][0] };
    };
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'ArrowDown':
          event.preventDefault();
          sound.play('click');
          setRow((r) => (r + (event.code === 'ArrowUp' ? -1 : 1) + ROWS.length) % ROWS.length);
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
          event.preventDefault();
          change(step(skin, row, event.code === 'ArrowLeft' ? -1 : 1));
          break;
        case 'KeyR':
          change(randomSkin());
          break;
        case 'Enter':
        case 'Space':
          event.preventDefault();
          if (!event.repeat) {
            onStart(skin);
          }
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [skin, row, onStart]);

  const preview = PREVIEW_POSES[poseIndex];
  const upper = name.toUpperCase();

  return (
    <Card sx={{ width: '100%', maxWidth: 640 }}>
      <CardContent>
        <Stack spacing={2.5} sx={{ alignItems: 'center' }}>
          <Typography variant="h2" component="h1" sx={{ color: PALETTE.yellow, textAlign: 'center', overflowWrap: 'anywhere' }}>
            {returning ? `WILLKOMMEN ZURÜCK, ${upper}!` : `HALLO, ${upper}!`}
          </Typography>

          <Box sx={{ height: PREVIEW_SIZE, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <Figure skin={skin} size={preview.parachute ? PREVIEW_SIZE : PREVIEW_SIZE * 0.85} pose={preview.pose} parachute={preview.parachute} bounce={!preview.parachute} />
          </Box>

          <Stack spacing={1} sx={{ width: '100%' }} role="list" aria-label="Spielfigur anpassen">
            {ROWS.map((r, index) => (
              <Stack
                key={r.part}
                direction="row"
                spacing={1}
                role="listitem"
                onMouseEnter={() => setRow(index)}
                sx={{ alignItems: 'center', minHeight: 32 }}
              >
                <Typography variant="body2" sx={{ width: 112, flexShrink: 0, color: index === row ? PALETTE.yellow : 'text.primary' }}>
                  {index === row ? '▶ ' : '  '}
                  {r.label}
                </Typography>
                {r.kind === 'color' ? (
                  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {SKIN_COLORS.map(([base]) => {
                      const selected = skin[r.part] === base;
                      return (
                        <ButtonBase
                          key={base}
                          aria-label={`${r.label} ${base}`}
                          aria-pressed={selected}
                          onClick={() => change({ ...skin, [r.part]: base })}
                          sx={{
                            width: 24,
                            height: 24,
                            bgcolor: base,
                            border: 2,
                            borderColor: selected ? PALETTE.white : PALETTE.black,
                            outline: selected ? `2px solid ${PALETTE.yellow}` : 'none',
                          }}
                        />
                      );
                    })}
                  </Stack>
                ) : (
                  <Stack direction="row" sx={{ alignItems: 'center' }}>
                    <IconButton size="small" aria-label={`${r.label} zurück`} onClick={() => change(cycle(skin, r, -1))}>
                      <ChevronLeftIcon />
                    </IconButton>
                    <Typography variant="body2" sx={{ minWidth: 112, textAlign: 'center' }}>
                      {r.options.find(([id]) => id === skin[r.part])?.[1]}
                    </Typography>
                    <IconButton size="small" aria-label={`${r.label} weiter`} onClick={() => change(cycle(skin, r, 1))}>
                      <ChevronRightIcon />
                    </IconButton>
                  </Stack>
                )}
              </Stack>
            ))}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'center', rowGap: 1 }}>
            <Button color="secondary" onClick={() => change(randomSkin())}>
              Zufall
            </Button>
            <Button color="secondary" onClick={() => change(DEFAULT_SKIN)}>
              Standard
            </Button>
            <Button variant="contained" onClick={() => onStart(skin)}>
              ▶ Los ◀
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            ↑ ↓ ZEILE · ← → AUSWAHL · R ZUFALL · ENTER LOS
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function cycle(skin: Skin, row: AccessoryRow, delta: number): Skin {
  const position = row.options.findIndex(([id]) => id === skin[row.part]);
  return { ...skin, [row.part]: row.options[(position + delta + row.options.length) % row.options.length][0] };
}
