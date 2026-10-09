import {
  BULLET_RADIUS,
  MONSTER_HEIGHT,
  MONSTER_WIDTH,
  PLATFORM_HEIGHT,
  PLATFORM_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  VIEW_HEIGHT,
  WORLD_WIDTH,
  type GameState,
  type Monster,
  type Platform,
  type Player,
} from './engine';

const colors = {
  paper: '#f8f4e6',
  grid: '#e6dfc8',
  outline: '#3b3a2f',
  doodle: '#cfe25b',
  doodleDark: '#9fb53a',
  normal: '#6fbf3a',
  moving: '#4aa3df',
  breaking: '#a0703c',
  spring: '#8a8a8a',
  monster: '#7b4bb3',
  bullet: '#c30827',
};

const GRID = 20;

/** Draws the visible part of the world; `scale` maps world pixels to canvas pixels. */
export function render(ctx: CanvasRenderingContext2D, state: GameState, scale: number) {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  drawPaper(ctx, state.cameraY);
  ctx.translate(0, -state.cameraY);

  for (const platform of state.platforms) {
    drawPlatform(ctx, platform);
  }
  for (const monster of state.monsters) {
    drawMonster(ctx, monster, state.time);
  }
  ctx.fillStyle = colors.bullet;
  for (const bullet of state.bullets) {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, BULLET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
  drawPlayer(ctx, state.player, state.time);
  // Wrapped around the edge: also draw the part that shows on the other side.
  if (state.player.x < 0 || state.player.x + PLAYER_WIDTH > WORLD_WIDTH) {
    const shift = state.player.x < 0 ? WORLD_WIDTH : -WORLD_WIDTH;
    drawPlayer(ctx, { ...state.player, x: state.player.x + shift }, state.time);
  }
}

function drawPaper(ctx: CanvasRenderingContext2D, cameraY: number) {
  ctx.fillStyle = colors.paper;
  ctx.fillRect(0, 0, WORLD_WIDTH, VIEW_HEIGHT);
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = GRID; x < WORLD_WIDTH; x += GRID) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, VIEW_HEIGHT);
  }
  // The horizontal lines scroll with the world, so climbing is visible even without platforms.
  const offset = ((-cameraY % GRID) + GRID) % GRID;
  for (let y = offset; y < VIEW_HEIGHT; y += GRID) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(WORLD_WIDTH, y + 0.5);
  }
  ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.stroke();
}

