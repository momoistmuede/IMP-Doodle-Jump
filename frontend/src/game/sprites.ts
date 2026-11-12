import { DEFAULT_SKIN, GLASSES, GLASSES_BOX, HAT_BOX, HATS, recolorSvg, skinColors, type FigureParts, type Pose, type SkinColors } from './skin';
import { ZONES, impSkin, type ImpSprite, type MonsterKind } from './zones';

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
  'platform-rescue': { file: 'platform-rescue.svg', x: 0, y: 0, width: 140, height: 14 },
  'platform-vanishing': platform('vanishing'),
  'platform-crumbling': platform('crumbling'),
  'platform-vertical': platform('vertical'),
  'platform-normal-short': { file: 'platform-normal-short.svg', x: 0, y: 0, width: 48, height: 14 },
  'platform-moving-short': { file: 'platform-moving-short.svg', x: 0, y: 0, width: 48, height: 14 },
  /** The spikes stick out 6 px above the platform's top. */
  'platform-spiked': { file: 'platform-spiked.svg', x: 0, y: -6, width: 68, height: 20 },
  spring: { file: 'spring.svg', x: 0, y: 0, width: 16, height: 12 },
  parachute: { file: 'parachute.svg', x: -32, y: -50, width: 64, height: 56 },
  heart: { file: 'heart.svg', x: 0, y: 0, width: 24, height: 24 },
  /** As a power-up centred in its 24 px box; on the player's back while flying. */
  jetpack: { file: 'jetpack.svg', x: 3, y: -1, width: 18, height: 26 },
  'heart-empty': { file: 'heart-empty.svg', x: 0, y: 0, width: 24, height: 24 },
  /** The IMP logo on every imp's shirt, centred on the anchor point. */
  'imp-logo': { file: 'imp-logo-shirt.svg', x: -7, y: -3.5, width: 14, height: 7 },
  // Accessories of the skin (2.4), drawn at the anchor points of the pose (skin.ts).
  ...accessories('hat', HATS, HAT_BOX),
  ...accessories('glasses', GLASSES, GLASSES_BOX),
} satisfies Record<string, SpriteSpec>;

function accessories<P extends string, T extends readonly (readonly [string, string])[]>(prefix: P, list: T, box: Omit<SpriteSpec, 'file'>) {
  return Object.fromEntries(list.slice(1).map(([id]) => [`${prefix}-${id}`, { file: `${prefix}-${id}.svg`, ...box }])) as Record<
    `${P}-${Exclude<T[number][0], 'none'>}`,
    SpriteSpec
  >;
}

export type SpriteName = keyof typeof SPRITES;

/** Imp sprites share one box; the zone tints them (body, shade, horns replace these placeholders). */
const IMP_BOX = { x: -6, y: -12, width: 62, height: 56 };
const IMP_SPRITES: readonly ImpSprite[] = ['telefon', 'pager', 'flieger', 'feature', 'deadline', 'quartalsziel', 'bug'];
const IMP_PLACEHOLDERS = { body: '#ff0080', shade: '#800040', horns: '#80ff00' };

export class Sprites {
  private readonly rasters = new Map<string, HTMLCanvasElement>();
  private scale = 0;

  private constructor(
    private readonly images: Map<string, HTMLImageElement>,
    private readonly specs: Map<string, SpriteSpec>,
    /** Sources of the player sprites, recoloured for every skin. */
    private readonly skinned: Map<string, string>,
  ) {}

