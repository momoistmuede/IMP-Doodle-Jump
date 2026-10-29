/** The top 10 as seen from a running game: HI, NEXT and the place a score would reach. */

export const TOP_PLACES = 10;
const SCORE_DIGITS = 6;

/** Six digits with leading zeros, as on an arcade machine. */
export function formatScore(score: number): string {
  return String(Math.min(Math.max(0, Math.floor(score)), 10 ** SCORE_DIGITS - 1)).padStart(SCORE_DIGITS, '0');
}

/** HI: the score of place 1, or the player's own score once it is higher. */
export function hiScore(top: readonly number[], score: number): { score: number; beaten: boolean } {
  const best = top[0] ?? 0;
  return score > best ? { score, beaten: true } : { score: best, beaten: false };
}

/**
 * NEXT: the lowest place of the top 10 the player has not overtaken yet, or null once even place 1
 * is beaten (NEW #1). Empty places count as 0 points and are overtaken right away.
 * `top` holds the scores of the filled places, best first.
 */
export function nextTarget(top: readonly number[], score: number): { rank: number; score: number } | null {
  for (let i = Math.min(top.length, TOP_PLACES) - 1; i >= 0; i--) {
    if (top[i] >= score) {
      return { rank: i + 1, score: top[i] };
    }
  }
  return null;
}

/** The place the score would take in the top 10, or null if it does not make it (or is 0). */
export function placeFor(top: readonly number[], score: number): number | null {
  if (score <= 0) {
    return null;
  }
  const rank = top.filter((s) => s > score).length + 1;
  return rank <= TOP_PLACES ? rank : null;
}
