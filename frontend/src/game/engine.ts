import { impSkin, PIXELS_PER_METER, ZONES, zoneIndexAtPx, zoneParams, type MonsterKind } from './zones';

export type { MonsterKind } from './zones';

/**
 * Doodle Jump game logic, independent of rendering and the DOM.
 *
 * World coordinates: x to the right, y downwards (like the canvas). The player climbs towards
 * negative y; `cameraY` is the world y shown at the top edge of the screen. The camera only moves
 * up, except while the player floats down on the parachute and during the intro.
 * `update` mutates the state in place, once per animation frame.
 */

export const WORLD_WIDTH = 400;
export const VIEW_HEIGHT = 600;

export const GRAVITY = 1800;
/** Apex of a normal jump: JUMP_VELOCITY² / (2 · GRAVITY) ≈ 235 px. */
export const JUMP_VELOCITY = 920;
export const SPRING_VELOCITY = 1500;
export const MOVE_SPEED = 320;

export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 44;
/** Inset of the feet from the sides of the player box, used for standing and landing. */
const FEET_INSET = 8;

export const PLATFORM_WIDTH = 68;
export const PLATFORM_HEIGHT = 14;
/** Largest vertical distance between two platforms of the climbable chain; well below the jump apex. */
export const MAX_GAP = 170;

export const MONSTER_WIDTH = 50;
export const MONSTER_HEIGHT = 40;
const MONSTER_START_HEIGHT = 1500;
/** Chance of a breaking decoy between two chain platforms. */
const DECOY_CHANCE = 0.25;
/** A monster this far above the screen announces itself with a sound. */
const MONSTER_WARNING_DISTANCE = 150;

export const BULLET_SPEED = 1000;
export const BULLET_RADIUS = 5;
export const FIRE_COOLDOWN = 0.25;

/** Climbed pixels per point. */
export const PIXELS_PER_POINT = 10;

/** Flyers cross the screen, chasers follow the player, shooters throw exceptions downwards. */
const FLYER_SPEED = 110;
const CHASER_SPEED = 60;
export const SHOOT_INTERVAL = 2.2;
export const ENEMY_BULLET_SPEED = 220;
export const ENEMY_BULLET_WIDTH = 10;
export const ENEMY_BULLET_HEIGHT = 14;

/** The behaviour sets bonus and hit points; the look comes from the zone (see zones.ts). */
export const MONSTER_TYPES: Record<MonsterKind, { bonus: number; hp: number }> = {
  wobbler: { bonus: 50, hp: 1 },
  flyer: { bonus: 75, hp: 1 },
  chaser: { bonus: 100, hp: 2 },
  shooter: { bonus: 150, hp: 1 },
};

export const MAX_LIVES = 3;
/** Invulnerability after losing a heart to a monster, and after a parachute landing. */
export const HURT_INVULNERABILITY = 2;
export const LANDING_INVULNERABILITY = 1;
const KNOCKBACK_SPEED = 400;
const KNOCKBACK_HOP = 450;

/** Sink rate on the parachute, and the depth of the rescue platform below the old bottom edge (30 m). */
export const PARACHUTE_SPEED = 120;
export const PARACHUTE_DROP = 300;
export const RESCUE_PLATFORM_WIDTH = 140;
/** The rescue platform slides under the player, so the landing is guaranteed. */
const RESCUE_PLATFORM_SPEED = 400;

export const POWER_UP_SIZE = 24;
/** Power-ups float this high above their platform. */
const POWER_UP_HOVER = 36;
/** A heart at full lives gives points instead. */
export const HEART_BONUS = 100;
export const POINTS_BONUS = 200;

/** Jetpack: 3 s straight up at a fixed speed (about 270 m); the flame sputters in the last 0.75 s. */
export const JETPACK_DURATION = 3;
export const JETPACK_SPEED = 900;
export const JETPACK_SPUTTER = 0.75;
/** Short invulnerability after the jetpack falls off, to land safely on the chain. */
const JETPACK_LANDING_INVULNERABILITY = 1;

/** The intro: floating down on the parachute from the boss's chair to the start (see concept 3.4). */
export const INTRO_START_M = 7100;
export const INTRO_DURATION = 10;
/** Skipping jumps to the last second of the intro. */
const INTRO_SKIP_TO = INTRO_DURATION - 1;
/** Screen y at which the player hangs during the descent. */
const INTRO_HANG = VIEW_HEIGHT * 0.25;

/** Vertical platforms move this far up and down around their base. */
export const VERTICAL_AMPLITUDE = 30;
export const SHORT_PLATFORM_WIDTH = 48;
/** Short moving platforms are this much faster. */
const SHORT_SPEED_FACTOR = 1.3;
/** A crumbling platform breaks this long after the first landing. */
export const CRUMBLE_DELAY = 1;

export type PlatformKind = 'normal' | 'moving' | 'breaking' | 'rescue' | 'vanishing' | 'crumbling' | 'vertical' | 'spiked';

export interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  kind: PlatformKind;
  /** Horizontal speed of moving platforms. */
  vx: number;
  /** Horizontal movement in the current frame, carries a standing player along. */
  dx: number;
  spring: boolean;
  /** Breaking platforms break when landed on and fall down. */
  broken: boolean;
  fallVelocity: number;
  /** Crumbling platforms: seconds until they break, or -1 before the first landing. */
  crumble: number;
  /** Vertical platforms: centre of the movement, phase (rad) and angular speed (rad/s). */
  baseY: number;
  phase: number;
  omega: number;
}

