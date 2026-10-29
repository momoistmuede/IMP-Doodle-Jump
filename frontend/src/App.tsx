import { CacheProvider } from '@emotion/react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import { ThemeProvider } from '@mui/material/styles';
import { useCallback, useEffect, useState } from 'react';
import { fetchHighscores, type Highscore, type SubmitResult } from './api';
import { GameOverScreen } from './ui/GameOverScreen';
import { GameScreen } from './ui/GameScreen';
import { HighscoreScreen } from './ui/HighscoreScreen';
import { createEmotionCache } from './ui/emotionCache';
import { theme } from './ui/theme';

const emotionCache = createEmotionCache();

type Screen =
  | { kind: 'highscores'; lastResult: SubmitResult | null }
  | { kind: 'playing'; round: number }
  | { kind: 'gameOver'; score: number; round: number };

/** The top 10, shared by the start screen, the HUD (HI and NEXT) and the game-over screen. */
export interface HighscoreList {
  entries: Highscore[] | null;
  error: string | null;
}

export function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'highscores', lastResult: null });
  const [highscores, setHighscores] = useState<HighscoreList>({ entries: null, error: null });
  // A new round number remounts GameScreen, which starts a fresh game.
  const play = () => setScreen((s) => ({ kind: 'playing', round: 'round' in s ? s.round + 1 : 1 }));

  const reload = useCallback(() => {
    fetchHighscores().then(
      (entries) => setHighscores({ entries, error: null }),
      (e: unknown) => setHighscores((h) => ({ entries: h.entries, error: e instanceof Error ? e.message : String(e) })),
    );
  }, []);
  useEffect(reload, [reload]);

  const showHighscores = (lastResult: SubmitResult | null) => {
    reload();
    setScreen({ kind: 'highscores', lastResult });
  };

  let content;
  switch (screen.kind) {
    case 'highscores':
      content = <HighscoreScreen onPlay={play} lastResult={screen.lastResult} highscores={highscores} />;
      break;
    case 'playing':
      content = (
        <GameScreen
          key={screen.round}
          highscores={highscores.entries ?? []}
          onGameOver={(score) => setScreen({ kind: 'gameOver', score, round: screen.round })}
        />
      );
      break;
    case 'gameOver':
      content = (
        <GameOverScreen
          score={screen.score}
          highscores={highscores.entries ?? []}
          onSaved={showHighscores}
          onSkip={() => showHighscores(null)}
          onReplay={play}
        />
      );
      break;
  }

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={{ 'html, body, #root': { height: '100%' } }} />
        <Box sx={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>{content}</Box>
      </ThemeProvider>
    </CacheProvider>
  );
}
