import { describe, expect, it } from 'vitest';
import {
  BULLET_SPEED,
  createGame,
  createInput,
  JUMP_VELOCITY,
  MAX_GAP,
  MONSTER_HEIGHT,
  PLATFORM_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  update,
  VIEW_HEIGHT,
  WORLD_WIDTH,
  GRAVITY,
  type GameState,
  type Input,
} from './engine';

const DT = 1 / 60;

/** Deterministic pseudo random numbers (mulberry32). */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function run(state: GameState, input: Input, seconds: number) {
  for (let t = 0; t < seconds; t += DT) {
    update(state, input, DT);
    input.fire = false;
  }
}

/** A game with only the start platform, so tests control what is in the world. */
function emptyGame(): GameState {
  const state = createGame(seeded(1));
  state.platforms = state.platforms.slice(0, 1);
  state.monsters = [];
  state.chainTopY = -1e9; // no further generation
  return state;
}

describe('engine', () => {
  it('starts standing on a platform and stays there without input', () => {
    const state = createGame(seeded(1));
    const y = state.player.y;
    run(state, createInput(), 2);
    expect(state.player.standingOn).not.toBeNull();
    expect(state.player.y).toBe(y);
    expect(state.over).toBe(false);
    expect(state.score).toBe(0);
  });

  it('jumps with space and lands on the platform again', () => {
    const state = emptyGame();
    const startY = state.player.y;
    const input = createInput();
    input.jump = true;
    update(state, input, DT);
    expect(state.player.vy).toBeLessThan(0);
    input.jump = false;
    let highest = startY;
    for (let i = 0; i < 120; i++) {
      update(state, input, DT);
      highest = Math.min(highest, state.player.y);
    }
    const apex = (JUMP_VELOCITY * JUMP_VELOCITY) / (2 * GRAVITY);
    expect(startY - highest).toBeGreaterThan(apex * 0.9);
    expect(state.player.standingOn).toBe(state.platforms[0].id);
    expect(state.player.y).toBe(startY);
  });

  it('keeps jumping while space is held', () => {
    const state = emptyGame();
    const input = createInput();
    input.jump = true;
    let takeoffs = 0;
    let previousVy = 0;
    for (let i = 0; i < 180; i++) {
      update(state, input, DT);
      if (state.player.vy < 0 && previousVy >= 0) takeoffs++;
      previousVy = state.player.vy;
    }
    expect(takeoffs).toBeGreaterThanOrEqual(2);
  });

  it('is game over after falling below the screen', () => {
    const state = emptyGame();
    const input = createInput();
    input.right = true; // walk off the start platform
    run(state, input, 3);
    expect(state.over).toBe(true);
  });

  it('wraps around the screen edges', () => {
    const state = emptyGame();
    state.player.standingOn = null;
    state.player.x = -PLAYER_WIDTH / 2 - 1;
    update(state, createInput(), DT);
    expect(state.player.x).toBeGreaterThan(WORLD_WIDTH / 2);
  });

  it('a breaking platform gives no support', () => {
    const state = emptyGame();
    const start = state.platforms[0];
    start.kind = 'breaking';
    state.player.standingOn = null;
    state.player.y = start.y - PLAYER_HEIGHT - 20;
    run(state, createInput(), 0.5);
    expect(start.broken).toBe(true);
    expect(state.player.standingOn).toBeNull();
    expect(state.player.y).toBeGreaterThan(start.y);
  });

  it('shoots monsters with F', () => {
    const state = emptyGame();
    const p = state.player;
    state.monsters.push({ id: 999, x: p.x - 5, y: p.y - 300, baseX: p.x - 5, phase: -Math.PI / 2 });
    // Freeze the side-to-side motion at baseX: sin(time * 2 + phase) = 0 with time = π/4.
    state.time = Math.PI / 4;
    const input = createInput();
    input.fire = true;
    run(state, input, 300 / BULLET_SPEED + 0.1);
    expect(state.monsters).toHaveLength(0);
    expect(state.kills).toBe(1);
    expect(state.score).toBe(50);
  });

  it('touching a monster from below ends the run', () => {
    const state = emptyGame();
    const p = state.player;
    state.monsters.push({ id: 999, x: p.x, y: p.y - MONSTER_HEIGHT + 20, baseX: p.x, phase: 0 });
    state.time = 0;
    run(state, createInput(), 3);
    expect(state.player.hit).toBe(true);
    expect(state.over).toBe(true);
  });

  it('generates a climbable chain of platforms', () => {
    const state = createGame(seeded(42));
    // Climb artificially: move the camera up and let the generator fill the screen.
    for (let i = 0; i < 400; i++) {
      state.player.standingOn = null;
      state.player.hit = false; // monsters are not the point here
      state.player.y = state.cameraY + VIEW_HEIGHT * 0.3;
      state.player.vy = -JUMP_VELOCITY;
      update(state, createInput(), DT);
    }
    expect(state.maxHeight).toBeGreaterThan(5000);
    const supporting = state.platforms.filter((p) => p.kind !== 'breaking').map((p) => p.y).sort((a, b) => a - b);
    for (let i = 1; i < supporting.length; i++) {
      expect(supporting[i] - supporting[i - 1]).toBeLessThanOrEqual(MAX_GAP);
    }
    for (const platform of state.platforms) {
      expect(platform.x).toBeGreaterThanOrEqual(0);
      expect(platform.x).toBeLessThanOrEqual(WORLD_WIDTH - PLATFORM_WIDTH);
    }
  });
});