export interface Monster {
  id: number;
  kind: MonsterKind;
  /** Look: the imp of its behaviour in the zone it was created in. */
  skin: string;
  x: number;
  y: number;
  /** Centre of the wobble, start height of a flyer. */
  baseX: number;
  baseY: number;
  phase: number;
  /** Hit points; a shot takes one, a jump from above always kills. */
  hp: number;
  /** Horizontal speed of flyers. */
  vx: number;
  /** Seconds until a shooter's next exception. */
  reload: number;
  /** The warning sound was played (the monster is about to appear). */
  announced?: boolean;
}

/** An exception thrown down by a shooter. */
export interface EnemyBullet {
  id: number;
  x: number;
  y: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
}

export type PowerUpKind = 'jetpack' | 'heart' | 'points';

export interface PowerUp {
  id: number;
  kind: PowerUpKind;
  x: number;
  y: number;
  /** Motif from the zone the power-up was created in (only 'points'). */
  skin?: string;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  /** Id of the platform the player stands on, or null while in the air. */
  standingOn: number | null;
  /** Lost the last heart: no more control, the player just falls. */
  hit: boolean;
  /** Seconds left of the shooting pose (nose up). */
  shootPose: number;
}

export interface Input {
  left: boolean;
  right: boolean;
  /** Held: jumps from a platform, and again right after every landing. */
  jump: boolean;
  /** One shot; the caller resets it after `update`. */
  fire: boolean;
  /** One shot: skips the intro (Space or Enter, without key repeat). */
  skip: boolean;
}

/** Something that happened during `update`, for the HUD and the sound; the caller empties `state.events`. */
export type GameEvent =
  | { type: 'jump' }
  | { type: 'spring' }
  | { type: 'shoot' }
  | { type: 'break' }
  /** A monster is about to come into view. */
  | { type: 'monsterNear'; kind: MonsterKind }
  /** A shot hit a monster that survives it. */
  | { type: 'monsterHit' }
  | { type: 'enemyShot' }
  | { type: 'kill'; x: number; y: number; points: number; by: 'shot' | 'stomp' }
  | { type: 'hurt'; cause: 'monster' | 'fall' | 'spikes' | 'exception' }
  /** A vanishing platform carried once and is gone. */
  | { type: 'vanish' }
  | { type: 'death' }
  | { type: 'parachuteOpen' }
  | { type: 'parachuteLand' }
  | { type: 'heart' }
  | { type: 'heartBonus'; x: number; y: number; points: number }
  | { type: 'points'; x: number; y: number; points: number }
  | { type: 'jetpackStart' }
  | { type: 'jetpackSputter' }
  | { type: 'jetpackEnd' }
  /** Reached a zone for the first time in this round. */
  | { type: 'zoneEnter'; zone: number }
  | { type: 'introStart' }
  /** The intro passes into a zone (descending). */
  | { type: 'introZone'; zone: number }
  | { type: 'introLand' };

export interface GameState {
  /** The round starts with the intro; the player only takes control once it has landed. */
  phase: 'intro' | 'playing';
  /** Seconds since the start of the round, while in the intro. */
  introTime: number;
  /** Zone the intro currently shows, for its banners. */
  introZone: number;
  /** After the intro, the jump key only counts once it has been released. */
  jumpLocked: boolean;
  player: Player;
  platforms: Platform[];
  monsters: Monster[];
  enemyBullets: EnemyBullet[];
  bullets: Bullet[];
  powerUps: PowerUp[];
  cameraY: number;
  startY: number;
  maxHeight: number;
  kills: number;
  /** Points for defeated monsters (the bonus depends on their behaviour). */
  killPoints: number;
  /** Points from power-ups. */
  bonus: number;
  score: number;
  lives: number;
  /** Highest zone reached in this round (index). */
  zone: number;
  /** Seconds left in which monsters cannot hurt the player. */
  invulnerable: number;
  /** Floating down to the rescue platform after a fall. */
  parachute: boolean;
  /** Seconds of jetpack flight left (0 = none). */
  jetpack: number;
  /** Id of the rescue platform while on the parachute. */
  rescueId: number | null;
  over: boolean;
  time: number;
  fireCooldown: number;
  /** Lowest point of the highest platform of the climbable chain generated so far. */
  chainTopY: number;
  /** That platform, for the spike rules. */
  chainTop: Platform | null;
  /** y of the last monster, keeps monsters at least a screen apart. */
  lastMonsterY: number;
  /** y of the last power-up per kind, for the minimum distance between them. */
  lastPowerUpY: Record<PowerUpKind, number>;
  nextId: number;
  random: () => number;
  events: GameEvent[];
}

interface PowerUpType {
  /** Chance per chain platform. */
  chance: (state: GameState) => number;
  /** Minimum distance to the last power-up of the same kind, in px. */
  minDistance: number;
  /** Lowest height (px) at which it appears. */
  minHeight: number;
  collect: (state: GameState, powerUp: PowerUp) => void;
}

/**
 * Every power-up is one entry here; the game loop needs no changes for a new one. The order is the
 * order of the spawn checks: the rare jetpack first, so the frequent points do not crowd it out.
 */
