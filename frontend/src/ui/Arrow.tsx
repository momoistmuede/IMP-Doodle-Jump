import Box from '@mui/material/Box';

const TURN = { up: 0, right: 90, down: 180, left: -90 } as const;
const LABEL = { up: 'Pfeil hoch', right: 'Pfeil rechts', down: 'Pfeil runter', left: 'Pfeil links' } as const;

/**
 * An arrow in the arcade font. The font has ↑ and ↓ but no ← and →, which a browser would take from
 * another font (tiny and out of style); so every arrow is its ↑, turned.
 */
export function Arrow({ direction }: { direction: keyof typeof TURN }) {
  return (
    <Box component="span" role="img" aria-label={LABEL[direction]} sx={{ display: 'inline-block', transform: `rotate(${TURN[direction]}deg)` }}>
      ↑
    </Box>
  );
}
