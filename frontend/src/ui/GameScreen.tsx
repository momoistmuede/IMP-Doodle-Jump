import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';
import type { Highscore } from '../api';
import { playEventSounds } from '../audio/gameSounds';
import { sound } from '../audio/sound';
import { createGame, createInput, update, VIEW_HEIGHT, WORLD_WIDTH } from '../game/engine';
import { createHud, FONT_FAMILY, updateHud } from '../game/hud';
import { Renderer } from '../game/render';
import { Sprites } from '../game/sprites';
import { PALETTE } from '../game/palette';

/** Longest simulated step, so a stalled tab does not teleport the player. */
const MAX_STEP = 1 / 30;
/** Pause between falling off the screen and the game-over screen. */
const GAME_OVER_DELAY_MS = 600;

const CONTROL_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'KeyF']);

/** Font and sprites are loaded once; otherwise the first frame would show the fallback font. */
let assets: Promise<Sprites> | undefined;
function loadAssets(): Promise<Sprites> {
  assets ??= Promise.all([document.fonts.load(`32px ${FONT_FAMILY}`), Sprites.load()]).then(([, sprites]) => sprites);
  assets.catch(() => (assets = undefined)); // try again next round
  return assets;
}

interface Props {
  /** The top 10 for HI and NEXT in the HUD. */
  highscores: Highscore[];
  onGameOver: (score: number) => void;
}

export function GameScreen({ highscores, onGameOver }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;
  const topRef = useRef(highscores.map((h) => h.score));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const state = createGame(Math.random, { intro: true });
    const input = createInput();
    const hud = createHud(topRef.current);
    let renderer: Renderer | undefined;
    let frame = 0;
    let last = 0;
    let stopped = false;
    let muffled = false;
    let gameOverTimer: ReturnType<typeof setTimeout> | undefined;

    const setKey = (event: KeyboardEvent, down: boolean) => {
      if (!CONTROL_KEYS.has(event.code)) {
        return;
      }
      event.preventDefault(); // no page scrolling, no button clicks
      // Space or Enter skips the intro; only a new key press counts, not the key repeat.
      if (down && !event.repeat && (event.code === 'Space' || event.code === 'Enter')) {
        input.skip = true;
      }
      switch (event.code) {
        case 'ArrowLeft':
          input.left = down;
          break;
        case 'ArrowRight':
          input.right = down;
          break;
        case 'Space':
          input.jump = down;
          break;
        case 'KeyF':
          if (down && !event.repeat) input.fire = true;
          break;
      }
    };
    const onKeyDown = (event: KeyboardEvent) => setKey(event, true);
    const onKeyUp = (event: KeyboardEvent) => setKey(event, false);
    const onBlur = () => Object.assign(input, createInput());

    const loop = (now: number) => {
      const dt = Math.min(MAX_STEP, (now - last) / 1000);
      last = now;
      update(state, input, dt);
      input.fire = false;
      input.skip = false;
      if (updateHud(hud, state, dt)) {
        sound.play('overtake');
      }
      playEventSounds(state.events, state);
      state.events = [];
      if (state.parachute !== muffled) {
        muffled = state.parachute;
        sound.setMuffled(muffled);
      }
      hud.muted = sound.current.muted;

      // Canvas resolution follows its CSS size and the device pixel ratio.
      const width = Math.round(canvas.clientWidth * devicePixelRatio);
      if (canvas.width !== width) {
        canvas.width = width;
        canvas.height = Math.round((width * VIEW_HEIGHT) / WORLD_WIDTH);
      }
      renderer!.render(state, hud, canvas.width / WORLD_WIDTH);

      if (state.over) {
        gameOverTimer = setTimeout(() => onGameOverRef.current(state.score), GAME_OVER_DELAY_MS);
      } else {
        frame = requestAnimationFrame(loop);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    loadAssets().then(
      (sprites) => {
        if (stopped) return;
        renderer = new Renderer(ctx, sprites);
        last = performance.now();
        frame = requestAnimationFrame(loop);
      },
      (e: unknown) => setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      stopped = true;
      sound.setMuffled(false);
      cancelAnimationFrame(frame);
      clearTimeout(gameOverTimer);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return (
    <Box sx={{ position: 'relative', height: 'min(calc(100vh - 32px), 900px)', aspectRatio: `${WORLD_WIDTH} / ${VIEW_HEIGHT}`, maxWidth: '100%' }}>
      <Box
        component="canvas"
        ref={canvasRef}
        aria-label="Spielfeld"
        sx={{ display: 'block', width: '100%', height: '100%', bgcolor: PALETTE.paper, outline: `4px solid ${PALETTE.slate}` }}
      />
      {error && (
        <Typography color="error" sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', p: 2, textAlign: 'center' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