const POWER_UPS: Record<PowerUpKind, PowerUpType> = {
  jetpack: {
    chance: () => 0.004,
    minDistance: 5000,
    minHeight: 3000,
    collect: (state) => {
      state.jetpack = JETPACK_DURATION;
      state.player.standingOn = null;
      state.events.push({ type: 'jetpackStart' });
    },
  },
  heart: {
    // The more hearts are missing, the likelier a heart: a second chance without giving it away.
    chance: (state) => [0.005, 0.015, 0.03][Math.min(2, MAX_LIVES - state.lives)],
    minDistance: 800,
    minHeight: 0,
    collect: (state, powerUp) => {
      if (state.lives < MAX_LIVES) {
        state.lives++;
        state.events.push({ type: 'heart' });
      } else {
        state.bonus += HEART_BONUS;
        state.events.push({ type: 'heartBonus', x: powerUp.x + POWER_UP_SIZE / 2, y: powerUp.y, points: HEART_BONUS });
      }
    },
  },
  // The most frequent power-up; its look depends on the zone, the effect does not.
  points: {
    chance: () => 0.02,
    minDistance: 300,
    minHeight: 0,
    collect: (state, powerUp) => {
      state.bonus += POINTS_BONUS;
      state.events.push({ type: 'points', x: powerUp.x + POWER_UP_SIZE / 2, y: powerUp.y, points: POINTS_BONUS });
    },
  },
};

export function createInput(): Input {
  return { left: false, right: false, jump: false, fire: false, skip: false };
}

export function createGame(random: () => number = Math.random, options: { intro?: boolean } = {}): GameState {
  const startPlatform: Platform = {
    id: 1,
    x: (WORLD_WIDTH - PLATFORM_WIDTH) / 2,
    y: VIEW_HEIGHT - 60,
    width: PLATFORM_WIDTH,
    kind: 'normal',
    vx: 0,
    dx: 0,
    spring: false,
    broken: false,
    fallVelocity: 0,
    crumble: -1,
    baseY: VIEW_HEIGHT - 60,
    phase: 0,
    omega: 0,
  };
  const playerY = startPlatform.y - PLAYER_HEIGHT;
  const state: GameState = {
    phase: 'playing',
    introTime: 0,
    introZone: ZONES.length - 1,
    jumpLocked: false,
    player: {
      x: (WORLD_WIDTH - PLAYER_WIDTH) / 2,
      y: playerY,
      vx: 0,
      vy: 0,
      facing: 1,
      standingOn: startPlatform.id,
      hit: false,
      shootPose: 0,
    },
    platforms: [startPlatform],
    monsters: [],
    enemyBullets: [],
    bullets: [],
    powerUps: [],
    cameraY: 0,
    startY: playerY,
    maxHeight: 0,
    kills: 0,
    killPoints: 0,
    bonus: 0,
    score: 0,
    lives: MAX_LIVES,
    zone: 0,
    invulnerable: 0,
    parachute: false,
    jetpack: 0,
    rescueId: null,
    over: false,
    time: 0,
    fireCooldown: 0,
    chainTopY: startPlatform.y,
    chainTop: startPlatform,
    lastMonsterY: 0,
    lastPowerUpY: { jetpack: Infinity, heart: Infinity, points: Infinity },
    nextId: 2,
    random,
    events: [],
  };
  generatePlatforms(state);
  if (options.intro) {
    state.phase = 'intro';
    state.player.standingOn = null;
    state.events.push({ type: 'introStart' }, { type: 'introZone', zone: state.introZone });
    updateIntro(state, createInput(), 0);
  }
  return state;
}

/** Height of the player above the start, in pixels. */
export function heightOf(state: GameState): number {
  return state.startY - state.player.y;
}

export function update(state: GameState, input: Input, dt: number): void {
  if (state.over) {
    return;
  }
  state.time += dt;
  if (state.phase === 'intro') {
    updateIntro(state, input, dt);
    return;
  }
  // After the intro the held jump key does not count until it is released.
  if (!input.jump) {
    state.jumpLocked = false;
  }
  if (state.jumpLocked) {
    input = { ...input, jump: false };
  }
  state.fireCooldown = Math.max(0, state.fireCooldown - dt);
  state.invulnerable = Math.max(0, state.invulnerable - dt);
  const player = state.player;
  player.shootPose = Math.max(0, player.shootPose - dt);

  if (input.fire && state.fireCooldown === 0 && !player.hit && !state.parachute && state.jetpack === 0) {
    state.bullets.push({ id: state.nextId++, x: player.x + PLAYER_WIDTH / 2, y: player.y });
    state.fireCooldown = FIRE_COOLDOWN;
    player.shootPose = 0.2;
    state.events.push({ type: 'shoot' });
  }

  const previousY = player.y;
  movePlatforms(state, dt);
  if (state.parachute) {
    floatDown(state, input, dt);
  } else if (state.jetpack > 0) {
    fly(state, input, dt);
  } else {
    movePlayer(state, input, dt);
  }
  moveMonsters(state, previousY, dt);
  moveBullets(state, dt);
  moveEnemyBullets(state, dt);
  collectPowerUps(state);

  if (state.parachute) {
    // The camera follows the player down, for the first time; eased, so it does not jump.
    state.cameraY += (player.y - VIEW_HEIGHT * 0.4 - state.cameraY) * Math.min(1, dt * 6);
  } else if (!player.hit) {
    state.cameraY = Math.min(state.cameraY, player.y - VIEW_HEIGHT * 0.4);
  }
  if (!player.hit) {
    state.maxHeight = Math.max(state.maxHeight, heightOf(state));
  }
  const zone = zoneIndexAtPx(state.maxHeight);
  if (zone > state.zone) {
    state.zone = zone;
    state.events.push({ type: 'zoneEnter', zone });
  }
  state.score = Math.floor(state.maxHeight / PIXELS_PER_POINT) + state.killPoints + state.bonus;

  generatePlatforms(state);
  removeBelowScreen(state);

  if (!state.parachute && player.y > state.cameraY + VIEW_HEIGHT) {
    fellOff(state);
  }
}

