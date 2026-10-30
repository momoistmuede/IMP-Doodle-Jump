import { describe, expect, it } from 'vitest';
import {
  BULLET_SPEED,
  JETPACK_DURATION,
  JETPACK_SPEED,
  ENEMY_BULLET_SPEED,
  MONSTER_TYPES,
  newMonster,
  SHOOT_INTERVAL,
  CRUMBLE_DELAY,
  lowestPoint,
  SHORT_PLATFORM_WIDTH,
  spikeOverlaps,
  supports,
  VERTICAL_AMPLITUDE,
  type Monster,
  type MonsterKind,
  type Platform,
  fillRange,
  INTRO_DURATION,
  INTRO_START_M,
  POINTS_BONUS,
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
  MONSTER_WIDTH,
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
  state.powerUps = [];
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
    state.monsters.push({ ...newMonster(state, 'wobbler', p.x - 5, p.y - 300), phase: -Math.PI / 2 });
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
    state.monsters.push({ ...newMonster(state, 'wobbler', p.x, p.y - MONSTER_HEIGHT + 20), phase: 0 });
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
      state.monsters.push({ ...newMonster(state, 'wobbler', p.x + 20, p.y), phase: 0 });
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
          for (const h of state.powerUps.filter((p) => p.kind === 'heart')) {
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
      const hearts = () => state.powerUps.filter((p) => p.kind === 'heart');
      for (let i = 0; i < 2000 && hearts().length === 0; i++) {
        state.player.standingOn = null;
        state.player.y = state.cameraY + VIEW_HEIGHT * 0.3;
        state.player.vy = -JUMP_VELOCITY;
        update(state, createInput(), DT);
      }
      const heart = hearts()[0];
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
      state.monsters.push({ ...newMonster(state, 'wobbler', p.x - 5, p.y - 300), phase: -Math.PI / 2 });
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
      state.monsters.push({ ...newMonster(state, 'wobbler', 100, state.cameraY - MONSTER_HEIGHT - 100), phase: 0 });
      update(state, createInput(), DT);
      expect(state.events).toContainEqual({ type: 'monsterNear', kind: 'wobbler' });
      state.events = [];
      update(state, createInput(), DT);
      expect(state.events).toEqual([]);
    });
  });

  describe('zones', () => {
    it('keeps the chain climbable in every zone and at the cap', () => {
      for (let zone = 0; zone <= 8; zone++) {
        const state = createGame(seeded(zone + 1));
        state.platforms = [];
        const fromY = state.startY - zone * 10000;
        const toY = fromY - 4000;
        fillRange(state, fromY, toY);
        expectClimbable(state.platforms, fromY, toY, `zone ${zone + 1}`);
      }
    });

    it('reports every new zone once', () => {
      const state = emptyGame();
      state.player.standingOn = null;
      state.player.y = state.startY - 10050; // 1005 m
      state.player.vy = -100;
      update(state, createInput(), DT);
      expect(state.events).toContainEqual({ type: 'zoneEnter', zone: 1 });
      expect(state.zone).toBe(1);
      state.events = [];
      update(state, createInput(), DT);
      expect(state.events.filter((e) => e.type === 'zoneEnter')).toHaveLength(0);
    });

    it('collects the points power-up: +200, whatever the zone', () => {
      const state = emptyGame();
      const p = state.player;
      state.powerUps.push({ id: 900, kind: 'points', x: p.x, y: p.y, skin: 'milestone' });
      update(state, createInput(), DT);
      expect(state.bonus).toBe(POINTS_BONUS);
      expect(state.score).toBe(POINTS_BONUS);
      expect(state.events.some((e) => e.type === 'points')).toBe(true);
    });

    it('gives the points power-up the motif of its zone', () => {
      const state = createGame(seeded(5));
      state.platforms = [];
      state.powerUps = [];
      const fromY = state.startY - 2000 * 10 - 100; // zone 3, project management
      fillRange(state, fromY, fromY - 60000);
      const skins = new Set(state.powerUps.filter((p) => p.kind === 'points').map((p) => p.skin));
      expect(skins.size).toBeGreaterThan(0);
      expect([...skins].every((skin) => skin === 'milestone' || skin === 'green-build' || skin === 'uptime' || skin === 'contract' || skin === 'idea' || skin === 'bonus-check')).toBe(true);
      expect(skins.has('milestone')).toBe(true);
    });
  });

  describe('intro', () => {
    function introGame() {
      return createGame(seeded(2), { intro: true });
    }

    it('starts high up in the boss chair, on the parachute', () => {
      const state = introGame();
      expect(state.phase).toBe('intro');
      expect((state.startY - state.player.y) / 10).toBeCloseTo(INTRO_START_M, -1);
      expect(state.events).toContainEqual({ type: 'introStart' });
      expect(state.events).toContainEqual({ type: 'introZone', zone: 7 });
    });

    it('lands on the start platform after the intro without points', () => {
      const state = introGame();
      state.events = [];
      const zones: number[] = [];
      for (let t = 0; t < INTRO_DURATION + 0.1; t += DT) {
        update(state, createInput(), DT);
        zones.push(...state.events.flatMap((e) => (e.type === 'introZone' ? [e.zone] : [])));
        state.events = [];
      }
      expect(state.phase).toBe('playing');
      expect(state.cameraY).toBe(0);
      expect(state.score).toBe(0);
      expect(state.maxHeight).toBe(0);
      expect(state.player.standingOn).toBe(state.platforms[0].id);
      expect(zones).toEqual([6, 5, 4, 3, 2, 1, 0]);
    });

    it('ignores all input but skipping, and generates nothing above the start area', () => {
      const state = introGame();
      const platforms = state.platforms.length;
      const input = createInput();
      Object.assign(input, { left: true, jump: true, fire: true });
      run(state, input, 5);
      expect(state.phase).toBe('intro');
      expect(state.bullets).toHaveLength(0);
      expect(state.player.x).toBe((WORLD_WIDTH - PLAYER_WIDTH) / 2);
      expect(state.platforms).toHaveLength(platforms);
      expect(state.lives).toBe(MAX_LIVES);
    });

    it('can be skipped to the last second', () => {
      const state = introGame();
      const input = createInput();
      input.skip = true;
      update(state, input, DT);
      expect(state.phase).toBe('intro');
      run(state, createInput(), 1);
      expect(state.phase).toBe('playing');
    });

    it('a jump key held over the landing does not jump until released', () => {
      const state = introGame();
      const input = createInput();
      input.jump = true;
      run(state, input, INTRO_DURATION + 0.5);
      expect(state.phase).toBe('playing');
      expect(state.player.standingOn).not.toBeNull();
      input.jump = false;
      update(state, input, DT);
      input.jump = true;
      update(state, input, DT);
      expect(state.player.vy).toBeLessThan(0);
    });
  });

  describe('special platforms', () => {
    /** A game with one platform of the given kind under the falling player. */
    function landingOn(kind: Platform['kind']) {
      const state = emptyGame();
      const platform = state.platforms[0];
      platform.kind = kind;
      state.player.standingOn = null;
      state.player.y = platform.y - PLAYER_HEIGHT - 10;
      state.player.vy = 200;
      return { state, platform };
    }

    it('a vanishing platform carries once and is gone after the jump', () => {
      const { state, platform } = landingOn('vanishing');
      const input = createInput();
      input.jump = true;
      const events: string[] = [];
      for (let i = 0; i < 10; i++) {
        update(state, input, DT);
        events.push(...state.events.map((e) => e.type));
        state.events = [];
      }
      expect(state.player.vy).toBeLessThan(0);
      expect(state.platforms).not.toContain(platform);
      expect(events).toContain('vanish');
    });

    it('a crumbling platform breaks one second after the landing', () => {
      const { state, platform } = landingOn('crumbling');
      run(state, createInput(), 0.2);
      expect(state.player.standingOn).toBe(platform.id);
      expect(platform.broken).toBe(false);
      run(state, createInput(), CRUMBLE_DELAY);
      expect(platform.broken).toBe(true);
      expect(state.player.standingOn).toBeNull();
    });

    it('a vertical platform moves up and down and carries the player', () => {
      const { state, platform } = landingOn('vertical');
      platform.baseY = platform.y;
      platform.omega = 3;
      run(state, createInput(), 0.3);
      expect(state.player.standingOn).toBe(platform.id);
      let low = Infinity;
      let high = -Infinity;
      for (let i = 0; i < 180; i++) {
        update(state, createInput(), DT);
        low = Math.min(low, platform.y);
        high = Math.max(high, platform.y);
        expect(state.player.y).toBeCloseTo(platform.y - PLAYER_HEIGHT);
      }
      expect(high - low).toBeGreaterThan(VERTICAL_AMPLITUDE);
      expect(high - platform.baseY).toBeLessThanOrEqual(VERTICAL_AMPLITUDE + 0.001);
    });

    it('brings the special platforms of each zone', () => {
      const kinds = (zone: number) => {
        const state = createGame(seeded(20 + zone));
        state.platforms = [];
        const fromY = state.startY - zone * 10000;
        fillRange(state, fromY, fromY - 9000);
        return new Set<string>(state.platforms.map((p) => (p.width === SHORT_PLATFORM_WIDTH ? 'short' : p.kind)));
      };
      expect(kinds(0)).toEqual(new Set(['normal', 'moving', 'breaking']));
      expect(kinds(1).has('vanishing')).toBe(true);
      expect(kinds(1).has('crumbling')).toBe(false);
      expect(['crumbling', 'vertical'].every((k) => kinds(2).has(k))).toBe(true);
      expect(kinds(3).has('short')).toBe(true);
      expect(kinds(3).has('spiked')).toBe(false);
      expect(kinds(4).has('spiked')).toBe(true);
    });
  });

  describe('spikes', () => {
    function onSpikes() {
      const state = emptyGame();
      const platform = state.platforms[0];
      platform.kind = 'spiked';
      state.player.standingOn = null;
      state.player.y = platform.y - PLAYER_HEIGHT - 10;
      state.player.vy = 200;
      return { state, platform };
    }

    it('landing on spikes costs a heart and bounces off', () => {
      const { state } = onSpikes();
      run(state, createInput(), 0.1);
      expect(state.lives).toBe(MAX_LIVES - 1);
      expect(state.player.vy).toBeLessThan(0);
      expect(state.player.standingOn).toBeNull();
      expect(state.invulnerable).toBeGreaterThan(1.5);
    });

    it('costs nothing while invulnerable', () => {
      const { state } = onSpikes();
      state.invulnerable = 1;
      run(state, createInput(), 0.1);
      expect(state.lives).toBe(MAX_LIVES);
      expect(state.player.vy).toBeLessThan(0);
    });

    it('is harmless from below', () => {
      const { state, platform } = onSpikes();
      state.player.y = platform.y + 30;
      state.player.vy = -JUMP_VELOCITY;
      run(state, createInput(), 0.15);
      expect(state.player.y).toBeLessThan(platform.y);
      expect(state.lives).toBe(MAX_LIVES);
    });

    it('with the last heart, spikes end the run', () => {
      const { state } = onSpikes();
      state.lives = 1;
      run(state, createInput(), 3);
      expect(state.player.hit).toBe(true);
      expect(state.over).toBe(true);
    });

    it('never makes the chain need a spike and never sits right above or below its neighbours', () => {
      let total = 0;
      for (let zone = 4; zone <= 8; zone++) {
        const state = createGame(seeded(40 + zone));
        state.platforms = [];
        const fromY = state.startY - zone * 10000;
        fillRange(state, fromY, fromY - 9900);
        expectClimbable(state.platforms, fromY, fromY - 9900, `zone ${zone + 1}`);
        const chain = state.platforms.filter(supports).sort((a, b) => a.baseY - b.baseY);
        const spikes = state.platforms.filter((p) => p.kind === 'spiked');
        total += spikes.length;
        for (const spike of spikes) {
          const above = chain.filter((p) => p.baseY < spike.y).at(-1)!;
          const below = chain.find((p) => p.baseY > spike.y)!;
          for (const neighbour of [above, below]) {
            expect(neighbour.vx).toBe(0);
            expect(neighbour.kind).not.toBe('vertical');
            expect(spikeOverlaps(spike.x, neighbour)).toBe(false);
          }
        }
      }
      expect(total).toBeGreaterThan(3);
    });

    it('does not appear in the parachute area', () => {
      const state = createGame(seeded(9));
      state.player.y = state.startY - 60000; // in operations
      state.maxHeight = 60000;
      state.cameraY = state.player.y - VIEW_HEIGHT * 0.4;
      state.platforms = [];
      state.chainTopY = state.cameraY - VIEW_HEIGHT; // nothing more above
      const y = state.cameraY + 100;
      state.platforms.push({ id: 500, x: 0, y, baseY: y, width: 68, kind: 'normal', vx: 0, dx: 0, spring: false, broken: false, fallVelocity: 0, crumble: -1, phase: 0, omega: 0 });
      state.player.y = state.cameraY + VIEW_HEIGHT + 1;
      update(state, createInput(), DT);
      expect(state.parachute).toBe(true);
      expect(state.platforms.filter((p) => p.kind === 'spiked')).toHaveLength(0);
    });
  });

  describe('imps', () => {
    /** A monster high on the screen, far from the player. */
    function withMonster(kind: MonsterKind) {
      const state = emptyGame();
      const monster = newMonster(state, kind, 100, state.cameraY + 100);
      state.monsters.push(monster);
      return { state, monster };
    }

    it('flyers cross the screen and turn at the edges', () => {
      const { state, monster } = withMonster('flyer');
      monster.vx = 110;
      let turned = false;
      for (let i = 0; i < 400; i++) {
        update(state, createInput(), DT);
        expect(monster.x).toBeGreaterThanOrEqual(0);
        expect(monster.x).toBeLessThanOrEqual(WORLD_WIDTH - MONSTER_WIDTH);
        turned ||= monster.vx < 0;
      }
      expect(turned).toBe(true);
    });

    it('chasers slowly follow the player and need two shots', () => {
      const { state, monster } = withMonster('chaser');
      const distance = () => Math.hypot(monster.x - state.player.x, monster.y - state.player.y);
      const before = distance();
      run(state, createInput(), 1);
      expect(distance()).toBeLessThan(before - 40);
      expect(distance()).toBeGreaterThan(before - 80);

      monster.x = state.player.x;
      monster.y = state.player.y - 250;
      const input = createInput();
      input.fire = true;
      update(state, input, DT);
      run(state, createInput(), 0.25);
      expect(state.monsters).toContain(monster);
      expect(monster.hp).toBe(1);
      monster.x = state.player.x;
      monster.y = state.player.y - 250;
      input.fire = true;
      update(state, input, DT);
      run(state, createInput(), 0.25);
      expect(state.monsters).not.toContain(monster);
      expect(state.score).toBe(MONSTER_TYPES.chaser.bonus);
    });

    it('shooters throw exceptions while on screen; a hit costs a heart', () => {
      const { state, monster } = withMonster('shooter');
      monster.x = monster.baseX = state.player.x - 5;
      monster.reload = 0.1;
      const events: string[] = [];
      for (let t = 0; t < 2; t += DT) {
        update(state, createInput(), DT);
        events.push(...state.events.map((e) => (e.type === 'hurt' ? `hurt:${e.cause}` : e.type)));
        state.events = [];
      }
      expect(events).toContain('enemyShot');
      expect(events).toContain('hurt:exception');
      expect(state.lives).toBe(MAX_LIVES - 1);
      expect(ENEMY_BULLET_SPEED).toBeGreaterThan(0);
    });

    it('shooters stay quiet above the screen', () => {
      const { state, monster } = withMonster('shooter');
      monster.y = monster.baseY = state.cameraY - 300;
      run(state, createInput(), SHOOT_INTERVAL * 2);
      expect(state.enemyBullets).toHaveLength(0);
    });

    it('exceptions do nothing while invulnerable', () => {
      const state = emptyGame();
      state.invulnerable = 1;
      state.enemyBullets.push({ id: 900, x: state.player.x + 15, y: state.player.y });
      update(state, createInput(), DT);
      expect(state.lives).toBe(MAX_LIVES);
    });

    it('gives the bonus of the behaviour', () => {
      for (const kind of ['wobbler', 'flyer', 'chaser', 'shooter'] as const) {
        const { state, monster } = withMonster(kind);
        // Jumping on top always kills, whatever the hit points.
        state.player.standingOn = null;
        state.player.y = state.cameraY + 100;
        state.player.vy = 300;
        monster.x = monster.baseX = state.player.x - 5;
        monster.y = monster.baseY = state.player.y + PLAYER_HEIGHT + 20;
        for (let i = 0; i < 30 && state.monsters.includes(monster); i++) {
          update(state, createInput(), DT);
        }
        expect(state.monsters, kind).not.toContain(monster);
        expect(state.killPoints, kind).toBe(MONSTER_TYPES[kind].bonus);
      }
    });

    it('brings the behaviours of each zone with the zone look', () => {
      const seen = (zone: number) => {
        const state = createGame(seeded(60 + zone));
        state.monsters = [];
        const all = new Map<number, Monster>();
        for (let i = 0; i < 4000 && all.size < 40; i++) {
          state.player.standingOn = null;
          state.player.hit = false;
          state.invulnerable = 10;
          state.player.y = state.startY - zone * 10000 - 500 - i * 2;
          state.player.vy = -JUMP_VELOCITY; // rising: no stomping on the monsters
          state.cameraY = state.player.y - VIEW_HEIGHT * 0.4;
          state.chainTopY = Math.min(state.chainTopY, state.cameraY + VIEW_HEIGHT);
          update(state, createInput(), DT);
          state.monsters.forEach((m) => all.set(m.id, m));
        }
        return [...all.values()];
      };
      const zone3 = seen(2);
      expect(new Set(zone3.map((m) => m.kind))).toEqual(new Set(['flyer', 'chaser']));
      expect(zone3.every((m) => m.skin.endsWith('@2'))).toBe(true);
      const zone4 = seen(3);
      expect(new Set(zone4.map((m) => m.kind))).toEqual(new Set(['chaser', 'shooter']));
    });
  });

  describe('jetpack', () => {
    function withJetpack() {
      const state = emptyGame();
      const p = state.player;
      state.powerUps.push({ id: 900, kind: 'jetpack', x: p.x, y: p.y });
      return state;
    }

    it('flies straight up for 3 s and ends with a normal jump', () => {
      const state = withJetpack();
      const startY = state.player.y;
      update(state, createInput(), DT);
      expect(state.jetpack).toBeGreaterThan(0);
      const events: string[] = [];
      let t = DT;
      while (state.jetpack > 0 && t < 5) {
        update(state, createInput(), DT);
        events.push(...state.events.map((e) => e.type));
        state.events = [];
        t += DT;
      }
      expect(t).toBeCloseTo(JETPACK_DURATION, 1);
      expect(state.jetpack).toBe(0);
      expect(state.player.vy).toBe(-JUMP_VELOCITY);
      expect(state.invulnerable).toBeGreaterThan(0.9);
      expect(startY - state.player.y).toBeCloseTo(JETPACK_SPEED * JETPACK_DURATION, -2);
      expect(events.filter((e) => e === 'jetpackSputter')).toHaveLength(1);
      expect(events.at(-1)).toBe('jetpackEnd');
    });

    it('is steerable, but no shooting and no platforms', () => {
      const state = withJetpack();
      update(state, createInput(), DT);
      const input = createInput();
      input.right = true;
      input.fire = true;
      const x = state.player.x;
      update(state, input, DT);
      run(state, input, 0.3);
      expect(state.bullets).toHaveLength(0);
      expect(state.player.x).not.toBe(x);
      expect(state.player.standingOn).toBeNull();
    });

    it('flies through monsters and exceptions without losing a heart', () => {
      const state = withJetpack();
      update(state, createInput(), DT);
      const p = state.player;
      for (let i = 0; i < 5; i++) {
        state.monsters.push({ ...newMonster(state, 'wobbler', p.x, p.y - 150 - i * 200), phase: -Math.PI / 2 });
        state.enemyBullets.push({ id: 950 + i, x: p.x + 15, y: p.y - 100 - i * 200 });
      }
      run(state, createInput(), 1.5);
      expect(state.lives).toBe(MAX_LIVES);
      expect(state.kills).toBe(0);
    });

    it('appears from 300 m on, at least 500 m apart', () => {
      const state = createGame(seeded(77));
      state.platforms = [];
      state.powerUps = [];
      fillRange(state, state.startY, state.startY - 400000);
      const jetpacks = state.powerUps.filter((p) => p.kind === 'jetpack').map((p) => state.startY - p.y).sort((a, b) => a - b);
      expect(jetpacks.length).toBeGreaterThan(2);
      expect(jetpacks[0]).toBeGreaterThanOrEqual(3000);
      for (let i = 1; i < jetpacks.length; i++) {
        expect(jetpacks[i] - jetpacks[i - 1]).toBeGreaterThanOrEqual(5000 - 100);
      }
    });

    it('never appears in the parachute area', () => {
      const state = createGame(seeded(78));
      state.platforms = [];
      state.powerUps = [];
      state.parachute = true;
      fillRange(state, state.startY - 5000, state.startY - 400000);
      expect(state.powerUps.filter((p) => p.kind === 'jetpack')).toHaveLength(0);
    });

    it('leaves a climbable chain behind after the flight', () => {
      const state = createGame(seeded(79));
      state.powerUps.push({ id: 900, kind: 'jetpack', x: state.player.x, y: state.player.y });
      run(state, createInput(), JETPACK_DURATION + 0.05);
      const visible = state.platforms.filter((p) => p.y > state.cameraY - VIEW_HEIGHT && p.y < state.cameraY + VIEW_HEIGHT);
      expectClimbable(visible, Math.max(...visible.filter(supports).map(lowestPoint)), state.cameraY - VIEW_HEIGHT + MAX_GAP, 'after the jetpack');
    });
  });
});

/** Every gap of the chain (without decoys) is reachable, also when vertical platforms are at their worst. */
function expectClimbable(platforms: Platform[], fromY: number, toY: number, label: string) {
  const chain = platforms.filter(supports).sort((a, b) => b.baseY - a.baseY);
  let lowerTop = fromY;
  for (const platform of chain) {
    const highest = platform.kind === 'vertical' ? platform.baseY - VERTICAL_AMPLITUDE : platform.y;
    expect(lowerTop - highest, label).toBeLessThanOrEqual(MAX_GAP);
    lowerTop = lowestPoint(platform);
  }
  expect(lowerTop - toY, label).toBeLessThanOrEqual(MAX_GAP);
}