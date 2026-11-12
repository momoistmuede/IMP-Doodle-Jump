/** REST API of the backend (de.imp.doodlejump.rest.v1.HighscoreController and PlayerController). */
import type { Skin } from './game/skin';

export interface Highscore {
  name: string;
  score: number;
  achievedAt: string;
  /** Only in the top list; null if the player never saved a skin. */
  skin?: Skin | null;
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

function skinUrl(name: string): string {
  return `/api/v1/players/${encodeURIComponent(name)}/skin`;
}

/** The saved skin of a player, or null if the name has none. */
export async function fetchSkin(name: string): Promise<Skin | null> {
  const response = await fetch(skinUrl(name), { cache: 'no-store' });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Skin nicht ladbar (HTTP ${response.status})`);
  }
  return (await response.json()) as Skin;
}

export async function saveSkin(name: string, skin: Skin): Promise<void> {
  const response = await fetch(skinUrl(name), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(skin),
  });
  if (!response.ok) {
    throw new Error(`Skin nicht gespeichert (HTTP ${response.status})`);
  }
}