/**
 * The intro: the camera glides from the boss's chair down to the start (ease-in-out), the player
 * hangs on the parachute. No physics, no input except skipping, no score; the world above the start
 * area is only generated later while climbing.
 */
function updateIntro(state: GameState, input: Input, dt: number) {
  state.introTime += dt;
  if (input.skip) {
    state.introTime = Math.max(state.introTime, INTRO_SKIP_TO);
  }
  const player = state.player;
  const progress = Math.min(1, state.introTime / INTRO_DURATION);
  const eased = (1 - Math.cos(Math.PI * progress)) / 2;
  const top = state.startY - INTRO_START_M * PIXELS_PER_METER - INTRO_HANG;
  state.cameraY = top * (1 - eased);
  // In the upper part of the screen, above the zone banners; in the last second and a half down to
  // the start platform.
  const landing = Math.min(1, Math.max(0, (state.introTime - (INTRO_DURATION - 1.5)) / 1.5));
  const offset = INTRO_HANG + (state.startY - INTRO_HANG) * landing * landing;
  player.x = (WORLD_WIDTH - PLAYER_WIDTH) / 2;
  player.y = state.cameraY + offset;
  player.vx = 0;
  player.vy = PARACHUTE_SPEED;

  const zone = zoneIndexAtPx(state.startY - (state.cameraY + VIEW_HEIGHT / 2));
  if (zone !== state.introZone) {
    state.introZone = zone;
    state.events.push({ type: 'introZone', zone });
  }

  if (state.introTime >= INTRO_DURATION) {
    state.phase = 'playing';
    state.cameraY = 0;
    player.y = state.startY;
    player.vy = 0;
    player.standingOn = state.platforms[0].id;
    state.jumpLocked = input.jump;
    state.events.push({ type: 'introLand' });
  }
}

function movePlatforms(state: GameState, dt: number) {
  for (const platform of state.platforms) {
    if (platform.crumble > 0) {
      platform.crumble = Math.max(0, platform.crumble - dt);
      if (platform.crumble === 0) {
        platform.broken = true;
        state.events.push({ type: 'break' });
      }
    }
    if (platform.kind === 'vertical' && !platform.broken) {
      platform.phase += platform.omega * dt;
      platform.y = platform.baseY + Math.sin(platform.phase) * VERTICAL_AMPLITUDE;
    }
    if (platform.broken) {
      platform.fallVelocity += GRAVITY * dt;
      platform.y += platform.fallVelocity * dt;
      platform.dx = 0;
      continue;
    }
    if (platform.vx === 0) {
      platform.dx = 0;
      continue;
    }
    const oldX = platform.x;
    platform.x += platform.vx * dt;
    if (platform.x < 0) {
      platform.x = -platform.x;
      platform.vx = Math.abs(platform.vx);
    } else if (platform.x > WORLD_WIDTH - platform.width) {
      platform.x = 2 * (WORLD_WIDTH - platform.width) - platform.x;
      platform.vx = -Math.abs(platform.vx);
    }
    platform.dx = platform.x - oldX;
  }
}

function feetOverlap(player: Player, platform: Platform): boolean {
  return player.x + PLAYER_WIDTH - FEET_INSET > platform.x && player.x + FEET_INSET < platform.x + platform.width;
}

/** Quick acceleration towards the target speed. */
function steer(player: Player, direction: number, dt: number) {
  player.vx += (direction * MOVE_SPEED - player.vx) * Math.min(1, dt * 12);
  if (direction !== 0) {
    player.facing = direction > 0 ? 1 : -1;
  }
  player.x += player.vx * dt;
}

function movePlayer(state: GameState, input: Input, dt: number) {
  const player = state.player;

  // Horizontal: wrap around the screen edges.
  steer(player, player.hit ? 0 : Number(input.right) - Number(input.left), dt);

  if (player.standingOn !== null) {
    const platform = state.platforms.find((p) => p.id === player.standingOn);
    if (platform && !platform.broken) {
      player.x += platform.dx;
    }
    if (!platform || platform.broken || !feetOverlap(player, platform)) {
      player.standingOn = null; // walked off the edge
    } else if (input.jump && !player.hit) {
      player.standingOn = null;
      player.vy = -JUMP_VELOCITY;
      state.events.push({ type: 'jump' });
      if (platform.kind === 'vanishing') {
        vanish(state, platform);
      }
    } else {
      player.y = platform.y - PLAYER_HEIGHT;
      player.vy = 0;
    }
  }
  wrap(player);

  if (player.standingOn !== null) {
    return;
  }

  const previousFeet = player.y + PLAYER_HEIGHT;
  player.vy += GRAVITY * dt;
  player.y += player.vy * dt;
  const feet = player.y + PLAYER_HEIGHT;
  if (player.vy <= 0 || player.hit) {
    return;
  }

  // Landing: the feet crossed the top of a platform in this frame; the highest one wins.
  let landing: Platform | undefined;
  for (const platform of state.platforms) {
    if (!platform.broken && previousFeet <= platform.y && feet >= platform.y && feetOverlap(player, platform)) {
      if (!landing || platform.y < landing.y) {
        landing = platform;
      }
    }
  }
  if (!landing) {
    return;
  }
  if (landing.kind === 'breaking') {
    landing.broken = true; // no support: the player falls through
    state.events.push({ type: 'break' });
    return;
  }
  player.y = landing.y - PLAYER_HEIGHT;
  if (landing.kind === 'spiked') {
    // Ouch: one heart less (unless invulnerable), but the player bounces off as usual.
    if (state.invulnerable === 0) {
      loseHeart(state, 'spikes');
      if (player.hit) {
        return;
      }
    }
    player.vy = -JUMP_VELOCITY;
    return;
  }
  if (landing.kind === 'crumbling' && landing.crumble < 0) {
    landing.crumble = CRUMBLE_DELAY;
  }
  if (landing.spring) {
    player.vy = -SPRING_VELOCITY;
    state.events.push({ type: 'spring' });
  } else if (input.jump) {
    player.vy = -JUMP_VELOCITY;
    state.events.push({ type: 'jump' });
    if (landing.kind === 'vanishing') {
      vanish(state, landing);
    }
  } else {
    player.vy = 0;
    player.standingOn = landing.id;
  }
}

