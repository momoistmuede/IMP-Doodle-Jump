import { CacheProvider } from '@emotion/react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import { ThemeProvider } from '@mui/material/styles';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchHighscores, fetchSkin, saveSkin, type Highscore, type SubmitResult } from './api';
import { sound } from './audio/sound';
import { DEFAULT_SKIN, sanitizeSkin, type Skin } from './game/skin';
import { GameOverScreen } from './ui/GameOverScreen';
import { GameScreen } from './ui/GameScreen';
import { HighscoreScreen } from './ui/HighscoreScreen';
import { NameScreen } from './ui/NameScreen';
import { SkinScreen } from './ui/SkinScreen';
import { saveLastName } from './ui/lastName';
import { createEmotionCache } from './ui/emotionCache';
import { theme } from './ui/theme';

const emotionCache = createEmotionCache();

/**
 * Start screen → name → skin → intro and round → game over → again (same player) or another player.
 * See docs/konzept-arcade.md, 2.3.
 */
type Screen =
  | { kind: 'highscores'; lastResult: SubmitResult | null }
  | { kind: 'name' }
  | { kind: 'skin'; returning: boolean }
  | { kind: 'playing'; round: number }
  | { kind: 'gameOver'; score: number };

/** Who is playing; stays until "Spieler wechseln". */
interface PlayerInfo {
  name: string;
  skin: Skin;
}

/** The top 10, shared by the start screen, the HUD (HI and NEXT) and the game-over screen. */
export interface HighscoreList {
  entries: Highscore[] | null;
  error: string | null;
}

export function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'highscores', lastResult: null });
  const [highscores, setHighscores] = useState<HighscoreList>({ entries: null, error: null });
  const [player, setPlayer] = useState<PlayerInfo>({ name: '', skin: DEFAULT_SKIN });
  const [loadingSkin, setLoadingSkin] = useState(false);
  const lastResult = useRef<SubmitResult | null>(null);
  // A new round number remounts GameScreen, which starts a fresh game.
  const round = useRef(0);
  const play = useCallback(() => {
    sound.unlock();
    sound.play('insertCoin');
    setScreen({ kind: 'playing', round: ++round.current });
  }, []);

  /** Name entered: preselect the skin saved for this name (if loading fails, the default skin). */
  const enterName = (name: string) => {
    saveLastName(name);
    setLoadingSkin(true);
    fetchSkin(name)
      .catch(() => null)
      .then((stored) => {
        setLoadingSkin(false);
        setPlayer({ name, skin: sanitizeSkin(stored) });
        setScreen({ kind: 'skin', returning: stored !== null });
      });
  };

  /** LOS: the skin is saved in the background; the game does not wait for it. */
  const startWithSkin = useCallback(
    (skin: Skin) => {
      setPlayer((p) => ({ ...p, skin }));
      saveSkin(player.name, skin).catch(() => {}); // only the preselection next time is lost
      play();
    },
    [player.name, play],
  );

  // Audio is only allowed after a user action; M switches the sound on and off everywhere.
  useEffect(() => {
    const unlock = () => sound.unlock();
    const onKeyDown = (event: KeyboardEvent) => {
      sound.unlock();
      const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
      if (event.code === 'KeyM' && !event.repeat && !typing) {
        sound.toggleMute();
      }
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const reload = useCallback(() => {
    fetchHighscores().then(
      (entries) => setHighscores({ entries, error: null }),
      (e: unknown) => setHighscores((h) => ({ entries: h.entries, error: e instanceof Error ? e.message : String(e) })),
    );
  }, []);
  useEffect(reload, [reload]);

  let content;
  switch (screen.kind) {
    case 'highscores':
      content = <HighscoreScreen onPlay={() => setScreen({ kind: 'name' })} lastResult={screen.lastResult} highscores={highscores} />;
      break;
    case 'name':
      content = <NameScreen onSubmit={enterName} onBack={() => setScreen({ kind: 'highscores', lastResult: null })} loading={loadingSkin} />;
      break;
    case 'skin':
      content = <SkinScreen name={player.name} initial={player.skin} returning={screen.returning} onStart={startWithSkin} />;
      break;
    case 'playing':
      content = (
        <GameScreen
          key={screen.round}
          skin={player.skin}
          highscores={highscores.entries ?? []}
          onGameOver={(score) => {
            lastResult.current = null;
            setScreen({ kind: 'gameOver', score });
          }}
        />
      );
      break;
    case 'gameOver':
      content = (
        <GameOverScreen
          name={player.name}
          score={screen.score}
          highscores={highscores.entries ?? []}
          onSaved={(result) => {
            lastResult.current = result;
            reload();
          }}
          onReplay={play}
          onChangePlayer={() => setScreen({ kind: 'name' })}
          onHighscores={() => setScreen({ kind: 'highscores', lastResult: lastResult.current })}
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
