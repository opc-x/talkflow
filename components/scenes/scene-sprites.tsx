"use client";

import type { SceneObject, SlotLayout } from "@/lib/visual-state";
import { SLOT_LAYOUT } from "@/lib/visual-state";
import {
  BookSprite,
  BoxSprite,
  ClockSprite,
  PenSprite,
  PencilSprite,
  PersonSprite,
  PictureSprite,
  PropSpriteDefs,
} from "@/components/scenes/prop-sprites";

const EMERALD = "#10B981";

function SpriteShape({
  sprite,
  dimmed,
}: {
  sprite: string;
  dimmed?: boolean;
}) {
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
    case "man":
    case "woman":
    case "boy":
    case "girl":
      return <PersonSprite sprite={sprite} dimmed={dimmed} />;
    case "picture":
      return <PictureSprite dimmed={dimmed} />;
    default:
      return null;
  }
}

/** Draw order: back → front */
const Z_ORDER: Record<string, number> = {
  picture: 0,
  clock: 1,
  box: 2,
  book: 3,
  pencil: 4,
  pen: 5,
  man: 6,
  woman: 6,
  boy: 6,
  girl: 6,
};

export function SceneSprites({
  objects,
  colourSwatch,
}: {
  objects: SceneObject[];
  colourSwatch?: string;
}) {
  const drawable = objects
    .filter(
      (o) =>
        !["table", "chair", "window", "door", "light", "room", "city", "town", "village"].includes(
          o.sprite
        )
    )
    .sort((a, b) => (Z_ORDER[a.sprite] ?? 0) - (Z_ORDER[b.sprite] ?? 0));

  return (
    <>
      {drawable.map((obj) => {
        const layout: SlotLayout = SLOT_LAYOUT[obj.slot] ?? SLOT_LAYOUT.table_center;
        const scale = layout.scale ?? 1;

        return (
          <g
            key={obj.id}
            transform={`translate(${layout.x}, ${layout.y}) scale(${scale})`}
            opacity={obj.dimmed ? 0.42 : 1}
          >
            <SpriteShape sprite={obj.sprite} dimmed={obj.dimmed} />
            {obj.highlight && colourSwatch && (
              <g transform="translate(22, -14)">
                <rect
                  x="-10"
                  y="-10"
                  width="20"
                  height="20"
                  rx="4"
                  fill={colourSwatch}
                  stroke="#fff"
                  strokeWidth="2"
                />
              </g>
            )}
          </g>
        );
      })}
    </>
  );
}

export function ScenePointer({
  targetId,
  objects,
}: {
  targetId: string;
  objects: SceneObject[];
}) {
  const target =
    objects.find((o) => o.id === targetId || o.sprite === targetId) ??
    objects.find((o) => o.highlight);
  if (!target) return null;

  const layout = SLOT_LAYOUT[target.slot] ?? SLOT_LAYOUT.table_center;
  const tipX = layout.x;
  const tipY = layout.y - 44;

  return (
    <g>
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values={`0,0; 0,-8; 0,0`}
          dur="0.85s"
          repeatCount="indefinite"
        />
        <line
          x1={tipX}
          y1={tipY - 22}
          x2={tipX}
          y2={tipY + 4}
          stroke={EMERALD}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <polygon
          points={`${tipX},${tipY + 8} ${tipX - 9},${tipY - 2} ${tipX + 9},${tipY - 2}`}
          fill={EMERALD}
        />
        <ellipse cx={tipX} cy={tipY + 14} rx="9" ry="2.5" fill="#000" opacity="0.1" />
        <path
          d={`M ${tipX + 3} ${tipY + 8}
              C ${tipX - 2} ${tipY - 2}, ${tipX} ${tipY - 12}, ${tipX + 7} ${tipY - 16}
              L ${tipX + 14} ${tipY - 20}
              L ${tipX + 10} ${tipY - 10}
              L ${tipX + 18} ${tipY - 14}
              L ${tipX + 8} ${tipY + 2}
              Z`}
          fill={EMERALD}
          stroke="#059669"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <circle cx={tipX + 5} cy={tipY - 16} r="3" fill="#34D399" />
      </g>
    </g>
  );
}

export { PropSpriteDefs };
