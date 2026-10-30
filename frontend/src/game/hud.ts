import { heightOf, MAX_LIVES, type GameState } from './engine';
import { PALETTE } from './palette';
import { formatScore, hiScore, nextTarget } from './scoreboard';
import type { Sprites } from './sprites';
import { PIXELS_PER_METER, ZONE_HEIGHT_M, ZONE_NAMES, zoneIndexAt } from './zones';

/**
 * The arcade HUD, drawn straight onto the canvas: it scales with the game and stays sharp, and React
 * does not re-render on every point. The lower sixth of the screen stays free for touch buttons later.
 */
export const FONT_FAMILY = '"Press Start 2P"';

const POPUP_SECONDS = 0.8;
const POPUP_RISE = 40;
const PULSE_SECONDS = 0.15;
const NEXT_BLINK_SECONDS = 1;

const METER = { x: 6, top: 112, bottom: 488, width: 8 };
const HEART_SIZE = 24;
const HEART_SPACING = 28;
const FLASH_SECONDS = 0.3;
const BURST_SECONDS = 0.6;
/** The best-height marker appears once the player is this far below it, e.g. after a parachute fall. */
const BEST_MARKER_DISTANCE = 300;

interface Banner {
  title: string;
  subtitle?: string;
  age: number;
  duration: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
}

interface Popup {
  text: string;
  x: number;
  y: number;
  age: number;
}

export interface Hud {
  /** Scores of the filled top-10 places, best first. */
  top: readonly number[];
  /** "+50" rising from defeated monsters, in world coordinates. */
  popups: Popup[];
  /** Seconds left of the score pulse. */
  pulse: number;
  /** Place shown in the NEXT line (null = NEW #1); undefined before the first frame. */
  nextRank: number | null | undefined;
  /** Seconds left of the NEXT blink after overtaking a place. */
  nextBlink: number;
  /** Red flash after losing a heart. */
  flash: number;
  /** Pieces of the heart that just burst, in screen coordinates. */
  particles: Particle[];
  /** Sound switched off (key M): shown as a crossed-out speaker. */
  muted: boolean;
  /** Zone banner or GO! in the middle of the screen. */
  banner: Banner | null;
  time: number;
}

export function createHud(top: readonly number[]): Hud {
  return { top, popups: [], pulse: 0, nextRank: undefined, nextBlink: 0, flash: 0, particles: [], muted: false, banner: null, time: 0 };
}

/**
 * Advances the animations and reacts to the events of the last `update`.
 * Returns true when the player just overtook a place of the top 10.
 */
export function updateHud(hud: Hud, state: GameState, dt: number): boolean {
  hud.time += dt;
  hud.pulse = Math.max(0, hud.pulse - dt);
  hud.nextBlink = Math.max(0, hud.nextBlink - dt);
  for (const popup of hud.popups) {
    popup.age += dt;
  }
  hud.popups = hud.popups.filter((p) => p.age < POPUP_SECONDS);
  hud.flash = Math.max(0, hud.flash - dt);
  for (const particle of hud.particles) {
    particle.age += dt;
    particle.vy += 600 * dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
  }
  hud.particles = hud.particles.filter((p) => p.age < BURST_SECONDS);
  if (hud.banner) {
    hud.banner.age += dt;
    if (hud.banner.age >= hud.banner.duration) {
      hud.banner = null;
    }
  }

  for (const event of state.events) {
    switch (event.type) {
      case 'zoneEnter':
        hud.banner = { title: `ZONE ${event.zone + 1}`, subtitle: ZONE_NAMES[event.zone], age: 0, duration: 2 };
        break;
      case 'introZone':
        // On the way down every name stays readable: one second per zone, no fanfare.
        hud.banner = { title: `ZONE ${event.zone + 1}`, subtitle: ZONE_NAMES[event.zone], age: 0, duration: 1 };
        break;
      case 'introLand':
        hud.banner = { title: 'GO!', age: 0, duration: 1 };
        break;
      case 'kill':
      case 'heartBonus':
      case 'points':
        hud.popups.push({ text: `+${event.points}`, x: event.x, y: event.y, age: 0 });
        hud.pulse = PULSE_SECONDS;
        break;
      case 'hurt': {
        hud.flash = FLASH_SECONDS;
        const heart = heartPosition(state.lives);
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          hud.particles.push({
            x: heart.x + HEART_SIZE / 2,
            y: heart.y + HEART_SIZE / 2,
            vx: Math.cos(angle) * (80 + Math.random() * 60),
            vy: Math.sin(angle) * (80 + Math.random() * 60) - 120,
            age: 0,
          });
        }
        break;
      }
    }
  }

  const next = nextTarget(hud.top, state.score)?.rank ?? null;
  const overtaken = hud.nextRank !== undefined && next !== hud.nextRank;
  if (overtaken) {
    hud.nextBlink = NEXT_BLINK_SECONDS;
  }
  hud.nextRank = next;
  return overtaken;
}

