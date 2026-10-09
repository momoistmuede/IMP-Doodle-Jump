import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useEffect, useRef, useState } from 'react';
import { createGame, createInput, update, VIEW_HEIGHT, WORLD_WIDTH } from '../game/engine';
import { render } from '../game/render';

/** Longest simulated step, so a stalled tab does not teleport the player. */
const MAX_STEP = 1 / 30;
/** Pause between falling off the screen and the game-over screen. */
const GAME_OVER_DELAY_MS = 600;

const CONTROL_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Space', 'KeyF']);

export function GameScreen({ onGameOver }: { onGameOver: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;
  const [score, setScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const state = createGame();
    const input = createInput();
    let frame = 0;
    let last = performance.now();
    let shownScore = 0;
    let gameOverTimer: ReturnType<typeof setTimeout> | undefined;

    const setKey = (event: KeyboardEvent, down: boolean) => {
      if (!CONTROL_KEYS.has(event.code)) {
        return;
      }
      event.preventDefault(); // no page scrolling, no button clicks
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

      // Canvas resolution follows its CSS size and the device pixel ratio.
      const width = Math.round(canvas.clientWidth * devicePixelRatio);
      if (canvas.width !== width) {
        canvas.width = width;
        canvas.height = Math.round((width * VIEW_HEIGHT) / WORLD_WIDTH);
      }
      render(ctx, state, canvas.width / WORLD_WIDTH);

      if (state.score !== shownScore) {
        shownScore = state.score;
        setScore(shownScore);
      }
      if (state.over) {
        gameOverTimer = setTimeout(() => onGameOverRef.current(state.score), GAME_OVER_DELAY_MS);
      } else {
        frame = requestAnimationFrame(loop);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    frame = requestAnimationFrame(loop);
    return () => {
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
        sx={{ display: 'block', width: '100%', height: '100%', borderRadius: 2, boxShadow: 6 }}
      />
      <Paper elevation={2} sx={{ position: 'absolute', top: 12, left: 12, px: 1.5, py: 0.5, opacity: 0.9 }}>
        <Typography variant="h6" component="p" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }} aria-live="off">
          {score.toLocaleString('de-DE')}
        </Typography>
      </Paper>
    </Box>
  );
}
