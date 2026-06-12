/**
 * 按 VisualState 拼一张 400×300 SVG（免费，不调用图像 API）
 */

import { DESK_FOCUS_SLOT_LAYOUT } from "@/lib/desk-focus-layout";
import {
  createRoughGenerator,
  roughHighlightRing,
  roughRoomSvg,
  roughSpriteSvg,
} from "@/lib/rough-scene-draw";
import type { RoughGenerator } from "roughjs/bin/generator";
import type { SceneObject, SizeVariant, VisualState } from "@/lib/visual-state";

export type QaSceneSvgStyle = "flat" | "rough";

const STROKE = "#78716C";
const W = {
  wallBottom: "#EDE4D6",
  floorBottom: "#C4A484",
  woodLight: "#E8C9A0",
  woodMid: "#C9A87A",
  woodShadow: "#6B5344",
};
const P = {
  penBarrel: "#1E3A5F",
  penCap: "#2563EB",
  penNib: "#C9A227",
  penNibMetal: "#94A3B8",
  pencilWood: "#F4D03F",
  pencilWoodDark: "#D97706",
  pencilEraser: "#F9A8D4",
  pencilGraphite: "#475569",
  bookCover: "#DC2626",
  bookSpine: "#991B1B",
  bookPage: "#FFFBEB",
};

const Z_ORDER: Record<string, number> = {
  light: 2,
  clock: 3,
  box: 5,
  book: 6,
  pencil: 7,
  pen: 8,
};

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

/** 暖色书桌 + 柔和景深，作为聚光舞台底板 */
function roomSvg(): string {
  return `
  <defs>
    <linearGradient id="dfWall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FCF8F1"/>
      <stop offset="62%" stop-color="#F4EADB"/>
      <stop offset="100%" stop-color="#ECDEC9"/>
    </linearGradient>
    <linearGradient id="dfDesk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#EACDA3"/>
      <stop offset="100%" stop-color="#D2A878"/>
    </linearGradient>
    <linearGradient id="dfDeskEdge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#C99A66"/>
      <stop offset="100%" stop-color="#A9794C"/>
    </linearGradient>
    <radialGradient id="dfSpot" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10B981" stop-opacity="0.30"/>
      <stop offset="48%" stop-color="#10B981" stop-opacity="0.09"/>
      <stop offset="100%" stop-color="#10B981" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="dfPool" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFF7E6" stop-opacity="0.8"/>
      <stop offset="70%" stop-color="#FBE9C7" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#FBE9C7" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="dfVignette" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.10"/>
      <stop offset="22%" stop-color="#000" stop-opacity="0"/>
      <stop offset="80%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#3a2a18" stop-opacity="0.14"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#dfWall)"/>
  <path d="M 0 192 L 400 192 L 400 300 L 0 300 Z" fill="url(#dfDesk)"/>
  <path d="M 0 192 L 400 192 L 400 202 L 0 202 Z" fill="url(#dfDeskEdge)" opacity="0.55"/>
  <line x1="0" y1="193" x2="400" y2="193" stroke="#FFF4E2" stroke-width="1.4" opacity="0.5"/>`;
}

/** 翡翠聚光 + 桌面暖光池，锚定在被高亮物体下方 */
function spotlightLayer(cx: number, cy: number): string {
  return `
  <ellipse cx="${cx}" cy="${Math.min(cy - 24, 168)}" rx="190" ry="150" fill="url(#dfSpot)"/>
  <ellipse cx="${cx}" cy="${cy + 18}" rx="150" ry="40" fill="url(#dfPool)"/>`;
}

function vignetteLayer(): string {
  return `<rect width="400" height="300" fill="url(#dfVignette)"/>`;
}

