import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { PALETTE } from '../game/palette';
import { Logo } from './Logo';

/** Game name and subtitle, always lower case. */
export function Title({ logo = true }: { logo?: boolean }) {
  return (
    <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
      {logo && <Logo height={28} />}
      <Typography variant="h1" sx={{ color: PALETTE.white }}>
        imp@jump
      </Typography>
      <Typography variant="body2" component="p" sx={{ color: PALETTE.grey, fontSize: 16 }}>
        der einzig wahre jumphost
      </Typography>
    </Stack>
  );
}
