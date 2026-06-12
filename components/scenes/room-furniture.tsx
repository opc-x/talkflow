/** 教室固定家具 — 与 prop 分文件，统一透视与木色 */

import { SCENE_ART } from "@/components/scenes/scene-art-tokens";

const W = SCENE_ART.room;

export function RoomDesk() {
  return (
    <g aria-hidden>
      <ellipse cx="200" cy="212" rx="102" ry="9" fill="#000" opacity="0.07" />
      <rect x="92" y="182" width="216" height="20" rx="8" fill={W.woodMid} stroke={W.woodShadow} strokeWidth="1" />
      <rect x="98" y="186" width="204" height="12" rx="5" fill={W.woodLight} />
      <path
        d="M 98 192 L 302 192 L 298 198 L 102 198 Z"
        fill={W.woodDark}
        opacity="0.35"
      />
      {/* 桌腿 — 梯形透视 */}
      <path d="M 108 202 L 118 202 L 114 248 L 104 248 Z" fill={W.woodDark} />
      <path d="M 118 202 L 128 202 L 122 248 L 112 248 Z" fill={W.woodShadow} />
      <path d="M 272 202 L 282 202 L 286 248 L 276 248 Z" fill={W.woodShadow} />
      <path d="M 282 202 L 292 202 L 298 248 L 288 248 Z" fill={W.woodDark} />
    </g>
  );
}

/** 侧视教室椅 — 有靠背、坐垫、四条腿，不是四根棍 */
export function RoomChair() {
  return (
    <g transform="translate(292, 196)" aria-hidden>
      <ellipse cx="36" cy="58" rx="30" ry="5" fill="#000" opacity="0.1" />
      {/* 靠背 */}
      <path
        d="M 8 8 C 8 0, 20 -6, 36 -6 C 52 -6, 64 0, 64 8 L 64 28 C 64 34, 52 30, 36 30 C 20 30, 8 34, 8 28 Z"
        fill={W.woodLight}
        stroke={W.woodShadow}
        strokeWidth="1.2"
      />
      <path
        d="M 14 10 C 14 4, 24 0, 36 0 C 48 0, 58 4, 58 10 L 58 24 C 58 28, 48 26, 36 26 C 24 26, 14 28, 14 24 Z"
        fill={W.woodMid}
        opacity="0.5"
      />
      {/* 坐垫 */}
      <ellipse cx="36" cy="34" rx="28" ry="9" fill={W.woodMid} stroke={W.woodShadow} strokeWidth="1" />
      <ellipse cx="36" cy="32" rx="24" ry="7" fill={W.woodLight} />
      {/* 前腿 */}
      <path d="M 14 38 L 20 38 L 18 58 L 12 58 Z" fill={W.woodDark} />
      <path d="M 52 38 L 58 38 L 60 58 L 54 58 Z" fill={W.woodShadow} />
      {/* 后腿略短 — 透视 */}
      <path d="M 20 38 L 26 38 L 24 54 L 18 54 Z" fill={W.woodShadow} opacity="0.85" />
      <path d="M 46 38 L 52 38 L 54 54 L 48 54 Z" fill={W.woodDark} opacity="0.85" />
    </g>
  );
}
