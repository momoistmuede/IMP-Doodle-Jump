/** REST API of the backend (de.imp.doodlejump.rest.v1.HighscoreController). */

export interface Highscore {
  name: string;
  score: number;
  achievedAt: string;
}

export interface SubmitResult {
  best: Highscore;
  newBest: boolean;
  rank: number;
}

/** Matches SubmitScoreRequest.MAX_NAME_LENGTH in the backend. */
export const MAX_NAME_LENGTH = 20;

const BASE = '/api/v1/highscores';

export async function fetchHighscores(): Promise<Highscore[]> {
  const response = await fetch(BASE, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Highscores nicht ladbar (HTTP ${response.status})`);
  }
  return (await response.json()) as Highscore[];
}

export async function submitScore(name: string, score: number): Promise<SubmitResult> {
  const response = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, score }),
  });
  if (!response.ok) {
    throw new Error(`Speichern fehlgeschlagen (HTTP ${response.status})`);
  }
  return (await response.json()) as SubmitResult;
}
