/**
 * Doodle Jump game logic, independent of rendering and the DOM.
 *
 * World coordinates: x to the right, y downwards (like the canvas). The player climbs towards
 * negative y; `cameraY` is the world y shown at the top edge of the screen and only ever moves up.
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
const MOVING_PLATFORM_SPEED = 90;

export const MONSTER_WIDTH = 50;
export const MONSTER_HEIGHT = 40;
const MONSTER_START_HEIGHT = 1500;

export const BULLET_SPEED = 1000;
export const BULLET_RADIUS = 5;
export const FIRE_COOLDOWN = 0.25;

/** Climbed pixels per point, and the bonus for every defeated monster. */
const PIXELS_PER_POINT = 10;
const KILL_BONUS = 50;

export type PlatformKind = 'normal' | 'moving' | 'breaking';

export interface Platform {
  id: number;
  x: number;
  y: number;
  kind: PlatformKind;
  /** Horizontal speed of moving platforms. */
  vx: number;
  /** Horizontal movement in the current frame, carries a standing player along. */
  dx: number;
  spring: boolean;
  /** Breaking platforms break when landed on and fall down. */
  broken: boolean;
  fallVelocity: number;
}

export interface Monster {
  id: number;
  x: number;
  y: number;
  baseX: number;
  phase: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  /** Id of the platform the player stands on, or null while in the air. */
  standingOn: number | null;
  /** Hit by a monster: no more control, the player just falls. */
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
}

export interface GameState {
  player: Player;
  platforms: Platform[];
  monsters: Monster[];
  bullets: Bullet[];
  cameraY: number;
  startY: number;
  maxHeight: number;
  kills: number;
  score: number;
  over: boolean;
  time: number;
  fireCooldown: number;
  /** y of the highest platform of the climbable chain generated so far. */
  chainTopY: number;
  /** y of the last monster, keeps monsters at least a screen apart. */
  lastMonsterY: number;
  nextId: number;
  random: () => number;
}

export function createInput(): Input {
  return { left: false, right: false, jump: false, fire: false };
}

export function createGame(random: () => number = Math.random): GameState {
  const startPlatform: Platform = {
    id: 1,
    x: (WORLD_WIDTH - PLATFORM_WIDTH) / 2,
    y: VIEW_HEIGHT - 60,
    kind: 'normal',
    vx: 0,
    dx: 0,
    spring: false,
    broken: false,
    fallVelocity: 0,
  };
  const playerY = startPlatform.y - PLAYER_HEIGHT;
  const state: GameState = {
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
    bullets: [],
    cameraY: 0,
    startY: playerY,
    maxHeight: 0,
    kills: 0,
    score: 0,
    over: false,
    time: 0,
    fireCooldown: 0,
    chainTopY: startPlatform.y,
    lastMonsterY: 0,
    nextId: 2,
    random,
  };
  generatePlatforms(state);
  return state;
}

/** Height climbed so far, in pixels (never decreases). */
export function heightOf(state: GameState): number {
  return state.startY - state.player.y;
}

/** 0 at the start, 1 from 8000 px on: larger gaps, more moving platforms, more monsters. */
function difficulty(height: number): number {
  return Math.min(1, Math.max(0, height) / 8000);
}

export function update(state: GameState, input: Input, dt: number): void {
  if (state.over) {
    return;
  }
  state.time += dt;
  state.fireCooldown = Math.max(0, state.fireCooldown - dt);
  const player = state.player;
  player.shootPose = Math.max(0, player.shootPose - dt);

  if (input.fire && state.fireCooldown === 0 && !player.hit) {
    state.bullets.push({ id: state.nextId++, x: player.x + PLAYER_WIDTH / 2, y: player.y });
    state.fireCooldown = FIRE_COOLDOWN;
    player.shootPose = 0.2;
  }

  const previousY = player.y;
  movePlatforms(state, dt);
  movePlayer(state, input, dt);
  moveMonsters(state, previousY);
  moveBullets(state, dt);

  if (!player.hit) {
    state.cameraY = Math.min(state.cameraY, player.y - VIEW_HEIGHT * 0.4);
    state.maxHeight = Math.max(state.maxHeight, heightOf(state));
  }
  state.score = Math.floor(state.maxHeight / PIXELS_PER_POINT) + state.kills * KILL_BONUS;

  generatePlatforms(state);
  removeBelowScreen(state);

  if (player.y > state.cameraY + VIEW_HEIGHT) {
    state.over = true;
  }
}

function movePlatforms(state: GameState, dt: number) {
  for (const platform of state.platforms) {
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
    } else if (platform.x > WORLD_WIDTH - PLATFORM_WIDTH) {
      platform.x = 2 * (WORLD_WIDTH - PLATFORM_WIDTH) - platform.x;
      platform.vx = -Math.abs(platform.vx);
    }
    platform.dx = platform.x - oldX;
  }
}

function feetOverlap(player: Player, platform: Platform): boolean {
  return player.x + PLAYER_WIDTH - FEET_INSET > platform.x && player.x + FEET_INSET < platform.x + PLATFORM_WIDTH;
}