/** A vanishing platform carries exactly once: it is gone as soon as the player jumps off. */
function vanish(state: GameState, platform: Platform) {
  state.platforms = state.platforms.filter((p) => p !== platform);
  state.events.push({ type: 'vanish' });
}

function wrap(player: Player) {
  const center = player.x + PLAYER_WIDTH / 2;
  if (center < 0) {
    player.x += WORLD_WIDTH;
  } else if (center > WORLD_WIDTH) {
    player.x -= WORLD_WIDTH;
  }
}

/** Fell below the screen: open the parachute, or game over with the last heart. */
function fellOff(state: GameState) {
  if (state.player.hit) {
    state.over = true; // already dead
    return;
  }
  state.lives--;
  if (state.lives === 0) {
    state.events.push({ type: 'hurt', cause: 'fall' }, { type: 'death' });
    state.over = true;
    return;
  }
  state.events.push({ type: 'hurt', cause: 'fall' }, { type: 'parachuteOpen' });
  const player = state.player;
  const oldBottom = state.cameraY + VIEW_HEIGHT;
  const rescue = newPlatform(state, 0, oldBottom + PARACHUTE_DROP, 'rescue', RESCUE_PLATFORM_WIDTH);
  rescue.x = clamp(player.x + PLAYER_WIDTH / 2 - RESCUE_PLATFORM_WIDTH / 2, 0, WORLD_WIDTH - RESCUE_PLATFORM_WIDTH);
  state.platforms.push(rescue);
  state.rescueId = rescue.id;
  state.parachute = true;
  player.standingOn = null;
  player.vy = PARACHUTE_SPEED;

  // The way back up: the platforms below the old screen were removed, fill the gap again.
  const lowest = Math.max(...state.platforms.filter((p) => supports(p) && p !== rescue && p.y < oldBottom + 100).map(lowestPoint));
  fillRange(state, rescue.y, Number.isFinite(lowest) ? lowest : Math.max(state.chainTopY, state.cameraY - VIEW_HEIGHT), rescue);
}

/**
 * Jetpack flight: straight up at a fixed speed, steerable, no platforms, no jumping or shooting,
 * invulnerable. When it ends the player gets a normal jump and a moment of invulnerability.
 */
function fly(state: GameState, input: Input, dt: number) {
  const player = state.player;
  steer(player, Number(input.right) - Number(input.left), dt);
  wrap(player);
  player.vy = -JETPACK_SPEED;
  player.y += player.vy * dt;
  const before = state.jetpack;
  state.jetpack = Math.max(0, state.jetpack - dt);
  if (before > JETPACK_SPUTTER && state.jetpack <= JETPACK_SPUTTER) {
    state.events.push({ type: 'jetpackSputter' });
  }
  if (state.jetpack === 0) {
    player.vy = -JUMP_VELOCITY;
    state.invulnerable = Math.max(state.invulnerable, JETPACK_LANDING_INVULNERABILITY);
    state.events.push({ type: 'jetpackEnd' });
  }
}

/** Sinking slowly on the parachute; steerable, but no jumping and no shooting. */
function floatDown(state: GameState, input: Input, dt: number) {
  const player = state.player;
  steer(player, Number(input.right) - Number(input.left), dt);
  wrap(player);
  player.vy = PARACHUTE_SPEED;
  player.y += PARACHUTE_SPEED * dt;

  const rescue = state.platforms.find((p) => p.id === state.rescueId)!;
  const target = clamp(player.x + PLAYER_WIDTH / 2 - rescue.width / 2, 0, WORLD_WIDTH - rescue.width);
  const step = clamp(target - rescue.x, -RESCUE_PLATFORM_SPEED * dt, RESCUE_PLATFORM_SPEED * dt);
  rescue.x += step;
  rescue.dx = step;

  if (player.y + PLAYER_HEIGHT >= rescue.y) {
    // Landed; if the player outran the platform, the feet still end up on it.
    player.x = clamp(player.x, rescue.x - PLAYER_WIDTH + FEET_INSET + 1, rescue.x + rescue.width - FEET_INSET - 1);
    player.y = rescue.y - PLAYER_HEIGHT;
    player.vy = 0;
    player.standingOn = rescue.id;
    state.parachute = false;
    state.rescueId = null;
    state.invulnerable = LANDING_INVULNERABILITY;
    state.events.push({ type: 'parachuteLand' });
  }
}