function spriteSvg(sprite: string, dimmed?: boolean): string {
  const o = dimmed ? 0.35 : 1;
  switch (sprite) {
    case "pen":
      return `<g opacity="${o}"><ellipse cx="0" cy="10" rx="38" ry="6" fill="#000" opacity="0.1"/>
        <rect x="-38" y="-10" width="76" height="20" rx="10" fill="${P.penBarrel}" stroke="${STROKE}" stroke-width="1.2"/>
        <rect x="-38" y="-10" width="22" height="20" rx="10" fill="${P.penCap}" stroke="${STROKE}"/>
        <circle cx="-28" cy="0" r="5" fill="#60A5FA"/>
        <rect x="28" y="-6" width="10" height="12" rx="2" fill="${P.penNibMetal}"/>
        <path d="M 38 -5 L 52 0 L 38 5 Z" fill="${P.penNib}" stroke="${STROKE}"/></g>`;
    case "pencil":
      return `<g opacity="${o}"><ellipse cx="0" cy="10" rx="37" ry="6" fill="#000" opacity="0.1"/>
        <rect x="-36" y="-9" width="72" height="18" rx="9" fill="${P.pencilWood}" stroke="${STROKE}" stroke-width="1.2"/>
        <rect x="-36" y="-9" width="14" height="18" rx="6" fill="${P.pencilEraser}" stroke="${STROKE}"/>
        <path d="M 36 -6 L 48 0 L 36 6 Z" fill="${P.pencilGraphite}" stroke="${STROKE}"/></g>`;
    case "book":
      return `<g opacity="${o}"><ellipse cx="0" cy="10" rx="32" ry="6" fill="#000" opacity="0.1"/>
        <path d="M -32 14 L -32 -14 L 34 -10 L 34 18 Z" fill="${P.bookSpine}" stroke="${STROKE}"/>
        <path d="M -30 12 L -30 -12 L 36 -8 L 36 16 Z" fill="${P.bookCover}" stroke="${STROKE}"/>
        <path d="M -28 10 L -28 -10 L 32 -6 L 32 14 Z" fill="${P.bookPage}" stroke="${STROKE}"/></g>`;
    case "box":
      return `<g opacity="${o}" transform="translate(0,-4)"><ellipse cx="0" cy="12" rx="22" ry="4" fill="#000" opacity="0.1"/>
        <path d="M -22 6 L 22 6 L 22 26 L -22 26 Z" fill="#D97706" stroke="${STROKE}"/>
        <path d="M -22 6 L 0 -10 L 22 6 Z" fill="#F59E0B" stroke="${STROKE}"/></g>`;
    case "clock":
      return `<g opacity="${o}"><circle r="22" fill="#FFFBEB" stroke="${STROKE}" stroke-width="2"/>
        <line x1="0" y1="0" x2="0" y2="-11" stroke="#44403C" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="0" y1="0" x2="7" y2="3" stroke="#78716C" stroke-width="1.8" stroke-linecap="round"/></g>`;
    case "light":
      return `<g opacity="${o}"><line x1="0" y1="-28" x2="0" y2="-12" stroke="#A8A29E" stroke-width="2"/>
        <ellipse cy="-6" rx="24" ry="10" fill="#FEF08A" stroke="#CA8A04"/></g>`;
    default:
      return "";
  }
}

function sizeScale(variant: SizeVariant | undefined, highlight: boolean): number {
  if (!highlight || !variant) return 1;
  if (variant === "large" || variant === "long") return 1.28;
  return 0.82;
}

function drawableObjects(objects: SceneObject[]): SceneObject[] {
  return objects
    .filter(
      (o) =>
        !["table", "chair", "window", "door", "room", "city", "town", "village"].includes(
          o.sprite,
        ),
    )
    .sort((a, b) => (Z_ORDER[a.sprite] ?? 0) - (Z_ORDER[b.sprite] ?? 0));
}

