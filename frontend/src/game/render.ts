import {
  BULLET_RADIUS,
  MONSTER_WIDTH,
  PLATFORM_HEIGHT,
  PLAYER_WIDTH,
  POWER_UP_SIZE,
  VIEW_HEIGHT,
  WORLD_WIDTH,
  type GameState,
  type Monster,
  type Platform,
  type Player,
  type PowerUp,
} from './engine';
import { drawHud, drawPopups, FONT_FAMILY, type Hud } from './hud';
import { PALETTE } from './palette';
import type { SpriteName, Sprites } from './sprites';
import { PIXELS_PER_METER, ZONE_HEIGHT_M, ZONES, zoneIndexAt } from './zones';

/**
 * Two layers (see docs/konzept-arcade.md, "Grafik"):
 * 1. The background is pixel art: drawn into a small offscreen canvas (1 art pixel = 2 world pixels)
 *    and scaled up without smoothing.
 * 2. Everything else is drawn sharp at the full canvas resolution, with anti-aliasing.
 */
export const ART_PIXEL = 2;
const BACKGROUND_WIDTH = WORLD_WIDTH / ART_PIXEL;
const BACKGROUND_HEIGHT = VIEW_HEIGHT / ART_PIXEL;
/** Spacing of the notepad grid, in art pixels. */
const GRID = 10;
/** The background blends into the next zone's over this many metres before the zone boundary. */
const TRANSITION_M = 20;
/** Imp shirt: centre of the logo relative to the monster position. */
const LOGO_ANCHOR = { x: MONSTER_WIDTH / 2, y: 30 };

