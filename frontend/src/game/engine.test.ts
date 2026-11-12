import { describe, expect, it } from 'vitest';
import {
  BULLET_SPEED,
  HEART_BONUS,
  HURT_INVULNERABILITY,
  LANDING_INVULNERABILITY,
  MAX_LIVES,
  PARACHUTE_DROP,
  POWER_UP_SIZE,
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

  it('is game over after falling below the screen with the last heart', () => {
    const state = emptyGame();
    state.lives = 1;
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
    const startY = start.y;
    state.player.standingOn = null;
    state.player.y = start.y - PLAYER_HEIGHT - 20;
    run(state, createInput(), 0.5);
    expect(start.broken).toBe(true);
    expect(state.player.standingOn).toBeNull();
    expect(state.player.y).toBeGreaterThan(startY);
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

  it('touching a monster from below with the last heart ends the run', () => {
    const state = emptyGame();
    state.lives = 1;
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

  describe('lives', () => {
    /** A monster sitting still right next to the standing player. */
    function monsterBeside(state: GameState) {
      const p = state.player;
      state.monsters.push({ id: 999, x: p.x + 20, y: p.y, baseX: p.x + 20, phase: 0 });
      state.time = 0; // sin(time * 2 + phase) = 0: the monster stays at baseX for a moment
    }

    it('starts with three hearts', () => {
      expect(createGame(seeded(1)).lives).toBe(MAX_LIVES);
    });

    it('touching a monster costs one heart, knocks back and makes invulnerable', () => {
      const state = emptyGame();
      monsterBeside(state);
      update(state, createInput(), DT);
      expect(state.lives).toBe(MAX_LIVES - 1);
      expect(state.player.hit).toBe(false);
      expect(state.player.vx).toBeLessThan(0);
      expect(state.invulnerable).toBeCloseTo(HURT_INVULNERABILITY);
      expect(state.monsters).toHaveLength(1);
      expect(state.events).toContainEqual({ type: 'hurt', cause: 'monster' });
    });

    it('cannot be hurt while invulnerable', () => {
      const state = emptyGame();
      monsterBeside(state);
      state.invulnerable = 1;
      update(state, createInput(), DT);
      expect(state.lives).toBe(MAX_LIVES);
    });

    it('falling opens the parachute and lands on a rescue platform', () => {
      const state = emptyGame();
      const input = createInput();
      input.right = true; // walk off the start platform
      const oldBottom = state.cameraY + VIEW_HEIGHT;
      for (let i = 0; i < 600 && !state.parachute; i++) {
        update(state, input, DT);
      }
      expect(state.parachute).toBe(true);
      expect(state.lives).toBe(MAX_LIVES - 1);
      expect(state.over).toBe(false);
      const rescue = state.platforms.find((p) => p.kind === 'rescue')!;
      expect(rescue.y).toBe(oldBottom + PARACHUTE_DROP);

      let seconds = 0;
      while (state.parachute && seconds < 10) {
        update(state, input, DT);
        seconds += DT;
      }
      expect(state.parachute).toBe(false);
      expect(seconds).toBeGreaterThan(2);
      expect(seconds).toBeLessThan(3.5);
      expect(state.player.standingOn).toBe(rescue.id);
      expect(state.invulnerable).toBeCloseTo(LANDING_INVULNERABILITY, 1);
      expect(state.cameraY).toBeGreaterThan(0); // the camera followed down
      expect(state.score).toBe(0); // points are kept, the fall costs none
    });

    it('builds a climbable way back up from the rescue platform, without monsters', () => {
      const state = createGame(seeded(7));
      for (let i = 0; i < 200; i++) {
        state.player.standingOn = null;
        state.player.y = state.cameraY + VIEW_HEIGHT * 0.3;
        state.player.vy = -JUMP_VELOCITY;
        update(state, createInput(), DT);
      }
      state.monsters = [];
      state.player.y = state.cameraY + VIEW_HEIGHT + 1; // just fell off
      state.player.vy = 500;
      update(state, createInput(), DT);
      expect(state.parachute).toBe(true);
      const rescue = state.platforms.find((p) => p.kind === 'rescue')!;
      run(state, createInput(), 4); // land and stand there
      expect(state.parachute).toBe(false);
      expect(state.player.standingOn).toBe(rescue.id);
      const supporting = state.platforms
        .filter((p) => p.kind !== 'breaking' && p.y <= rescue.y)
        .map((p) => p.y)
        .sort((a, b) => a - b);
      for (let i = 1; i < supporting.length; i++) {
        expect(supporting[i] - supporting[i - 1]).toBeLessThanOrEqual(MAX_GAP);
      }
      expect(state.monsters).toHaveLength(0);
    });

    it('keeps the points after a fall', () => {
      const state = emptyGame();
      state.maxHeight = 2000;
      state.player.standingOn = null;
      state.player.y = state.cameraY + VIEW_HEIGHT + 1;
      update(state, createInput(), DT);
      expect(state.parachute).toBe(true);
      expect(state.score).toBe(200);
    });

    it('collects a heart: one heart more, at full lives points instead', () => {
      const state = emptyGame();
      const p = state.player;
      state.lives = 1;
      state.powerUps.push({ id: 900, kind: 'heart', x: p.x, y: p.y });
      update(state, createInput(), DT);
      expect(state.lives).toBe(2);
      expect(state.powerUps).toHaveLength(0);

      state.lives = MAX_LIVES;
      state.powerUps.push({ id: 901, kind: 'heart', x: p.x, y: p.y });
      update(state, createInput(), DT);
      expect(state.lives).toBe(MAX_LIVES);
      expect(state.bonus).toBe(HEART_BONUS);
      expect(state.score).toBe(HEART_BONUS);
    });

    it('spawns hearts above chain platforms, at least 80 m apart, more often when hearts are missing', () => {
      const count = (lives: number) => {
        const state = createGame(seeded(3));
        state.lives = lives;
        const hearts = new Set<number>();
        const ys: number[] = [];
        for (let i = 0; i < 1500; i++) {
          state.lives = lives;
          state.player.standingOn = null;
          state.player.hit = false;
          state.invulnerable = 10;
          state.player.y = state.cameraY + VIEW_HEIGHT * 0.3;
          state.player.vy = -JUMP_VELOCITY * 2;
          update(state, createInput(), DT);
          for (const h of state.powerUps) {
            if (!hearts.has(h.id)) {
              hearts.add(h.id);
              ys.push(h.y);
            }
          }
          state.powerUps = []; // never collected
        }
        ys.sort((a, b) => a - b);
        for (let i = 1; i < ys.length; i++) {
          expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(800);
        }
        return ys.length;
      };
      expect(count(1)).toBeGreaterThan(count(3));
    });

    it('a heart floats reachable above its platform', () => {
      const state = createGame(seeded(11));
      state.lives = 1;
      for (let i = 0; i < 2000 && state.powerUps.length === 0; i++) {
        state.player.standingOn = null;
        state.player.y = state.cameraY + VIEW_HEIGHT * 0.3;
        state.player.vy = -JUMP_VELOCITY;
        update(state, createInput(), DT);
      }
      const heart = state.powerUps[0];
      const below = state.platforms.find(
        (p) => p.x <= heart.x && heart.x + POWER_UP_SIZE <= p.x + p.width && p.y > heart.y && p.y - heart.y < 100,
      );
      expect(below).toBeDefined();
    });
  });

  describe('events', () => {
    it('reports a jump once per take-off', () => {
      const state = emptyGame();
      const input = createInput();
      input.jump = true;
      update(state, input, DT);
      expect(state.events.filter((e) => e.type === 'jump')).toHaveLength(1);
      state.events = [];
      input.jump = false;
      run(state, input, 0.3);
      expect(state.events.filter((e) => e.type === 'jump')).toHaveLength(0);
    });

    it('reports exactly one spring when landing on a spring', () => {
      const state = emptyGame();
      state.platforms[0].spring = true;
      state.player.standingOn = null;
      state.player.y -= 30;
      state.player.vy = 300;
      let springs = 0;
      for (let i = 0; i < 10; i++) {
        update(state, createInput(), DT);
        springs += state.events.filter((e) => e.type === 'spring').length;
        state.events = [];
      }
      expect(springs).toBe(1);
      expect(state.player.vy).toBeLessThan(-JUMP_VELOCITY);
    });

    it('reports shots, breaking platforms and how a monster died', () => {
      const state = emptyGame();
      const p = state.player;
      state.monsters.push({ id: 999, x: p.x - 5, y: p.y - 300, baseX: p.x - 5, phase: -Math.PI / 2 });
      state.time = Math.PI / 4;
      const input = createInput();
      input.fire = true;
      const events: string[] = [];
      for (let i = 0; i < 30; i++) {
        update(state, input, DT);
        input.fire = false;
        events.push(...state.events.map((e) => (e.type === 'kill' ? `kill:${e.by}` : e.type)));
        state.events = [];
      }
      expect(events).toEqual(['shoot', 'monsterNear', 'kill:shot']);
    });

    it('announces a monster before it comes into view', () => {
      const state = emptyGame();
      state.monsters.push({ id: 999, x: 100, y: state.cameraY - MONSTER_HEIGHT - 100, baseX: 100, phase: 0 });
      update(state, createInput(), DT);
      expect(state.events).toContainEqual({ type: 'monsterNear' });
      state.events = [];
      update(state, createInput(), DT);
      expect(state.events).toEqual([]);
    });
  });
});
