import { DEFAULT_COLORS, recolorSvg, type SkinColors } from './skin';

/**
 * SVG sprites from public/sprites. Drawing an SVG every frame is slow, so each sprite is rasterised
 * once per canvas scale into an offscreen canvas at the target resolution; it stays sharp on any
 * screen. A new scale (window resized) rasterises again.
 */
export interface SpriteSpec {
  file: string;
  /** Drawing box relative to the position passed to `draw`, in world pixels. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Player sprites get the skin colours. */
  skinned?: boolean;
}

const player = (pose: string): SpriteSpec => ({ file: `player-${pose}.svg`, x: -10, y: -12, width: 60, height: 58, skinned: true });
const platform = (kind: string): SpriteSpec => ({ file: `platform-${kind}.svg`, x: 0, y: 0, width: 68, height: 14 });

export const SPRITES = {
  'player-stand': player('stand'),
  'player-jump': player('jump'),
  'player-fall': player('fall'),
  'player-shoot': player('shoot'),
  'player-dead': player('dead'),
  'platform-normal': platform('normal'),
  'platform-moving': platform('moving'),
  'platform-breaking': platform('breaking'),
  spring: { file: 'spring.svg', x: 0, y: 0, width: 16, height: 12 },
  'imp-telefon': { file: 'imp-telefon.svg', x: -6, y: -12, width: 62, height: 56 },
  /** The IMP logo on every imp's shirt, centred on the anchor point. */
  'imp-logo': { file: 'imp-logo-shirt.svg', x: -7, y: -3.5, width: 14, height: 7 },
} satisfies Record<string, SpriteSpec>;

export type SpriteName = keyof typeof SPRITES;

export class Sprites {
  private readonly rasters = new Map<SpriteName, HTMLCanvasElement>();
  private scale = 0;

  private constructor(private readonly images: Map<SpriteName, HTMLImageElement>) {}

  /** Loads all sprites; player sprites are recoloured with the given skin. */
  static async load(colors: SkinColors = DEFAULT_COLORS): Promise<Sprites> {
    const entries = await Promise.all(
      (Object.entries(SPRITES) as [SpriteName, SpriteSpec][]).map(async ([name, spec]) => {
        const response = await fetch(`/sprites/${spec.file}`);
        if (!response.ok) {
          throw new Error(`Sprite ${spec.file} nicht ladbar (HTTP ${response.status})`);
        }
        const svg = await response.text();
        return [name, await svgImage(spec.skinned ? recolorSvg(svg, colors) : svg)] as const;
      }),
    );
    return new Sprites(new Map(entries));
  }

  /** Draws a sprite at world position (x, y); the context is already scaled to world pixels. */
  draw(ctx: CanvasRenderingContext2D, name: SpriteName, x: number, y: number, scale: number) {
    const spec: SpriteSpec = SPRITES[name];
    ctx.drawImage(this.raster(name, scale), x + spec.x, y + spec.y, spec.width, spec.height);
  }

  private raster(name: SpriteName, scale: number): HTMLCanvasElement {
    if (scale !== this.scale) {
      this.rasters.clear();
      this.scale = scale;
    }
    let canvas = this.rasters.get(name);
    if (!canvas) {
      const spec: SpriteSpec = SPRITES[name];
      canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.ceil(spec.width * scale));
      canvas.height = Math.max(1, Math.ceil(spec.height * scale));
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(this.images.get(name)!, 0, 0, canvas.width, canvas.height);
      this.rasters.set(name, canvas);
    }
    return canvas;
  }
}

/** An image of an SVG source; a data: URL is allowed by the CSP (img-src 'self' data:). */
export async function svgImage(svg: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = svgDataUrl(svg);
  await image.decode();
  return image;
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
