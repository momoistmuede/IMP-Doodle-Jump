import { heightOf, type GameState } from './engine';
import { PALETTE } from './palette';
import { formatScore, hiScore, nextTarget } from './scoreboard';
import { ZONE_HEIGHT_M, ZONE_NAMES, zoneIndexAt } from './zones';

/**
 * The arcade HUD, drawn straight onto the canvas: it scales with the game and stays sharp, and React
 * does not re-render on every point. The lower sixth of the screen stays free for touch buttons later.
 */
export const FONT_FAMILY = '"Press Start 2P"';
/** 10 px = 1 m, so the metres equal the height points of the score. */
export const PIXELS_PER_METER = 10;

const POPUP_SECONDS = 0.8;
const POPUP_RISE = 40;
const PULSE_SECONDS = 0.15;
const NEXT_BLINK_SECONDS = 1;

const METER = { x: 6, top: 112, bottom: 488, width: 8 };

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
  time: number;
}

export function createHud(top: readonly number[]): Hud {
  return { top, popups: [], pulse: 0, nextRank: undefined, nextBlink: 0, time: 0 };
}

/** Advances the animations and reacts to the events of the last `update`. */
export function updateHud(hud: Hud, state: GameState, dt: number) {
  hud.time += dt;
  hud.pulse = Math.max(0, hud.pulse - dt);
  hud.nextBlink = Math.max(0, hud.nextBlink - dt);
  for (const popup of hud.popups) {
    popup.age += dt;
  }
  hud.popups = hud.popups.filter((p) => p.age < POPUP_SECONDS);

  for (const event of state.events) {
    if (event.type === 'kill') {
      hud.popups.push({ text: `+${event.points}`, x: event.x, y: event.y, age: 0 });
      hud.pulse = PULSE_SECONDS;
    }
  }

  const next = nextTarget(hud.top, state.score)?.rank ?? null;
  if (hud.nextRank !== undefined && next !== hud.nextRank) {
    hud.nextBlink = NEXT_BLINK_SECONDS;
  }
  hud.nextRank = next;
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
export function drawHud(ctx: CanvasRenderingContext2D, hud: Hud, state: GameState) {
  const blinkOn = Math.floor(hud.time * 8) % 2 === 0;
  const center = 200;

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

  drawMeter(ctx, state);
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