function moveMonsters(state: GameState, previousPlayerY: number, dt: number) {
  const player = state.player;
  const killed = new Set<number>();
  for (const monster of state.monsters) {
    moveMonster(state, monster, dt);
    if (!monster.announced && monster.y + MONSTER_HEIGHT > state.cameraY - MONSTER_WARNING_DISTANCE) {
      monster.announced = true;
      state.events.push({ type: 'monsterNear', kind: monster.kind });
    }
    // On the jetpack the player flies through monsters.
    if (player.hit || state.parachute || state.jetpack > 0 || !overlaps(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT, monster.x, monster.y, MONSTER_WIDTH, MONSTER_HEIGHT, 6)) {
      continue;
    }
    if (player.vy > 0 && previousPlayerY + PLAYER_HEIGHT <= monster.y + MONSTER_HEIGHT / 2) {
      // Jumped on top of it.
      killed.add(monster.id);
      killMonster(state, monster, 'stomp');
      player.vy = -JUMP_VELOCITY;
      player.standingOn = null;
    } else if (state.invulnerable === 0) {
      hurt(state, monster);
    }
  }
  if (killed.size > 0) {
    state.monsters = state.monsters.filter((m) => !killed.has(m.id));
  }
}

function moveMonster(state: GameState, monster: Monster, dt: number) {
  const t = state.time;
  const onScreen = monster.y + MONSTER_HEIGHT > state.cameraY && monster.y < state.cameraY + VIEW_HEIGHT;
  switch (monster.kind) {
    case 'wobbler':
      monster.x = monster.baseX + Math.sin(t * 2 + monster.phase) * 30;
      break;
    case 'flyer':
      // Across the screen and back, slightly up and down.
      monster.x += monster.vx * dt;
      if (monster.x < 0 || monster.x > WORLD_WIDTH - MONSTER_WIDTH) {
        monster.x = clamp(monster.x, 0, WORLD_WIDTH - MONSTER_WIDTH);
        monster.vx = -monster.vx;
      }
      monster.y = monster.baseY + Math.sin(t * 3 + monster.phase) * 6;
      break;
    case 'chaser': {
      // Slowly after the player, as long as it is on screen and the player is not floating down.
      if (!onScreen || state.parachute || state.player.hit) {
        break;
      }
      const dx = state.player.x + PLAYER_WIDTH / 2 - (monster.x + MONSTER_WIDTH / 2);
      const dy = state.player.y + PLAYER_HEIGHT / 2 - (monster.y + MONSTER_HEIGHT / 2);
      const distance = Math.hypot(dx, dy);
      if (distance > 1) {
        monster.x += (dx / distance) * CHASER_SPEED * dt;
        monster.y += (dy / distance) * CHASER_SPEED * dt;
      }
      break;
    }
    case 'shooter':
      monster.x = monster.baseX + Math.sin(t * 1.5 + monster.phase) * 15;
      if (onScreen && !state.parachute) {
        monster.reload -= dt;
        if (monster.reload <= 0) {
          monster.reload = SHOOT_INTERVAL;
          state.enemyBullets.push({ id: state.nextId++, x: monster.x + MONSTER_WIDTH / 2 - ENEMY_BULLET_WIDTH / 2, y: monster.y + MONSTER_HEIGHT });
          state.events.push({ type: 'enemyShot' });
        }
      }
      break;
  }
}

/** Exceptions fall down; one that hits costs a heart like touching a monster. */
function moveEnemyBullets(state: GameState, dt: number) {
  const player = state.player;
  const remaining: EnemyBullet[] = [];
  for (const bullet of state.enemyBullets) {
    bullet.y += ENEMY_BULLET_SPEED * dt;
    const hits =
      !player.hit &&
      !state.parachute &&
      state.jetpack === 0 &&
      state.invulnerable === 0 &&
      overlaps(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT, bullet.x, bullet.y, ENEMY_BULLET_WIDTH, ENEMY_BULLET_HEIGHT, 4);
    if (hits) {
      loseHeart(state, 'exception');
    } else if (bullet.y < state.cameraY + VIEW_HEIGHT + 50) {
      remaining.push(bullet);
    }
  }
  state.enemyBullets = remaining;
}

/** Touched a monster from the side or below: one heart less; the monster stays. */
function hurt(state: GameState, monster: Monster) {
  const player = state.player;
  loseHeart(state, 'monster');
  if (player.hit) {
    return;
  }
  // Short knockback: a hop away from the monster.
  const away = player.x + PLAYER_WIDTH / 2 < monster.x + MONSTER_WIDTH / 2 ? -1 : 1;
  player.vx = away * KNOCKBACK_SPEED;
  player.vy = -KNOCKBACK_HOP;
}

/** One heart less and 2 s of blinking invulnerability; with the last heart the player dies. */
function loseHeart(state: GameState, cause: 'monster' | 'spikes' | 'exception') {
  const player = state.player;
  state.lives--;
  state.events.push({ type: 'hurt', cause });
  player.standingOn = null;
  if (state.lives === 0) {
    player.hit = true;
    player.vy = Math.max(player.vy, 0);
    state.events.push({ type: 'death' });
    return;
  }
  state.invulnerable = HURT_INVULNERABILITY;
}