function assembleSceneSvg(
  room: string,
  objectGroups: string[],
  options?: { label?: string; overlay?: string },
): string {
  const label = options?.label ?? "";
  const overlay = options?.overlay ?? "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="Lesson scene">
${room}
${objectGroups.join("\n")}
${overlay}
${label}
</svg>`;
}

const FOCUS_CX = 200;
const FOCUS_CY = 178;

/** 该问答能否被静态 flat 渲染（焦点是可画道具）。否则应交给前端 React（人物/地点等） */
export function canRenderFlatScene(state: VisualState): boolean {
  const objects = drawableObjects(state.objects);
  const focus = objects.find((o) => o.highlight) ?? objects[0];
  return Boolean(focus && spriteSvg(focus.sprite, false));
}

/** 单焦点 hero：把答案物体大尺寸居中 + 翡翠对焦环，避免多物体堆叠成糊 */
function buildFlatFocusGroup(state: VisualState): string {
  const objects = drawableObjects(state.objects);
  const focus = objects.find((o) => o.highlight) ?? objects[0];
  if (!focus) return "";
  const inner = spriteSvg(focus.sprite, false);
  if (!inner) return "";

  const v = state.sizeVariant;
  const scale = v === "large" || v === "long" ? 2.15 : v === "small" || v === "short" ? 1.7 : 1.95;

  let g = `<g transform="translate(${FOCUS_CX},${FOCUS_CY}) scale(${scale})">`;
  // 翡翠对焦环（虚线）+ 外圈柔光 + 一点闪光，物体随后压在上层
  g += `<ellipse cx="0" cy="2" rx="60" ry="33" fill="none" stroke="#10B981" stroke-width="1.6" stroke-dasharray="2 9" stroke-linecap="round" opacity="0.7"/>`;
  g += `<ellipse cx="0" cy="2" rx="68" ry="39" fill="none" stroke="#10B981" stroke-width="0.7" opacity="0.16"/>`;
  g += `<path d="M -54 -24 l 1.6 4.1 4.1 1.6 -4.1 1.6 -1.6 4.1 -1.6 -4.1 -4.1 -1.6 4.1 -1.6 Z" fill="#34D399" opacity="0.9"/>`;
  g += inner;
  if (state.colourSwatch) {
    g += `<rect x="22" y="-22" width="18" height="18" rx="4" fill="${esc(state.colourSwatch)}" stroke="#fff" stroke-width="2"/>`;
  }
  g += `</g>`;
  return g;
}

function buildObjectGroups(
  state: VisualState,
  style: QaSceneSvgStyle,
  roughGen?: RoughGenerator,
): string[] {
  const gen = style === "rough" ? (roughGen ?? createRoughGenerator()) : null;
  const parts: string[] = [];
  const objects = drawableObjects(state.objects);

  for (const obj of objects) {
    const layout = DESK_FOCUS_SLOT_LAYOUT[obj.slot] ?? DESK_FOCUS_SLOT_LAYOUT.table_center;
    const scale = (layout.scale ?? 1) * sizeScale(state.sizeVariant, Boolean(obj.highlight));
    const inner =
      style === "rough" && gen
        ? roughSpriteSvg(gen, obj.sprite, obj.dimmed)
        : spriteSvg(obj.sprite, obj.dimmed);
    if (!inner) continue;

    let g = `<g transform="translate(${layout.x},${layout.y}) scale(${scale})">`;
    if (obj.highlight && !gen) {
      // 翡翠对焦环（虚线）+ 外圈柔光 + 一点闪光，物体绘制其后压在上层
      g += `<ellipse cx="0" cy="2" rx="62" ry="34" fill="none" stroke="#10B981" stroke-width="2" stroke-dasharray="2 9" stroke-linecap="round" opacity="0.7"/>`;
      g += `<ellipse cx="0" cy="2" rx="70" ry="40" fill="none" stroke="#10B981" stroke-width="0.8" opacity="0.16"/>`;
      g += `<path d="M -58 -26 l 1.7 4.4 4.4 1.7 -4.4 1.7 -1.7 4.4 -1.7 -4.4 -4.4 -1.7 4.4 -1.7 Z" fill="#34D399" opacity="0.9"/>`;
    }
    g += inner;
    if (obj.highlight) {
      if (gen) {
        g += roughHighlightRing(gen);
      }
      if (state.colourSwatch) {
        g += `<rect x="22" y="-22" width="18" height="18" rx="4" fill="${esc(state.colourSwatch)}" stroke="#fff" stroke-width="2"/>`;
      }
    }
    g += `</g>`;
    parts.push(g);
  }
  return parts;
}

/** 扁平矢量（默认兼容） */
export function buildQaSceneSvg(
  state: VisualState,
  style: QaSceneSvgStyle = "flat",
): string {
  if (style === "rough") return buildRoughQaSceneSvg(state);
  return assembleSceneSvg(
    roomSvg() + spotlightLayer(FOCUS_CX, FOCUS_CY + 12),
    [buildFlatFocusGroup(state)],
    { overlay: vignetteLayer() },
  );
}

/** Rough.js 手绘风（Excalidraw 素描感） */
export function buildRoughQaSceneSvg(state: VisualState): string {
  const gen = createRoughGenerator();
  return assembleSceneSvg(
    roughRoomSvg(gen),
    buildObjectGroups(state, "rough", gen),
  );
}

export function localQaSceneSvgPublicPath(lessonNum: number, qaPairId: number): string {
  return `/scene-assets/qa-generated/lesson-${lessonNum}/pair-${qaPairId}.svg`;
}
