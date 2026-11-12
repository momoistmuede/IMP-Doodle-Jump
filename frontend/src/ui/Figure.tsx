import Box from '@mui/material/Box';
import { useEffect, useMemo, useState } from 'react';
import { figureSvg, type FigureParts, type Pose, type Skin } from '../game/skin';
import { loadFigureParts, svgDataUrl } from '../game/sprites';
import { PALETTE } from '../game/palette';

/** Width : height of a figure (the player sprite box). */
const RATIO = 60 / 58;
const PARACHUTE_RATIO = 60 / 108;

function useFigureParts(): FigureParts | null {
  const [parts, setParts] = useState<FigureParts | null>(null);
  useEffect(() => {
    let alive = true;
    loadFigureParts().then(
      (loaded) => alive && setParts(loaded),
      () => {}, // without the parts the silhouette stays
    );
    return () => {
      alive = false;
    };
  }, []);
  return parts;
}

interface Props {
  /** null: grey silhouette with "?" (empty place, or a player without a saved skin). */
  skin: Skin | null;
  /** Height in px. */
  size: number;
  pose?: Pose;
  parachute?: boolean;
  bounce?: boolean;
}

/** The player figure in a skin, with hat and glasses, as a sharp SVG image. */
export function Figure({ skin, size, pose = 'stand', parachute = false, bounce = false }: Props) {
  const parts = useFigureParts();
  const src = useMemo(() => (parts && skin ? svgDataUrl(figureSvg(parts, skin, pose, parachute)) : null), [parts, skin, pose, parachute]);
  const animation = bounce ? { '@keyframes hop': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12%)' } }, animation: 'hop 0.6s ease-in-out infinite' } : {};

  if (!src) {
    return (
      <Box
        aria-hidden
        sx={{
          width: size * 0.8,
          height: size,
          display: 'grid',
          placeItems: 'center',
          bgcolor: PALETTE.slate,
          color: PALETTE.grey,
          fontSize: Math.max(8, Math.round(size / 24) * 8),
          borderRadius: `${size / 2}px ${size / 2}px 2px 2px`,
        }}
      >
        ?
      </Box>
    );
  }
  return (
    <Box
      component="img"
      src={src}
      alt=""
      aria-hidden
      sx={{ height: size, width: size * (parachute ? PARACHUTE_RATIO : RATIO), display: 'block', ...animation }}
    />
  );
}