  /** Loads all sprites; player sprites get the default skin until `setSkin`. */
  static async load(): Promise<Sprites> {
    const images = new Map<string, HTMLImageElement>();
    const specs = new Map<string, SpriteSpec>();
    const skinned = new Map<string, string>();
    const colors = skinColors(DEFAULT_SKIN);
    await Promise.all(
      (Object.entries(SPRITES) as [SpriteName, SpriteSpec][]).map(async ([name, spec]) => {
        const svg = await fetchSvg(spec.file);
        if (spec.skinned) {
          skinned.set(name, svg);
        }
        images.set(name, await svgImage(spec.skinned ? recolorSvg(svg, colors) : svg));
        specs.set(name, spec);
      }),
    );
    // Every imp look of every zone, e.g. the blue pager imp of operations.
    const impSvgs = new Map(await Promise.all(IMP_SPRITES.map(async (sprite) => [sprite, await fetchSvg(`imp-${sprite}.svg`)] as const)));
    await Promise.all(
      ZONES.flatMap((zone, index) =>
        (Object.keys(zone.imps) as MonsterKind[]).map(async (kind) => {
          const look = zone.imps[kind];
          const svg = impSvgs
            .get(look.sprite)!
            .replaceAll(IMP_PLACEHOLDERS.body, look.body[0])
            .replaceAll(IMP_PLACEHOLDERS.shade, look.body[1])
            .replaceAll(IMP_PLACEHOLDERS.horns, look.horns);
          const skin = impSkin(index, kind);
          images.set(skin, await svgImage(svg));
          specs.set(skin, { file: `imp-${look.sprite}.svg`, ...IMP_BOX });
        }),
      ),
    );
    return new Sprites(images, specs, skinned);
  }

  /** Recolours the player sprites once per round; there is no recolouring per frame. */
  async setSkin(colors: SkinColors) {
    await Promise.all(
      [...this.skinned].map(async ([name, svg]) => {
        this.images.set(name, await svgImage(recolorSvg(svg, colors)));
        this.rasters.delete(name);
      }),
    );
  }

  /** Draws a sprite at world position (x, y); the context is already scaled to world pixels. */
  draw(ctx: CanvasRenderingContext2D, name: SpriteName, x: number, y: number, scale: number) {
    this.drawAny(ctx, name, x, y, scale);
  }

  /** Draws an imp in the look given by its skin (see zones.ts, impSkin). */
  drawImp(ctx: CanvasRenderingContext2D, skin: string, x: number, y: number, scale: number) {
    this.drawAny(ctx, this.specs.has(skin) ? skin : impSkin(0, 'wobbler'), x, y, scale);
  }

  private drawAny(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, scale: number) {
    const spec = this.specs.get(name)!;
    ctx.drawImage(this.raster(name, scale), x + spec.x, y + spec.y, spec.width, spec.height);
  }

  private raster(name: string, scale: number): HTMLCanvasElement {
    if (scale !== this.scale) {
      this.rasters.clear();
      this.scale = scale;
    }
    let canvas = this.rasters.get(name);
    if (!canvas) {
      const spec = this.specs.get(name)!;
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

let figureParts: Promise<FigureParts> | undefined;

/** SVG sources for whole figures (mini figures in the top list, skin editor preview); loaded once. */
export function loadFigureParts(): Promise<FigureParts> {
  figureParts ??= (async () => {
    const poses: Pose[] = ['stand', 'jump', 'fall', 'shoot', 'dead'];
    const [poseSvgs, hatSvgs, glassesSvgs, parachute] = await Promise.all([
      Promise.all(poses.map((pose) => fetchSvg(`player-${pose}.svg`))),
      Promise.all(HATS.slice(1).map(([id]) => fetchSvg(`hat-${id}.svg`))),
      Promise.all(GLASSES.slice(1).map(([id]) => fetchSvg(`glasses-${id}.svg`))),
      fetchSvg('parachute.svg'),
    ]);
    return {
      poses: Object.fromEntries(poses.map((pose, i) => [pose, poseSvgs[i]])) as Record<Pose, string>,
      hats: Object.fromEntries(HATS.slice(1).map(([id], i) => [id, hatSvgs[i]])),
      glasses: Object.fromEntries(GLASSES.slice(1).map(([id], i) => [id, glassesSvgs[i]])),
      parachute,
    };
  })();
  figureParts.catch(() => (figureParts = undefined));
  return figureParts;
}

async function fetchSvg(file: string): Promise<string> {
  const response = await fetch(`/sprites/${file}`);
  if (!response.ok) {
    throw new Error(`Sprite ${file} nicht ladbar (HTTP ${response.status})`);
  }
  return response.text();
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
