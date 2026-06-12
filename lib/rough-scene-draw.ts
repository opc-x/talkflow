/**
 * Rough.js 手绘风 — 用于 Node 导出 SVG 与浏览器 QaScene
 */

import { RoughGenerator } from "roughjs/bin/generator";
import type { Drawable, OpSet, Options } from "roughjs/bin/core";

const STROKE = "#57534E";
const W = {
  wall: "#FFFCF7",
  floor: "#D6C4A8",
  wood: "#E8C9A0",
  woodDark: "#C9A87A",
  woodStroke: "#6B5344",
};

const ROUGH_OPTS: Options = {
  roughness: 1.35,
  bowing: 1.8,
  strokeWidth: 1.8,
  fillStyle: "solid",
};

export function createRoughGenerator(seed?: number): RoughGenerator {
  return new RoughGenerator({
    options: { ...ROUGH_OPTS, seed: seed ?? 42 },
  });
}

function pathFromSet(gen: RoughGenerator, set: OpSet, drawable: Drawable): string {
  const d = set.path ?? gen.opsToPath(set);
  const o = drawable.options;
  if (set.type === "fillPath") {
    return `<path d="${d}" fill="${o.fill ?? "none"}" stroke="none" />`;
  }
  if (set.type === "path") {
    return `<path d="${d}" fill="none" stroke="${o.stroke ?? STROKE}" stroke-width="${o.strokeWidth ?? 1.8}" stroke-linecap="round" stroke-linejoin="round" />`;
  }
  if (set.type === "fillSketch") {
    return `<path d="${d}" fill="none" stroke="${o.stroke ?? STROKE}" stroke-width="${(o.strokeWidth ?? 1.8) * 0.7}" opacity="0.85" />`;
  }
  return "";
}

export function drawableToSvg(gen: RoughGenerator, drawable: Drawable, opacity = 1): string {
  const inner = drawable.sets.map((s) => pathFromSet(gen, s, drawable)).join("\n");
  if (opacity >= 1) return `<g>${inner}</g>`;
  return `<g opacity="${opacity}">${inner}</g>`;
}

function draw(
  gen: RoughGenerator,
  fn: () => Drawable,
  opacity = 1,
): string {
  return drawableToSvg(gen, fn(), opacity);
}

/** 背景 + 课桌（绝对坐标） */
export function roughRoomSvg(gen: RoughGenerator): string {
  const parts: string[] = [];
  parts.push(
    draw(gen, () =>
      gen.rectangle(0, 0, 400, 300, {
        fill: W.wall,
        stroke: STROKE,
        strokeWidth: 1.2,
        roughness: 0.8,
      }),
    ),
  );
  parts.push(
    draw(gen, () =>
      gen.rectangle(0, 248, 400, 52, {
        fill: W.floor,
        stroke: "none",
        roughness: 1,
      }),
    ),
  );
  // window
  parts.push(
    draw(gen, () =>
      gen.rectangle(36, 38, 56, 48, {
        fill: "#C5DCF5",
        stroke: W.woodStroke,
        roughness: 1.2,
      }),
    ),
  );
  parts.push(
    draw(gen, () =>
      gen.line(64, 38, 64, 86, { stroke: W.woodStroke, strokeWidth: 1.2 }),
    ),
  );
  parts.push(
    draw(gen, () =>
      gen.line(36, 62, 92, 62, { stroke: W.woodStroke, strokeWidth: 1.2 }),
    ),
  );
  // picture
  parts.push(
    draw(gen, () =>
      gen.rectangle(168, 44, 64, 44, {
        fill: "#F5E6C8",
        stroke: W.woodStroke,
      }),
    ),
  );
  parts.push(
    draw(gen, () => gen.circle(200, 58, 16, { fill: "#FBBF24", stroke: STROKE })),
  );
  parts.push(
    draw(gen, () =>
      gen.path("M 178 72 Q 200 62 222 72", { fill: "#86EFAC", stroke: STROKE }),
    ),
  );
  // desk trapezoid
  parts.push(
    draw(gen, () =>
      gen.polygon(
        [
          [24, 168],
          [376, 168],
          [360, 268],
          [40, 268],
        ],
        { fill: W.wood, stroke: W.woodStroke, strokeWidth: 2 },
      ),
    ),
  );
  parts.push(
    draw(gen, () =>
      gen.polygon(
        [
          [48, 178],
          [352, 178],
          [345, 255],
          [55, 255],
        ],
        { fill: W.woodDark, stroke: "none", roughness: 0.9 },
      ),
    ),
  );
  return parts.join("\n");
}