function movePlayer(state: GameState, input: Input, dt: number) {
  const player = state.player;

  // Horizontal: quick acceleration towards the target speed, wrap around the screen edges.
  const direction = player.hit ? 0 : Number(input.right) - Number(input.left);
  player.vx += (direction * MOVE_SPEED - player.vx) * Math.min(1, dt * 12);
  if (direction !== 0) {
    player.facing = direction > 0 ? 1 : -1;
  }
  player.x += player.vx * dt;

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
    return;
  }
  player.y = landing.y - PLAYER_HEIGHT;
  if (landing.spring) {
    player.vy = -SPRING_VELOCITY;
  } else if (input.jump) {
    player.vy = -JUMP_VELOCITY;
  } else {
    player.vy = 0;
    player.standingOn = landing.id;
  }
}

function wrap(player: Player) {
  const center = player.x + PLAYER_WIDTH / 2;
  if (center < 0) {
    player.x += WORLD_WIDTH;
  } else if (center > WORLD_WIDTH) {
    player.x -= WORLD_WIDTH;
  }
}

function moveMonsters(state: GameState, previousPlayerY: number) {
  const player = state.player;
  const killed = new Set<number>();
  for (const monster of state.monsters) {
    monster.x = monster.baseX + Math.sin(state.time * 2 + monster.phase) * 30;
    if (player.hit || !overlaps(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT, monster.x, monster.y, MONSTER_WIDTH, MONSTER_HEIGHT, 6)) {
      continue;
    }
    if (player.vy > 0 && previousPlayerY + PLAYER_HEIGHT <= monster.y + MONSTER_HEIGHT / 2) {
      // Jumped on top of it.
      killed.add(monster.id);
      state.kills++;
      player.vy = -JUMP_VELOCITY;
      player.standingOn = null;
    } else {
      player.hit = true;
      player.standingOn = null;
      player.vy = Math.max(player.vy, 0);
    }
  }
  if (killed.size > 0) {
    state.monsters = state.monsters.filter((m) => !killed.has(m.id));
  }
}

function moveBullets(state: GameState, dt: number) {
  const remaining: Bullet[] = [];
  for (const bullet of state.bullets) {
    bullet.y -= BULLET_SPEED * dt;
    const target = state.monsters.find((m) =>
      overlaps(bullet.x - BULLET_RADIUS, bullet.y - BULLET_RADIUS, 2 * BULLET_RADIUS, 2 * BULLET_RADIUS, m.x, m.y, MONSTER_WIDTH, MONSTER_HEIGHT, 0),
    );
    if (target) {
      state.monsters = state.monsters.filter((m) => m !== target);
      state.kills++;
    } else if (bullet.y > state.cameraY - 50) {
      remaining.push(bullet);
    }
  }
  state.bullets = remaining;
}

function overlaps(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number, inset: number): boolean {
  return ax + inset < bx + bw - inset && ax + aw - inset > bx + inset && ay + inset < by + bh - inset && ay + ah - inset > by + inset;
}

/** Fills the area up to one screen above the camera with platforms (and the odd monster). */
function generatePlatforms(state: GameState) {
  const random = state.random;
  while (state.chainTopY > state.cameraY - VIEW_HEIGHT) {
    const height = state.startY - state.chainTopY;
    const d = difficulty(height);
    const minGap = 40 + 50 * d;
    const maxGap = Math.min(MAX_GAP, 90 + 80 * d);
    const gap = minGap + random() * (maxGap - minGap);
    const y = state.chainTopY - gap;

    const moving = height > 500 && random() < 0.1 + 0.3 * d;
    const platform = newPlatform(state, random() * (WORLD_WIDTH - PLATFORM_WIDTH), y, moving ? 'moving' : 'normal');
    if (moving) {
      platform.vx = (random() < 0.5 ? -1 : 1) * MOVING_PLATFORM_SPEED * (1 + d);
    } else {
      platform.spring = random() < 0.06;
    }
    state.platforms.push(platform);

    // Breaking platforms are decoys between chain platforms, never needed to climb on.
    if (gap > 60 && random() < 0.15 + 0.2 * d) {
      const decoyY = y + gap / 2;
      state.platforms.push(newPlatform(state, random() * (WORLD_WIDTH - PLATFORM_WIDTH), decoyY, 'breaking'));
    }

    if (height > MONSTER_START_HEIGHT && state.lastMonsterY - y > VIEW_HEIGHT && random() < 0.08 + 0.1 * d) {
      const monsterY = y - MONSTER_HEIGHT - 30;
      const baseX = 30 + random() * (WORLD_WIDTH - MONSTER_WIDTH - 60);
      state.monsters.push({ id: state.nextId++, x: baseX, y: monsterY, baseX, phase: random() * Math.PI * 2 });
      state.lastMonsterY = monsterY;
    }

    state.chainTopY = y;
  }
}

function newPlatform(state: GameState, x: number, y: number, kind: PlatformKind): Platform {
  return { id: state.nextId++, x, y, kind, vx: 0, dx: 0, spring: false, broken: false, fallVelocity: 0 };
}

function removeBelowScreen(state: GameState) {
  const limit = state.cameraY + VIEW_HEIGHT + 100;
  state.platforms = state.platforms.filter((p) => p.y < limit);
  state.monsters = state.monsters.filter((m) => m.y < limit);
}
