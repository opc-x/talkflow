"use client";

import type { SceneObject, SizeVariant, SlotLayout } from "@/lib/visual-state";
import { SLOT_LAYOUT } from "@/lib/visual-state";
import { STORYSET_ROOM_SRC, storysetPropPath } from "@/lib/scene-art-pack";
import {
  BookSprite,
  BoxSprite,
  ClockSprite,
  LightSprite,
  PenSprite,
  PencilSprite,
} from "@/components/scenes/prop-sprites";

/** Storyset <image> placement per sprite (viewBox 0 0 500 500) */
const PROP_LAYOUT: Record<string, { w: number; h: number; dx: number; dy: number }> = {
  pen: { w: 100, h: 44, dx: -50, dy: -18 },
  pencil: { w: 104, h: 44, dx: -52, dy: -18 },
  book: { w: 80, h: 70, dx: -40, dy: -52 },
  box: { w: 64, h: 56, dx: -32, dy: -40 },
  clock: { w: 56, h: 56, dx: -28, dy: -28 },
  light: { w: 48, h: 48, dx: -24, dy: -24 },
};

const FALLBACK_SPRITES = new Set(["pen", "pencil", "book", "box", "clock", "light"]);

function sizeScaleFor(variant: SizeVariant | undefined, highlight: boolean): number {
  if (!highlight || !variant) return 1;
  if (variant === "large" || variant === "long") return 1.28;
  return 0.82;
}

function InlinePropFallback({ sprite, dimmed }: { sprite: string; dimmed?: boolean }) {
  switch (sprite) {
    case "book":
      return <BookSprite dimmed={dimmed} />;
    case "pen":
      return <PenSprite dimmed={dimmed} />;
    case "pencil":
      return <PencilSprite dimmed={dimmed} />;
    case "box":
      return <BoxSprite dimmed={dimmed} />;
    case "clock":
      return <ClockSprite dimmed={dimmed} />;
    case "light":
      return <LightSprite dimmed={dimmed} />;
    default:
      return null;
  }
}

export function StorysetRoomBackground() {
  return (
    <image
      href={STORYSET_ROOM_SRC}
      x={-24}
      y={-8}
      width={448}
      height={316}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

export function StorysetSceneSprites({
  objects,
  colourSwatch,
  sizeVariant,
}: {
  objects: SceneObject[];
  colourSwatch?: string;
  sizeVariant?: SizeVariant;
}) {
  const drawable = objects.filter(
    (o) => storysetPropPath(o.sprite) !== null || FALLBACK_SPRITES.has(o.sprite),
  );

  return (
    <>
      {drawable.map((obj) => {
        const src = storysetPropPath(obj.sprite);
        const layout: SlotLayout = SLOT_LAYOUT[obj.slot] ?? SLOT_LAYOUT.table_center;
        const baseScale = layout.scale ?? 1;
        const scale = baseScale * sizeScaleFor(sizeVariant, Boolean(obj.highlight));
        const box = PROP_LAYOUT[obj.sprite] ?? { w: 72, h: 56, dx: -36, dy: -28 };

        return (
          <g
            key={obj.id}
            transform={`translate(${layout.x}, ${layout.y}) scale(${scale})`}
            opacity={obj.dimmed ? 0.45 : 1}
          >
            {src ? (
              <image
                href={src}
                x={box.dx}
                y={box.dy}
                width={box.w}
                height={box.h}
                preserveAspectRatio="xMidYMid meet"
              />
            ) : (
              <InlinePropFallback sprite={obj.sprite} dimmed={obj.dimmed} />
            )}
            {obj.highlight && colourSwatch && (
              <g transform="translate(28, -18)">
                <rect
                  x={-10}
                  y={-10}
                  width={20}
                  height={20}
                  rx={4}
                  fill={colourSwatch}
                  stroke="#fff"
                  strokeWidth={2}
                />
              </g>
            )}
          </g>
        );
      })}
    </>
  );
}

export function StorysetAttribution() {
  return (
    <a
      href="https://storyset.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="absolute bottom-1 right-2 z-[5] rounded bg-white/80 px-1.5 py-0.5 text-[9px] text-stone-500 hover:text-stone-700"
    >
      Illustrations by Storyset
    </a>
  );
}