/** Popups live in the world; call with the camera transform applied. */
export function drawPopups(ctx: CanvasRenderingContext2D, hud: Hud) {
  for (const popup of hud.popups) {
    ctx.globalAlpha = 1 - popup.age / POPUP_SECONDS;
    text(ctx, popup.text, popup.x, popup.y - (popup.age / POPUP_SECONDS) * POPUP_RISE, 16, PALETTE.yellow, 'center');
  }
  ctx.globalAlpha = 1;
}

/** Draws the HUD in screen coordinates (world pixels without the camera). */
export function drawHud(ctx: CanvasRenderingContext2D, hud: Hud, state: GameState, sprites: Sprites, scale: number) {
  const blinkOn = Math.floor(hud.time * 8) % 2 === 0;
  const center = 200;

  if (hud.flash > 0) {
    ctx.globalAlpha = (hud.flash / FLASH_SECONDS) * 0.4;
    ctx.fillStyle = PALETTE.red;
    ctx.fillRect(0, 0, 400, 600);
    ctx.globalAlpha = 1;
  }

  ctx.save();
  ctx.translate(center, 28);
  const pulse = hud.pulse > 0 ? 1.1 : 1;
  ctx.scale(pulse, pulse);
  text(ctx, formatScore(state.score), 0, -16, 32, PALETTE.white, 'center');
  ctx.restore();

  const hi = hiScore(hud.top, state.score);
  text(ctx, `HI ${formatScore(hi.score)}`, center, 54, 16, hi.beaten && blinkOn ? PALETTE.yellow : PALETTE.white, 'center');

  if (hud.nextBlink === 0 || blinkOn) {
    const next = nextTarget(hud.top, state.score);
    const line = next ? `NEXT #${next.rank} ${formatScore(next.score)}` : 'NEW #1';
    text(ctx, line, center, 76, 16, next ? PALETTE.white : PALETTE.gold, 'center');
  }

  drawHearts(ctx, hud, state, sprites, scale);
  drawMeter(ctx, state);
  drawSpeaker(ctx, hud.muted);

  if (hud.banner) {
    const { title, subtitle } = hud.banner;
    text(ctx, title, center, 236, 32, subtitle ? PALETTE.white : PALETTE.yellow, 'center');
    if (subtitle) {
      text(ctx, subtitle, center, 276, 16, PALETTE.yellow, 'center');
    }
  }
  if (state.phase === 'intro' && Math.floor(hud.time * 2) % 2 === 0) {
    text(ctx, 'SPACE > SKIP', center, 560, 8, PALETTE.white, 'center');
  }
}

/** Small speaker at the top left; crossed out while the sound is off. */
function drawSpeaker(ctx: CanvasRenderingContext2D, muted: boolean) {
  ctx.save();
  ctx.translate(8, 10);
  ctx.fillStyle = PALETTE.white;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.lineTo(4, 5);
  ctx.lineTo(9, 1);
  ctx.lineTo(9, 15);
  ctx.lineTo(4, 11);
  ctx.lineTo(0, 11);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = muted ? PALETTE.red : PALETTE.white;
  ctx.beginPath();
  if (muted) {
    ctx.moveTo(12, 4);
    ctx.lineTo(19, 12);
    ctx.moveTo(19, 4);
    ctx.lineTo(12, 12);
  } else {
    ctx.arc(10, 8, 4, -0.9, 0.9);
    ctx.moveTo(15.5, 2.5);
    ctx.arc(10, 8, 8, -0.75, 0.75);
  }
  ctx.stroke();
  ctx.restore();
}