function moveBullets(state: GameState, dt: number) {
  const remaining: Bullet[] = [];
  for (const bullet of state.bullets) {
    bullet.y -= BULLET_SPEED * dt;
    const target = state.monsters.find((m) =>
      overlaps(bullet.x - BULLET_RADIUS, bullet.y - BULLET_RADIUS, 2 * BULLET_RADIUS, 2 * BULLET_RADIUS, m.x, m.y, MONSTER_WIDTH, MONSTER_HEIGHT, 0),
    );
    if (target) {
      target.hp--;
      if (target.hp > 0) {
        state.events.push({ type: 'monsterHit' });
      } else {
        state.monsters = state.monsters.filter((m) => m !== target);
        killMonster(state, target, 'shot');
      }
    } else if (bullet.y > state.cameraY - 50) {
      remaining.push(bullet);
    }
  }
  state.bullets = remaining;
}

function killMonster(state: GameState, monster: Monster, by: 'shot' | 'stomp') {
  const points = MONSTER_TYPES[monster.kind].bonus;
  state.kills++;
  state.killPoints += points;
  state.events.push({ type: 'kill', x: monster.x + MONSTER_WIDTH / 2, y: monster.y, points, by });
}

function collectPowerUps(state: GameState) {
  const player = state.player;
  if (player.hit) {
    return;
  }
  const collected = state.powerUps.filter((p) => overlaps(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT, p.x, p.y, POWER_UP_SIZE, POWER_UP_SIZE, 2));
  for (const powerUp of collected) {
    POWER_UPS[powerUp.kind].collect(state, powerUp);
  }
  if (collected.length > 0) {
    state.powerUps = state.powerUps.filter((p) => !collected.includes(p));
  }
}

function overlaps(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number, inset: number): boolean {
  return ax + inset < bx + bw - inset && ax + aw - inset > bx + inset && ay + inset < by + bh - inset && ay + ah - inset > by + inset;
}

/** Fills the area up to one screen above the camera with platforms (and the odd monster or power-up). */
function generatePlatforms(state: GameState) {
  while (state.chainTopY > state.cameraY - VIEW_HEIGHT) {
    const link = addChainPlatform(state, { y: state.chainTopY, platform: state.chainTop }, true);
    state.chainTopY = link.y;
    state.chainTop = link.platform;
  }
}

/**
 * Fills a height range with a climbable chain from `fromY` (the platform `below`, if known) up to the
 * platform at `toY`, without monsters, e.g. the way back up from the rescue platform.
 */
export function fillRange(state: GameState, fromY: number, toY: number, below: Platform | null = null) {
  let link: ChainLink = { y: fromY, platform: below };
  while (link.y - toY > gapRange(state.startY - link.y).max) {
    link = addChainPlatform(state, link, false, toY);
  }
}

/** A platform of the climbable chain and its lowest point, from which the next gap is measured. */
interface ChainLink {
  y: number;
  platform: Platform | null;
}

/** Platforms the player can stand on (at least once). */
export function supports(platform: Platform): boolean {
  return platform.kind !== 'breaking' && platform.kind !== 'spiked';
}

/** Lowest point a platform reaches; vertical platforms move up and down. */
export function lowestPoint(platform: Platform): number {
  return platform.kind === 'vertical' ? platform.baseY + VERTICAL_AMPLITUDE : platform.y;
}

function gapRange(height: number): { min: number; max: number } {
  const params = zoneParams(height);
  return { min: params.minGap, max: Math.min(MAX_GAP, params.maxGap) };
}

/**
 * Adds the next platform of the climbable chain above `below`; with a decoy in between and, if
 * `withMonsters`, now and then a monster. `limitY` keeps the platform below it.
 * Vanishing and crumbling platforms may be part of the chain: they carry once.
 */