export class Renderer {
  private readonly background: HTMLCanvasElement;
  private readonly backgroundCtx: CanvasRenderingContext2D;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly sprites: Sprites,
  ) {
    this.background = document.createElement('canvas');
    this.background.width = BACKGROUND_WIDTH;
    this.background.height = BACKGROUND_HEIGHT;
    this.backgroundCtx = this.background.getContext('2d')!;
  }

  /** Draws a frame; `scale` maps world pixels to canvas pixels. */
  render(state: GameState, hud: Hud, scale: number) {
    const ctx = this.ctx;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    this.drawBackground(state);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.background, 0, 0, WORLD_WIDTH, VIEW_HEIGHT);
    ctx.imageSmoothingEnabled = true;

    ctx.translate(0, -state.cameraY);
    for (const platform of state.platforms) {
      this.drawPlatform(platform, scale);
    }
    for (const monster of state.monsters) {
      this.drawMonster(monster, state.time, scale);
    }
    for (const powerUp of state.powerUps) {
      this.drawPowerUp(powerUp, state.time, scale);
    }
    ctx.fillStyle = PALETTE.redDark;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.5;
    for (const bullet of state.bullets) {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, BULLET_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    // Blinking while invulnerable.
    if (state.invulnerable > 0 && Math.floor(state.time * 10) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }
    this.drawPlayer(state.player, state, scale);
    // Wrapped around the edge: also draw the part that shows on the other side.
    if (state.player.x < 0 || state.player.x + PLAYER_WIDTH > WORLD_WIDTH) {
      const shift = state.player.x < 0 ? WORLD_WIDTH : -WORLD_WIDTH;
      this.drawPlayer({ ...state.player, x: state.player.x + shift }, state, scale);
    }
    ctx.globalAlpha = 1;
    drawPopups(ctx, hud);

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawHud(ctx, hud, state, this.sprites, scale);
  }

  /**
   * The zone's background, chosen by the camera height, so it also works during the intro descent.
   * Until the pixel-art pictures exist, every zone is a flat placeholder colour; only the hotline has
   * its notepad grid. Before a zone boundary the colours blend over.
   * Positions are whole art pixels, otherwise slow scrolling flickers.
   */
  private drawBackground(state: GameState) {
    const bg = this.backgroundCtx;
    const meters = (state.startY - (state.cameraY + VIEW_HEIGHT / 2)) / PIXELS_PER_METER;
    const index = zoneIndexAt(meters);
    const boundary = (index + 1) * ZONE_HEIGHT_M;
    const blend = index < ZONES.length - 1 ? Math.min(1, Math.max(0, (meters - (boundary - TRANSITION_M)) / TRANSITION_M)) : 0;
    const next = ZONES[Math.min(index + 1, ZONES.length - 1)];
    bg.fillStyle = mixColors(ZONES[index].background, next.background, blend);
    bg.fillRect(0, 0, BACKGROUND_WIDTH, BACKGROUND_HEIGHT);
    if (index === 0) {
      bg.globalAlpha = 1 - blend;
      this.drawNotepad(state.cameraY);
      bg.globalAlpha = 1;
    }
  }

  /** The hotline's notepad grid. */
  private drawNotepad(cameraY: number) {
    const bg = this.backgroundCtx;
    bg.fillStyle = PALETTE.paperLine;
    for (let x = GRID; x < BACKGROUND_WIDTH; x += GRID) {
      bg.fillRect(x, 0, 1, BACKGROUND_HEIGHT);
    }
    // The horizontal lines scroll with the world, so climbing is visible even without platforms.
    const scroll = Math.round(-cameraY / ART_PIXEL);
    const offset = ((scroll % GRID) + GRID) % GRID;
    for (let y = offset; y < BACKGROUND_HEIGHT; y += GRID) {
      bg.fillRect(0, y, BACKGROUND_WIDTH, 1);
    }
    bg.fillStyle = PALETTE.pink;
    bg.fillRect(16, 0, 1, BACKGROUND_HEIGHT);
  }

  private drawPlatform(platform: Platform, scale: number) {
    const ctx = this.ctx;
    const sprite: SpriteName = `platform-${platform.kind}`;
    if (platform.broken) {
      // Two halves tilting away from each other while falling.
      const tilt = Math.min(0.6, platform.fallVelocity / 1500);
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(platform.x + platform.width / 2 + side * 4, platform.y + PLATFORM_HEIGHT / 2);
        ctx.rotate(side * tilt);
        ctx.beginPath();
        ctx.rect(side < 0 ? -platform.width / 2 : 0, -PLATFORM_HEIGHT, platform.width / 2, PLATFORM_HEIGHT * 2);
        ctx.clip();
        this.sprites.draw(ctx, sprite, -platform.width / 2, -PLATFORM_HEIGHT / 2, scale);
        ctx.restore();
      }
      return;
    }
    this.sprites.draw(ctx, sprite, platform.x, platform.y, scale);
    if (platform.spring) {
      this.sprites.draw(ctx, 'spring', platform.x + platform.width / 2 - 8, platform.y - 11, scale);
    }
  }

  private drawPlayer(player: Player, state: GameState, scale: number) {
    const ctx = this.ctx;
    const time = state.time;
    if (state.parachute || state.phase === 'intro') {
      // Swinging gently under the canopy.
      ctx.save();
      ctx.translate(player.x + PLAYER_WIDTH / 2, player.y);
      ctx.rotate(Math.sin(time * 2) * 0.08);
      this.sprites.draw(ctx, 'parachute', 0, 0, scale);
      this.sprites.draw(ctx, 'player-stand', -PLAYER_WIDTH / 2, 0, scale);
      ctx.restore();
      return;
    }
    const pose: SpriteName = player.hit
      ? 'player-dead'
      : player.shootPose > 0
        ? 'player-shoot'
        : player.vy < 0
          ? 'player-jump'
          : player.vy > 300
            ? 'player-fall'
            : 'player-stand';
    ctx.save();
    ctx.translate(player.x + PLAYER_WIDTH / 2, player.y);
    if (player.hit) {
      ctx.rotate(Math.sin(time * 20) * 0.3);
    }
    if (player.facing < 0 && pose !== 'player-shoot') {
      ctx.scale(-1, 1);
    }
    this.sprites.draw(ctx, pose, -PLAYER_WIDTH / 2, 0, scale);
    ctx.restore();
  }

  /** Power-ups bob up and down and sparkle, so they stand out on dark backgrounds too. */
  private drawPowerUp(powerUp: PowerUp, time: number, scale: number) {
    const ctx = this.ctx;
    const bob = Math.sin(time * 4 + powerUp.id) * 3;
    if (powerUp.kind === 'points') {
      drawPointsPlaceholder(ctx, powerUp, bob);
    } else {
      this.sprites.draw(ctx, powerUp.kind, powerUp.x, powerUp.y + bob, scale);
    }
    ctx.fillStyle = PALETTE.white;
    for (let i = 0; i < 3; i++) {
      const t = time * 3 + i * 2.1 + powerUp.id;
      const size = Math.max(0, Math.sin(t)) * 3;
      if (size > 0.3) {
        const sx = powerUp.x + POWER_UP_SIZE / 2 + Math.cos(i * 2.1) * 16;
        const sy = powerUp.y + POWER_UP_SIZE / 2 + bob + Math.sin(i * 2.1) * 16;
        ctx.beginPath();
        ctx.moveTo(sx, sy - size * 2);
        ctx.lineTo(sx + size / 2, sy);
        ctx.lineTo(sx, sy + size * 2);
        ctx.lineTo(sx - size / 2, sy);
        ctx.closePath();
        ctx.moveTo(sx - size * 2, sy);
        ctx.lineTo(sx, sy + size / 2);
        ctx.lineTo(sx + size * 2, sy);
        ctx.lineTo(sx, sy - size / 2);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  private drawMonster(monster: Monster, time: number, scale: number) {
    const ctx = this.ctx;
    const bob = Math.sin(time * 6 + monster.phase) * 2;
    ctx.save();
    ctx.translate(monster.x + MONSTER_WIDTH / 2, monster.y + bob);
    // The phone imp wobbles to the ring.
    ctx.rotate(Math.sin(time * 18 + monster.phase) * 0.06);
    ctx.translate(-MONSTER_WIDTH / 2, 0);
    this.sprites.draw(ctx, 'imp-telefon', 0, 0, scale);
    this.sprites.draw(ctx, 'imp-logo', LOGO_ANCHOR.x, LOGO_ANCHOR.y, scale);
    ctx.restore();
  }
}

/**
 * Placeholder of the points power-up until its zone motif is drawn: a circle in the zone's colour
 * with the zone number.
 */
function drawPointsPlaceholder(ctx: CanvasRenderingContext2D, powerUp: PowerUp, bob: number) {
  const zone = Math.max(0, ZONES.findIndex((z) => z.pointsSkin === powerUp.skin));
  const color = ZONES[zone].pointsColor;
  const cx = powerUp.x + POWER_UP_SIZE / 2;
  const cy = powerUp.y + POWER_UP_SIZE / 2 + bob;
  ctx.fillStyle = color;
  ctx.strokeStyle = PALETTE.black;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, POWER_UP_SIZE / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.font = `16px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = luminance(color) > 0.5 ? PALETTE.black : PALETTE.white;
  ctx.fillText(String(zone + 1), cx + 1, cy + 1);
}

/** Linear mix of two #rrggbb colours. */
function mixColors(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  const mixed = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `rgb(${mixed.join(',')})`;
}

function luminance(color: string): number {
  const [r, g, b] = parseHex(color);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function parseHex(color: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)) as [number, number, number];
}