/** Top left corner of heart `index` (0 = leftmost) at the top right of the screen. */
function heartPosition(index: number): { x: number; y: number } {
  return { x: 400 - 8 - (MAX_LIVES - index) * HEART_SPACING + (HEART_SPACING - HEART_SIZE), y: 10 };
}

/** Filled hearts for the lives left, outlines for the lost ones; the last one pulses. */
function drawHearts(ctx: CanvasRenderingContext2D, hud: Hud, state: GameState, sprites: Sprites, scale: number) {
  for (let i = 0; i < MAX_LIVES; i++) {
    const { x, y } = heartPosition(i);
    const filled = i < state.lives;
    const pulse = filled && state.lives === 1 ? 1 + 0.15 * Math.abs(Math.sin(hud.time * 6)) : 1;
    ctx.save();
    ctx.translate(x + HEART_SIZE / 2, y + HEART_SIZE / 2);
    ctx.scale(pulse, pulse);
    sprites.draw(ctx, filled ? 'heart' : 'heart-empty', -HEART_SIZE / 2, -HEART_SIZE / 2, scale * pulse);
    ctx.restore();
  }
  ctx.fillStyle = PALETTE.red;
  for (const particle of hud.particles) {
    ctx.globalAlpha = 1 - particle.age / BURST_SECONDS;
    ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
}

/** Height meter on the left: progress through the current zone (or 1000 m step in the endless last zone). */
function drawMeter(ctx: CanvasRenderingContext2D, state: GameState) {
  const meters = Math.max(0, heightOf(state)) / PIXELS_PER_METER;
  const zone = zoneIndexAt(meters);
  const start = Math.floor(meters / ZONE_HEIGHT_M) * ZONE_HEIGHT_M;
  const end = start + ZONE_HEIGHT_M;
  const fraction = (meters - start) / ZONE_HEIGHT_M;
  const { x, top, bottom, width } = METER;
  const markerY = bottom - fraction * (bottom - top);

  ctx.globalAlpha = 0.45;
  ctx.fillStyle = PALETTE.white;
  ctx.fillRect(x, top, width, bottom - top);
  ctx.fillStyle = PALETTE.red;
  ctx.fillRect(x, markerY, width, bottom - markerY);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, top, width, bottom - top);

  const nextZone = zone < ZONE_NAMES.length - 1 ? ` ${ZONE_NAMES[zone + 1]}` : '';
  text(ctx, `${end} m${nextZone}`, x, top - 14, 8, PALETTE.white);
  text(ctx, `${start} m`, x, bottom + 4, 8, PALETTE.white);

  ctx.fillStyle = PALETTE.white;
  ctx.strokeStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.moveTo(x + width + 1, markerY);
  ctx.lineTo(x + width + 7, markerY - 4);
  ctx.lineTo(x + width + 7, markerY + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, `${Math.floor(meters)} m`, x + width + 10, markerY - 4, 8, PALETTE.white);

  // Dashed: the highest point of this round, to be climbed again after a fall.
  if (state.maxHeight - Math.max(0, heightOf(state)) > BEST_MARKER_DISTANCE) {
    const best = state.maxHeight / PIXELS_PER_METER;
    const bestY = Math.max(top, bottom - ((best - start) / ZONE_HEIGHT_M) * (bottom - top));
    ctx.setLineDash([3, 2]);
    ctx.strokeStyle = PALETTE.white;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 2, bestY);
    ctx.lineTo(x + width + 8, bestY);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, `${Math.floor(best)} m`, x + width + 10, bestY - 4, 8, PALETTE.yellow);
  }
}

/** White (or coloured) arcade text with a dark outline, readable on every background. */
export function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'left',
) {
  ctx.font = `${size}px ${FONT_FAMILY}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1.5, size / 5);
  ctx.strokeStyle = PALETTE.ink;
  ctx.strokeText(value, x, y);
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}