function addChainPlatform(state: GameState, below: ChainLink, withMonsters: boolean, limitY = -Infinity): ChainLink {
  const random = state.random;
  const belowY = below.y;
  const height = state.startY - belowY;
  const params = zoneParams(height);
  const zone = ZONES[zoneIndexAtPx(height)];
  const special = zone.specials.length > 0 && random() < params.specialShare ? zone.specials[Math.floor(random() * zone.specials.length)] : null;
  const { min } = gapRange(height);
  // A vertical platform rises by its amplitude, so its base must be that much closer.
  const max = gapRange(height).max - (special === 'vertical' ? VERTICAL_AMPLITUDE : 0);
  const gap = Math.min(min + random() * (max - min), belowY - limitY - min);
  const y = belowY - Math.max(min, gap);

  const width = special === 'short' ? SHORT_PLATFORM_WIDTH : PLATFORM_WIDTH;
  const x = random() * (WORLD_WIDTH - width);
  let platform: Platform;
  if (special === 'vanishing' || special === 'crumbling') {
    platform = newPlatform(state, x, y, special);
  } else if (special === 'vertical') {
    platform = newPlatform(state, x, y, 'vertical');
    platform.phase = random() * Math.PI * 2;
    platform.omega = (params.movingSpeed * 0.6) / VERTICAL_AMPLITUDE;
    platform.y = y + Math.sin(platform.phase) * VERTICAL_AMPLITUDE;
  } else {
    const moving = height > 500 && random() < params.movingShare;
    platform = newPlatform(state, x, y, moving ? 'moving' : 'normal', width);
    if (moving) {
      platform.vx = (random() < 0.5 ? -1 : 1) * params.movingSpeed * (special === 'short' ? SHORT_SPEED_FACTOR : 1);
    } else {
      platform.spring = random() < params.springChance;
      maybeAddPowerUp(state, platform);
    }
  }
  state.platforms.push(platform);

  // Decoys between chain platforms, never needed to climb on: breaking, or from zone 5 on spiked.
  if (belowY - y > 60 && random() < DECOY_CHANCE) {
    const decoyY = y + (belowY - y) / 2;
    const spiked = zone.params.spikeShare > 0 && withSpikes(state, below.platform) && random() < params.spikeShare;
    const decoyX = spiked ? spikeX(state, below.platform, platform) : null;
    state.platforms.push(newPlatform(state, decoyX ?? random() * (WORLD_WIDTH - PLATFORM_WIDTH), decoyY, decoyX !== null ? 'spiked' : 'breaking'));
  }

  if (withMonsters && height > MONSTER_START_HEIGHT && state.lastMonsterY - y > VIEW_HEIGHT && random() < params.monsterChance) {
    const zoneIndex = zoneIndexAtPx(height);
    const kind = ZONES[zoneIndex].monsters[Math.floor(random() * ZONES[zoneIndex].monsters.length)];
    const monster = newMonster(state, kind, 30 + random() * (WORLD_WIDTH - MONSTER_WIDTH - 60), y - MONSTER_HEIGHT - 30, impSkin(zoneIndex, kind));
    monster.phase = random() * Math.PI * 2;
    monster.vx = (random() < 0.5 ? -1 : 1) * FLYER_SPEED;
    monster.reload = SHOOT_INTERVAL * (0.5 + random() * 0.5);
    state.monsters.push(monster);
    state.lastMonsterY = monster.y;
  }
  return { y: lowestPoint(platform), platform };
}

/** No spikes in the parachute area (it has no `below` platform from the regular chain). */
function withSpikes(state: GameState, below: Platform | null): boolean {
  return below !== null && below.kind !== 'rescue' && !state.parachute;
}

/**
 * x of a spiked platform between two chain platforms, or null if there is no fair place: it must
 * not overlap either neighbour horizontally (with a player's width to spare), otherwise a player
 * hopping on the platform below would land on the spikes. Next to moving neighbours: no spikes.
 */
function spikeX(state: GameState, below: Platform | null, above: Platform): number | null {
  if (!below || below.vx !== 0 || below.kind === 'vertical' || above.vx !== 0 || above.kind === 'vertical') {
    return null;
  }
  for (let attempt = 0; attempt < 8; attempt++) {
    const x = state.random() * (WORLD_WIDTH - PLATFORM_WIDTH);
    if (!spikeOverlaps(x, below) && !spikeOverlaps(x, above)) {
      return x;
    }
  }
  return null;
}

export function spikeOverlaps(x: number, neighbour: Platform): boolean {
  return x - PLAYER_WIDTH < neighbour.x + neighbour.width && x + PLATFORM_WIDTH + PLAYER_WIDTH > neighbour.x;
}

/** Power-ups float above standing chain platforms, so they can always be reached. */
function maybeAddPowerUp(state: GameState, platform: Platform) {
  if (platform.spring) {
    return;
  }
  const height = state.startY - platform.y;
  for (const kind of Object.keys(POWER_UPS) as PowerUpKind[]) {
    const type = POWER_UPS[kind];
    if (height < type.minHeight || Math.abs(state.lastPowerUpY[kind] - platform.y) < type.minDistance) {
      continue;
    }
    if (kind === 'jetpack' && state.parachute) {
      continue; // not on the way back up from the rescue platform
    }
    if (state.random() < type.chance(state)) {
      const powerUp: PowerUp = {
        id: state.nextId++,
        kind,
        x: platform.x + platform.width / 2 - POWER_UP_SIZE / 2,
        y: platform.y - POWER_UP_HOVER - POWER_UP_SIZE / 2,
      };
      if (kind === 'points') {
        powerUp.skin = ZONES[zoneIndexAtPx(height)].pointsSkin;
      }
      state.powerUps.push(powerUp);
      state.lastPowerUpY[kind] = platform.y;
      return; // at most one per platform
    }
  }
}

export function newMonster(state: GameState, kind: MonsterKind, x: number, y: number, skin = impSkin(0, kind)): Monster {
  return { id: state.nextId++, kind, skin, x, y, baseX: x, baseY: y, phase: 0, hp: MONSTER_TYPES[kind].hp, vx: 0, reload: SHOOT_INTERVAL };
}

function newPlatform(state: GameState, x: number, y: number, kind: PlatformKind, width = PLATFORM_WIDTH): Platform {
  return { id: state.nextId++, x, y, width, kind, vx: 0, dx: 0, spring: false, broken: false, fallVelocity: 0, crumble: -1, baseY: y, phase: 0, omega: 0 };
}

function removeBelowScreen(state: GameState) {
  if (state.parachute) {
    return; // the camera is on its way down to the rescue platform and the way back up
  }
  const limit = state.cameraY + VIEW_HEIGHT + 100;
  state.platforms = state.platforms.filter((p) => p.y < limit);
  state.monsters = state.monsters.filter((m) => m.y < limit);
  state.enemyBullets = state.enemyBullets.filter((b) => b.y < limit);
  state.powerUps = state.powerUps.filter((p) => p.y < limit);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