function drawPlatform(ctx: CanvasRenderingContext2D, platform: Platform) {
  ctx.strokeStyle = colors.outline;
  ctx.lineWidth = 2;
  ctx.fillStyle = colors[platform.kind];

  if (platform.broken) {
    // Two halves tilting away from each other while falling.
    const tilt = Math.min(0.6, platform.fallVelocity / 1500);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(platform.x + PLATFORM_WIDTH / 2 + side * 4, platform.y + PLATFORM_HEIGHT / 2);
      ctx.rotate(side * tilt);
      roundRect(ctx, side < 0 ? -PLATFORM_WIDTH / 2 : 0, -PLATFORM_HEIGHT / 2, PLATFORM_WIDTH / 2, PLATFORM_HEIGHT, 4);
      ctx.restore();
    }
    return;
  }

  roundRect(ctx, platform.x, platform.y, PLATFORM_WIDTH, PLATFORM_HEIGHT, 6);
  if (platform.kind === 'breaking') {
    ctx.beginPath();
    const cx = platform.x + PLATFORM_WIDTH / 2;
    ctx.moveTo(cx - 3, platform.y);
    ctx.lineTo(cx + 3, platform.y + 5);
    ctx.lineTo(cx - 2, platform.y + 9);
    ctx.lineTo(cx + 2, platform.y + PLATFORM_HEIGHT);
    ctx.stroke();
  }
  if (platform.spring) {
    const sx = platform.x + PLATFORM_WIDTH / 2 - 8;
    const sy = platform.y - 12;
    ctx.fillStyle = colors.spring;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      ctx.rect(sx, sy + i * 4, 16, 3);
    }
    ctx.fill();
    ctx.stroke();
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, time: number) {
  const { x, y, facing } = player;
  ctx.save();
  ctx.translate(x + PLAYER_WIDTH / 2, y);
  if (player.hit) {
    ctx.rotate(Math.sin(time * 20) * 0.3);
  }
  ctx.strokeStyle = colors.outline;
  ctx.lineWidth = 2;

  // Legs (spread while rising).
  const spread = player.vy < 0 ? 4 : 0;
  ctx.beginPath();
  for (const lx of [-12, -4, 4, 12]) {
    ctx.moveTo(lx, PLAYER_HEIGHT - 10);
    ctx.lineTo(lx + Math.sign(lx) * spread, PLAYER_HEIGHT);
  }
  ctx.stroke();

  // Body.
  ctx.fillStyle = colors.doodle;
  ctx.beginPath();
  ctx.roundRect(-PLAYER_WIDTH / 2, 4, PLAYER_WIDTH, PLAYER_HEIGHT - 14, [16, 16, 4, 4]);
  ctx.fill();
  ctx.stroke();
  // Stripes on the lower body.
  ctx.strokeStyle = colors.doodleDark;
  ctx.beginPath();
  for (const sy of [PLAYER_HEIGHT - 18, PLAYER_HEIGHT - 14]) {
    ctx.moveTo(-PLAYER_WIDTH / 2 + 2, sy);
    ctx.lineTo(PLAYER_WIDTH / 2 - 2, sy);
  }
  ctx.stroke();
  ctx.strokeStyle = colors.outline;

  // Snout: sideways while walking, upwards while shooting.
  ctx.fillStyle = colors.doodle;
  ctx.beginPath();
  if (player.shootPose > 0) {
    ctx.rect(-5, -8, 10, 14);
  } else {
    ctx.rect(facing > 0 ? PLAYER_WIDTH / 2 - 4 : -PLAYER_WIDTH / 2 - 10, 14, 14, 8);
  }
  ctx.fill();
  ctx.stroke();

  // Eyes.
  ctx.fillStyle = colors.outline;
  if (player.hit) {
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('× ×', 0, 16);
  } else {
    const ex = player.shootPose > 0 ? 0 : facing * 6;
    ctx.beginPath();
    ctx.arc(ex - 4, 12, 2, 0, Math.PI * 2);
    ctx.arc(ex + 4, 12, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMonster(ctx: CanvasRenderingContext2D, monster: Monster, time: number) {
  const cx = monster.x + MONSTER_WIDTH / 2;
  const bob = Math.sin(time * 6 + monster.phase) * 2;
  const top = monster.y + bob;
  ctx.strokeStyle = colors.outline;
  ctx.lineWidth = 2;
  ctx.fillStyle = colors.monster;

  // Horns.
  ctx.beginPath();
  ctx.moveTo(cx - 16, top + 10);
  ctx.lineTo(cx - 20, top);
  ctx.lineTo(cx - 8, top + 6);
  ctx.moveTo(cx + 16, top + 10);
  ctx.lineTo(cx + 20, top);
  ctx.lineTo(cx + 8, top + 6);
  ctx.fill();
  ctx.stroke();

  // Body.
  ctx.beginPath();
  ctx.ellipse(cx, top + MONSTER_HEIGHT / 2 + 2, MONSTER_WIDTH / 2, MONSTER_HEIGHT / 2 - 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eyes and teeth.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - 9, top + 16, 6, 0, Math.PI * 2);
  ctx.arc(cx + 9, top + 16, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.outline;
  ctx.beginPath();
  ctx.arc(cx - 8, top + 17, 2.5, 0, Math.PI * 2);
  ctx.arc(cx + 10, top + 17, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  for (let i = -2; i <= 1; i++) {
    ctx.moveTo(cx + i * 6, top + 28);
    ctx.lineTo(cx + i * 6 + 6, top + 28);
    ctx.lineTo(cx + i * 6 + 3, top + 33);
  }
  ctx.fill();
}