export function roughPenSvg(gen: RoughGenerator, dimmed?: boolean): string {
  const o = dimmed ? 0.4 : 1;
  return `<g opacity="${o}">
    ${draw(gen, () =>
      gen.rectangle(-38, -10, 76, 20, {
        fill: "#1E3A5F",
        stroke: STROKE,
        fillStyle: "hachure",
        hachureGap: 4,
      }),
    )}
    ${draw(gen, () =>
      gen.rectangle(-38, -10, 22, 20, { fill: "#2563EB", stroke: STROKE }),
    )}
    ${draw(gen, () =>
      gen.rectangle(28, -6, 10, 12, { fill: "#94A3B8", stroke: STROKE }),
    )}
    ${draw(gen, () =>
      gen.polygon(
        [
          [38, -5],
          [52, 0],
          [38, 5],
        ],
        { fill: "#C9A227", stroke: STROKE },
      ),
    )}
  </g>`;
}

export function roughPencilSvg(gen: RoughGenerator, dimmed?: boolean): string {
  const o = dimmed ? 0.4 : 1;
  return `<g opacity="${o}">
    ${draw(gen, () => gen.rectangle(-38, -10, 58, 20, { fill: "#F9A8D4", stroke: STROKE }))}
    ${draw(gen, () => gen.rectangle(-18, -10, 48, 20, { fill: "#F4D03F", stroke: STROKE, fillStyle: "hachure", hachureGap: 3 }))}
    ${draw(gen, () =>
      gen.polygon(
        [
          [32, -5],
          [48, 0],
          [32, 5],
        ],
        { fill: "#475569", stroke: STROKE },
      ),
    )}
  </g>`;
}

export function roughBookSvg(gen: RoughGenerator, dimmed?: boolean): string {
  const o = dimmed ? 0.4 : 1;
  return `<g opacity="${o}">
    ${draw(gen, () =>
      gen.polygon(
        [
          [-32, 12],
          [-32, -12],
          [34, -8],
          [34, 16],
        ],
        { fill: "#991B1B", stroke: STROKE },
      ),
    )}
    ${draw(gen, () =>
      gen.polygon(
        [
          [-30, 10],
          [-30, -10],
          [36, -6],
          [36, 14],
        ],
        { fill: "#DC2626", stroke: STROKE, fillStyle: "solid" },
      ),
    )}
    ${draw(gen, () =>
      gen.polygon(
        [
          [-28, 8],
          [-28, -8],
          [32, -4],
          [32, 12],
        ],
        { fill: "#FFFBEB", stroke: STROKE },
      ),
    )}
  </g>`;
}

export function roughHighlightRing(gen: RoughGenerator): string {
  return draw(gen, () =>
    gen.ellipse(-2, 0, 108, 58, {
      fill: "none",
      stroke: "#10B981",
      strokeWidth: 2.5,
      roughness: 1.6,
      bowing: 2.5,
    }),
  );
}

export function roughBoxSvg(gen: RoughGenerator, dimmed?: boolean): string {
  const o = dimmed ? 0.4 : 1;
  return `<g opacity="${o}" transform="translate(0,-4)">
    ${draw(gen, () => gen.rectangle(-22, 6, 44, 20, { fill: "#D97706", stroke: STROKE }))}
    ${draw(gen, () =>
      gen.polygon(
        [
          [-22, 6],
          [0, -10],
          [22, 6],
        ],
        { fill: "#F59E0B", stroke: STROKE },
      ),
    )}
  </g>`;
}

export function roughClockSvg(gen: RoughGenerator, dimmed?: boolean): string {
  const o = dimmed ? 0.4 : 1;
  return `<g opacity="${o}">
    ${draw(gen, () => gen.circle(0, 0, 44, { fill: "#FFFBEB", stroke: STROKE }))}
    ${draw(gen, () => gen.line(0, 0, 0, -11, { stroke: "#44403C", strokeWidth: 2.2 }))}
    ${draw(gen, () => gen.line(0, 0, 7, 3, { stroke: "#78716C", strokeWidth: 1.8 }))}
  </g>`;
}

export function roughLightSvg(gen: RoughGenerator, dimmed?: boolean): string {
  const o = dimmed ? 0.4 : 1;
  return `<g opacity="${o}">
    ${draw(gen, () => gen.line(0, -28, 0, -12, { stroke: "#A8A29E", strokeWidth: 2 }))}
    ${draw(gen, () =>
      gen.ellipse(0, -6, 48, 20, { fill: "#FEF08A", stroke: "#CA8A04" }),
    )}
  </g>`;
}

export function roughSpriteSvg(
  gen: RoughGenerator,
  sprite: string,
  dimmed?: boolean,
): string {
  switch (sprite) {
    case "pen":
      return roughPenSvg(gen, dimmed);
    case "pencil":
      return roughPencilSvg(gen, dimmed);
    case "book":
      return roughBookSvg(gen, dimmed);
    case "box":
      return roughBoxSvg(gen, dimmed);
    case "clock":
      return roughClockSvg(gen, dimmed);
    case "light":
      return roughLightSvg(gen, dimmed);
    default:
      return "";
  }
}
