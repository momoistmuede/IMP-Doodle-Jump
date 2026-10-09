import { CacheProvider } from '@emotion/react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import { ThemeProvider } from '@mui/material/styles';
import { useState } from 'react';
import type { SubmitResult } from './api';
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

export function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'highscores', lastResult: null });
  // A new round number remounts GameScreen, which starts a fresh game.
  const play = () => setScreen((s) => ({ kind: 'playing', round: 'round' in s ? s.round + 1 : 1 }));

  let content;
  switch (screen.kind) {
    case 'highscores':
      content = <HighscoreScreen onPlay={play} lastResult={screen.lastResult} />;
      break;
    case 'playing':
      content = (
        <GameScreen key={screen.round} onGameOver={(score) => setScreen({ kind: 'gameOver', score, round: screen.round })} />
      );
      break;
    case 'gameOver':
      content = (
        <GameOverScreen
          score={screen.score}
          onSaved={(lastResult) => setScreen({ kind: 'highscores', lastResult })}
          onSkip={() => setScreen({ kind: 'highscores', lastResult: null })}
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
