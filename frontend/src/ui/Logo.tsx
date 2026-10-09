import Box from '@mui/material/Box';

/** IMP logo (public/imp-logo.png, 600 × 270). */
export function Logo({ height = 28 }: { height?: number }) {
  return <Box component="img" src="/imp-logo.png" alt="IMP" sx={{ height, width: 'auto', display: 'block' }} />;
}
